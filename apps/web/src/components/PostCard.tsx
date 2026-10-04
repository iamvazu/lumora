'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@lumora/ui';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Lock,
  DollarSign,
  Share2,
  MoreHorizontal,
  Send,
} from 'lucide-react';
import type { PostDto, CommentDto } from '@lumora/contracts';

interface PostCardProps {
  post: PostDto;
  onLikeToggle?: (postId: string, currentLiked: boolean) => void;
  onBookmarkToggle?: (postId: string, currentBookmarked: boolean) => void;
  onUnlockClick?: (post: PostDto) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  onBookmarkToggle,
  onUnlockClick,
}) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const handleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    onLikeToggle?.(post.id, isLiked);
  };

  const handleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    onBookmarkToggle?.(post.id, isBookmarked);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: CommentDto = {
      id: `local-comment-${Date.now()}`,
      postId: post.id,
      userId: 'current-user',
      userHandle: 'you',
      userDisplayName: 'You',
      body: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    setCommentCount((prev) => prev + 1);
    setCommentText('');
  };

  return (
    <Card className="p-5 space-y-4 border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {post.creatorDisplayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">
                {post.creatorDisplayName}
              </span>
              <span className="text-xs text-zinc-500">@{post.creatorHandle}</span>
            </div>
            <span className="text-[11px] text-zinc-500">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.visibility === 'ppv' && (
            <Badge variant="purple">
              PPV · ${(post.priceCents ? post.priceCents / 100 : 0).toFixed(2)}
            </Badge>
          )}
          {post.visibility === 'subscribers' && (
            <Badge variant="purple">Subscribers Only</Badge>
          )}
          <button className="text-zinc-500 hover:text-zinc-300 p-1">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Text */}
      {post.body && (
        <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
          {post.body}
        </p>
      )}

      {/* Media Carousel / Grid */}
      {post.media && post.media.length > 0 && (
        <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          {post.media.map((m, idx) => (
            <div key={m.id || idx} className="relative aspect-[4/5] sm:aspect-video w-full">
              {/* If Entitled, render crisp preview, otherwise blurred teaser */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-all ${
                  !post.isEntitled ? 'blur-2xl scale-110 brightness-50' : ''
                }`}
                style={{
                  backgroundImage: `url(${
                    post.isEntitled ? m.thumbUrl || m.blurredUrl : m.blurredUrl
                  })`,
                }}
              />

              {/* Locked Overlay */}
              {!post.isEntitled && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 mb-3 shadow-lg shadow-purple-900/30">
                    <Lock className="w-6 h-6" />
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">
                    {post.visibility === 'ppv'
                      ? `Unlock Post for $${(post.priceCents ? post.priceCents / 100 : 0).toFixed(2)}`
                      : `Subscribe to @${post.creatorHandle} to View`}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mb-4">
                    {post.visibility === 'ppv'
                      ? 'One-time pay-per-view purchase with lifetime access.'
                      : 'Get unlimited access to all subscriber exclusive posts and high quality media.'}
                  </p>

                  <Button
                    variant="primary"
                    onClick={() => onUnlockClick?.(post)}
                    className="flex items-center gap-2 shadow-lg shadow-purple-900/40"
                  >
                    {post.visibility === 'ppv' ? (
                      <>
                        <DollarSign className="w-4 h-4" />
                        Unlock for ${(post.priceCents ? post.priceCents / 100 : 0).toFixed(2)}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Subscribe to Unlock
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${
              isLiked ? 'text-rose-500 font-semibold' : 'hover:text-zinc-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount}</span>
          </button>

          <button className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleBookmark}
          className={`transition-colors ${
            isBookmarked ? 'text-purple-400' : 'hover:text-zinc-200'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="pt-3 space-y-3 border-t border-zinc-800/60">
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <Button size="sm" variant="primary" type="submit">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="space-y-2 pt-1">
            {comments.length === 0 ? (
              <p className="text-center text-[11px] text-zinc-500 py-2">
                No comments yet. Be the first to reply!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-xs bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-200">{c.userDisplayName}</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-300">{c.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
