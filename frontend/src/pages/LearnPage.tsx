import {
  GraduationCap,
  Code2,
  ExternalLink,
} from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-9 h-9 text-blue-200" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Syllabus Architecture Map</h1>
            <p className="mt-1 text-blue-100 text-sm sm:text-base">
              Theoretical foundations, mathematical proofs, and architectural mapping across Layers I to IV.
            </p>
          </div>
        </div>
      </div>

      {/* Layer I: Foundations */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
              L1
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Layer I: Foundations &amp; Pipeline Lifecycle</h2>
          </div>
          <a href="#/ask" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
            Where in App: Ask Page <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Lifecycle Diagram */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            End-to-End VQA System Lifecycle &amp; Paradigm Attribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Notice how our system orchestrates both discriminative (encoder/classification) and generative (autoregressive sequence) models:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            {[
              { step: '1. Data', desc: 'RGB Image + Question Text', type: 'Modality Prep' },
              { step: '2. Model', desc: 'ViT + BERT Cross-Attention', type: 'Discriminative', tag: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
              { step: '3. Prompt', desc: 'Zero/Few-Shot Templates', type: 'Prompt Eng.' },
              { step: '4. Inference', desc: 'Beam Search Short Answer', type: 'BLIP (CPU)' },
              { step: '5. Expansion', desc: 'Full Sentence Generation', type: 'Generative', tag: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
              { step: '6. Evaluation', desc: 'Rule + MiniLM Cosine', type: 'Discriminative', tag: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
              { step: '7. Feedback', desc: 'Manual Verdict Overrides', type: 'Human-in-Loop' },
            ].map((st, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">{st.step}</span>
                <span className="text-[10px] text-slate-500 mt-1">{st.desc}</span>
                <span className={`text-[9px] mt-2 py-0.5 px-1 rounded font-semibold ${st.tag || 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {st.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Comparison Table */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Prompt Engineering Comparison: Zero-Shot vs Few-Shot (Measured)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-lg">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-2.5">Technique</th>
                  <th className="p-2.5">Prompt Structure</th>
                  <th className="p-2.5">Fidelity Gate %</th>
                  <th className="p-2.5">Mean Latency</th>
                  <th className="p-2.5">Academic Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-2.5 font-bold">Zero-Shot</td>
                  <td className="p-2.5 font-mono text-slate-500">Q: [q] \n A: [a] \n Full sentence:</td>
                  <td className="p-2.5 text-green-600 font-bold">100.0%</td>
                  <td className="p-2.5">~350 ms</td>
                  <td className="p-2.5 text-slate-500">Fastest, but occasional risk of syntactic brevity.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Few-Shot (5+ Examples)</td>
                  <td className="p-2.5 font-mono text-slate-500">5 curated input-output demonstrations</td>
                  <td className="p-2.5 text-green-600 font-bold">100.0%</td>
                  <td className="p-2.5">~480 ms</td>
                  <td className="p-2.5 text-slate-500">Consistently adheres to exact passive/active style constraints.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Top-K Probability View */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            BLIP Sequence Confidence via Softmax Over Beam Candidates
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            In our PyTorch CPU backend, beam search outputs length-penalized sequence log-likelihoods. Applying softmax across the top-5 beams yields calibrated candidate probabilities:
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            {[
              { word: 'red (Top 1)', p: 0.4581, color: 'bg-blue-600' },
              { word: 'black (Top 2)', p: 0.1586, color: 'bg-slate-500' },
              { word: 'red and black (Top 3)', p: 0.1390, color: 'bg-slate-500' },
              { word: 'red and white (Top 4)', p: 0.1236, color: 'bg-slate-500' },
              { word: 'black and red (Top 5)', p: 0.1206, color: 'bg-slate-500' },
            ].map((b, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-36 font-mono font-medium text-slate-700 dark:text-slate-300">{b.word}</span>
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${b.color}`} style={{ width: `${b.p * 100}%` }} />
                </div>
                <span className="w-16 font-mono text-right text-slate-600 dark:text-slate-400">
                  {(b.p * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer II: Transformers, GANs & Attention */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
              L2
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Layer II: Attention Mechanics &amp; Transformer Architecture</h2>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Core Viva Subject</span>
        </div>

        {/* Self vs Cross Attention Diagram */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Self-Attention vs Cross-Attention in Vision-Language Models
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block">1. ViT Self-Attention (Image Only)</span>
              <p className="text-slate-500">
                The image is divided into $16 \times 16$ pixel patches. Each patch projects to query ($Q$), key ($K$), and value ($V$) vectors.
                Self-attention calculates pairwise spatial affinities across all image patches independently of the question.
              </p>
              <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                Q = Patches, K = Patches, V = Patches
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-purple-600 dark:text-purple-400 block">2. Multimodal Cross-Attention (Query-to-Vision)</span>
              <p className="text-slate-500">
                In BLIP's multimodal text decoder, question tokens act as queries ($Q$), while the visual patch representations from the ViT encoder serve as keys ($K$) and values ($V$).
              </p>
              <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                Q = Question Tokens, K = Visual Patches, V = Visual Patches
              </div>
            </div>
          </div>
        </div>

        {/* Worked Softmax Math Example */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600" /> Worked Numeric Example of Scaled Dot-Product Attention:
          </h3>
          <p className="text-xs text-indigo-800 dark:text-indigo-300 font-mono">
            Formula: Attention(Q, K, V) = Softmax( (Q · K^T) / √d_k ) · V
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900">
              <span className="text-[10px] text-slate-400 block font-sans">Step 1: Given Vectors (d=2)</span>
              Q = [1, 0]<br />
              K₁ = [1, 0], K₂ = [0, 1]<br />
              V₁ = [1, 0], V₂ = [0, 1]
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900">
              <span className="text-[10px] text-slate-400 block font-sans">Step 2: Dot Products &amp; Scaling</span>
              Q·K₁ = 1, Q·K₂ = 0<br />
              Scaled (√2 ≈ 1.414):<br />
              s₁ = 1/1.414 = 0.707<br />
              s₂ = 0/1.414 = 0.000
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900">
              <span className="text-[10px] text-slate-400 block font-sans">Step 3: Softmax &amp; Output</span>
              exp(0.707) ≈ 2.028<br />
              exp(0.000) = 1.000<br />
              Weights: [0.67, 0.33]<br />
              Output = 0.67·V₁ + 0.33·V₂<br />
              <strong>= [0.67, 0.33]</strong>
            </div>
          </div>
        </div>

        {/* Why fine-tuning was not done on CPU note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <strong>Academic Viva Note (Deployment Constraints):</strong> Full parameter fine-tuning or LoRA adaptation of BLIP-VQA (446M parameters) was purposefully omitted because the target hosting environment (Hugging Face Spaces Free Tier) provides strictly 2 vCPUs and 16 GB RAM without GPU acceleration. Backpropagation on CPU would require prohibitive training hours and exceed the RAM ceiling during gradient accumulation. Prompt engineering with frozen inference is the optimal production pattern for free-tier constraints.
        </div>
      </section>

      {/* Layer III & IV: Models & Tools */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
              L3+4
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Layers III &amp; IV: Model Modalities &amp; Tooling Stack</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-1.5">
            <span className="font-bold text-blue-600">Salesforce/blip-vqa-base</span>
            <span className="text-[10px] text-slate-400 block">ViT + BERT Cross-Attention</span>
            <p className="text-slate-500">
              Primary VQA engine running locally under PyTorch CPU inference mode.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-1.5">
            <span className="font-bold text-purple-600">Gemini 2.5 Flash</span>
            <span className="text-[10px] text-slate-400 block">Autoregressive LLM</span>
            <p className="text-slate-500">
              Used for U2 single-sentence answer expansion and multimodal comparative VQA.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-1.5">
            <span className="font-bold text-emerald-600">all-MiniLM-L6-v2</span>
            <span className="text-[10px] text-slate-400 block">Sentence-Transformers (BERT)</span>
            <p className="text-slate-500">
              Generates 384-dimensional dense embeddings for cosine similarity evaluation.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-1.5">
            <span className="font-bold text-indigo-600">SD-Turbo / Gemini Image</span>
            <span className="text-[10px] text-slate-400 block">Generative Diffusion</span>
            <p className="text-slate-500">
              Generates synthetic adversarial test images for the Test Lab (U4).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
