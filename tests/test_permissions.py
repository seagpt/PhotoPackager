import os
import pytest
import sys
import shutil
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from job import PhotoPackagerJob, PhotoPackagerSettings

ASSETS_DIR = PROJECT_ROOT / "assets"
TEST_IMAGE_NAME = "Test_Image.JPG"

def get_test_image_path():
    img_path = ASSETS_DIR / TEST_IMAGE_NAME
    if not img_path.exists():
        jpgs = list(ASSETS_DIR.glob("*.jpg")) + list(ASSETS_DIR.glob("*.JPG"))
        if jpgs:
            img_path = jpgs[0]
        else:
            pytest.fail(f"Test image {TEST_IMAGE_NAME} or any .jpg/.JPG not found in {ASSETS_DIR}")
    return img_path

def copy_test_image_to(dest_dir_path: Path, filename: str = None) -> Path:
    real_test_image = get_test_image_path()
    target_filename = filename or real_test_image.name
    dest_file_path = dest_dir_path / target_filename
    shutil.copy(str(real_test_image), str(dest_file_path))
    assert dest_file_path.exists()
    return dest_file_path

def test_unreadable_source_file_graceful_skip(tmp_path, caplog):
    shoot_name = "UnreadableSourceTest"
    src_dir = tmp_path / shoot_name
    out_dir = tmp_path / "output"
    src_dir.mkdir()
    # out_dir.mkdir() # Job creates it

    # Create one unreadable image and one readable image
    unreadable_img_name = "unreadable.jpg"
    readable_img_name = "readable.jpg"
    
    unreadable_img_path = copy_test_image_to(src_dir, unreadable_img_name)
    readable_img_path = copy_test_image_to(src_dir, readable_img_name)

    # Remove read permissions from the unreadable file
    unreadable_img_path.chmod(0o000) # No read/write/execute

    settings = PhotoPackagerSettings(
        source_folder=str(src_dir),
        output_folder=str(out_dir),
        originals_action='skip', # Keep it simple
        skip_export=True,
        generate_jpg=True, # Need some output to check
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
    job.run(log_callback=None) # Using caplog

    print("\nLogs for unreadable_source_file_graceful_skip:")
    print(caplog.text)

    # Check that a permission-related error was logged for the unreadable file
    assert "unreadable.jpg" in caplog.text
    assert "permission denied" in caplog.text.lower() or "error opening image" in caplog.text.lower()
    
    # Check that the readable file was processed successfully
    optimized_jpg_dir = out_dir / shoot_name / "Optimized Files" / "Optimized JPGs"
    assert optimized_jpg_dir.is_dir(), "Optimized JPGs directory not created."
    
    processed_readable_files = list(optimized_jpg_dir.glob(f"*-{readable_img_name}")) # Assuming default prefixing
    if not processed_readable_files:
         # Check without prefix if default prefixing is not happening or complex
         processed_readable_files = list(optimized_jpg_dir.glob(f"{readable_img_name}"))
    
    assert len(processed_readable_files) == 1, \
        f"Readable file '{readable_img_name}' was not processed and found in output. Files: {list(optimized_jpg_dir.iterdir())}"

    # Restore permissions for cleanup
    unreadable_img_path.chmod(0o644)


def test_output_permission_error(tmp_path, caplog):
    shoot_name = "OutputPermErrorTest"
    src_dir = tmp_path / shoot_name
    out_dir = tmp_path / "output"
    src_dir.mkdir()
    out_dir.mkdir() # Create output base first to then restrict its permissions

    copy_test_image_to(src_dir, "test_write.jpg")

    # Remove write permissions from the base output dir
    # The job will try to create shoot_name subdir inside this
    out_dir.chmod(0o500)  # r-x --- --- (read and execute, no write)

    settings = PhotoPackagerSettings(
        source_folder=str(src_dir),
        output_folder=str(out_dir),
        originals_action='skip',
        skip_export=True,
        generate_jpg=True,
        dry_run=False,
        verbose=True,
        workers=1,
        include_raw=False
    )
    job = PhotoPackagerJob(settings)
    
    raised_permission_error = False
    try:
        job.run(log_callback=None) # Using caplog
    except PermissionError:
        raised_permission_error = True
    except Exception as e:
        pytest.fail(f"Expected PermissionError, but got {type(e)}: {e}. Logs: {caplog.text}")
    finally:
        # Restore permissions for cleanup
        out_dir.chmod(0o755)
    
    assert raised_permission_error, f"PermissionError was not raised when output directory was unwritable. Logs: {caplog.text}"
    
    # Optionally, check logs for messages about failing to create output directories
    assert any("failed to create directory" in l.lower() or "permission denied" in l.lower() for l in caplog.text.splitlines() if "output" in l.lower()), \
        f"Expected log message about output directory permission error not found. Logs: {caplog.text}"
