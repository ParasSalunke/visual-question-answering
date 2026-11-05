import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Volume2,
  AlertTriangle,
  RefreshCw,
  Camera,
  Clipboard,
  ChevronRight,
  Layers,
  BarChart2,
  Sliders,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { apiTemplates, apiVqa, apiExpand } from '../api';

interface TemplateItem {
  id: string;
  category: string;
  template: string;
  defaults: Record<string, string>;
}

const SAMPLE_IMAGES = [
  { label: 'Red Car', path: '/eval/images/normal_01_red_car.jpg', defaultQ: 'What color is the car?' },
  { label: '3 Cups', path: '/eval/images/normal_02_three_cups.jpg', defaultQ: 'How many cups are on the surface?' },
  { label: 'Apple', path: '/eval/images/normal_03_red_apple.jpg', defaultQ: 'What fruit is shown in the image?' },
  { label: 'Stop Sign', path: '/eval/images/normal_04_stop_sign.jpg', defaultQ: 'What kind of traffic sign is visible?' },
];

export default function AskPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [engine, setEngine] = useState<'blip' | 'gemini' | 'both'>('blip');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Template state
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('existence');
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});

  // Result state
  const [result, setResult] = useState<any | null>(null);
  const [comparePrompts, setComparePrompts] = useState<boolean>(false);
  const [promptComparison, setPromptComparison] = useState<any | null>(null);
  const [expandedSentence, setExpandedSentence] = useState<string>('');
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  // Pipeline step tracker: 1 = Input, 2 = Perception, 3 = Expansion
  const [currentStep, setCurrentStep] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load templates
  useEffect(() => {
    apiTemplates()
      .then((data: any) => {
        if (Array.isArray(data)) {
          setTemplates(data);
          const cats = Array.from(new Set(data.map((t: any) => t.category)));
          setCategories(cats);
          if (cats.length > 0) setSelectedCategory(cats[0]);
        }
      })
      .catch((err) => console.error('Failed to load templates:', err));
  }, []);

  // Update question when placeholder values change
  const handlePlaceholderChange = (key: string, val: string) => {
    const updated = { ...placeholders, [key]: val };
    setPlaceholders(updated);
    if (activeTemplate) {
      let q = activeTemplate.template;
      for (const [k, v] of Object.entries(updated)) {
        q = q.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
      setQuestion(q);
    }
  };

  const handleSelectTemplate = (tmpl: TemplateItem) => {
    setActiveTemplate(tmpl);
    setPlaceholders(tmpl.defaults);
    let q = tmpl.template;
    for (const [k, v] of Object.entries(tmpl.defaults)) {
      q = q.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    setQuestion(q);
  };

  const handleFileChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size exceeds the 5 MB in-memory limit. Please choose a smaller image.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Load sample image
  const handleLoadSample = async (sample: typeof SAMPLE_IMAGES[0]) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(sample.path);
      const blob = await res.blob();
      const file = new File([blob], sample.path.split('/').pop() || 'sample.jpg', {
        type: blob.type || 'image/jpeg',
      });
      handleFileChange(file);
      setQuestion(sample.defaultQ);
      setActiveTemplate(null);
    } catch (e: any) {
      setError(`Failed to load sample image: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Clipboard Paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) handleFileChange(file);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Submit VQA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or upload an image to begin.');
      return;
    }
    if (!question.trim()) {
      setError('Please enter or select a question to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setPromptComparison(null);
    setCurrentStep(1);

    try {
      // Step 2: VQA inference
      const vqaRes = await apiVqa(selectedFile, question, engine);
      setResult(vqaRes);
      setCurrentStep(2);

      // Step 3: LLM expansion
      const shortAns = vqaRes.short_answer || 'unknown';
      const technique = comparePrompts ? 'both' : 'few_shot';
      const expandRes = await apiExpand(question, shortAns, technique);

      if (comparePrompts && expandRes.zero_shot && expandRes.few_shot) {
        setPromptComparison(expandRes);
        setExpandedSentence(expandRes.few_shot.sentence);
        setIsFallback(expandRes.few_shot.is_fallback);
        setFallbackReason(expandRes.few_shot.fallback_reason);
      } else {
        setExpandedSentence(expandRes.sentence);
        setIsFallback(expandRes.is_fallback);
        setFallbackReason(expandRes.fallback_reason);
      }
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'An error occurred during VQA processing.');
    } finally {
      setLoading(false);
    }
  };

  // Re-run expansion if comparePrompts toggled
  const handleToggleComparePrompts = async (enabled: boolean) => {
    setComparePrompts(enabled);
    if (result && result.short_answer) {
      try {
        const technique = enabled ? 'both' : 'few_shot';
        const expandRes = await apiExpand(question, result.short_answer, technique);
        if (enabled && expandRes.zero_shot && expandRes.few_shot) {
          setPromptComparison(expandRes);
          setExpandedSentence(expandRes.few_shot.sentence);
        } else {
          setExpandedSentence(expandRes.sentence);
          setPromptComparison(null);
        }
      } catch (err) {
        console.error('Failed to update prompt comparison:', err);
      }
    }
  };

  // Web Speech API Read Aloud
  const handleReadAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported by your browser.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Clean Editorial Header */}
      <div className="space-y-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Visual Question Answering
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Multimodal perception via Salesforce BLIP-VQA with natural sentence synthesis by Gemini Flash.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              BLIP-VQA 385M
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              Gemini Flash
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              In-Memory RAM
            </span>
          </div>
        </div>

        {/* Minimal Stepper Bar */}
        <div className="pt-3">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`flex items-center gap-1.5 font-medium ${
                currentStep >= 1 ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Input &amp; Question</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <span
              className={`flex items-center gap-1.5 font-medium ${
                currentStep >= 2 ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Visual Perception</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <span
              className={`flex items-center gap-1.5 font-medium ${
                currentStep >= 3 ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Sentence Expansion</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Canvas & Samples (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Input Image
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Max 5MB • RAM Only</span>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`relative rounded-xl border transition-all overflow-hidden bg-white dark:bg-[#111827] ${
              imagePreview
                ? 'border-slate-300 dark:border-slate-700 shadow-xs'
                : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            {imagePreview ? (
              <div className="p-4 space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-full max-h-72 object-contain mx-auto"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 truncate max-w-[180px]">
                    {selectedFile?.name || 'Uploaded image'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                      className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 px-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Drop an image here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer focus:outline-none"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPEG, or WEBP up to 5 MB</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.read().catch(() => alert('Press Ctrl+V to paste an image'))}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste Clipboard</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Quick Demo Samples with Real Thumbnails */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              1-Click Benchmark Samples
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="group text-left p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="aspect-4/3 w-full rounded overflow-hidden bg-slate-100 dark:bg-slate-800 mb-1.5 border border-slate-100 dark:border-slate-800">
                    <img
                      src={sample.path}
                      alt={sample.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <span className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                    {sample.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Question & Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Question Templates Section */}
          <div className="space-y-3 bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Question Templates
              </label>
              <span className="text-[11px] font-mono text-slate-400">26 Structured Presets</span>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all capitalize cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-blue-600 font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Template Selector List */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
              {(Array.isArray(templates) ? templates : [])
                .filter((t) => t.category === selectedCategory)
                .map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`text-xs text-left px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                      activeTemplate?.id === tmpl.id
                        ? 'bg-blue-600 text-white font-medium shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tmpl.template}
                  </button>
                ))}
            </div>

            {/* Template Parameter Replacements */}
            {activeTemplate && Object.keys(placeholders).length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Template Placeholders:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(placeholders).map(([k, v]) => (
                    <div key={k} className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 capitalize">{k}</label>
                      <input
                        type="text"
                        value={v}
                        onChange={(e) => handlePlaceholderChange(k, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Textarea */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between items-center">
                <label htmlFor="question-input" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Target Question:
                </label>
                <span className="text-[11px] font-mono text-slate-400">{question.length}/200</span>
              </div>
              <textarea
                id="question-input"
                rows={2}
                maxLength={200}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setActiveTemplate(null);
                }}
                placeholder="Type your question or click a template above (e.g. What color is the car?)"
                className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-normal"
              />
            </div>

            {/* Vision Model Engine Choice */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Vision Engine
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'blip', title: 'BLIP-VQA Base', desc: 'PyTorch CPU' },
                  { id: 'gemini', title: 'Gemini Vision', desc: 'Cloud Multimodal' },
                  { id: 'both', title: 'Compare Both', desc: 'Side-by-side run' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEngine(item.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      engine === item.id
                        ? 'border-slate-900 dark:border-blue-500 bg-slate-900/5 dark:bg-blue-950/30 font-medium shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !selectedFile || !question.trim()}
                className="w-full py-3 px-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-medium text-sm rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image &amp; Synthesizing Answer...</span>
                  </>
                ) : (
                  <>
                    <span>Ask Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="text-sm">
            <p className="font-semibold">Processing Notice</p>
            <p className="mt-0.5 text-xs sm:text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results Workspace Area */}
      <div aria-live="polite" className="space-y-6">
        {result && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            {/* Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Question Analyzed
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">"{question}"</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">
                  Latency: {result.latency_ms} ms
                </span>
                <button
                  type="button"
                  onClick={() => handleReadAloud(expandedSentence || result.short_answer)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Read Aloud</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(expandedSentence || result.short_answer)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Low Confidence Notice */}
            {result.is_low_confidence && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Confidence Warning (&lt; 0.45):</strong> The visual scene presents ambiguous cues
                  or low contrast. Visually confirm before relying on this prediction.
                </span>
              </div>
            )}

            {/* 2-Tier Core Answers Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Short Answer Perception (4 cols) */}
              <div className="md:col-span-4 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Visual Perception
                  </span>
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
                    {result.short_answer || 'Unknown'}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Confidence</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                      result.confidence >= 0.6
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : result.confidence >= 0.45
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Natural Sentence Expansion (8 cols) */}
              <div className="md:col-span-8 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Synthesized Sentence
                    </span>
                    {isFallback && (
                      <span
                        title={fallbackReason || 'Fallback rule sentence'}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono"
                      >
                        Deterministic Fallback
                      </span>
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    "{expandedSentence || result.short_answer}"
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-400">
                    Fidelity Gated • Temperature 0.1
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors font-medium">
                    <input
                      type="checkbox"
                      checked={comparePrompts}
                      onChange={(e) => handleToggleComparePrompts(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Compare Zero-Shot vs Few-Shot</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Prompt Comparison View */}
            {comparePrompts && promptComparison && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    Prompt Engineering Comparison
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Unit 2 Requirement</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Zero-Shot */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Zero-Shot Direct</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {promptComparison.zero_shot.latency_ms} ms
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      "{promptComparison.zero_shot.sentence}"
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Fidelity status:{' '}
                      <span className={promptComparison.zero_shot.fidelity_passed ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                        {promptComparison.zero_shot.fidelity_passed ? 'Verified' : 'Flagged'}
                      </span>
                    </div>
                  </div>

                  {/* Few-Shot */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Few-Shot (5+ Examples)</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {promptComparison.few_shot.latency_ms} ms
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      "{promptComparison.few_shot.sentence}"
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Fidelity status:{' '}
                      <span className={promptComparison.few_shot.fidelity_passed ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                        {promptComparison.few_shot.fidelity_passed ? 'Verified' : 'Flagged'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compare Both Engines View */}
            {engine === 'both' && result.details && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Dual Engine Cross-Validation
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">Salesforce BLIP-VQA</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {result.details.blip?.latency_ms} ms
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {result.details.blip?.short_answer || 'N/A'}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Confidence: {((result.details.blip?.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">Gemini 3.5 Flash Vision</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {result.details.gemini?.latency_ms} ms
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {result.details.gemini?.short_answer || 'N/A'}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Confidence: {((result.details.gemini?.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Distribution Top-K */}
            {result.top_k && result.top_k.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                    Answer Probability Distribution (Softmax Top-K)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Beam Sequence Scores</span>
                </div>
                <div className="space-y-1.5">
                  {result.top_k.map((cand: any, idx: number) => {
                    const pct = Math.round(cand.probability * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-28 text-slate-600 dark:text-slate-400 truncate capitalize font-medium">
                          {cand.answer}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              idx === 0 ? 'bg-slate-900 dark:bg-blue-500' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-slate-500">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
