import React, { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface AppearanceNodeViewProps {
  onBack: () => void;
  showToast: (msg: string) => void;
}

export const AppearanceNodeView: React.FC<AppearanceNodeViewProps> = ({ onBack, showToast }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('misrah_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // fallback
    }
    return document.documentElement.classList.contains('dark');
  });

  const applyThemeMode = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0F111A';
      document.body.style.color = '#F8FAFC';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#FDFAF7';
      document.body.style.color = '#1A1A2E';
    }

    try {
      localStorage.setItem('misrah_theme', dark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    applyThemeMode(isDark);
  }, []);

  const handleSelectMode = (mode: 'light' | 'dark') => {
    const shouldBeDark = mode === 'dark';
    applyThemeMode(shouldBeDark);
    showToast(`${shouldBeDark ? 'Dark' : 'Light'} Mode enabled`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
            isDark 
              ? 'bg-[#171B29] border-[#262B3D] text-[#F8FAFC] hover:bg-[#202538]' 
              : 'bg-white border-[#F2E8DF] text-[#1A1A2E] hover:bg-surface'
          }`}
          title="Back"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className={`text-2xl font-black italic uppercase tracking-tight ${
          isDark ? 'text-white' : 'text-primary'
        }`}>
          Interface Appearance
        </h1>
      </header>

      {/* Main Single Card: Dark Mode & Light Mode Only */}
      <div className={`rounded-[40px] border p-10 max-w-2xl space-y-6 shadow-xs transition-colors duration-200 ${
        isDark 
          ? 'bg-[#171B29] border-[#262B3D]' 
          : 'bg-white border-border-misrah'
      }`}>
        <label className={`text-[10px] font-black uppercase tracking-[2px] block ${
          isDark ? 'text-white/40' : 'text-primary/40'
        }`}>
          Canvas Theme
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Option */}
          <div 
            onClick={() => handleSelectMode('light')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-center min-h-[96px] ${
              !isDark 
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/40 bg-[#C5A880]/5' 
                : 'border-[#262B3D] bg-[#10131E] hover:border-[#C5A880]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-black uppercase tracking-wide ${
                isDark ? 'text-white/80' : 'text-primary'
              }`}>
                LIGHT MODE
              </h4>
              {!isDark && (
                <Check size={14} className="text-[#C5A880]" strokeWidth={2.5} />
              )}
            </div>
            <p className={`text-[10px] mt-1 font-medium ${
              isDark ? 'text-white/40' : 'text-muted-text'
            }`}>
              Default Desert Luxury
            </p>
          </div>

          {/* Dark Mode Option */}
          <div 
            onClick={() => handleSelectMode('dark')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-center min-h-[96px] ${
              isDark 
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/40 bg-[#C5A880]/15' 
                : 'border-border-misrah bg-white hover:border-[#C5A880]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-black uppercase tracking-wide ${
                isDark ? 'text-white' : 'text-primary'
              }`}>
                DARK MODE
              </h4>
              {isDark && (
                <Check size={14} className="text-[#C5A880]" strokeWidth={2.5} />
              )}
            </div>
            <p className={`text-[10px] mt-1 font-medium ${
              isDark ? 'text-white/60' : 'text-muted-text'
            }`}>
              High Contrast Dark
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
