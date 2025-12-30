
import React from 'react';
import { Language, Translations } from '../types';

interface SidebarProps {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  onShowModal: (type: 'about' | 'help') => void;
  onNewSession: () => void;
  currentView: 'research' | 'pdf';
  setView: (v: 'research' | 'pdf') => void;
  disabled: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ lang, setLang, t, onShowModal, onNewSession, currentView, setView, disabled, isCollapsed, setIsCollapsed }) => {
  const isRtl = lang === 'AR';
  return (
    <aside className={`fixed top-0 bottom-0 z-50 transition-all duration-500 sidebar-glass ${isCollapsed ? 'w-20' : 'w-64'} ${isRtl ? 'right-0' : 'left-0'}`}>
      <div className="flex flex-col h-full p-6">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className={`absolute top-6 ${isRtl ? 'left-4' : 'right-4'} p-2 rounded bg-white/5`}>
           <svg className={`w-5 h-5 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="mt-12 space-y-4">
          <button onClick={onNewSession} className="w-full flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
            {!isCollapsed && <span className="text-sm font-bold">{t.newSession}</span>}
          </button>
          <button disabled={disabled} onClick={() => setView('research')} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${currentView === 'research' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5" /></svg>
            {!isCollapsed && <span className="text-sm font-semibold">{t.sidebarResearch}</span>}
          </button>
        </div>
        <div className="mt-auto space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <button onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')} className="w-full text-xs font-bold text-slate-400">
              {isCollapsed ? lang : (lang === 'EN' ? 'العربية' : 'English')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
