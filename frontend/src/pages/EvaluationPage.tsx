import { useState, useEffect } from 'react';
import {
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Benchmark Evaluation &amp; Failure Study
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Standardized 20-pair ground truth evaluation across Normal, Low-Light, and Cluttered domains with confidence calibration.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              all-MiniLM-L6-v2
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              Dual-Verdict Engine
            </span>
          </div>
        </div>
      </div>

      {/* Benchmark Controls Bar */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Evaluation Engine:
            </label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="blip">Salesforce BLIP-VQA (Local CPU)</option>
              <option value="gemini">Gemini 3.5 Flash Vision (Cloud)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider">Similarity Gate:</span>
              <span className="font-mono text-slate-900 dark:text-white font-bold ml-2">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-40 accent-slate-900 dark:accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleRunEval}
            className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Benchmark (20 Pairs)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Benchmark</span>
              </>
            )}
          </button>

          <a
            href="/api/eval/export/csv"
            download="vqa_benchmark_results.csv"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Overall Accuracy</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {summary.overall_accuracy}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {summary.correct} / {summary.total_pairs} pairs verified
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Mean Latency</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {summary.mean_latency_ms} ms
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Per query execution</span>
          </div>

          <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Correct Conf.</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {((calib.mean_correct_confidence || 0) * 100).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Mean confidence on pass</span>
          </div>

          <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Calibration Gap</span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
              +{(calib.confidence_gap * 100 || 0).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Confidence separation</span>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      {results && summary.by_category && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-slate-400" />
            <span>Category Performance Breakdown</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Tested</th>
                  <th className="py-2.5 px-3">Correct</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Mean Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {Object.entries(summary.by_category).map(([cat, c]: any) => (
                  <tr key={cat} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold capitalize text-slate-900 dark:text-white">
                      {cat.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{c.total}</td>
                    <td className="py-2.5 px-3 font-mono">{c.correct}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 dark:bg-blue-500 h-full rounded-full"
                            style={{ width: `${c.accuracy}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold">{c.accuracy}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{c.mean_latency_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs: All Pairs vs Failure Gallery */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-3.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            All 20 Pairs ({pairsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('failures')}
            className={`py-1.5 px-3.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'failures'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Failure Study ({failureList.length})</span>
          </button>
        </div>

        {/* View 1: Detailed Table (All Pairs) */}
        {activeTab === 'all' && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Domain</th>
                    <th className="py-3 px-3">Question</th>
                    <th className="py-3 px-3">Ground Truth</th>
                    <th className="py-3 px-3">Prediction</th>
                    <th className="py-3 px-3">Conf</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3 text-right">Annotate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {pairsList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{p.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs font-medium text-slate-800 dark:text-slate-200">
                        {p.question}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
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
                          title="Click to toggle human override"
                          className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
                        >
                          {p.verdict ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Fail
                            </span>
                          )}
                          {p.manual_override && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1 py-0.2 rounded font-mono">
                              Override
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
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs cursor-pointer p-1 rounded"
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
              <div className="col-span-2 p-8 text-center text-slate-400 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800">
                All 20 test pairs passed the evaluation criteria for this run.
              </div>
            ) : (
              failureList.map((f: any) => (
                <div
                  key={f.id}
                  className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {f.id} • <span className="capitalize text-slate-400">{f.category.replace('_', ' ')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleVerdict(f)}
                      className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer transition-colors"
                    >
                      Override to Pass
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <img
                      src={getImageUrl(f.image)}
                      alt={f.question}
                      className="w-24 h-24 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-200/60 dark:border-slate-800"
                    />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">{f.question}</p>
                      <p className="text-slate-500">
                        Ground Truth: <span className="font-mono font-semibold text-emerald-600">{f.ground_truth}</span>
                      </p>
                      <p className="text-slate-500">
                        Prediction: <span className="font-mono font-semibold text-red-500">{f.prediction}</span> (
                        {(f.confidence * 100).toFixed(0)}% conf)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Taxonomy: <span className="font-medium capitalize text-slate-600 dark:text-slate-300">{f.failure_reason || 'Unspecified'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">Student Viva Defense Notes:</span>
                    <input
                      type="text"
                      defaultValue={f.notes || ''}
                      onBlur={(e) => apiEvalOverride(f.id, f.verdict, f.failure_reason, e.target.value)}
                      placeholder="Add analytical notes for viva defense..."
                      className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-md w-full shadow-xl space-y-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Edit Failure Taxonomy &amp; Notes ({editingId})
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Failure Root-Cause Taxonomy:
              </label>
              <select
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {FAILURE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Student Case Notes:
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Explain the visual bottleneck for examiners..."
                className="w-full text-xs p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveNotes(editingId)}
                className="text-xs px-4 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-medium rounded-md cursor-pointer shadow-xs"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
