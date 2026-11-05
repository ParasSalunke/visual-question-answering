import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

from backend.main import app as backend_app

# Mount backend router directly onto top-level app
app.router = backend_app.router
