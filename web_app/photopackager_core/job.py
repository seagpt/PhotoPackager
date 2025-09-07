from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Optional
import zipfile

from .models import PhotoPackagerSettings, QualitySettings

@dataclass
class JobSummary:
    """A summary of the completed job."""

    start_time: datetime
    end_time: Optional[datetime] = None
    total_files_scanned: int = 0
    total_files_processed: int = 0
    total_files_failed: int = 0
    total_output_files: int = 0
    errors: List[str] = field(default_factory=list)
    output_location: Optional[str] = None
    zip_packages: List[str] = field(default_factory=list)

    def to_dict(self):
        """Convert the summary to a dictionary for serialization."""
        return {
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_files_scanned": self.total_files_scanned,
            "total_files_processed": self.total_files_processed,
            "total_files_failed": self.total_files_failed,
            "total_output_files": self.total_output_files,
            "errors": self.errors,
            "output_location": str(self.output_location) if self.output_location else None,
            "zip_packages": self.zip_packages,
        }

class PhotoPackagerJob:
    """Manages the entire photo packaging process for a given job."""

    def __init__(self, job_id: str, settings: PhotoPackagerSettings, source_path: Path, output_path: Path):
        self.job_id = job_id
        self.settings = settings
        self.source_path = source_path
        self.output_path = output_path
        self.summary = JobSummary(start_time=datetime.now(), output_location=str(output_path))

    def run(self) -> JobSummary:
        # This is a placeholder for the actual image processing logic.
        # In a real application, this would involve using a library like Pillow to process images.
        self.summary.total_files_scanned = len(list(self.source_path.glob('*')))

        for quality_setting in self.settings.quality_settings:
            quality_dir = self.output_path / quality_setting.directory_name
            quality_dir.mkdir(exist_ok=True)

            for image_file in self.source_path.glob('*'):
                if image_file.is_file() and image_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    try:
                        # Simulate processing
                        output_file = quality_dir / image_file.name
                        output_file.write_bytes(image_file.read_bytes()) # a copy for now
                        self.summary.total_files_processed += 1
                    except Exception as e:
                        self.summary.errors.append(f"Failed to process {image_file.name}: {e}")
                        self.summary.total_files_failed += 1

        if self.settings.create_zip:
            zip_path = self.output_path / f"{self.job_id}.zip"
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file_path in self.output_path.rglob('*'):
                    if file_path.is_file() and file_path.suffix != '.zip':
                        zipf.write(file_path, file_path.relative_to(self.output_path))
            self.summary.zip_packages.append(str(zip_path))

        self.summary.end_time = datetime.now()
        return self.summary
