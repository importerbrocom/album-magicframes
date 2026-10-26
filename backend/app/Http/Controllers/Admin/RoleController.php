<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Role & permission management (admin only — enforced by the UserPolicy
 * manageRoles ability and the route middleware).
 */
class RoleController extends Controller
{
    public function __construct(private AuditService $audit)
    {
    }

    public function index(): JsonResponse
    {
        $this->authorize('manageRoles', User::class);

        $roles = Role::with('permissions')->withCount('users')->orderBy('id')->get();

        return RoleResource::collection($roles)->response();
    }

    /** The full catalogue of assignable permissions, grouped for the UI. */
    public function permissions(): JsonResponse
    {
        $this->authorize('manageRoles', User::class);

        $permissions = Permission::orderBy('group')->orderBy('name')->get();

        return PermissionResource::collection($permissions)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manageRoles', User::class);

        $data = $request->validate([
            'slug' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9_]+$/', Rule::unique('roles', 'slug')],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'slug')],
        ]);

        // Never let a custom role claim the reserved super_admin slug.
        if ($data['slug'] === 'super_admin') {
            abort(422, 'The super_admin slug is reserved.');
        }

        $role = Role::create([
            'slug' => $data['slug'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_system' => false,
        ]);

        $this->syncPermissions($role, $data['permissions'] ?? []);

        $this->audit->log($request->user(), 'role.created', $role, ['slug' => $role->slug]);

        return (new RoleResource($role->load('permissions')))
            ->additional(['message' => 'Role created.'])
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $this->authorize('manageRoles', User::class);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'slug')],
        ]);

        // The super_admin role is all-powerful by definition; don't let its
        // permission set be edited (could otherwise lock everyone out).
        if ($role->slug === 'super_admin' && array_key_exists('permissions', $data)) {
            abort(422, 'The super admin role cannot be modified.');
        }

        if (isset($data['name'])) {
            $role->name = $data['name'];
        }
        if (array_key_exists('description', $data)) {
            $role->description = $data['description'];
        }
        $role->save();

        if (array_key_exists('permissions', $data)) {
            $this->syncPermissions($role, $data['permissions']);
        }

        $this->audit->log($request->user(), 'role.updated', $role, [
            'changed' => array_keys($data),
        ]);

        return (new RoleResource($role->refresh()->load('permissions')))
            ->additional(['message' => 'Role updated.'])
            ->response();
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        $this->authorize('manageRoles', User::class);

        if ($role->is_system) {
            abort(422, 'Built-in roles cannot be deleted.');
        }

        if ($role->users()->exists()) {
            abort(422, 'Reassign the staff using this role before deleting it.');
        }

        $slug = $role->slug;
        $role->delete();

        $this->audit->log($request->user(), 'role.deleted', null, ['slug' => $slug]);

        return response()->json(['message' => 'Role deleted.']);
    }

    private function syncPermissions(Role $role, array $slugs): void
    {
        $ids = Permission::whereIn('slug', $slugs)->pluck('id')->all();
        $role->permissions()->sync($ids);
    }
}
