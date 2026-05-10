'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
  GraduationCap, 
  MessageSquare, 
  AlertTriangle, 
  Send,
  ArrowLeft
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';

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
    <div className="h-full flex flex-col space-y-6 max-w-4xl mx-auto pb-6">
      <PageHeader 
        title={conversationTitle}
        subtitle="Online"
        rightElement={
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Support
          </div>
        }
      />

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20">
              <MessageSquare size={64} className="text-[#001A72] mb-4" />
              <p className="text-gray-900 font-bold">No messages yet</p>
              <p className="text-sm">Start a conversation with your tutor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === 1 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender_id === 1
                      ? 'bg-[#001A72] text-white rounded-tr-none'
                      : msg.is_flagged
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    {msg.is_flagged && (
                      <p className="text-[10px] mt-1 font-black uppercase tracking-widest flex items-center gap-1 text-amber-600">
                        <AlertTriangle size={10} /> Flagged
                      </p>
                    )}
                    <p className="text-[10px] mt-1 opacity-50 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning Zone */}
        {warning && (
          <div className="px-6 py-2">
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <AlertTriangle className="text-amber-600 shrink-0" size={16} />
              <p className="text-amber-800 text-xs font-medium leading-relaxed">{warning}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-50">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message... (Avoid sharing phone/email)"
              className="flex-1 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition bg-white"
            />
            <Button
              type="submit"
              className="px-6"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
