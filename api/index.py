import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

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

# Vercel Service Binding: injects the internal URL of the target 'app' service
BACKEND_SERVICE_URL = os.environ.get("BACKEND_SERVICE_URL")

if BACKEND_SERVICE_URL:
    # Multi-Service Mode: proxy requests to internal 'app' service
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def proxy_to_internal_backend(request: Request, path: str):
        target_url = f"{BACKEND_SERVICE_URL.rstrip('/')}/api/{path}"
        async with httpx.AsyncClient(timeout=120.0) as client:
            req_body = await request.body()
            headers = dict(request.headers)
            headers.pop("host", None)
            headers.pop("content-length", None)

            resp = await client.request(
                method=request.method,
                url=target_url,
                params=request.query_params,
                content=req_body,
                headers=headers,
            )

            excluded_headers = {"content-encoding", "content-length", "transfer-encoding", "connection"}
            resp_headers = {
                k: v for k, v in resp.headers.items() if k.lower() not in excluded_headers
            }

            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=resp_headers,
                media_type=resp.headers.get("content-type"),
            )
else:
    # Standalone mode: mount core backend router directly onto top-level app
    ROOT_DIR = Path(__file__).resolve().parent.parent
    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))

    os.environ["USE_TF"] = "0"
    os.environ["LOW_MEMORY_MODE"] = "true"

    from backend.main import app as backend_app
    app.router = backend_app.router
