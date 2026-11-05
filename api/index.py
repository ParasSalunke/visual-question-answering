import os
import sys
from pathlib import Path
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# Vercel Service Binding: injects the internal URL of the target 'app' service
BACKEND_SERVICE_URL = os.environ.get("BACKEND_SERVICE_URL")

if BACKEND_SERVICE_URL:
    # Multi-Service Mode: 'api' service acts as public gateway calling internal 'app' service
    app = FastAPI(title="VQA Public API Gateway")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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
    # Monolithic fallback for local development or direct in-process testing
    ROOT_DIR = Path(__file__).resolve().parent.parent
    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))

    os.environ["USE_TF"] = "0"
    os.environ["LOW_MEMORY_MODE"] = "true"

    from backend.main import app
