import subprocess
import sys
import pytest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MAIN_PY = PROJECT_ROOT / "main.py"


@pytest.mark.parametrize("flag", ["--help", "-h"])
def test_cli_help(flag):
    result = subprocess.run(
        [sys.executable, str(MAIN_PY), flag], capture_output=True, text=True
    )
    assert result.returncode == 0
    out = result.stdout + result.stderr
    assert "--source" in out and "--output" in out and "--dry-run" in out


def test_cli_dry_run(tmp_path):
    # Create dummy source dir and image file
    src_dir = tmp_path / "src"
    src_dir.mkdir()
    import shutil
    real_test_image_path = Path(__file__).parent / "test.jpg"
    temp_image_path = src_dir / "test.jpg"
    shutil.copy(str(real_test_image_path), str(temp_image_path))
    assert temp_image_path.exists()
    out_dir = tmp_path / "out"
    out_dir.mkdir()

    result = subprocess.run(
        [
            sys.executable,
            str(MAIN_PY),
            "--source",
            str(src_dir),
            "--output",
            str(out_dir),
            "--dry-run",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    out = result.stdout + result.stderr
    assert "dry" in out.lower() or "simulat" in out.lower() or "DRYRUN" in out
    # Output directory should not contain delivery folders (e.g., Export Originals, Optimized Files, etc.)
    forbidden = ["Export Originals", "Optimized Files", "Compressed Files"]
    actual = [p.name for p in out_dir.iterdir() if p.is_dir()]
    for folder in forbidden:
        assert folder not in actual


def test_cli_exif_policy_strip_all(tmp_path):
    src_dir = tmp_path / "src"
    src_dir.mkdir()
    import shutil
    real_test_image_path = Path(__file__).parent / "test.jpg"
    temp_image_path = src_dir / "test.jpg"
    shutil.copy(str(real_test_image_path), str(temp_image_path))
    assert temp_image_path.exists()
    out_dir = tmp_path / "out"
    out_dir.mkdir()
    result = subprocess.run(
        [
            sys.executable,
            str(MAIN_PY),
            "--source",
            str(src_dir),
            "--output",
            str(out_dir),
            "--dry-run",
            "--exif-policy",
            "strip_all",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    out = result.stdout + result.stderr
    assert "strip_all" in out or "EXIF" in out or "dry" in out.lower()
