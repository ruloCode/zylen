import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { Button } from '../components/Button';
export function Chat() {
  const [messages, setMessages] = useState([{
    id: '1',
    message: "Hey there, Champion! 👋 I'm your AI coach. How can I help you level up today?",
    isUser: false,
    timestamp: '10:30 AM'
  }, {
    id: '2',
    message: "I'm struggling to stay consistent with my morning routine.",
    isUser: true,
    timestamp: '10:32 AM'
  }, {
    id: '3',
    message: "I hear you! Consistency is tough. Let's break it down: What's the smallest version of your morning routine you could do even on your worst day? Start there and build up gradually. 💪",
    isUser: false,
    timestamp: '10:33 AM'
  }]);
  const [input, setInput] = useState('');
  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      message: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setMessages([...messages, newMessage]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        message: "That's a great question! Remember, progress over perfection. Every small step counts toward your bigger goals. Keep going! 🌟",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };
  return <div className="min-h-screen pb-32 px-4 pt-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Coach</h1>
          <p className="text-gray-600">Your personal mentor is here</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map(msg => <ChatBubble key={msg.id} {...msg} />)}
        </div>

        {/* Input */}
        <div className="glass-card rounded-3xl p-4 flex gap-3 items-center">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Ask your coach anything..." className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500" />
          <button onClick={handleSend} className="bg-gradient-to-r from-quest-blue to-quest-purple text-white p-3 rounded-xl hover:scale-105 transition-transform">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>;
}