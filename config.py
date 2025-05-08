#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from typing import Set

TOOL_DISPLAY_NAME: str = "PhotoPackager"

ORIGINAL_AUTHOR: str = "Steven Seagondollar, DropShock Digital LLC"

ORIGINAL_TOOL_REPO: str = "https://github.com/Droptimal/PhotoPackager"

USER_COMPANY_NAME: str = "DropShock Digital LLC"

USER_WEBSITE: str = "https://www.dropshockdigital.com"

USER_SUPPORT_EMAIL: str = "support@dropshockdigital.com"

ALLOWED_EXTENSIONS: Set[str] = {
    ".jpg",
    ".jpeg",
    ".png",
    ".tiff",
    ".tif",
    ".bmp",
    ".gif",
}

FOLDER_NAMES = {
    "top_level_readme": "README.txt",
    "log_file": "photopackager_run.log",
    "raw": "RAW Files",

    "export_originals": "Export Originals",
    "optimized": "Optimized Files",
    "optimized_jpg": "Optimized JPGs",
    "optimized_webp": "Optimized WebPs",
    "compressed": "Compressed Files",
    "compressed_jpg": "Compressed JPGs",
    "compressed_webp": "Compressed WebPs",
    "raw_readme": "README.txt",

    "zip_optimized": "Zipped Optimized Files.zip",
    "zip_compressed": "Zipped Compressed Files.zip",
}

OPTIMIZED_QUALITY: int = 90

COMPRESSED_TARGET_PIXELS: int = 2_000_000

COMPRESSED_QUALITY_BASE: int = 60

BOLD: str = "\033[1m"
RESET: str = "\033[0m"
YELLOW: str = "\033[93m"
RED: str = "\033[91m"
GREEN: str = "\033[92m"
ORANGE: str = "\033[38;5;214m"

PREFIX_INFO: str = "[INFO] "
PREFIX_WARN: str = "[WARN] "
PREFIX_ERROR: str = "[ERR]  "
PREFIX_DEBUG: str = "[DEBUG]"
PREFIX_DRYRUN: str = "[DRYRUN]"
PREFIX_DONE: str = "[DONE] "

DEFAULT_GENERATE_JPG: bool = True
DEFAULT_GENERATE_WEBP: bool = True
DEFAULT_GENERATE_LOW_QUALITY: bool = True
DEFAULT_ORIGINAL_ACTION: str = "copy"
DEFAULT_EXIF_OPTION: str = "keep"
DEFAULT_GENERATE_ZIPS: bool = True

DEFAULT_WORKERS: int = os.cpu_count() or 1
