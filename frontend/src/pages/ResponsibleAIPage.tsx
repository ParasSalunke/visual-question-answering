import { useState } from 'react';
import {
  ShieldAlert,
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
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-pink-700 to-red-800 text-white p-6 sm:p-8 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-9 h-9 text-rose-200" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Layer V: Responsible AI &amp; Safety Guardrails</h1>
            <p className="mt-1 text-rose-100 text-sm sm:text-base">
              Empirical hallucination benchmarking, privacy assurances, content filters, and ethical accessibility standards.
            </p>
          </div>
        </div>
      </div>

      {/* Measured Hallucination Test Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-rose-600" /> Measured Hallucination Benchmark
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Testing model resilience against 10 questions targeting objects completely absent from the image.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="blip">BLIP (Local CPU)</option>
              <option value="gemini">Gemini 2.5 Flash</option>
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={handleRunHallucinationTest}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running 10 Probes...
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
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Hallucination Rate</span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {hallucinationData.hallucination_rate_pct}%
                </div>
                <span className="text-[11px] text-slate-500">
                  {hallucinationData.hallucinations} / {hallucinationData.total_unanswerable} false assertions
                </span>
              </div>
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Proper Refusal / Null Rate</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {(100 - hallucinationData.hallucination_rate_pct).toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-500">Correctly indicated "not visible"</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Evaluated Model</span>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 uppercase">
                  {hallucinationData.engine}
                </div>
                <span className="text-[11px] text-slate-500">10 probe questions</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Absent Target Question</th>
                    <th className="p-2.5">Model Output</th>
                    <th className="p-2.5">Confidence</th>
                    <th className="p-2.5">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hallucinationData.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-mono text-slate-400">{item.id}</td>
                      <td className="p-2.5 font-medium">{item.question}</td>
                      <td className="p-2.5 font-mono font-bold capitalize text-slate-800 dark:text-slate-200">
                        "{item.prediction}"
                      </td>
                      <td className="p-2.5 font-mono text-slate-500">{(item.confidence * 100).toFixed(0)}%</td>
                      <td className="p-2.5">
                        {item.is_hallucination ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold text-[10px]">
                            Hallucination
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-bold text-[10px]">
                            Refused / Clean
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
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Active System Guardrails
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-500" /> 1. Ephemeral In-Memory Processing
            </span>
            <p className="text-slate-500 leading-relaxed">
              Uploaded user images are decoded into PIL byte buffers directly in RAM and passed to the model. They are <strong>never saved to disk or persistent storage</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-500" /> 2. Face Recognition &amp; PII Refusal
            </span>
            <p className="text-slate-500 leading-relaxed">
              Regex patterns reject queries attempting to identify individual people or faces ("who is this person?"), preventing unconsented biometric profiling.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-purple-500" /> 3. Payload Limits &amp; Rate Limiter
            </span>
            <p className="text-slate-500 leading-relaxed">
              Strict 5 MB image size cap, 200 character question limit, and per-IP sliding window rate limiting (60 requests/minute) protect server resources.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Accessibility className="w-4 h-4 text-amber-500" /> 4. Low-Confidence Warning Banner
            </span>
            <p className="text-slate-500 leading-relaxed">
              Whenever model confidence drops below 0.45, the UI highlights a prominent warning preventing blind/low-vision users from relying on dangerous false positives.
            </p>
          </div>
        </div>
      </section>

      {/* Accessibility Note for Low-Vision Users */}
      <section className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Accessibility className="w-5 h-5 text-amber-600" /> Accessibility Note: High-Stakes Vision Applications
        </h2>
        <div className="text-xs text-amber-950 dark:text-amber-100 space-y-2 leading-relaxed">
          <p>
            For visually impaired users, visual question answering is not merely an interactive demo—it is an assistive navigation tool. Users frequently query: <em>"Is the path ahead clear of obstacles?"</em> or <em>"Is there a curb or step ahead?"</em>
          </p>
          <p>
            Critically, blind users often capture photographs with motion blur, poor framing, or extreme low light. Our empirical evaluation proved that <strong>under low-light conditions, vision models suffer a significant accuracy drop (to ~40-60%) while still asserting false confidence</strong>.
          </p>
          <p className="font-semibold">
            Recommended Assistive AI Practice: Always communicate uncertainty numerically, enforce auditory warnings when confidence is below threshold, and provide a "Read Aloud" Web Speech interface.
          </p>
        </div>
      </section>

      {/* Licenses & Model Cards */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" /> Licenses &amp; Open Source Compliance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-semibold text-slate-500">
              <tr>
                <th className="p-2.5">Component / Asset</th>
                <th className="p-2.5">License</th>
                <th className="p-2.5">Terms / Permitted Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="p-2.5 font-semibold">Salesforce BLIP-VQA-Base</td>
                <td className="p-2.5 font-mono">BSD-3-Clause</td>
                <td className="p-2.5 text-slate-500">Academic &amp; commercial use with attribution.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Sentence-Transformers (MiniLM)</td>
                <td className="p-2.5 font-mono">Apache-2.0</td>
                <td className="p-2.5 text-slate-500">Permissive open source with trademark reservation.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Google Gemini API</td>
                <td className="p-2.5 font-mono">Google GenAI Terms</td>
                <td className="p-2.5 text-slate-500">Free-tier API use subject to Google developer policies.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Evaluation Benchmark Images</td>
                <td className="p-2.5 font-mono">CC0 1.0 Universal</td>
                <td className="p-2.5 text-slate-500">Public domain synthetic datasets for reproducible research.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
