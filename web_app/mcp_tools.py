import uuid
import shutil
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field

# Import shared components
from .schemas import JobSettings, JobResponse
from .worker import celery_app
from .photopackager_core.config import TEMP_UPLOADS_DIR


class MCPPackagePhotosInput(BaseModel):
    """Input schema for the package_photos MCP tool."""
    source_files: List[Path] = Field(..., description="A list of absolute paths to the source photos.")
    settings: JobSettings


async def package_photos(input: MCPPackagePhotosInput) -> JobResponse:
    """
    An MCP tool that packages photos based on a list of local file paths and settings.
    """
    job_id = str(uuid.uuid4())
    job_dir = TEMP_UPLOADS_DIR / job_id

    # 1. Create a unique directory for the job and copy files
    try:
        job_dir.mkdir(parents=True, exist_ok=True)
        for src_file in input.source_files:
            if not src_file.is_file():
                raise FileNotFoundError(f"Source file not found: {src_file}")
            shutil.copy(src_file, job_dir / src_file.name)
    except Exception as e:
        # Cleanup if setup fails
        if job_dir.exists():
            shutil.rmtree(job_dir)
        return JobResponse(
            job_id=job_id,
            status="failed",
            message=f"Failed to prepare job environment: {e}"
        )

    # 2. Launch background task with Celery
    celery_app.send_task(
        "photopackager.web_app.worker.run_packaging_job",
        args=[job_id, str(job_dir), input.settings.dict()],
        task_id=job_id
    )

    return JobResponse(
        job_id=job_id,
        status="queued",
        message=f"Job '{job_id}' has been queued. {len(input.source_files)} files received."
    )


def get_tools():
    """Returns a list of all MCP tools for the server to register."""
    # In the future, we could add more tools here.
    # The MCP server will automatically use the function name, docstring,
    # and type hints to generate the tool's definition.
    return [package_photos]
