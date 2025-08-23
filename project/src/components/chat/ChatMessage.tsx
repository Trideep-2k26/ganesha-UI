import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const isUser = message.type === 'user';
  const isGanesha = message.type === 'ganesha';
  const lang = (message.language || 'en').toLowerCase();
  const fontClass =
    lang === 'hi' || lang === 'mr'
      ? 'font-devanagari'
      : lang === 'ta'
      ? 'font-tamil'
      : lang === 'te'
      ? 'font-telugu'
      : lang === 'gu'
      ? 'font-gujarati'
      : '';

  return (
    <div 
      className={`
        flex mb-6 animate-fade-in
        ${isUser ? 'justify-end' : 'justify-start'}
      `}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full
          flex items-center justify-center
          ${isUser ? 'ml-3 bg-gradient-to-br from-blue-400 to-blue-600' : 'mr-3'}
          ${isGanesha ? 'bg-gradient-to-br from-saffron-400 to-saffron-600' : ''}
          shadow-lg
        `}>
          {isUser ? (
            <span className="text-white font-semibold text-sm">U</span>
          ) : (
            <span className="text-white font-bold text-lg">ॐ</span>
          )}
        </div>

        {/* Message bubble */}
        <div className={`
          relative px-4 py-3 rounded-2xl shadow-lg
          ${isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : 'bg-gradient-to-br from-white to-ivory-100 text-gray-800 border border-gold-200'
          }
          ${isLatest && isGanesha ? 'animate-gentle-glow' : ''}
        `}>
          {/* Message content */}
          <p className={`
            text-sm leading-relaxed
            ${isGanesha ? 'font-medium' : ''}
            ${fontClass}
          `}>
            {message.content}
          </p>

          {/* Timestamp */}
          <div className={`
            mt-2 text-xs opacity-70
            ${isUser ? 'text-blue-100' : 'text-gray-500'}
          `}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>

          {/* Speech bubble tail */}
          <div className={`
            absolute top-4 w-0 h-0
            ${isUser 
              ? 'right-[-8px] border-l-[8px] border-l-blue-500 border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent' 
              : 'left-[-8px] border-r-[8px] border-r-white border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent'
            }
          `} />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;