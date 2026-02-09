'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X, Send, Bot, Mic, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentEmoji?: string;
  agentName?: string;
  timestamp: Date;
}

export function AgentChat() {
  const t = useTranslations('agents');
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationId = useRef(`conv-${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: userMsg.content,
        conversationId: conversationId.current,
        farmId: localStorage.getItem('fla7a_farm') || '',
        locale: document.documentElement.lang || 'fr',
      });

      const data = res.data.data;
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-res`,
        role: 'assistant',
        content: data.message,
        agentEmoji: data.agentUsed?.emoji,
        agentName: data.agentUsed?.name,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-err`, role: 'assistant', content: 'Erreur de connexion', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 end-6 bg-fla7a-500 text-white p-4 rounded-full shadow-lg hover:bg-fla7a-600 transition z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col border',
        isFullscreen
          ? 'inset-4'
          : 'bottom-6 end-6 w-96 h-[500px]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-fla7a-500 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold text-sm">{t('title')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-white/20 rounded">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-10">
            <Bot className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>{t('sendMessage')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-fla7a-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md',
              )}
            >
              {msg.agentEmoji && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <span>{msg.agentEmoji}</span>
                  <span>{msg.agentName}</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-fla7a-500 transition">
            <Mic className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('sendMessage')}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-fla7a-500 focus:border-transparent outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-2 bg-fla7a-500 text-white rounded-lg hover:bg-fla7a-600 transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
