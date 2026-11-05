import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Camera,
  Clipboard,
  ChevronRight,
  Layers,
  BarChart3,
  Sliders,
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

  // Stepper state: 1 = Template/Input, 2 = Short Answer, 3 = Sentence
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
      setError('File size exceeds 5 MB limit. Please select a smaller image.');
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
      const file = new File([blob], sample.path.split('/').pop() || 'sample.jpg', { type: blob.type || 'image/jpeg' });
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
      setError('Please upload or select an image first.');
      return;
    }
    if (!question.trim()) {
      setError('Please enter or select a question.');
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
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Visual Question Answering</h1>
        <p className="mt-1 text-blue-100 text-sm sm:text-base">
          Dual-engine multimodal pipeline: Salesforce BLIP-VQA (CPU) + Gemini Flash LLM Expansion.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="bg-blue-800/60 px-2.5 py-1 rounded-full border border-blue-400/30">Free Tier CPU Safe</span>
          <span className="bg-blue-800/60 px-2.5 py-1 rounded-full border border-blue-400/30">In-Memory Image Processing (Zero Storage)</span>
          <span className="bg-blue-800/60 px-2.5 py-1 rounded-full border border-blue-400/30">Fidelity-Gated Expansion</span>
        </div>
      </div>

      {/* Visual Pipeline Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>1</span>
            <span>Input & Template</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>2</span>
            <span>Short Answer (Vision)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>3</span>
            <span>Full Sentence (LLM)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Image Upload & Preview */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Image Input <span className="text-xs font-normal text-slate-500">(Max 5 MB, processed in RAM)</span>
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              imagePreview
                ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-900/50'
            }`}
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Uploaded preview"
                  className="max-h-64 mx-auto rounded-lg shadow-sm object-contain border border-slate-200 dark:border-slate-800"
                />
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-md"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                    className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Drag and drop image here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 dark:text-blue-400 underline font-semibold focus:outline-none"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG, WEBP (paste clipboard or camera)</p>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-500" /> Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.read().catch(() => alert('Use Ctrl+V to paste an image'))}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-indigo-500" /> Paste
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
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

          {/* Quick Demo Gallery */}
          <div>
            <span className="block text-xs font-semibold text-slate-500 mb-1.5">Quick Demo Samples (1-Click Test):</span>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="text-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:shadow-xs transition-all text-xs"
                >
                  <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 mb-1">
                    <ImageIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block truncate">{sample.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Templates & Question */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Template Category Chips */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Question Templates <span className="text-xs font-normal text-slate-500">(U1)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selector dropdown/chips */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
              {(Array.isArray(templates) ? templates : [])
                .filter((t) => t.category === selectedCategory)
                .map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`text-xs text-left p-1.5 rounded transition-all ${
                      activeTemplate?.id === tmpl.id
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tmpl.template}
                  </button>
                ))}
            </div>

            {/* Inline Placeholder Fields */}
            {activeTemplate && Object.keys(placeholders).length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 space-y-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">Template Parameters:</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(placeholders).map(([k, v]) => (
                    <div key={k}>
                      <label className="block text-[11px] text-blue-700 dark:text-blue-300 font-medium capitalize">{k}:</label>
                      <input
                        type="text"
                        value={v}
                        onChange={(e) => handlePlaceholderChange(k, e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="question-input" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Question
                </label>
                <span className={`text-xs ${question.length > 180 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {question.length}/200
                </span>
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
                placeholder="Ask something about the image (e.g. What color is the car?)"
                className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Engine Selection & Options */}
            <div className="space-y-2 pt-1">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Vision Model Engine (U3):</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'blip', label: 'BLIP (Local CPU)', desc: 'No quota dependency' },
                  { id: 'gemini', label: 'Gemini Vision', desc: 'Cloud multimodal' },
                  { id: 'both', label: 'Compare Both', desc: 'Side-by-side run' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex flex-col p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                      engine === item.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="engine"
                        value={item.id}
                        checked={engine === item.id}
                        onChange={() => setEngine(item.id as any)}
                        className="text-blue-600"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedFile || !question.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running VQA Inference...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ask Question</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="text-sm">
            <p className="font-semibold">Request Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Results Section with aria-live */}
      <div aria-live="polite" className="space-y-6">
        {result && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">VQA Pipeline Output</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Latency: {result.latency_ms} ms</span>
                <button
                  type="button"
                  onClick={() => handleReadAloud(expandedSentence || result.short_answer)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                >
                  <Volume2 className="w-4 h-4 text-blue-500" /> Read Aloud
                </button>
              </div>
            </div>

            {/* Low Confidence Warning (Academic Requirement) */}
            {result.is_low_confidence && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Low Confidence Warning (Confidence &lt; 0.45):</strong> Prediction may be unreliable due to
                  poor illumination, occlusion, or clutter. Visually verify before relying on this result.
                </span>
              </div>
            )}

            {/* Step 2: Short Answer Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Step 2: Terse Short Answer</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white capitalize mt-1">
                    "{result.short_answer}"
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Confidence:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      result.confidence >= 0.6
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : result.confidence >= 0.35
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Step 3: Expanded Sentence Box */}
              <div className="md:col-span-2 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">
                      Step 3: Expanded Full Sentence (LLM)
                    </span>
                    {isFallback && (
                      <span
                        title={fallbackReason || 'Fallback rule sentence'}
                        className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      >
                        Fallback Badge
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium text-slate-800 dark:text-slate-100 mt-2 leading-relaxed">
                    "{expandedSentence}"
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 dark:border-blue-900/50 pt-2 text-xs text-slate-500">
                  <span>Gemini Temperature: 0.1 | Anti-Hallucination Gate</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 font-medium">
                    <input
                      type="checkbox"
                      checked={comparePrompts}
                      onChange={(e) => handleToggleComparePrompts(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Compare Prompts (Zero vs Few-Shot)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Compare Prompts View (U2 requirement) */}
            {comparePrompts && promptComparison && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-500" />
                    Prompt Engineering Comparison (Zero-Shot vs Few-Shot)
                  </h3>
                  <span className="text-xs text-slate-400">Academic Layer I Requirement</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Zero-Shot */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Zero-Shot Technique</span>
                      <span className="text-[11px] text-slate-400">{promptComparison.zero_shot.latency_ms} ms</span>
                    </div>
                    <p className="text-sm italic text-slate-800 dark:text-slate-200">
                      "{promptComparison.zero_shot.sentence}"
                    </p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">Fidelity:</span>
                      <span className={promptComparison.zero_shot.fidelity_passed ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {promptComparison.zero_shot.fidelity_passed ? 'Passed (100%)' : 'Failed'}
                      </span>
                    </div>
                  </div>

                  {/* Few-Shot */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Few-Shot Technique (5+ Exemplars)</span>
                      <span className="text-[11px] text-slate-400">{promptComparison.few_shot.latency_ms} ms</span>
                    </div>
                    <p className="text-sm italic text-slate-800 dark:text-slate-200">
                      "{promptComparison.few_shot.sentence}"
                    </p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">Fidelity:</span>
                      <span className={promptComparison.few_shot.fidelity_passed ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {promptComparison.few_shot.fidelity_passed ? 'Passed (100%)' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compare Both Engines View (U3 requirement) */}
            {engine === 'both' && result.details && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Dual Engine Comparison: BLIP (Local CPU) vs Gemini Vision (Cloud)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-blue-600">Salesforce BLIP-VQA</span>
                      <span className="text-xs text-slate-400">{result.details.blip?.latency_ms} ms</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                      {result.details.blip?.short_answer || 'N/A'}
                    </p>
                    <span className="text-xs text-slate-500">
                      Confidence: {((result.details.blip?.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-600">Gemini 2.5 Flash Vision</span>
                      <span className="text-xs text-slate-400">{result.details.gemini?.latency_ms} ms</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                      {result.details.gemini?.short_answer || 'N/A'}
                    </p>
                    <span className="text-xs text-slate-500">
                      Confidence: {((result.details.gemini?.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top-K Candidates Bar Chart (Layer I probability requirement) */}
            {result.top_k && result.top_k.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                    Top-K Answer Candidates & Sequence Probabilities (Layer I):
                  </span>
                  <span className="text-[11px] text-slate-400">Softmax beam scores</span>
                </div>
                <div className="space-y-1.5">
                  {result.top_k.map((cand: any, idx: number) => {
                    const pct = Math.round(cand.probability * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-slate-600 dark:text-slate-400 truncate capitalize font-medium">
                          {cand.answer}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-slate-500 dark:text-slate-400">{pct}%</span>
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
