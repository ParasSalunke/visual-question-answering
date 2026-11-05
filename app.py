"""
Hugging Face Spaces Entry Point (Free CPU Tier - Gradio SDK)
Mounts the full FastAPI VQA application and serves the built Vite React frontend at '/'
and a companion diagnostic Gradio view at '/gradio'.
"""
import os
import logging
import uvicorn
from dotenv import load_dotenv

# Ensure TF doesn't interfere with PyTorch
os.environ["USE_TF"] = "0"

load_dotenv()
logger = logging.getLogger("vqa-app")

from backend.main import app as fastapi_app

try:
    import gradio as gr

    with gr.Blocks(title="Visual Question Answering (VQA) Companion") as demo:
        gr.Markdown("# 👁️ Visual Question Answering (VQA) Studio")
        gr.Markdown(
            "The full React application is served at the root URL **[/](/)**.\n\n"
            "This companion interface provides a diagnostic check and quick links."
        )
        with gr.Row():
            with gr.Column():
                gr.Markdown("### Core Syllabus Capabilities:")
                gr.Markdown("- **U1**: 26 Question Templates across 8 categories with inline placeholders")
                gr.Markdown("- **U2**: Zero-Shot vs Few-Shot Sentence Expansion with Gemini Flash")
                gr.Markdown("- **U3**: Salesforce BLIP-VQA (CPU) + Gemini 3.5 Flash dual-engine comparison")
                gr.Markdown("- **U4**: Test Image Lab with 6 adversarial presets & procedural generator")
                gr.Markdown("- **U5**: 20-Pair Benchmark Evaluation, Calibration, and Failure Gallery")
            with gr.Column():
                gr.Markdown("### Quick Access:")
                gr.Markdown("[👉 Click here to launch the Full Web Application](/)")
                gr.Markdown("[📚 View Swagger API Documentation](/docs)")
                gr.Markdown("[🔍 Health Check Status](/api/health)")

    # Mount Gradio onto the existing FastAPI app at /gradio
    # The root '/' remains the built React Vite SPA!
    app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")
except Exception as e:
    logger.warning(f"Could not initialize companion Gradio mount: {e}. Falling back to pure FastAPI.")
    app = fastapi_app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
