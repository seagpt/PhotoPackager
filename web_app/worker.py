from pathlib import Path
from celery import Celery

# Local imports from the core logic
from .photopackager_core.job import PhotoPackagerJob
from .photopackager_core.models import PhotoPackagerSettings, QualitySettings
from .schemas import JobSettings
from .photopackager_core.config import OUTPUTS_DIR

# Configure Celery
celery_app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)


@celery_app.task(name="photopackager.web_app.worker.run_packaging_job")
def run_packaging_job(job_id: str, source_dir: str, settings_dict: dict):
    """
    Celery task to run a photo packaging job in the background.

    Args:
        job_id: The unique identifier for this job.
        source_dir: The directory containing the source images for this job.
        settings_dict: A dictionary containing the job settings.

    Returns:
        A dictionary summary of the completed job.
    """
    try:
        # 1. Prepare paths
        source_path = Path(source_dir)
        output_path = OUTPUTS_DIR / job_id
        output_path.mkdir(parents=True, exist_ok=True)

        # 2. Map API settings to core logic settings
        api_settings = JobSettings(**settings_dict)
        quality_settings = []
        if api_settings.generate_optimized_jpg:
            quality_settings.append(QualitySettings(directory_name='optimized_jpg', file_format='jpg', quality_level=api_settings.quality_optimized))
        if api_settings.generate_optimized_webp:
            quality_settings.append(QualitySettings(directory_name='optimized_webp', file_format='webp', quality_level=api_settings.quality_optimized))
        if api_settings.generate_compressed_jpg:
            quality_settings.append(QualitySettings(directory_name='compressed_jpg', file_format='jpg', quality_level=api_settings.quality_compressed))
        if api_settings.generate_compressed_webp:
            quality_settings.append(QualitySettings(directory_name='compressed_webp', file_format='webp', quality_level=api_settings.quality_compressed))

        settings = PhotoPackagerSettings(
            quality_settings=quality_settings,
            create_zip=api_settings.create_zip_packages
        )

        # 3. Initialize and run the job
        job = PhotoPackagerJob(
            job_id=job_id,
            settings=settings,
            source_path=source_path,
            output_path=output_path
        )
        summary = job.run()

        # 4. Return the summary, converted to a dictionary for serialization
        return summary.to_dict()
    except Exception as e:
        # Log the exception and re-raise to mark the task as failed
        print(f"Job {job_id} failed with error: {e}")
        raise
