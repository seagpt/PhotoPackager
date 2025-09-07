import uuid
import shutil
import json
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Import shared components
from .worker import celery_app
from .photopackager_core.config import OUTPUTS_DIR, TEMP_UPLOADS_DIR
from .schemas import JobSettings, JobResponse

# Import MCP Server components
from fastmcp import FastMCP
from .mcp_tools import get_tools

app = FastAPI()

# --- Static Files ---
# Mount static files FIRST to ensure they handle the root path.
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

# Mount the MCP server as a sub-application
mcp_server = FastMCP(tools=get_tools())
app.mount("/mcp", mcp_server)

# Ensure base directories exist
TEMP_UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)

# --- Helper Functions ---

def get_job_status(job_id: str):
    """Helper to get the status of a Celery task."""
    task_result = celery_app.AsyncResult(job_id)
    response = {
        "job_id": job_id,
        "status": task_result.status.lower(),
        "message": "",
        "result": None,
        "error": None
    }
    if task_result.successful():
        response["message"] = "Job completed successfully."
        response["result"] = task_result.result
    elif task_result.failed():
        response["message"] = "Job failed."
        response["error"] = str(task_result.info)
    elif task_result.status == 'PENDING':
        response["message"] = "Job is queued and waiting to be processed."
    elif task_result.status == 'STARTED':
        response["message"] = "Job is currently being processed."
    else:
        response["message"] = f"Job is in an unknown state: {task_result.status}"

    return response

# --- API Endpoints ---

@app.post("/api/jobs", response_model=JobResponse)
async def create_packaging_job(
    files: List[UploadFile] = File(...),
    settings: str = Form(...),  # Settings will be a JSON string
):
    """Accepts photo uploads and job settings to start a packaging job."""
    try:
        job_settings = JobSettings.parse_raw(settings)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid settings format: {e}")

    job_id = str(uuid.uuid4())
    job_dir = TEMP_UPLOADS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # Save uploaded files
    for file in files:
        file_path = job_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Launch background task with Celery
    celery_app.send_task(
        "photopackager.web_app.worker.run_packaging_job",
        args=[job_id, str(job_dir), job_settings.dict()],
        task_id=job_id
    )

    return JobResponse(
        job_id=job_id,
        status="queued",
        message=f"Job '{job_id}' has been queued. {len(files)} files received."
    )


@app.get("/api/jobs/{job_id}/status")
async def get_job_status_api(job_id: str):
    """Endpoint to poll for the status of a job."""
    return JSONResponse(content=get_job_status(job_id))


@app.get("/api/jobs/{job_id}/download/{zip_filename}")
async def download_zip_package(job_id: str, zip_filename: str):
    """Allows downloading of a packaged ZIP file."""
    # Basic security check
    if ".." in zip_filename or zip_filename.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = OUTPUTS_DIR / job_id / zip_filename

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(file_path, media_type='application/zip', filename=zip_filename)
