import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, MoreVertical } from 'lucide-react';

const ChatPanel = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
  currentUserName,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 w-80 h-full bg-white border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageSquare size={20} className="text-gray-600" />
          <h2 className="text-lg font-medium">In-call messages</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical size={16} className="text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Send a message to everyone in the meeting
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-1">
              {/* Message header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {message.senderName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {message.senderId === currentUserId ? 'You' : message.senderName}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {/* Message content */}
              <div className="ml-8">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Send a message to everyone..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg transition-all duration-200 ${
              newMessage.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Messages can only be seen by people in the call and are deleted when the call ends.
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;