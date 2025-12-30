
import React, { useState, useRef, useEffect } from 'react';
import { gemini } from '../geminiService';
import { Message, Translations } from '../types';

interface ChatInterfaceProps {
  t: Translations;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ t }) => {
  const [messages, setMessages] = useState<Message[]>([{ role: 'model', text: 'The sanctuary is prepared for your inquiry.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', text }]);
    setIsLoading(true);
    try {
      setMessages(p => [...p, { role: 'model', text: '' }]);
      const stream = gemini.sendMessageStream(text);
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(p => {
          const m = [...p];
          m[m.length - 1].text = fullText;
          return m;
        });
      }
    } catch {
      setMessages(p => [...p, { role: 'model', text: 'The link was severed.' }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-[600px] glass-card rounded-[40px] overflow-hidden">
      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-6 rounded-3xl ${m.role === 'user' ? 'bg-indigo-600/20 text-indigo-100' : 'bg-white/5 text-slate-200 font-serif'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-8 bg-black/20 flex gap-4">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t.placeholder} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none" />
        <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 p-4 rounded-2xl text-white">
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
