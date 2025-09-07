{{ ... }}
import zipfile
import logging
from pathlib import Path
from typing import Dict, List, Optional

from .job import PhotoPackagerSettings

try:
    from . import config
except ImportError:
    # This path is less likely now with relative imports, but good practice.
    raise ImportError("Critical: config.py is missing. The application cannot run.")

logger = logging.getLogger(__name__)


def scan_directory(source_dir: Path, include_raw: bool = True):
    """
{{ ... }}
