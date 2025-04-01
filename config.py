#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Central configuration repository for the PhotoPackager application.

This module consolidates all constants, default settings, and user-configurable
parameters required by the PhotoPackager tool. Its primary purpose is to provide
a single source of truth for settings related to file handling, image processing,
user interface appearance (including interactive prompt defaults), runtime
behavior, and branding/attribution.

By centralizing configuration here, we avoid hardcoding 'magic numbers' or strings
scattered throughout the other modules (`ui.py`, `filesystem.py`,
`image_processing.py`, etc.). This makes the application easier to understand,
maintain, and customize according to DropShock Digital standards and specific
user preferences.

**IMPORTANT:** Modifying values in this file can significantly alter the tool's
output, behavior, and performance. Ensure you understand the impact of changes
before making them. Comments below detail the purpose and potential effects of
each constant. Adherence to the structure and commenting style defined in the
DropShock Digital Developer Profile is mandatory.

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
Project: PhotoPackager v1.0.0-refactor
License: MIT License (Consult LICENSE.md file for full details)
"""

# --- Standard Library Imports ---
# Use os for cpu_count, pathlib for potential Path constants if needed later.
import os
from pathlib import Path
# Import necessary types for hinting complex constants.
from typing import Set, Dict, Tuple # Added Tuple

# ----------------------------------------
# --- Tool Identity & Branding (Core) ---
# ----------------------------------------
# These constants define the core identity of the tool itself.
# They are generally NOT meant to be changed by the end-user studio, as they
# relate to the original development and licensing.

TOOL_DISPLAY_NAME: str = "PhotoPackager"
# Purpose: The official name of the application displayed in UI elements (intro screen)
#          and documentation (READMEs, logs).
# Impact: Changes how the tool identifies itself. Essential for branding.

ORIGINAL_AUTHOR: str = "Steven Seagondollar, DropShock Digital LLC"
# Purpose: Specifies the original developer/copyright holder. Used for mandatory attribution
#          in LICENSE.md, generated README.txt footers, and log files.
# Impact: Critical for maintaining intellectual property credit as required. Do not change.

ORIGINAL_TOOL_REPO: str = "https://github.com/Droptimal/PhotoPackager"
# Purpose: A link back to the original tool's source code repository or website. Used in
#          attribution footers in generated README.txt files.
# Impact: Provides a way for end-clients or users to find the original tool. Should point
#         to a valid URL. Update if the repository location changes.

# ----------------------------------------------------
# --- User Configuration (Studio Branding for Output) ---
# ----------------------------------------------------
# This section contains settings that the END-USER (e.g., the photography studio
# using PhotoPackager) should configure to brand the output deliverables (README.txt)
# and UI elements (intro screen) with their own details.

USER_COMPANY_NAME: str = "DropShock Digital LLC"
# Purpose: The name of the studio or business using this tool. Displayed prominently in
#          the UI intro and within generated README.txt files delivered to clients.
# Impact: Allows the end-user studio to brand the output package for their clients.
#         Should be customized by the studio running the tool.

USER_WEBSITE: str = "https://www.dropshockdigital.com"
# Purpose: The website URL of the studio/business using the tool. Included in generated
#          README.txt files for client reference.
# Impact: Provides contact/portfolio information for the end-user's clients within the
#         delivery package. Should be set by the user. Ensure it's a valid URL.

USER_SUPPORT_EMAIL: str = "support@dropshockdigital.com"
# Purpose: The support email address for the studio/business using the tool. Included in
#          generated README.txt files to direct client support inquiries regarding the
#          *delivered photos/content* (not the tool itself) to the correct place.
# Impact: Facilitates client communication regarding the delivered work. Should be set by the user.

# ----------------------------------------
# --- File Handling & Naming ---
# ----------------------------------------
# Settings related to input file types, output folder structure, and generated filenames.

# Define which file extensions are considered valid input image files.
# Case-insensitive matching is used in filesystem.py.
ALLOWED_EXTENSIONS: Set[str] = {
    ".jpg", ".jpeg", # Standard JPEG formats
    ".png",          # Portable Network Graphics (supports transparency)
    ".tiff", ".tif", # Tagged Image File Format (often high quality, large)
    ".bmp",          # Bitmap (less common for photos, usually uncompressed)
    ".gif"           # Graphics Interchange Format (limited colors, rarely for photos)
    # Note: WebP is primarily handled as an *output* format in this tool.
    # If Pillow supports other *input* formats needed (e.g., HEIC with plugins),
    # add their lowercase extensions here. Ensure image_processing.py can handle them.
}
# Purpose: Filters which files `filesystem.gather_image_files` will identify as processable images.
# Impact: Files with extensions not listed here will be ignored during the input scan.

# Defines the exact names used for creating the output directory structure and key files.
# Keys (e.g., "raw", "optimized_jpg") are used internally in filesystem.py, main.py etc.
# Changing values directly alters the generated folder hierarchy and filenames.
FOLDER_NAMES: Dict[str, str] = {
    # --- Top Level & Core Structure ---
    "top_level_readme": "README.txt",          # Name of the main readme in the root output shoot folder.
    "log_file": "photopackager_run.log",   # Name of the detailed log file in the root output shoot folder.
    "raw": "RAW Files",                    # Folder reserved for original RAWs (content depends on delivery agreement).
    "export": "Export Files",              # Parent folder for handling originals/copies (based on original_action).
    "optimized": "Optimized Files",          # Parent folder for high-quality processed versions (JPG/WebP).
    "compressed": "Compressed Files",        # Parent folder for resized, highly compressed versions (JPG/WebP).

    # --- Subfolders within Core Structure ---
    "raw_readme": "README.txt",                # Readme specifically inside the RAW folder explaining its purpose/policy.
    "export_originals": "Export Originals",    # Subfolder under 'Export' containing copies or moved original files.
    "optimized_jpg": "Optimized JPGs",         # Subfolder under 'Optimized' for high-quality JPEGs.
    "optimized_webp": "Optimized WebPs",       # Subfolder under 'Optimized' for high-quality WebPs.
    "compressed_jpg": "Compressed JPGs",       # Subfolder under 'Compressed' for resized/compressed JPEGs.
    "compressed_webp": "Compressed WebPs",     # Subfolder under 'Compressed' for resized/compressed WebPs.

    # --- ZIP Archives (Optional Generation) ---
    "zip_export": "Zipped Export Files.zip",       # Filename for the optional ZIP of the Export structure.
    "zip_optimized": "Zipped Optimized Files.zip",   # Filename for the optional ZIP of the Optimized structure.
    "zip_compressed": "Zipped Compressed Files.zip", # Filename for the optional ZIP of the Compressed structure.
}
# Purpose: Provides a single source of truth for all output naming conventions.
# Impact: Modifying values here changes the generated structure. Consistency is key.

# ----------------------------------------
# --- Image Processing Settings ---
# ----------------------------------------
# Parameters controlling how images are resized, compressed, and saved by image_processing.py.

OPTIMIZED_QUALITY: int = 90
# Purpose: Target quality setting (1-100, higher is better quality/larger size) used when
#          saving "Optimized" JPEG and lossy WebP files.
# Impact: Directly affects the visual quality and file size of the 'Optimized Files' set.
#         Values 90-95 are typical for high quality suitable for print/archival.

COMPRESSED_TARGET_PIXELS: int = 2_000_000 # Approx 2 Megapixels (e.g., 1920x1080 is ~2.07MP)
# Purpose: The target total number of pixels for "Compressed" images. Images with more pixels
#          than this will be downscaled proportionally before compression. Underscores improve readability.
# Impact: Controls the resolution (dimensions) of the 'Compressed Files' set. Lowering this value
#         reduces dimensions and file size further, suitable for web/previews.

COMPRESSED_QUALITY_BASE: int = 60
# Purpose: The *starting point* quality target (1-100) used for "Compressed" JPEG and WebP
#          files *before* adaptive quality adjustments (based on image complexity) are applied
#          by `image_processing._compute_adaptive_quality`.
# Impact: Influences the baseline compression level for the 'Compressed Files' set. Adaptive
#         logic might adjust this up or down slightly per image. Lower values result in smaller
#         files but potentially more visible compression artifacts.

# ----------------------------------------
# --- UI / Console Formatting ---
# ----------------------------------------
# Constants for styling terminal output consistently across modules (ui.py, bootstrap.py, main.py).

# --- ANSI Color Codes ---
# Standard codes for adding color and style to terminal text.
# Reference: https://stackoverflow.com/questions/287871/how-to-print-colored-text-to-the-terminal
# Note: Compatibility depends on the terminal emulator (standard on most modern terminals).
# `colorama` library (optional Windows dependency) helps ensure compatibility on older Windows.
BOLD: str = "\033[1m"     # Bold text.
RESET: str = "\033[0m"    # Resets all formatting (color, bold) to terminal default.
# Define standard colors based on DropShock style guide / examples:
YELLOW: str = "\033[93m"  # Bright yellow (for prompts, warnings, highlights).
RED: str = "\033[91m"     # Bright red (for errors, critical warnings).
GREEN: str = "\033[92m"   # Bright green (for success messages, completion).
ORANGE: str = "\033[38;5;214m" # Specific orange shade (used for intro banner).
# Purpose: Used by modules printing to console (`ui.py`, `bootstrap.py`, `main.py`) for styled output.
# Impact: Affects visual appearance of terminal messages. Maintain consistency.

# --- Console Output Prefixes ---
# Standardized prefixes for different types of console log messages. Used for clarity and filtering.
PREFIX_INFO: str = "[INFO] "   # General information message prefix.
PREFIX_WARN: str = "[WARN] "   # Warning message prefix (often paired with YELLOW).
PREFIX_ERROR: str = "[ERR]  "  # Error message prefix (often paired with RED). Pad for alignment.
PREFIX_DEBUG: str = "[DEBUG]"   # Debug message prefix (only shown if verbose logging is enabled).
PREFIX_DRYRUN: str = "[DRYRUN]" # Prefix for actions simulated during a dry run (no actual change).
PREFIX_DONE: str = "[DONE] "   # Prefix for successful completion messages (often paired with GREEN).
# Purpose: Used by `ui.py`, `main.py` and potentially other modules printing to console for consistent
#          message formatting and easy identification of message type.
# Impact: Affects the readability and structure of console output.

# -----------------------------------------------------
# --- UI Prompt Defaults (Interactive Mode) --- NEW SECTION ---
# -----------------------------------------------------
# These constants define the default answers presented to the user during
# interactive configuration prompts in `ui.py`. Modifying these allows
# customization of the tool's default behavior when run interactively without
# specific command-line arguments overriding these choices.

DEFAULT_GENERATE_JPG: bool = True
# Purpose: Default choice for "Generate JPG editions?". True means JPGs are generated by default.
# Impact: Sets the default state for JPG output in interactive mode.

DEFAULT_GENERATE_WEBP: bool = True
# Purpose: Default choice for "Generate WebP editions?". True means WebPs are generated by default.
# Impact: Sets the default state for WebP output in interactive mode.

DEFAULT_GENERATE_LOW_QUALITY: bool = True
# Purpose: Default choice for "Generate Compressed Files (~2MP web-friendly)?". True means compressed files are generated.
# Impact: Sets the default state for generating the 'Compressed' set in interactive mode.

DEFAULT_ORIGINAL_ACTION: str = "copy"
# Purpose: Default choice for how original source images are handled.
# Valid Options: "copy", "move", "leave", "none" (as used internally and prompted in ui.py).
#   "copy": Safest option, duplicates originals into the 'Export Originals' folder.
#   "move": Moves originals permanently. Requires explicit confirmation. USE WITH CAUTION.
#   "leave": Leaves originals in place. 'Export Originals' folder will be empty.
#   "none": Skips the entire 'Export Files' structure creation and original handling.
# Impact: Determines the default file handling strategy in interactive mode.

DEFAULT_EXIF_OPTION: str = "keep"
# Purpose: Default choice for EXIF metadata handling in generated images.
# Valid Options: "keep", "date", "camera", "both", "strip_all".
#   "keep": Retains all original EXIF.
#   "date": Removes only date/time related tags (requires piexif).
#   "camera": Removes only camera make/model related tags (requires piexif).
#   "both": Removes both date and camera tags (requires piexif).
#   "strip_all": Removes all EXIF data.
# Impact: Sets the default EXIF handling policy in interactive mode.

DEFAULT_GENERATE_ZIPS: bool = True
# Purpose: Default choice for "Generate ZIP archives for key output folders?". True means ZIPs are created.
# Impact: Sets the default state for generating final ZIP archives in interactive mode.

# Note: Defaults for shoot-specific names ('shoot_name', 'base_name') and the output parent
# directory ('output_parent') are typically derived contextually from the source folder path
# within `ui.ask_shoot_specific_options` for better usability, rather than being set globally here.

# ----------------------------------------
# --- Runtime Behavior & Defaults ---
# ----------------------------------------
# Settings affecting how the application executes, particularly defaults for CLI args.

# Default number of parallel worker processes used for image processing in main.py.
# Based on system CPU cores for potentially faster processing on multi-core systems.
# Falls back to 1 if os.cpu_count() returns None or 0.
DEFAULT_WORKERS: int = os.cpu_count() or 1
# Purpose: Sets the default value for the `--workers` command-line argument.
# Impact: Affects processing speed and system resource usage. Can be overridden by the user.
#         Higher values might not always be faster due to I/O bottlenecks or processing overhead.

# --- Add other runtime flags or default settings as needed ---
# Example (if adding a new feature):
# DEFAULT_WATERMARK_OPACITY: float = 0.15
# Purpose: Sets the default opacity for a hypothetical watermarking feature.
# Impact: Controls default watermark visibility if feature is added and enabled.

# ----------------------------------------
# --- Bootstrap Script Settings ---
# ----------------------------------------
# Constants specifically used by bootstrap.py (repeated here for self-containment if needed,
# but ideally bootstrap reads its own config or uses args if becoming complex).
# For now, bootstrap.py defines these internally. If more config needed, consider options.
# Example: BOOTSTRAP_MIN_PYTHON_VERSION: Tuple[int, int, int] = (3, 8, 0)