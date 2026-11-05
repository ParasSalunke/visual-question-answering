import {
  Code2,
  ExternalLink,
} from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Syllabus Architecture &amp; Foundations
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Theoretical foundations, cross-attention mechanics, scaled dot-product proofs, and multimodal pipeline lifecycle.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              Layers I – IV
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              50-Mark Syllabus Map
            </span>
          </div>
        </div>
      </div>

      {/* Layer I: Foundations */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center text-xs">
              L1
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Layer I: Foundations &amp; Pipeline Lifecycle
            </h2>
          </div>
          <a
            href="#/ask"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            <span>Ask Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Lifecycle Diagram */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              End-to-End Multimodal Lifecycle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Coordinated interplay between discriminative encoder perception and generative autoregressive expansion:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs">
            {[
              { step: '1. Input', desc: 'RGB Image + Text Query', type: 'Modality Prep' },
              { step: '2. Encoder', desc: 'ViT + Text Tokenizer', type: 'Discriminative', tag: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
              { step: '3. Prompting', desc: 'Zero/Few-Shot Context', type: 'Prompt Eng.' },
              { step: '4. Perception', desc: 'Beam Search Short Answer', type: 'BLIP-VQA (CPU)' },
              { step: '5. Expansion', desc: 'Single-Sentence Synthesis', type: 'Gemini LLM', tag: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' },
              { step: '6. Evaluation', desc: 'Rule + MiniLM Cosine', type: 'Dual-Verdict', tag: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
              { step: '7. Feedback', desc: 'Human-in-Loop Verdicts', type: 'Student Review' },
            ].map((st, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{st.step}</span>
                <span className="text-[11px] text-slate-500 mt-1">{st.desc}</span>
                <span
                  className={`text-[9px] mt-2 py-0.5 px-1.5 rounded font-mono font-medium ${
                    st.tag || 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Comparison Table */}
        <div className="pt-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prompt Engineering Comparison: Zero-Shot vs Few-Shot (Measured)
          </h3>
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500">
                <tr>
                  <th className="p-2.5">Technique</th>
                  <th className="p-2.5">Prompt Structure</th>
                  <th className="p-2.5">Fidelity Gate</th>
                  <th className="p-2.5">Mean Latency</th>
                  <th className="p-2.5">Analytical Trade-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Zero-Shot</td>
                  <td className="p-2.5 font-mono text-slate-500">Q: [q] \n A: [a] \n Full sentence:</td>
                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">100.0%</td>
                  <td className="p-2.5 font-mono">~350 ms</td>
                  <td className="p-2.5 text-slate-500">Fastest response, but exhibits minor grammatical variation.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white">Few-Shot (5+ Examples)</td>
                  <td className="p-2.5 font-mono text-slate-500">5 in-context demonstrator exemplars</td>
                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">100.0%</td>
                  <td className="p-2.5 font-mono">~480 ms</td>
                  <td className="p-2.5 text-slate-500">Higher syntactic consistency and strict non-hallucinatory fidelity.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Layer II: Attention Mechanics */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center text-xs">
              L2
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Layer II: Attention Mechanics &amp; Transformer Architectures
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Core Viva Topic</span>
        </div>

        {/* Self vs Cross Attention */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="font-semibold text-slate-900 dark:text-white block">1. Vision Transformer Self-Attention (Visual Tokens)</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Images are divided into 16x16 pixel patches. Each patch projects into Query ($Q$), Key ($K$), and Value ($V$) representations, computing spatial relationships across image patches independently of text.
            </p>
            <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              Q = Visual Patches, K = Visual Patches, V = Visual Patches
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="font-semibold text-slate-900 dark:text-white block">2. Multimodal Cross-Attention (Query-to-Vision)</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              In BLIP's multimodal text decoder, question tokens act as queries ($Q$), while patch vectors from the ViT encoder serve as keys ($K$) and values ($V$), conditioning generation on visual features.
            </p>
            <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              Q = Question Tokens, K = Visual Patches, V = Visual Patches
            </div>
          </div>
        </div>

        {/* Worked Softmax Math Example */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-500" />
            <span>Worked Mathematical Example: Scaled Dot-Product Attention</span>
          </h3>
          <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Attention(Q, K, V) = softmax( (Q · K^T) / √d_k ) · V
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Step 1: Given Vectors ($d=2$)</span>
              <div>Q = [1, 0]</div>
              <div>K₁ = [1, 0], K₂ = [0, 1]</div>
              <div>V₁ = [1, 0], V₂ = [0, 1]</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Step 2: Dot Products &amp; Scaling</span>
              <div>Q·K₁ = 1, Q·K₂ = 0</div>
              <div>Scaled by $\sqrt{2} \approx 1.414$:</div>
              <div>$s_1 = 0.707, s_2 = 0.000$</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Step 3: Softmax &amp; Output</span>
              <div>$\exp(0.707) \approx 2.028$</div>
              <div>Weights: [0.67, 0.33]</div>
              <div className="font-bold text-slate-900 dark:text-white">Output = [0.67, 0.33]</div>
            </div>
          </div>
        </div>

        {/* Deployment Constraints Viva Note */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Viva Defense Note (CPU vs GPU Constraints):</strong> Full parameter fine-tuning of BLIP-VQA (385M parameters) was purposefully avoided because target free-tier serverless environments provide strictly CPU execution and limited memory. Fine-tuning on CPU incurs prohibitive latency and memory exhaustion during gradient accumulation. Prompt engineering with frozen inference is the industry-standard architectural pattern for CPU-constrained production deployments.
        </div>
      </section>

      {/* Layers III & IV: Stack */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center text-xs">
            L3+4
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Layers III &amp; IV: Multi-Modal Model Stack &amp; Tooling
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">Salesforce BLIP-VQA</span>
            <span className="text-[10px] text-slate-400 block font-mono">ViT + Cross-Attention</span>
            <p className="text-slate-500 dark:text-slate-400">
              Perception model executing on local CPU with beam sequence confidence scoring.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">Google Gemini Flash</span>
            <span className="text-[10px] text-slate-400 block font-mono">Autoregressive LLM</span>
            <p className="text-slate-500 dark:text-slate-400">
              Powers few-shot sentence expansion with strict fidelity constraints against hallucinations.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">all-MiniLM-L6-v2</span>
            <span className="text-[10px] text-slate-400 block font-mono">Dense Embeddings</span>
            <p className="text-slate-500 dark:text-slate-400">
              Computes 384-dimensional cosine similarity for semantic ground-truth evaluation.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">Stability AI SD-Turbo</span>
            <span className="text-[10px] text-slate-400 block font-mono">Adversarial Diffusion</span>
            <p className="text-slate-500 dark:text-slate-400">
              Synthesizes adversarial low-contrast and cluttered scenes for failure mode testing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
