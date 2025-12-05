import React, { useState } from 'react';
import Avatar from './Avatar';
import CommentForm from './CommentForm';

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

interface CommentCardProps {
  comment: Comment;
  currentUser?: {
    id: string;
    name: string;
  };
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onReply?: () => void;
  isReplying?: boolean;
  onSubmitReply?: (content: string) => void;
  isReply?: boolean;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUser,
  onEdit,
  onDelete,
  onReply,
  isReplying = false,
  onSubmitReply,
  isReply = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit?.(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete?.(comment.id);
    }
  };

  const isAuthor = currentUser?.id === comment.author.id;

  return (
    <div className={`${isReply ? 'ml-8' : ''}`}>
      <div className="flex space-x-3">
        <Avatar
          src={comment.author.avatar_url}
          name={comment.author.name}
          size="md"
        />
        
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-gray-900">
                  {comment.author.name}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-sm text-gray-500 ml-1">
                    (edited)
                  </span>
                )}
              </div>
              
              {isAuthor && !isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>
          
          {!isReply && (
            <div className="mt-2">
              <button
                onClick={onReply}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reply
              </button>
            </div>
          )}
          
          {isReplying && onSubmitReply && (
            <div className="mt-4">
              <CommentForm
                onSubmit={onSubmitReply}
                placeholder="Write a reply..."
                buttonText="Reply"
                onCancel={() => onReply?.()}
              />
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
