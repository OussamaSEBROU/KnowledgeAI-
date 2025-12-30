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
          const newMessages = [...p];
          newMessages[newMessages.length - 1].text = fullText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ... UI code ... */}
    </div>
  );
};

export default ChatInterface;
