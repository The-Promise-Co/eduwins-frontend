'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [conversationTitle, setConversationTitle] = useState('Chat with Tutor');

  // Fetch messages (mock for demo)
  const fetchMessages = async () => {
    try {
      // const res = await api.get('/chat/messages');
      // setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // For demo, add message locally
      const newMsg = {
        id: messages.length + 1,
        sender_id: 1,
        content: newMessage,
        is_flagged: false,
        created_at: new Date(),
      };

      setMessages([...messages, newMsg]);

      // Check for flagged content (simple demo)
      if (/whatsapp|call me|phone|email|@gmail/.test(newMessage.toLowerCase())) {
        setWarning('⚠️ Your message was flagged. Avoid sharing contact details for security.');
        setTimeout(() => setWarning(''), 5000);
      }

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001A72]/10 to-[#FFB81C]/10 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👨‍🏫</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{conversationTitle}</h1>
              <p className="text-gray-600 text-sm">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4 text-[#001A72]">💬</div>
              <p className="text-gray-600 text-lg">No messages yet. Start a conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === 1 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-4 py-2 rounded-lg ${msg.sender_id === 1
                    ? 'bg-[#001A72] text-white'
                    : msg.is_flagged
                      ? 'bg-[#FFB81C]/20 text-gray-900 border-2 border-[#FFB81C]/70'
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                  <p>{msg.content}</p>
                  {msg.is_flagged && (
                    <p className="text-xs mt-1 font-semibold">⚠️ Flagged content</p>
                  )}
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Zone */}
      {warning && (
        <div className="max-w-4xl mx-auto w-full px-4">
          <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <p className="text-yellow-800 font-medium">{warning}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message... (Avoid sharing phone/email)"
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#001A72] outline-none"
          />
          <button
            type="submit"
            className="bg-[#001A72] text-white px-6 py-3 rounded-lg hover:bg-[#001A72]/90 font-semibold transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
