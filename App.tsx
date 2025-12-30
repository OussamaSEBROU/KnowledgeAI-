import React, { useState } from 'react';
import { gemini } from './geminiService';
import { translations } from './translations';
import { Language, PDFData, Axiom } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Flashcard from './components/Flashcard';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('EN');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'research' | 'pdf'>('research');
  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [axioms, setAxioms] = useState<Axiom[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState<'about' | 'help' | null>(null);

  const t = translations[lang];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const data: PDFData = { name: file.name, base64 };
      setPdfData(data);
      
      try {
        const result = await gemini.initializeSession(data, lang);
        setAxioms(result);
      } catch (error) {
        console.error(error);
        alert(t.analyzing + " failed.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetSession = () => {
    setPdfData(null);
    setAxioms([]);
    gemini.resetService();
  };

  return (
    <div className={`flex h-screen bg-black text-white ${lang === 'AR' ? 'font-arabic' : ''}`} dir={lang === 'AR' ? 'rtl' : 'ltr'}>
      <Sidebar 
        lang={lang} 
        setLang={setLang} 
        t={t}
        onShowModal={setShowModal}
        onNewSession={resetSession}
        currentView={currentView}
        setView={setCurrentView}
        disabled={!pdfData}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main className={`flex-1 transition-all duration-500 ${isCollapsed ? 'mr-20 ml-0' : 'mr-0 ml-64'}`}>
        {!pdfData ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-xl text-gray-400 mb-8 text-center max-w-2xl italic">
              {t.subtitle}
            </p>
            
            <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">{t.uploadTitle}</h2>
                  <p className="text-gray-400 text-sm">{t.uploadSubtitle}</p>
                </div>
                <label className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-center cursor-pointer transition-all shadow-lg shadow-emerald-500/20">
                  {isAnalyzing ? t.analyzing : t.uploadBtn}
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isAnalyzing} />
                </label>
              </div>
            </div>
            <p className="mt-12 text-xs text-gray-500 tracking-widest uppercase">{t.subtitle2}</p>
          </div>
        ) : (
          <div className="flex h-full">
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {axioms.map((axiom, index) => (
                  <Flashcard key={index} axiom={axiom} index={index} t={t} />
                ))}
              </div>
            </div>
            <div className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-md">
              <ChatInterface t={t} />
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-8 rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-emerald-400">
              {showModal === 'about' ? t.sidebarAbout : t.sidebarHelp}
            </h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              {showModal === 'about' ? t.aboutContent : t.helpContent}
            </p>
            <button 
              onClick={() => setShowModal(null)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
