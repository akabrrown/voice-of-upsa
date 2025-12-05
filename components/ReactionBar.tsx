import React, { useState } from 'react';

interface Reaction {
  emoji: string;
  count: number;
  selected: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  onReactionClick: (emoji: string) => void;
  className?: string;
  showLabels?: boolean;
}

const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  onReactionClick,
  className = '',
  showLabels = false
}) => {
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  const handleClick = (emoji: string) => {
    setIsAnimating(emoji);
    onReactionClick(emoji);
    
    // Remove animation after a short delay
    setTimeout(() => setIsAnimating(null), 300);
  };

  const defaultReactions = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Laugh' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' }
  ];

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {reactions.map((reaction) => {
        const defaultReaction = defaultReactions.find(r => r.emoji === reaction.emoji);
        const label = defaultReaction?.label || reaction.emoji;
        
        return (
          <button
            key={reaction.emoji}
            onClick={() => handleClick(reaction.emoji)}
            className={`
              group relative flex items-center space-x-1 px-3 py-1.5 rounded-full
              border transition-all duration-200 hover:scale-105
              ${reaction.selected
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700'
              }
              ${isAnimating === reaction.emoji ? 'animate-bounce' : ''}
            `}
            title={label}
          >
            <span className="text-lg">{reaction.emoji}</span>
            {reaction.count > 0 && (
              <span className="text-sm font-medium">
                {reaction.count}
              </span>
            )}
            {showLabels && (
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
            )}
          </button>
        );
      })}
      
      {reactions.length === 0 && (
        <div className="flex items-center space-x-1">
          {defaultReactions.slice(0, 3).map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => handleClick(reaction.emoji)}
              className="group relative flex items-center justify-center w-8 h-8 rounded-full
                border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-700
                transition-all duration-200 hover:scale-105"
              title={reaction.label}
            >
              <span className="text-sm">{reaction.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionBar;
