import { useState, useEffect } from 'react';
import {
  Brain,
  HelpCircle,
  FlaskConical,
  BarChart,
  GraduationCap,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
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
      .catch((err) => console.log('Backend not reachable yet:', err));
  }, []);

  const navItems: { id: Route; label: string; icon: any; task: string }[] = [
    { id: 'ask', label: 'Ask (Home)', icon: HelpCircle, task: 'U1+U3' },
    { id: 'testlab', label: 'Test Lab', icon: FlaskConical, task: 'U4' },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart, task: 'U5' },
    { id: 'learn', label: 'Learn (Syllabus)', icon: GraduationCap, task: 'L1-L4' },
    { id: 'responsible-ai', label: 'Responsible AI', icon: ShieldCheck, task: 'L5' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate('ask')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                VQA Studio
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono ml-1.5 uppercase tracking-wider">
                GenAI 2026
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Health Pill + Dark Mode + Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Health pill */}
            <div
              title={`Status: ${healthStatus?.status || 'connecting'} | BLIP: ${healthStatus?.blip_loaded ? 'Loaded' : 'Ready'} | Gemini: ${healthStatus?.gemini_configured ? 'Active' : 'Fallback'}`}
              className="hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
            >
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>CPU Ready (7860)</span>
            </div>

            {/* Dark mode button */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 shadow-lg">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono">{item.task}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {route === 'ask' && <AskPage />}
        {route === 'testlab' && <TestLabPage />}
        {route === 'evaluation' && <EvaluationPage />}
        {route === 'learn' && <LearnPage />}
        {route === 'responsible-ai' && <ResponsibleAIPage />}
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Generative AI Individual Course Project (50 Marks)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live Demo (15) | Syllabus Coverage (10) | Evaluation (10) | Code &amp; Repo (5) | Report (5) | Viva (5)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>Hugging Face Spaces (CPU Docker)</span>
            <span>•</span>
            <a href="#/responsible-ai" className="hover:underline text-blue-600 dark:text-blue-400">
              Licenses &amp; Model Card
            </a>
            <span>•</span>
            <a href="#/learn" className="hover:underline text-blue-600 dark:text-blue-400">
              Syllabus Map
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
