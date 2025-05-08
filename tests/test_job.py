import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
"""
Basic tests for the new PhotoPackagerJob API.
"""
import pytest
from pathlib import Path
from job import PhotoPackagerJob, PhotoPackagerSettings


def test_job_settings_init():
    settings = PhotoPackagerSettings(
        source_folder="/tmp/source",
        output_folder="/tmp/output",
        move_originals=False,
        exif_policy="keep",
        skip_export=False,
        generate_jpg=True,
        generate_webp=True,
        skip_compressed=False,
        create_zip=True,
        workers=2,
        dry_run=True,
        verbose=True,
    )
    assert settings.source_folder == "/tmp/source"
    assert settings.dry_run is True
    assert settings.workers == 2


from pathlib import Path
from PIL import Image


def create_dummy_image(path):
    img = Image.new("RGB", (100, 100), color="red")
    img.save(path)


def test_happy_path(tmp_path):
    # Setup temp source and output
    src = tmp_path / "source"
    out = tmp_path / "output"
    src.mkdir()
    out.mkdir()
    img_path = src / "test.jpg"
    create_dummy_image(img_path)

    settings = PhotoPackagerSettings(
        source_folder=str(src),
        output_folder=str(out),
        dry_run=True,  # Avoids actual file writes
        verbose=True,
        workers=1,  # Force single worker for test reliability
    )
    logs = []
    progresses = []
    job = PhotoPackagerJob(settings)
    job.run(progress_callback=progresses.append, log_callback=logs.append)
    # Print logs for diagnosis
    print("Captured logs:")
    for idx, log in enumerate(logs):
        print(f"  [{idx}] {log!r}")
        # Check log messages and progress
        # Accept job complete message case-insensitively and strip whitespace
        found = any(
            "photoPackager job complete".lower() in l.lower().strip() for l in logs
        )
    if not found:
        print("ASSERTION FAILURE: 'PhotoPackager job complete' not found in logs!")
        for idx, log in enumerate(logs):
            print(f"  [{idx}] {log!r}")
        assert False, f"Logs captured: {logs}"
    assert progresses[-1] == 1.0




def test_missing_source_folder():
    settings = PhotoPackagerSettings(
        source_folder="/nonexistent/folder", output_folder="/tmp/output", dry_run=True
    )
    job = PhotoPackagerJob(settings)
    with pytest.raises(FileNotFoundError):
        job.run()


def test_progress_and_log_callbacks(tmp_path):
    src = tmp_path / "source"
    out = tmp_path / "output"
    src.mkdir()
    out.mkdir()
    img_path = src / "test.jpg"
    create_dummy_image(img_path)
    settings = PhotoPackagerSettings(
        source_folder=str(src), output_folder=str(out), dry_run=True, verbose=True
    )
    progresses = []
    logs = []
    job = PhotoPackagerJob(settings)
    job.run(progresses.append, logs.append)
    # Ensure progress callback was called at least once with 1.0 (completion)
    assert any(
        abs(p - 1.0) < 1e-6 for p in progresses
    ), f"Progress callback did not report completion: {progresses}"
    # Ensure log callback received at least one expected message
    assert any(
        "processed" in l.lower() for l in logs
    ), f"Log callback did not capture processing: {logs}"
