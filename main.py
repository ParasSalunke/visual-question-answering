import os
import sys
import traceback
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

CURRENT_DIR = Path(__file__).resolve().parent

if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

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

IMPORT_ERROR = None
try:
    from backend.main import app as backend_app
    app.include_router(backend_app.router)
except Exception as e:
    IMPORT_ERROR = {
        "error": str(e),
        "type": type(e).__name__,
        "traceback": traceback.format_exc(),
        "sys_path": sys.path,
        "current_dir": str(CURRENT_DIR),
    }

@app.middleware("http")
async def request_router_middleware(request: Request, call_next):
    if IMPORT_ERROR:
        return JSONResponse(status_code=500, content=IMPORT_ERROR)

    path = request.scope.get("path", "")
    if path and not path.startswith("/api"):
        request.scope["path"] = "/api" + path
    return await call_next(request)
