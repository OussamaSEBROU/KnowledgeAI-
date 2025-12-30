
import React, { useState } from 'react';
import { Axiom, Translations } from '../types';

interface FlashcardProps {
  axiom: Axiom;
  index: number;
  t: Translations;
}

const Flashcard: React.FC<FlashcardProps> = ({ axiom, index, t }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

  return (
    <div className="relative w-full h-[320px] perspective-2000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d rounded-[32px] ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute inset-0 backface-hidden glass-card p-10 flex flex-col rounded-[32px] border-indigo-500/30">
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-4">{t.flashcardPillar} {index + 1}</span>
          <h3 className="text-2xl font-serif font-black text-white leading-tight mt-auto" dir={isArabic(axiom.axiom) ? 'rtl' : 'ltr'}>{axiom.axiom}</h3>
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card p-10 flex flex-col rounded-[32px] bg-[#080c18]">
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-4">{t.flashcardSummary}</span>
          <p className="text-base text-slate-200 font-serif italic overflow-y-auto" dir={isArabic(axiom.definition) ? 'rtl' : 'ltr'}>{axiom.definition}</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
