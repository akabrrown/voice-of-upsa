import React, { useState } from 'react';
import CommentForm from './CommentForm';
import CommentCard from './CommentCard';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  articleId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isLoading?: boolean;
  currentUser?: {
    id: string;
    name: string;
  };
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isLoading = false,
  currentUser
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Comments ({comments.length})
        </h3>
        
        {currentUser && (
          <div className="mb-6">
            <CommentForm
              onSubmit={(content) => onAddComment(content)}
              placeholder="Write a comment..."
              buttonText="Post Comment"
            />
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onReply={() => handleReply(comment.id)}
              isReplying={replyingTo === comment.id}
              onSubmitReply={() => {
                // Handle reply submission
                setReplyingTo(null);
              }}
            />
          ))}
        </div>

        {comments.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
