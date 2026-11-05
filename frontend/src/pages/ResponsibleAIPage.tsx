import { useState } from 'react';
import {
  ShieldCheck,
  EyeOff,
  Lock,
  FileCheck,
  AlertOctagon,
  RefreshCw,
  Scale,
  Accessibility,
} from 'lucide-react';
import { apiUnanswerableRun } from '../api';

export default function ResponsibleAIPage() {
  const [engine, setEngine] = useState<'blip' | 'gemini'>('blip');
  const [loading, setLoading] = useState<boolean>(false);
  const [hallucinationData, setHallucinationData] = useState<any | null>(null);

  const handleRunHallucinationTest = async () => {
    setLoading(true);
    try {
      const data = await apiUnanswerableRun(engine);
      setHallucinationData(data);
    } catch (err: any) {
      alert(`Hallucination test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Responsible AI &amp; Safety Guardrails
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Empirical hallucination benchmarking, privacy assurances, PII refusal filters, and assistive standards.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              Zero Disk Retention
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              PII Refusal Gated
            </span>
          </div>
        </div>
      </div>

      {/* Measured Hallucination Test Section */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-slate-500" />
              <span>Measured Hallucination Benchmark (10 Probes)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Testing model resilience against questions targeting objects completely absent or occluded from visual evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="blip">BLIP (Local CPU)</option>
              <option value="gemini">Gemini 3.5 Flash</option>
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={handleRunHallucinationTest}
              className="px-3.5 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white text-xs font-medium rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Probing 10 Queries...</span>
                </>
              ) : (
                'Run Hallucination Benchmark'
              )}
            </button>
          </div>
        </div>

        {hallucinationData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Hallucination Rate</span>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">
                  {hallucinationData.hallucination_rate_pct}%
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {hallucinationData.hallucinations} / {hallucinationData.total_unanswerable} fabricated assertions
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Clean Refusal Rate</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {(100 - hallucinationData.hallucination_rate_pct).toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Correctly answered "not visible"</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Tested Model</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 uppercase font-mono">
                  {hallucinationData.engine}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">10 unanswerable test queries</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Unanswerable Query</th>
                    <th className="p-2.5">Perceived Output</th>
                    <th className="p-2.5">Confidence</th>
                    <th className="p-2.5">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {hallucinationData.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="p-2.5 font-mono text-slate-400">{item.id}</td>
                      <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{item.question}</td>
                      <td className="p-2.5 font-mono font-bold capitalize text-slate-900 dark:text-slate-100">
                        "{item.prediction}"
                      </td>
                      <td className="p-2.5 font-mono text-slate-500">{(item.confidence * 100).toFixed(0)}%</td>
                      <td className="p-2.5">
                        {item.is_hallucination ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold text-[10px]">
                            Hallucination
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[10px]">
                            Clean Refusal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Production Guardrails Section */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Active Architecture Guardrails</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-500" /> 1. Ephemeral In-Memory Streaming
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Uploaded user images are decoded into PIL byte buffers directly in RAM and passed to the model. Images are <strong>never stored on disk or database</strong> and are garbage-collected immediately upon HTTP response completion.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-slate-500" /> 2. Facial Recognition &amp; PII Refusal
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Pre-flight regex guardrails intercept requests seeking personal identification (e.g. <em>"who is this person?"</em>), blocking unconsented biometric profiling.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-500" /> 3. Resource &amp; Rate Safeguards
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Enforces a strict 5 MB file size ceiling, a 200-character prompt boundary, and per-client in-memory sliding-window rate limiting (60 requests/minute).
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Accessibility className="w-4 h-4 text-slate-500" /> 4. Low-Confidence Uncertainty Warnings
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              When prediction confidence drops below 0.45, an amber warning banner notifies users that visual features are ambiguous, preventing hazardous reliance.
            </p>
          </div>
        </div>
      </section>

      {/* Accessibility Note */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-slate-400" />
          <span>Assistive AI Considerations for Low-Vision Users</span>
        </h2>
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          <p>
            For visually impaired users, visual question answering is a navigational aid (e.g., <em>"Is the sidewalk clear of hazards?"</em>). Under low-light or motion blur, models can exhibit false confidence.
          </p>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            Design Rule: Always communicate uncertainty numerically, enforce auditory warnings when confidence is below threshold, and provide speech synthesis ("Read Aloud") for accessible consumption.
          </p>
        </div>
      </section>

      {/* Licenses & Compliance */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-slate-400" />
          <span>Open Source Licensing &amp; Attribution</span>
        </h2>
        <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-500">
              <tr>
                <th className="p-2.5">Component / Model</th>
                <th className="p-2.5">License</th>
                <th className="p-2.5">Terms / Permitted Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr>
                <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Salesforce BLIP-VQA-Base</td>
                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">BSD-3-Clause</td>
                <td className="p-2.5 text-slate-500">Academic &amp; commercial use with attribution.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Sentence-Transformers (MiniLM)</td>
                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">Apache-2.0</td>
                <td className="p-2.5 text-slate-500">Permissive open source with trademark reservation.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Google Gemini API</td>
                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">Google GenAI Terms</td>
                <td className="p-2.5 text-slate-500">Free-tier API use subject to Google developer policies.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Evaluation Benchmark Images</td>
                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">CC0 1.0 Universal</td>
                <td className="p-2.5 text-slate-500">Public domain synthetic datasets for reproducible research.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
