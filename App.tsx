
import React, { useState, useMemo, useEffect } from 'react';
import { gemini } from './geminiService';
import { Axiom, AppState, PDFData, Language } from './types';
import { translations } from './translations';
import Flashcard from './components/Flashcard';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';

// Define the AIStudio interface to match the environment's expected type
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Extended global window for AI Studio integration with correct type naming
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

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
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(true);

  const t = useMemo(() => translations[lang], [lang]);
  const isRtl = lang === 'AR';

  // Verify API Key availability on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsApiKeySelected(hasKey);
        } else if (!process.env.API_KEY) {
          setIsApiKeySelected(false);
        }
      } catch (err) {
        console.warn("API Key check skipped - likely non-studio environment.");
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsApiKeySelected(true); // Proceed immediately as per instructions
    }
  };

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
    
    setError('');
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
      } catch (err: any) {
        console.error("Initialization failed:", err);
        let errorMsg = lang === 'EN' ? 'Connection failed. ' : 'فشل الاتصال. ';
        
        if (err.message?.includes("Requested entity was not found")) {
          setError(errorMsg + (lang === 'EN' ? 'Please re-select your API key.' : 'يرجى إعادة اختيار مفتاح API.'));
          setIsApiKeySelected(false);
        } else {
          setError(errorMsg + (err.message || "Unknown error. Check console and API key."));
        }
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
    setError('');
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
        <div className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 border-indigo-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-300 font-serif leading-relaxed italic">{t.readingDisclaimer}</p>
        </div>
      </div>
    </div>
  );

  if (!isApiKeySelected) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 text-center">
        <div className="glass-card p-12 rounded-[40px] max-w-md w-full space-y-8">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto text-indigo-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white">API Key Required</h2>
            <p className="text-slate-400 text-sm leading-relaxed">To access this high-performance research sanctuary, a paid API key must be selected. Please refer to the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">billing documentation</a> for more information.</p>
          </div>
          <button onClick={handleSelectKey} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20">
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#05070a] text-slate-200 ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar 
        lang={lang} 
        setLang={setLang} 
        t={t} 
        onShowModal={setModal} 
        onNewSession={handleReset} 
        currentView={view} 
        setView={setView} 
        disabled={state !== AppState.READY}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <main className={`transition-all duration-500 ${sidebarCollapsed ? (isRtl ? 'pr-20' : 'pl-20') : (isRtl ? 'pr-64' : 'pl-64')} p-10 min-h-screen`}>
        <div className="max-w-6xl mx-auto py-12">
          {state === AppState.IDLE || state === AppState.ERROR ? (
            <div className="text-center space-y-12 py-20 animate-in fade-in zoom-in duration-1000">
              <div className="space-y-6">
                <h1 className="text-7xl font-black text-white tracking-tighter">{t.title}</h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto font-serif italic">{t.subtitle}</p>
                <p className="text-xs text-indigo-500/60 font-black uppercase tracking-[0.3em]">{t.subtitle2}</p>
              </div>

              <div className="max-w-xl mx-auto">
                <label className="group relative block cursor-pointer">
                  <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                  <div className="glass-card p-12 rounded-[48px] border-white/5 group-hover:border-indigo-500/30 transition-all duration-500 group-hover:scale-[1.02] bg-white/[0.02]">
                    <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-500 group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">{t.uploadTitle}</h3>
                    <p className="text-slate-500 text-sm mb-8">{t.uploadSubtitle}</p>
                    <div className="inline-block px-10 py-4 bg-indigo-600 rounded-2xl text-white font-bold text-sm shadow-xl shadow-indigo-600/20">
                      {t.uploadBtn}
                    </div>
                  </div>
                </label>
                {error && <p className="mt-6 text-rose-500 text-sm font-medium animate-pulse">{error}</p>}
              </div>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.5em] mt-12">{t.creator}</p>
            </div>
          ) : state === AppState.ANALYZING || state === AppState.UPLOADING ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-12">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-white">{state === AppState.UPLOADING ? t.transmitting : t.analyzing}</h2>
                <p className="text-slate-500 font-serif italic">{fileName}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {showProtocol && <ProtocolBanner />}
              
              {view === 'research' ? (
                <>
                  <section className="space-y-10">
                    <div className="flex items-end justify-between border-b border-white/5 pb-8">
                      <div>
                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.4em] mb-4 block">{fileName}</span>
                        <h2 className="text-4xl font-black text-white tracking-tight">{t.axiomTitle}</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {axioms.map((ax, i) => (
                        <Flashcard key={i} axiom={ax} index={i} t={t} />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-10">
                    <div className="flex items-end justify-between border-b border-white/5 pb-8">
                      <h2 className="text-4xl font-black text-white tracking-tight">{t.dialogueTitle}</h2>
                    </div>
                    <ChatInterface key={chatKey} t={t} />
                  </section>
                </>
              ) : (
                <div className="h-[calc(100vh-200px)] glass-card rounded-[40px] overflow-hidden">
                  <iframe src={pdfUrl || ''} className="w-full h-full border-none" title="PDF Viewer" />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setModal(null)}>
          <div className="glass-card p-12 rounded-[48px] max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModal(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-4xl font-black text-white mb-8">{modal === 'about' ? t.sidebarAbout : t.sidebarHelp}</h2>
            <div className="prose prose-invert max-w-none text-lg text-slate-300 leading-relaxed font-serif italic">
              {modal === 'about' ? t.aboutContent : t.helpContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
