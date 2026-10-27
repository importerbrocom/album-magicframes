<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Comment;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public comments. Open to ANYONE viewing a shared album (including reshared
 * links). Only the album slug is required. Each comment stores a display name
 * and body; the name is shown with the comment.
 */
class CommentController extends Controller
{
    public function __construct(private AnalyticsService $analytics)
    {
    }

    private function resolveAlbum(string $slug): Album
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404, 'Album not found.');

        return $album;
    }

    /** Paginated list of approved comments for the album (newest first). */
    public function index(string $slug): JsonResponse
    {
        $album = $this->resolveAlbum($slug);

        $comments = $album->comments()
            ->where('is_approved', true)
            ->orderByDesc('created_at')
            ->paginate(20);

        $comments->getCollection()->transform(fn (Comment $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'body' => $c->body,
            'created_at' => $c->created_at->toIso8601String(),
            'ago' => $c->created_at->diffForHumans(),
        ]);

        return response()->json($comments);
    }

    /** Add a comment. Returns the created comment so the UI can show it at once. */
    public function store(Request $request, string $slug): JsonResponse
    {
        $album = $this->resolveAlbum($slug);

        if (! $album->allow_comments) {
            return response()->json(['message' => 'Comments are disabled for this album.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'body' => ['required', 'string', 'max:1000'],
            'website' => ['nullable', 'size:0'], // honeypot
        ]);

        if ($request->filled('website')) {
            return response()->json(['ok' => true]);
        }

        $comment = Comment::create([
            'album_id' => $album->id,
            'album_slug' => $album->slug,
            'name' => $data['name'],
            'body' => $data['body'],
            'is_approved' => true,
            'visitor_hash' => $this->analytics->visitorHash($request, $album),
        ]);

        return response()->json([
            'id' => $comment->id,
            'name' => $comment->name,
            'body' => $comment->body,
            'created_at' => $comment->created_at->toIso8601String(),
            'ago' => $comment->created_at->diffForHumans(),
        ], 201);
    }
}
