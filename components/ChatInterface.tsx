
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

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

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
    } catch (err: any) {
      setMessages(p => [...p, { role: 'model', text: `The link was severed: ${err.message || 'Unknown interruption.'}` }]);
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="flex flex-col h-[650px] glass-card rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 bg-black/10" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[85%] p-7 rounded-3xl ${
              m.role === 'user' 
                ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 rounded-br-none' 
                : 'bg-white/[0.03] text-slate-200 font-serif text-lg leading-relaxed border border-white/5 rounded-bl-none'
            }`}>
              {m.text || (isLoading && i === messages.length - 1 ? <div className="flex gap-2 p-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div></div> : '')}
            </div>
          </div>
        ))}
      </div>
      <div className="p-8 bg-white/[0.02] border-t border-white/5">
        <div className="relative flex items-center gap-4">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder={t.placeholder} 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm md:text-base"
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()} 
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            {isLoading ? '...' : 'Inquire'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
