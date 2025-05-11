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

# Standard image file extensions
STANDARD_IMAGE_EXTENSIONS: Set[str] = {
    # Common image formats
    ".jpg", ".jpeg", ".jpe", ".jif", ".jfif", ".jfi", 
    ".png", ".gif", ".webp", ".avif", ".bmp", ".dib", 
    ".tiff", ".tif", ".psd", ".ai", ".eps", ".svg", 
    ".pdf", ".heif", ".heic", ".indd", ".xcf", ".iff", 
    ".apng", ".jp2", ".j2k", ".jpf", ".jpx", ".jpm", 
    ".mj2", ".hdr", ".exr", ".bpg", ".drw", ".ecw", 
    ".fits", ".flif", ".ico", ".cur", ".ilbm", ".img", 
    ".nrrd", ".pam", ".pcx", ".pgf", ".sgi", 
    ".sid", ".sun", ".tga", ".vicar", ".xisf"
}

# Camera RAW file extensions
RAW_IMAGE_EXTENSIONS: Set[str] = {
    # Camera RAW formats
    ".raw", ".arw", ".srf", ".sr2", ".crw", ".cr2", ".cr3", 
    ".nef", ".nrw", ".orf", ".rw2", ".raf", ".dng", ".mos", 
    ".kdc", ".dcr", ".x3f", ".pef", ".3fr", ".mef", ".erf", 
    ".fff", ".braw", ".cine", ".iiq", ".rwl", ".ari", ".bay", 
    ".cap", ".data", ".dcs", ".drf", ".eip", ".gpr", ".k25", 
    ".mdc", ".mrw", ".obm", ".ptx", ".pxn", ".r3d", ".rwz", ".srw"
}

# Combined set for backward compatibility
ALLOWED_EXTENSIONS: Set[str] = STANDARD_IMAGE_EXTENSIONS | RAW_IMAGE_EXTENSIONS

FOLDER_NAMES = {
    "top_level_readme": "README.txt",
    "log_file": "photopackager_run.log",
    "raw": "RAW Files",
    "raw_readme": "README.txt",

    "originals": "Export Originals", # Directory for original, unprocessed images (if copied/moved)
    "export": "Delivery Export",      # Top-level folder for primary deliverable processed files (e.g., JPEGs for client)
                                      # This might be redundant if 'Optimized Files' serves this purpose, or can be a parent.
                                      # For now, let's assume 'Optimized Files' is the primary client deliverable.
    "export_files": "User Export JPEGs", # Specific sub-folder for user-exported JPEGs (from GUI or a specific process)
                                     # This was previously ambiguous. Clarifying its potential role.
                                     # If this isn't used by current job.py logic for standard exports, it can be removed or repurposed.
                                     # The test failure relates to 'Export Originals'.

    "optimized": "Optimized Files",
    "optimized_jpg": "Optimized JPGs",
    "optimized_webp": "Optimized WebPs",
    "compressed": "Compressed Files",
    "compressed_jpg": "Compressed JPGs",
    "compressed_webp": "Compressed WebPs",
    "raw_readme": "README.txt",

    "zip_optimized": "Zipped Optimized Files.zip",
    "zip_compressed": "Zipped Compressed Files.zip",
    "zip_raw": "Zipped RAW Files.zip",
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
DEFAULT_GENERATE_COMPRESSED_JPG: bool = True
DEFAULT_GENERATE_COMPRESSED_WEBP: bool = True
# Legacy flag maintained for backward compatibility
DEFAULT_GENERATE_LOW_QUALITY: bool = True
DEFAULT_ORIGINAL_ACTION: str = "copy"
DEFAULT_RAW_ACTION: str = "copy"
DEFAULT_EXIF_OPTION: str = "keep"
DEFAULT_GENERATE_ZIPS: bool = True

DEFAULT_WORKERS: int = 5

# New default options
DEFAULT_INCLUDE_RAW: bool = True
DEFAULT_ADD_PREFIX: bool = True

# Template for RAW readme
RAW_README_TEMPLATE: str = """
# RAW Files Directory

This folder contains the original RAW format files from your photo shoot. 
These files:

- Are in their original camera RAW format
- Have not been processed or modified
- May require specialized software to open (e.g., Adobe Lightroom, Capture One)
- Provide maximum flexibility for professional editing

For easy viewing and sharing, please use the processed JPG/WebP files in the 
other folders which have been optimized for general use.
"""

# File prefixes for renamed files
FILE_PREFIXES = {
    "raw": "RAW_",
    "original": "Original_",
    "optimized": "Optimized_",
    "compressed": "Compressed_"
}
