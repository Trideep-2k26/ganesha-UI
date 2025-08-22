import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../../types';

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-saffron-400 to-saffron-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <span className="text-white text-2xl font-bold">ॐ</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Welcome to Divine Conversation
        </h3>
        <p className="text-gray-600 max-w-md leading-relaxed">
          Begin your spiritual journey with Lord Ganesha. Press the lotus button below to start speaking, 
          or simply type your thoughts and questions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          isLatest={index === messages.length - 1}
        />
      ))}
      
      {isLoading && (
        <div className="flex justify-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-saffron-400 to-saffron-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">ॐ</span>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-gold-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;