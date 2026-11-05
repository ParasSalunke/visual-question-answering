import { useState, useEffect } from 'react';
import {
  BarChart,
  Play,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Target,
} from 'lucide-react';
import { apiEvalRun, apiEvalResults, apiEvalOverride, getImageUrl } from '../api';

const FAILURE_REASONS = [
  'too dark',
  'clutter',
  'occlusion',
  'small object',
  'counting',
  'OCR',
  'ambiguous question',
  'hallucination',
  'misclassification',
];

export default function EvaluationPage() {
  const [engine, setEngine] = useState<'blip' | 'gemini'>('blip');
  const [threshold, setThreshold] = useState<number>(0.8);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'failures'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Load initial results
  useEffect(() => {
    apiEvalResults()
      .then((data) => {
        if (data && data.pairs) setResults(data);
      })
      .catch((err) => console.log('No prior eval results found:', err));
  }, []);

  const handleRunEval = async () => {
    setLoading(true);
    try {
      const data = await apiEvalRun(engine, threshold);
      setResults(data);
    } catch (err: any) {
      alert(`Benchmark run failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerdict = async (pair: any) => {
    const newVerdict = !pair.verdict;
    try {
      const updated = await apiEvalOverride(pair.id, newVerdict, pair.failure_reason, pair.notes);
      setResults(updated);
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    }
  };

  const handleSaveNotes = async (pairId: string) => {
    const pair = results.pairs.find((p: any) => p.id === pairId);
    if (!pair) return;
    try {
      const updated = await apiEvalOverride(pairId, pair.verdict, editReason, editNotes);
      setResults(updated);
      setEditingId(null);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const summary = results?.summary || {};
  const calib = summary?.calibration || {};
  const pairsList = results?.pairs || [];
  const failureList = pairsList.filter((p: any) => !p.verdict);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <BarChart className="w-8 h-8 text-emerald-200" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Evaluation Benchmark Dashboard (U5)</h1>
            <p className="mt-1 text-emerald-100 text-sm sm:text-base">
              Empirical assessment across 20 curated core pairs (8 Normal, 6 Low-Light, 6 Cluttered) + Confidence Calibration.
            </p>
          </div>
        </div>
      </div>

      {/* Benchmark Controls Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Engine:</label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            >
              <option value="blip">Salesforce BLIP-VQA (Local CPU)</option>
              <option value="gemini">Gemini 2.5 Flash Vision (Cloud)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
              <span>MiniLM Similarity Gate:</span>
              <span className="font-mono text-emerald-600 font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-40 accent-emerald-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleRunEval}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Benchmarking 20 Pairs...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run 20-Pair Benchmark</span>
              </>
            )}
          </button>

          <a
            href="/api/eval/export/csv"
            download="results.csv"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> Export CSV
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500">Overall Accuracy</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {summary.overall_accuracy}%
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.correct} / {summary.total_pairs} pairs passed
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500">Mean Latency</span>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {summary.mean_latency_ms} ms
            </div>
            <span className="text-[11px] text-slate-400">Average response time</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500">Correct Answer Conf.</span>
            <div className="text-2xl font-black text-green-600 mt-1">
              {((calib.mean_correct_confidence || 0) * 100).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400">Mean confidence on pass</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500">Calibration Gap</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              +{(calib.confidence_gap * 100 || 0).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400">Correct vs Incorrect conf</span>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      {results && summary.by_category && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" /> Category Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Total Tested</th>
                  <th className="py-2.5 px-3">Correct</th>
                  <th className="py-2.5 px-3">Accuracy %</th>
                  <th className="py-2.5 px-3">Mean Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(summary.by_category).map(([cat, c]: any) => (
                  <tr key={cat} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {cat.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3">{c.total}</td>
                    <td className="py-2.5 px-3 font-mono">{c.correct}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${c.accuracy}%` }}
                          />
                        </div>
                        <span className="font-bold">{c.accuracy}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{c.mean_latency_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs: All Pairs vs Failure Gallery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All 20 Pairs ({pairsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('failures')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'failures'
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Failure Gallery ({failureList.length})
          </button>
        </div>

        {/* View 1: Detailed Table (All Pairs) */}
        {activeTab === 'all' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Question</th>
                    <th className="py-3 px-3">Ground Truth</th>
                    <th className="py-3 px-3">Prediction</th>
                    <th className="py-3 px-3">Conf</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pairsList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs font-medium text-slate-800 dark:text-slate-200">
                        {p.question}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {p.ground_truth}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold capitalize text-slate-900 dark:text-slate-100">
                        {p.prediction}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {(p.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleVerdict(p)}
                          title="Click to toggle manual override"
                          className="flex items-center gap-1 cursor-pointer focus:outline-none"
                        >
                          {p.verdict ? (
                            <span className="text-green-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Fail
                            </span>
                          )}
                          {p.manual_override && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1 rounded">
                              Overridden
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(p.id);
                            setEditReason(p.failure_reason || 'misclassification');
                            setEditNotes(p.notes || '');
                          }}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Failure Gallery */}
        {activeTab === 'failures' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {failureList.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                🎉 No failure cases in this run! All tested pairs passed the ground-truth gate.
              </div>
            ) : (
              failureList.map((f: any) => (
                <div
                  key={f.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-red-500">{f.id} ({f.category})</span>
                    <button
                      type="button"
                      onClick={() => handleToggleVerdict(f)}
                      className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                    >
                      Override to Pass
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <img
                      src={getImageUrl(f.image)}
                      alt={f.question}
                      className="w-24 h-24 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800"
                    />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{f.question}</p>
                      <p className="text-slate-500">
                        Ground Truth: <span className="font-mono font-bold text-green-600">{f.ground_truth}</span>
                      </p>
                      <p className="text-slate-500">
                        Prediction: <span className="font-mono font-bold text-red-500">{f.prediction}</span> (
                        {(f.confidence * 100).toFixed(0)}% conf)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Reason: <span className="font-medium capitalize text-slate-600 dark:text-slate-300">{f.failure_reason || 'Unspecified'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block mb-1">Student Viva Notes:</span>
                    <input
                      type="text"
                      defaultValue={f.notes || ''}
                      onBlur={(e) => apiEvalOverride(f.id, f.verdict, f.failure_reason, e.target.value)}
                      placeholder="Add case study notes for viva examination..."
                      className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Override / Notes Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Edit Failure Taxonomy & Notes ({editingId})
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Failure Reason:
              </label>
              <select
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {FAILURE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Student Case Study Notes:
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Explain the visual bottleneck for viva examiners..."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveNotes(editingId)}
                className="text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
