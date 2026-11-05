import { useState, useEffect } from 'react';
import {
  FlaskConical,
  Sparkles,
  AlertTriangle,
  Download,
  BookmarkPlus,
  RefreshCw,
  Sliders,
  Check,
  Eye,
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
      setEvalCategory(presetKey.includes('low_light') ? 'low_light' : presetKey.includes('cluttered') ? 'cluttered' : 'normal');
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
    // Simulation / local notification of saving to eval
    setSaveSuccess(true);
    setTimeout(() => {
      setShowSaveModal(false);
      setSaveSuccess(false);
      setEvalQuestion('');
      setEvalGroundTruth('');
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-purple-300" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Test Image Lab (U4)</h1>
            <p className="mt-1 text-purple-200 text-sm sm:text-base">
              Generate adversarial hard-case visual inputs to stress-test vision backbones and uncover failure modes.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Academic Warning Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold">Crucial Academic Rule (Visual Verification Required):</p>
          <p className="mt-0.5 text-xs sm:text-sm">
            Diffusion models (like SD-Turbo) frequently hallucinate or ignore fine-grained numeric counts and tiny objects.
            You must <strong>visually verify</strong> every generated image before saving to evaluation sets. Never derive ground truth from model prediction!
          </p>
        </div>
      </div>

      {/* Provider Selector */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Image Generation Provider:</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="hf"
              checked={provider === 'hf'}
              onChange={() => setProvider('hf')}
              className="text-purple-600"
            />
            <span>HF sd-turbo (Inference API)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="gemini"
              checked={provider === 'gemini'}
              onChange={() => setProvider('gemini')}
              className="text-purple-600"
            />
            <span>Gemini Image (Nano Banana / Imagen)</span>
          </label>
        </div>
      </div>

      {/* Presets Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Hard-Case Preset Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(presets).map(([key, item]) => (
            <div
              key={key}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                activeKey === key
                  ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Editable Prompt:
                  </label>
                  <textarea
                    rows={3}
                    value={prompts[key] || item.prompt}
                    onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleGenerate(key)}
                className="mt-4 w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading && activeKey === key ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate {item.title.split('/')[0]}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <strong>Generation Error:</strong> {error}
        </div>
      )}

      {/* Generated Image Showcase */}
      {generatedImage && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" /> Generated Visual Case
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Provider: <span className="font-mono uppercase font-bold text-purple-600">{genDetails?.provider}</span> |{' '}
                {genDetails?.width}x{genDetails?.height}px | Latency: {genDetails?.latency_ms}ms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={generatedImage}
                download="vqa_generated_test.jpg"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save to Eval Set
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-slate-950 p-4 rounded-xl">
            <img
              src={generatedImage}
              alt="Generated synthetic test case"
              className="max-h-96 rounded-lg object-contain shadow-md"
            />
          </div>

          {genDetails?.error_note && (
            <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200">
              Note: Procedural fallback was used because API token was absent or free-tier quota was exceeded.
            </div>
          )}
        </div>
      )}

      {/* Save to Eval Set Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Save Image to Evaluation Benchmark</h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveToEval} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evaluation Question:
                </label>
                <input
                  type="text"
                  required
                  value={evalQuestion}
                  onChange={(e) => setEvalQuestion(e.target.value)}
                  placeholder="e.g. Is the path ahead clear of obstacles?"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ground Truth (Typed by Student):
                </label>
                <input
                  type="text"
                  required
                  value={evalGroundTruth}
                  onChange={(e) => setEvalGroundTruth(e.target.value)}
                  placeholder="e.g. no"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Academic Rule: Must be visually confirmed by you.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category:</label>
                  <select
                    value={evalCategory}
                    onChange={(e) => setEvalCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="normal">Normal</option>
                    <option value="low_light">Low-Light</option>
                    <option value="cluttered">Cluttered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags:</label>
                  <input
                    type="text"
                    value={evalTags}
                    onChange={(e) => setEvalTags(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center gap-1"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-300" /> Saved!
                    </>
                  ) : (
                    'Confirm Save'
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
