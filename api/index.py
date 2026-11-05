import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

# Ensure both api/ and project root are in sys.path
for p in [str(CURRENT_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["USE_TF"] = "0"
os.environ["LOW_MEMORY_MODE"] = "true"

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

# Route middleware: ensures that requests reaching this service with or without the /api prefix resolve
@app.middleware("http")
async def ensure_api_prefix(request: Request, call_next):
    path = request.scope.get("path", "")
    if path and not path.startswith("/api"):
        request.scope["path"] = "/api" + path
    return await call_next(request)

# Import backend application
from backend.main import app as backend_app

# Include all backend routes safely into top-level app
app.include_router(backend_app.router)
