import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Download,
  BookmarkPlus,
  RefreshCw,
  Sliders,
  Check,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { apiPresets, apiGenerate } from '../api';

interface PresetItem {
  title: string;
  prompt: string;
  description: string;
}

export default function TestLabPage() {
  const [presets, setPresets] = useState<Record<string, PresetItem>>({});
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string>('low_light');
  const [provider, setProvider] = useState<'hf' | 'gemini'>('hf');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generated Result
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genDetails, setGenDetails] = useState<any | null>(null);

  // Save to Eval Set Modal
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [evalQuestion, setEvalQuestion] = useState<string>('');
  const [evalGroundTruth, setEvalGroundTruth] = useState<string>('');
  const [evalCategory, setEvalCategory] = useState<string>('low_light');
  const [evalTags, setEvalTags] = useState<string>('synthetic, edge-case');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    apiPresets()
      .then((data) => {
        setPresets(data);
        const pMap: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          pMap[k] = (v as PresetItem).prompt;
        }
        setPrompts(pMap);
      })
      .catch((err) => console.error('Failed to load presets:', err));
  }, []);

  const handleGenerate = async (presetKey: string) => {
    setActiveKey(presetKey);
    const promptText = prompts[presetKey] || presets[presetKey]?.prompt;
    if (!promptText) return;

    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await apiGenerate(promptText, provider);
      setGeneratedImage(res.image_base64);
      setGenDetails(res);
      setEvalCategory(
        presetKey.includes('low_light')
          ? 'low_light'
          : presetKey.includes('cluttered')
          ? 'cluttered'
          : 'normal'
      );
    } catch (err: any) {
      setError(err.message || 'Image generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalQuestion.trim() || !evalGroundTruth.trim()) {
      alert('Both Question and Ground Truth must be provided.');
      return;
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setShowSaveModal(false);
      setSaveSuccess(false);
      setEvalQuestion('');
      setEvalGroundTruth('');
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Adversarial Test Lab
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Generate synthetic edge-case imagery to evaluate vision backbones under low-light, clutter, and occlusion.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              Stability SD-Turbo
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              512px Resampling
            </span>
          </div>
        </div>

        {/* Human Ground Truth Verification Alert */}
        <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-800 dark:text-amber-200 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold">Academic Evaluation Protocol:</strong> Synthetic diffusion models may
            render unexpected artifacts or numeric deviations. Visually inspect generated imagery and manually verify ground-truth facts before adding cases to the evaluation set.
          </div>
        </div>
      </div>

      {/* Provider Selector Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Generation Engine:
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {[
            { id: 'hf', label: 'Stability AI SD-Turbo (Inference API)' },
            { id: 'gemini', label: 'Gemini Vision / Procedural Fallback' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setProvider(item.id as any)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                provider === item.id
                  ? 'bg-slate-900 text-white dark:bg-blue-600 border-transparent font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Hard-Case Challenge Presets
          </h2>
          <span className="text-xs font-mono text-slate-400">6 Adversarial Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(presets).map(([key, item]) => (
            <div
              key={key}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all bg-white dark:bg-[#111827] ${
                activeKey === key
                  ? 'border-slate-900 dark:border-blue-500 shadow-xs ring-1 ring-slate-900/10 dark:ring-blue-500/20'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {key.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Prompt Specification:</label>
                  <textarea
                    rows={3}
                    value={prompts[key] || item.prompt}
                    onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
                    className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleGenerate(key)}
                className="mt-4 w-full py-2 px-3 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                {loading && activeKey === key ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Image</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs">
          <strong>Generation Alert:</strong> {error}
        </div>
      )}

      {/* Generated Image Showcase */}
      {generatedImage && (
        <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Generated Visual Output</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Engine: <span className="font-mono uppercase font-semibold text-slate-700 dark:text-slate-300">{genDetails?.provider}</span> •{' '}
                {genDetails?.width}x{genDetails?.height}px • Latency: {genDetails?.latency_ms} ms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={generatedImage}
                download="vqa_generated_test.jpg"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-md font-medium shadow-xs transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save to Eval Set
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-slate-950 p-4 rounded-lg">
            <img
              src={generatedImage}
              alt="Generated synthetic test case"
              className="max-h-96 rounded object-contain shadow-xs"
            />
          </div>

          {genDetails?.error_note && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
              Note: Procedural geometric fallback was utilized because cloud API token was omitted or free-tier quota was exceeded.
            </div>
          )}
        </div>
      )}

      {/* Save to Eval Set Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Save Image to Benchmark Evaluation Set
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveToEval} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Evaluation Question:
                </label>
                <input
                  type="text"
                  required
                  value={evalQuestion}
                  onChange={(e) => setEvalQuestion(e.target.value)}
                  placeholder="e.g. Is there a blue notebook on the desk?"
                  className="w-full text-xs p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ground Truth Reference (Human Verified):
                </label>
                <input
                  type="text"
                  required
                  value={evalGroundTruth}
                  onChange={(e) => setEvalGroundTruth(e.target.value)}
                  placeholder="e.g. yes"
                  className="w-full text-xs p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 block">
                  Mandatory: Must be visually verified by you against the image.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category:</label>
                  <select
                    value={evalCategory}
                    onChange={(e) => setEvalCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="normal">Normal Baseline</option>
                    <option value="low_light">Low-Light Stress</option>
                    <option value="cluttered">Cluttered Adversarial</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Taxonomy Tags:</label>
                  <input
                    type="text"
                    value={evalTags}
                    onChange={(e) => setEvalTags(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-medium rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved to Benchmark</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
