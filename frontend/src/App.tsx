import { useState, useEffect } from 'react';
import {
  Eye,
  FlaskConical,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useRouter, type Route } from './router';
import { apiHealth } from './api';
import AskPage from './pages/AskPage';
import TestLabPage from './pages/TestLabPage';
import EvaluationPage from './pages/EvaluationPage';
import LearnPage from './pages/LearnPage';
import ResponsibleAIPage from './pages/ResponsibleAIPage';

export default function App() {
  const [route, navigate] = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<any | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch health status
  useEffect(() => {
    apiHealth()
      .then((data) => setHealthStatus(data))
      .catch((err) => console.log('Backend connection notice:', err));
  }, []);

  const navItems: { id: Route; label: string; icon: any }[] = [
    { id: 'ask', label: 'VQA Studio', icon: Eye },
    { id: 'testlab', label: 'Test Lab', icon: FlaskConical },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: 'learn', label: 'Documentation', icon: BookOpen },
    { id: 'responsible-ai', label: 'Responsible AI', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-700 dark:selection:text-blue-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate('ask')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
                VQA Studio
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Research Lab
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-2.5">
            {/* System Status Pill */}
            <div
              title={`Status: ${healthStatus?.status || 'Online'} | BLIP Engine: ${healthStatus?.blip_loaded ? 'Ready' : 'Standby'} | Gemini: ${healthStatus?.gemini_configured ? 'Active' : 'Fallback'}`}
              className="hidden lg:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 font-mono text-[11px]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {healthStatus?.low_memory_mode ? 'Cloud Vision Active' : 'PyTorch CPU Ready'}
              </span>
            </div>

            {/* Dark mode button */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-blue-600'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12">
        {route === 'ask' && <AskPage />}
        {route === 'testlab' && <TestLabPage />}
        {route === 'evaluation' && <EvaluationPage />}
        {route === 'learn' && <LearnPage />}
        {route === 'responsible-ai' && <ResponsibleAIPage />}
      </main>

      {/* Clean Academic Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] mt-auto py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Paras Nitin Salunke • Roll 34 • Enrollment: ADT23SOCB0692
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Generative AI (GEN AI) • Problem Statement P34: Visual Question Answering (VQA)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a href="#/responsible-ai" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Responsible AI &amp; Privacy
            </a>
            <span>•</span>
            <a href="#/learn" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Syllabus Coverage
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
