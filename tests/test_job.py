import sys
from pathlib import Path
import shutil
import pytest
from PIL import Image, ExifTags

# Add project root to sys.path to allow for photopackager imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from job import PhotoPackagerJob, PhotoPackagerSettings # Corrected import back

ASSETS_DIR = PROJECT_ROOT / "assets"
TEST_IMAGE_NAME = "Test_Image.JPG"

def get_test_image_path():
    img_path = ASSETS_DIR / TEST_IMAGE_NAME
    if not img_path.exists():
        # Fallback to any JPG in assets if specific one is missing (for robustness)
        jpgs = list(ASSETS_DIR.glob("*.jpg")) + list(ASSETS_DIR.glob("*.JPG"))
        if jpgs:
            img_path = jpgs[0]
        else:
            pytest.fail(f"Test image {TEST_IMAGE_NAME} or any .jpg/.JPG not found in {ASSETS_DIR}")
    return img_path

def copy_test_image_to(dest_dir_path: Path, filename: str = None) -> Path:
    """Copies the standard test image to the destination directory."""
    real_test_image = get_test_image_path()
    target_filename = filename or real_test_image.name
    dest_file_path = dest_dir_path / target_filename
    shutil.copy(str(real_test_image), str(dest_file_path))
    assert dest_file_path.exists()
    return dest_file_path


def test_job_settings_init():
    settings = PhotoPackagerSettings(
        source_folder="/tmp/source",
        output_folder="/tmp/output",
        move_originals=False,
        originals_action="copy", 
        exif_policy="keep",
        skip_export=False, 
        generate_jpg=True, 
        generate_webp=True, 
        generate_compressed_jpg=True,
        generate_compressed_webp=True,
        create_zip=True, 
        workers=2,
        dry_run=True,
        verbose=True,
        include_raw=False, 
        raw_action="skip" 
    )
    assert settings.source_folder == "/tmp/source"
    assert settings.dry_run is True
    assert settings.workers == 2
    assert settings.generate_jpg is True 
    assert settings.create_zip is True
    assert settings.skip_export is False


def test_job_actual_run_creates_output(tmp_path):
    """Test a basic actual run (not dry_run) and verify output structure and files."""
    shoot_name = "MyTestShoot" 
    src_dir = tmp_path / shoot_name 
    out_dir = tmp_path / "output"
    src_dir.mkdir()

    copy_test_image_to(src_dir, "test_image_01.jpg")
    copy_test_image_to(src_dir, "test_image_02.JPG") 

    settings = PhotoPackagerSettings(
        source_folder=str(src_dir),
        output_folder=str(out_dir),
        originals_action="copy",
        skip_export=False,
        generate_jpg=True,
        generate_webp=False, 
        generate_compressed_jpg=False,
        generate_compressed_webp=False,
        create_zip=False,
        dry_run=False, 
        verbose=True,
        workers=1, 
        include_raw=False
    )
    logs = []
    progresses = []
    job = PhotoPackagerJob(settings)
    job.run(progress_callback=progresses.append, log_callback=logs.append)

    print("\nCaptured logs for actual_run:")
    for log_entry in logs: print(f"  {log_entry}")
    print("\nProgress updates:", progresses)

    assert len(progresses) > 0 and abs(progresses[-1] - 1.0) < 1e-6, "Progress did not complete to 1.0"
    assert any("job complete" in log.lower() for log in logs), "'Job complete' message not found in logs."

    expected_shoot_dir = out_dir / shoot_name
    assert expected_shoot_dir.is_dir(), f"Shoot directory '{shoot_name}' not created in output."

    expected_optimized_dir = expected_shoot_dir / "Optimized Files" / "Optimized JPGs"
    assert expected_optimized_dir.is_dir(), "Optimized JPGs directory not created."

    output_jpgs = list(expected_optimized_dir.glob("*.jpg"))
    assert len(output_jpgs) == 2, f"Expected 2 JPGs in optimized output, found {len(output_jpgs)}"

    expected_originals_dir = expected_shoot_dir / "Export Originals"
    assert expected_originals_dir.is_dir(), "Export Originals directory not created."
    copied_originals = list(expected_originals_dir.glob("test_image_01.jpg")) + \
                       list(expected_originals_dir.glob("test_image_02.JPG"))
    assert len(copied_originals) == 2, "Originals not copied correctly."


def test_job_exif_strip_all(tmp_path):
    """Test actual run with exif_policy='strip_all' and verify EXIF is stripped."""
    shoot_name = "ExifStripTest" 
    src_dir = tmp_path / shoot_name 
    out_dir = tmp_path / "output"
    src_dir.mkdir()

    img_name = "image_with_exif.jpg"
    copy_test_image_to(src_dir, img_name)

    settings = PhotoPackagerSettings(
        source_folder=str(src_dir),
        output_folder=str(out_dir),
        originals_action="skip", 
        skip_export=True, 
        exif_policy="strip_all",
        generate_jpg=True,
        generate_webp=False,
        generate_compressed_jpg=False,
        generate_compressed_webp=False,
        create_zip=False,
        dry_run=False,
        verbose=True,
        workers=1,
        include_raw=False
    )
    job = PhotoPackagerJob(settings)
    job.run()

    optimized_jpg_dir = out_dir / shoot_name / "Optimized Files" / "Optimized JPGs"
    assert optimized_jpg_dir.is_dir(), "Optimized JPGs directory not created for EXIF test."
    
    output_images = list(optimized_jpg_dir.glob("*.jpg"))
    assert len(output_images) > 0, "No JPG images found in EXIF test output."

    for img_path_out in output_images:
        image = Image.open(img_path_out)
        exif_data = image._getexif()
        assert exif_data is None or len(exif_data) == 0, \
            f"EXIF data not stripped from {img_path_out}. Found: {exif_data}"


def test_missing_source_folder():
    settings = PhotoPackagerSettings(
        source_folder="/nonexistent/folder", 
        output_folder="/tmp/output", 
        originals_action="skip",
        dry_run=True
    )
    job = PhotoPackagerJob(settings)
    with pytest.raises(FileNotFoundError):
        job.run()


def test_progress_and_log_callbacks_dry_run(tmp_path):
    """Test callbacks on a dry run to ensure they are still invoked."""
    shoot_name = "CallbackTestDryRun" 
    src_dir = tmp_path / shoot_name
    out_dir = tmp_path / "output"
    src_dir.mkdir()

    copy_test_image_to(src_dir)

    settings = PhotoPackagerSettings(
        source_folder=str(src_dir), 
        output_folder=str(out_dir), 
        originals_action="skip",
        skip_export=True,
        dry_run=True, 
        verbose=True,
        include_raw=False
    )
    progresses = []
    logs = []
    job = PhotoPackagerJob(settings)
    job.run(progress_callback=progresses.append, log_callback=logs.append)
    
    print("\nCaptured logs for callback_dry_run:")
    for log_entry in logs: print(f"  {log_entry}")
    print("\nProgress updates for callback_dry_run:", progresses)

    assert len(progresses) > 0, "Progress callback not called."
    # For a dry run, it might complete quickly. Check if 1.0 is among reported values.
    assert any(abs(p - 1.0) < 1e-6 for p in progresses), \
        f"Progress callback did not report completion (1.0): {progresses}"
    
    assert len(logs) > 0, "Log callback not called."
    assert any("[dryrun]" in l.lower() for l in logs), \
        f"Log callback did not capture '[dryrun]' message: {logs}"
