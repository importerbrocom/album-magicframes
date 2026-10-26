// Frontend permission helpers. These are for UI convenience only (hiding or
// disabling controls); the backend independently authorizes every request via
// policies + the permission middleware, so UI checks are never the gate.

export const ADMIN_ROLES = ['super_admin', 'admin'];

export function isAdmin(user) {
  return !!user && (user.is_admin || ADMIN_ROLES.includes(user.role));
}

export function can(user, permission) {
  if (!user) return false;
  if (isAdmin(user)) return true; // admins implicitly have everything
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

// Human-readable labels for roles / statuses / permission keys.
export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  photographer: 'Photographer',
  editor: 'Editor',
  assistant: 'Assistant',
};

export const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

export const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || (role || '').replace(/_/g, ' ');
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}
