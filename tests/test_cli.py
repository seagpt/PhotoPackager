import subprocess
import sys
import pytest
import re
from pathlib import Path
from PIL import Image, ExifTags 
import shutil 

PROJECT_ROOT = Path(__file__).resolve().parent.parent
APP_PY_PATH = PROJECT_ROOT / "app.py" 
ASSETS_DIR = PROJECT_ROOT / "assets"
TEST_IMAGE_NAME = "Test_Image.JPG" 

def get_test_image_path():
    img_path = ASSETS_DIR / TEST_IMAGE_NAME
    if not img_path.exists():
        jpgs = list(ASSETS_DIR.glob("*.jpg"))
        if jpgs:
            img_path = jpgs[0]
        else:
            pytest.fail(f"Test image {TEST_IMAGE_NAME} or any .jpg not found in {ASSETS_DIR}")
    return img_path

@pytest.mark.parametrize("flag", ["--help", "-h"])
def test_app_main_help(flag):
    result = subprocess.run(
        [sys.executable, str(APP_PY_PATH), flag], capture_output=True, text=True, check=False
    )
    assert result.returncode == 0
    out = result.stdout + result.stderr
    assert "cli" in out and "gui" in out 

@pytest.mark.parametrize("help_flag", ["--help", "-h"])
def test_cli_subcommand_help(help_flag):
    """Test that 'app.py cli --help' shows relevant options."""
    command = [sys.executable, str(APP_PY_PATH), "cli", help_flag]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = result.stdout + result.stderr
    print(f"CLI Help Output ({help_flag}):\n{output}")
    assert result.returncode == 0, f"CLI --help command failed with code {result.returncode}\nOutput:\n{output}"
    assert "source" in output, "'source' (positional) not found in CLI help output."
    assert "destination" in output, "'destination' (positional) not found in CLI help output."
    assert "--exif-policy" in output, "'--exif-policy' option not found in CLI help output."
    assert "--dry-run" in output, "'--dry-run' option not found in CLI help output."


def test_cli_dry_run(tmp_path):
    src_dir = tmp_path / "source"
    out_dir = tmp_path / "output"
    src_dir.mkdir()

    # Get the path to a real test image
    real_test_image_src_path = get_test_image_path()
    # Define the destination path for the image within the test's source directory
    test_image_in_src_dir = src_dir / real_test_image_src_path.name
    # Copy the real test image into the source directory for the test
    shutil.copy(str(real_test_image_src_path), str(test_image_in_src_dir))

    command = [
        sys.executable, str(APP_PY_PATH), "cli",
        str(src_dir),  # Positional source_folder
        str(out_dir),  # Positional output_folder
        "--dry-run",
        "--verbose",
        # Corrected boolean flags
        "--originals-action", "copy", 
        "--no-skip-export",            
        "--generate-jpg",              
        "--no-generate-webp",          
        "--generate-compressed-jpg",   
        "--no-generate-compressed-webp", 
        "--no-create-zip"              
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = result.stdout + result.stderr
    print(f"CLI Dry Run Output:\n{output}")

    assert result.returncode == 0, f"CLI dry run command failed with exit code {result.returncode}. Output:\n{output}"
    # Check for job completion and dry run indicators
    assert "photopackager job complete." in output.lower(), \
        "Did not find 'PhotoPackager job complete.' message."
    assert "[dryrun]" in output.lower(), \
        "Did not find '[DRYRUN]' indicator in output."
    assert not (out_dir / src_dir.name).exists(), "Output directory was created during dry run, but should not have been."


def test_cli_exif_policy_strip_all(tmp_path):
    src_dir = tmp_path / "source_exif_strip"
    out_dir = tmp_path / "output_exif_strip"
    src_dir.mkdir()
    # out_dir.mkdir() # Let the job create it

    # Use the actual test image helper to get an image with EXIF
    test_image_path = get_test_image_path() 
    shutil.copy(str(test_image_path), str(src_dir / test_image_path.name))

    command = [
        sys.executable, str(APP_PY_PATH), "cli",
        str(src_dir),  # Positional source_folder
        str(out_dir),  # Positional output_folder
        "--exif-policy", "strip_all",
        # Corrected boolean flags
        "--no-skip-export",
        "--verbose",
        "--no-generate-webp",
        "--no-generate-compressed-jpg",
        "--no-generate-compressed-webp",
        "--no-create-zip"
        # --generate-jpg is implicitly True by default if not specified as --no-generate-jpg
    ]
    print(f"CLI EXIF Strip Command: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = result.stdout + result.stderr
    print(f"CLI EXIF Strip Output:\n{output}")

    if result.returncode != 0:
        crash_log_path_str = ""
        # Try to find the crash log path in the output
        log_path_match = re.search(r"Crash log: (.*?)$", output, re.MULTILINE)
        if log_path_match:
            crash_log_path_str = log_path_match.group(1).strip()
            print(f"\n[TEST INFO] Full crash log path from output: {crash_log_path_str}")
            try:
                crash_log_path = Path(crash_log_path_str)
                if crash_log_path.exists():
                    crash_log_content = crash_log_path.read_text()
                    print(f"\n[TEST INFO] Crash log content:\n{crash_log_content}")
                else:
                    print(f"\n[TEST INFO] Crash log file not found at: {crash_log_path_str}")
            except Exception as e:
                print(f"\n[TEST INFO] Error reading crash log: {e}")
        else:
            print("\n[TEST INFO] Crash log path not found in output.")

    assert result.returncode == 0, f"CLI process failed with errors: {output}"

    # Verify that output image has no EXIF data
    # The shoot name will be derived from src_dir.name
    shoot_output_dir = out_dir / src_dir.name / "Optimized Files" / "Optimized JPGs"
    assert shoot_output_dir.is_dir(), f"Optimized JPGs directory not found: {shoot_output_dir}"
    
    output_images = list(shoot_output_dir.glob("*.jpg"))
    assert len(output_images) > 0, "No JPG images found in output for EXIF check."

    for img_path_out in output_images:
        try:
            image = Image.open(img_path_out)
            exif_data = image._getexif() 
            image.close()
            assert exif_data is None or len(exif_data) == 0, \
                f"EXIF data not stripped from {img_path_out}. Found: {exif_data}"
        except Exception as e:
            pytest.fail(f"Error processing output image {img_path_out} for EXIF check: {e}")
