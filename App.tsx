
import React, { useState, useMemo, useEffect } from 'react';
import { gemini } from './geminiService';
import { Axiom, AppState, PDFData, Language } from './types';
import { translations } from './translations';
import Flashcard from './components/Flashcard';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [view, setView] = useState<'research' | 'pdf'>('research');
  const [axioms, setAxioms] = useState<Axiom[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [lang, setLang] = useState<Language>('EN');
  const [modal, setModal] = useState<'about' | 'help' | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showProtocol, setShowProtocol] = useState<boolean>(true);
  const [hasReappearedOnce, setHasReappearedOnce] = useState<boolean>(false);
  const [chatKey, setChatKey] = useState<number>(0);

  const t = useMemo(() => translations[lang], [lang]);
  const isRtl = lang === 'AR';

  useEffect(() => {
    if (state === AppState.ANALYZING && !showProtocol && !hasReappearedOnce) {
      setShowProtocol(true);
      setHasReappearedOnce(true);
    }
  }, [state, showProtocol, hasReappearedOnce]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError(lang === 'EN' ? 'Please upload a PDF.' : 'يرجى تحميل ملف PDF.');
      return;
    }
    setState(AppState.UPLOADING);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setState(AppState.ANALYZING);
      try {
        const result = await gemini.initializeSession({ base64, name: file.name }, lang);
        setAxioms(result);
        setState(AppState.READY);
      } catch (err) {
        setError(lang === 'EN' ? 'Connection failed.' : 'فشل الاتصال.');
        setState(AppState.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    gemini.resetService();
    setState(AppState.IDLE);
    setAxioms([]);
    setFileName('');
    setChatKey(p => p + 1);
    setHasReappearedOnce(false);
    setShowProtocol(true);
  };

  const ProtocolBanner = () => (
    <div className="max-w-5xl mx-auto mb-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card p-8 rounded-3xl border-indigo-500/20 flex gap-6 items-center bg-indigo-900/5 relative">
        <button onClick={() => setShowProtocol(false)} className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-slate-500 hover:text-white`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 border border-indigo-500/20 hidden sm:block">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <div className={`flex-1 ${isRtl ? 'pl-8' : 'pr-8'}`}>
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400 mb-2">Protocol: Critical Engagement</h4>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">{t.readingDisclaimer}</p>
        </div>
      </div>
    </div>
  );

  const dynamicSpacing = sidebarCollapsed ? (isRtl ? 'pr-20' : 'pl-20') : (isRtl ? 'pr-64' : 'pl-64');

  return (
    <div className="min-h-screen bg-[#050810]" dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar lang={lang} setLang={setLang} t={t} onShowModal={setModal} onNewSession={handleReset} currentView={view} setView={setView} disabled={state !== AppState.READY} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <main className={`transition-all duration-500 ${dynamicSpacing} flex flex-col pt-24`}>
        <div className="container mx-auto px-6 max-w-7xl">
          <header className="text-center mb-24">
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter shine-brand uppercase">KNOWLEDGE AI</h1>
            <p className="text-slate-500 text-xl font-serif italic opacity-70">"{t.subtitle}"</p>
          </header>

          {state === AppState.IDLE || state === AppState.ERROR ? (
            <div className="space-y-12">
              <div className="max-w-3xl mx-auto glass-card p-20 rounded-[40px] flex flex-col items-center">
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-2xl font-bold uppercase text-xs">
                  {t.uploadBtn}
                  <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                </label>
                {error && <p className="mt-4 text-red-400">{error}</p>}
              </div>
              {showProtocol && <ProtocolBanner />}
            </div>
          ) : state === AppState.UPLOADING || state === AppState.ANALYZING ? (
            <div className="space-y-12">
              <div className="max-w-md mx-auto text-center py-32">
                <div className="w-32 h-32 border-[6px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto mb-8"></div>
                <h3 className="text-3xl text-white">{state === AppState.UPLOADING ? t.transmitting : t.analyzing}</h3>
              </div>
              {showProtocol && <ProtocolBanner />}
            </div>
          ) : (
            <div className="space-y-20 pb-32">
              {showProtocol && <ProtocolBanner />}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {axioms.map((a, i) => <Flashcard key={i} axiom={a} index={i} t={t} />)}
              </div>
              <div className="max-w-5xl mx-auto">
                <ChatInterface key={chatKey} t={t} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
