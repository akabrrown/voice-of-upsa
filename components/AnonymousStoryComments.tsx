import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiMessageSquare, FiChevronUp, FiChevronDown, FiLoader, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import commentStyles from '../styles/components/AnonymousComments.module.css';

interface AnonymousStoryComment {
  id: string;
  story_id: string;
  content: string;
  created_at: string;
}

interface AnonymousStoryCommentsProps {
  storyId: string;
  sessionId: string;
}

const AnonymousStoryComments: React.FC<AnonymousStoryCommentsProps> = ({ storyId, sessionId }) => {
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<AnonymousStoryComment[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const hasMore = useMemo(() => pagination.currentPage < pagination.totalPages, [pagination]);

  const fetchComments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/anonymous-stories/comments?storyId=${storyId}&page=${page}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load comments');
      }
      setComments((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
      });
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
    }
  }, [storyId]);

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const response = await fetch('/api/anonymous-stories/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          content: newComment,
          sessionId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to post comment');
      }
      setComments((prev) => [...prev, data.data]);
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.max(1, Math.ceil((prev.total + 1) / 25)),
        currentPage: prev.currentPage,
      }));
      setNewComment('');
      toast.success('Comment added');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  }, [newComment, sessionId, storyId]);

  useEffect(() => {
    if (!initialFetchDone) {
      fetchComments(1);
    }
  }, [fetchComments, initialFetchDone]);

  const toggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchComments(pagination.currentPage + 1);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={commentStyles.commentsSection}>
      
      <button className={commentStyles.toggleButton} onClick={toggleComments}>
        <FiMessageSquare />
        {showComments ? 'Hide comments' : 'View comments'}
        {showComments ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      <div className={commentStyles.metaBar}>
        {pagination.total} {pagination.total === 1 ? 'comment' : 'comments'}
      </div>
      {showComments && (
        <>
          {loading && comments.length === 0 && (
            <div className={commentStyles.loadingRow}>
              <FiLoader className="animate-spin" /> Loading comments...
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className={commentStyles.emptyState}>
              Be the first to comment on this story.
            </div>
          )}
          {comments.length > 0 && (
            <div className={commentStyles.commentList}>
              {comments.map((comment) => (
                <div key={comment.id} className={commentStyles.commentCard}>
                  <div className={commentStyles.commentMeta}>
                    Anonymous • {formatTimestamp(comment.created_at)}
                  </div>
                  <div className={commentStyles.commentContent}>{comment.content}</div>
                </div>
              ))}
              {hasMore && (
                <button
                  className={commentStyles.loadMore}
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
          <div className={commentStyles.formContainer}>
            <textarea
              className={commentStyles.textarea}
              placeholder="Share your thoughts freely. There's no character limit."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={5}
            />
            <div className={commentStyles.formFooter}>
              <span>Comments are public immediately.</span>
              <button
                className={commentStyles.submitButton}
                onClick={handleSubmit}
                disabled={posting || !newComment.trim()}
              >
                {posting ? <FiLoader className="animate-spin" /> : <FiSend />}
                {posting ? 'Posting...' : 'Post comment'}
              </button>
            </div>
            {error && <div className={commentStyles.errorText}>{error}</div>}
          </div>
        </>
      )}
    </div>
  );
};

export default AnonymousStoryComments;
