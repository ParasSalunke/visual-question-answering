import os
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

# Ensure both api/ and project root are in sys.path
for p in [str(CURRENT_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["USE_TF"] = "0"
os.environ["LOW_MEMORY_MODE"] = "true"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Top-level FastAPI instance strictly required by Vercel static AST analyzer
app = FastAPI(
    title="Visual Question Answering App",
    description="Multimodal VQA platform combining Salesforce BLIP-VQA with Gemini Flash LLM expansion and comprehensive academic evaluation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import backend application
try:
    from backend.main import app as backend_app
    # Mount backend router directly onto top-level app
    app.router = backend_app.router
except Exception as e:
    import traceback
    traceback.print_exc()
    
    @app.get("/api/health")
    def health_err():
        return {"status": "error", "error": str(e)}
