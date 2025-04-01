#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Core image processing logic for the PhotoPackager application.

This module encapsulates all image manipulation tasks, leveraging the Pillow
library. Its responsibilities include:
- Loading various image file formats.
- Applying EXIF orientation correction to ensure images display correctly.
- Converting images to standard color modes (RGB/RGBA) for consistent processing.
- Resizing images based on a target pixel count for 'Compressed' versions.
- Calculating adaptive compression quality based on image complexity analysis.
- Saving processed images in different formats (JPEG, WebP) with specified
  quality settings and appropriate EXIF handling.
- Selectively stripping EXIF metadata based on user configuration ('keep', 'date',
  'camera', 'both', 'strip_all'), using 'piexif' if available for partial removal.
- Correctly simulating save operations (logging intent without writing files)
  when '--dry-run' mode is active.

This module aims for efficiency and robustness in image handling, including
managing large images and handling potential errors during loading or saving.
It relies on configuration values (quality settings, target pixels, etc.)
sourced exclusively from the central `config.py` module.

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
Project: PhotoPackager v1.0.0-refactor
License: MIT License (Consult LICENSE.md file for full details)
"""

# --- Standard Library Imports ---
import math
import logging
from pathlib import Path
# Import necessary types for hinting
from typing import Optional, Dict, Tuple, Any, List, Union # Added List, Union

# --- Third-Party Library Imports ---
# Pillow (PIL Fork) is the core imaging library.
try:
    # Import specific components needed to minimize namespace pollution.
    # Image: Main class for image loading and manipulation.
    # ImageStat: Used for calculating statistics (std dev for adaptive quality).
    # ImageOps: Contains helpful operations like exif_transpose.
    from PIL import Image, ImageStat, ImageOps, UnidentifiedImageError
    # Set max image pixels to None to avoid potential DecompressionBomb warnings/errors
    # for very large images. This allows Pillow to handle arbitrarily large images,
    # assuming sufficient system memory. Adjust if memory constraints are tight.
    # Rationale: Modern cameras produce large images; limiting this might prevent valid processing.
    Image.MAX_IMAGE_PIXELS = None
    PILLOW_AVAILABLE = True
    logger_pillow = logging.getLogger(__name__ + '.pillow') # Specific logger for Pillow ops
    logger_pillow.debug("Pillow library successfully imported and configured.")
except ImportError:
    # Pillow is absolutely essential. If not installed, the application cannot function.
    # Log a critical error and set a flag. The main script should ideally check this flag or handle the error.
    # However, bootstrap should prevent reaching here if Pillow is missing. Defensive coding.
    PILLOW_AVAILABLE = False
    logger_pillow = logging.getLogger(__name__ + '.pillow')
    # Use print as logging might not be fully configured if this fails very early.
    print("CRITICAL ERROR: Pillow (PIL) library not found. PhotoPackager cannot perform image processing.", file=sys.stderr) # Use sys after import
    # We don't exit here; allow main.py to handle the failure if Pillow is missing after bootstrap.
    logger_pillow.critical("Pillow library import failed!")


# piexif is used for *partial* EXIF stripping. It's optional.
try:
    import piexif
    PIEXIF_AVAILABLE = True
    logger_piexif = logging.getLogger(__name__ + '.piexif') # Specific logger for piexif ops
    logger_piexif.debug("Optional 'piexif' library successfully imported.")
except ImportError:
    # If piexif is not installed, set a flag and log a warning.
    # Partial EXIF stripping options ('date', 'camera', 'both') will fallback to 'strip_all'.
    PIEXIF_AVAILABLE = False
    logger_piexif = logging.getLogger(__name__ + '.piexif')
    logger_piexif.warning("Optional 'piexif' library not found. Partial EXIF removal ('date', 'camera', 'both') "
                          "will fallback to 'strip_all' if selected.")

# --- Project-Specific Imports ---
# Use try-except for robustness, although config is fundamental.
try:
    # Import configuration constants. CRITICAL for quality, sizing, etc.
    import config
except ImportError:
    # If config.py is missing, critical error. Cannot proceed.
    print("CRITICAL ERROR: Failed to import 'config' module in image_processing.py. Cannot proceed.", file=sys.stderr)
    # Exit directly if config is missing, as defaults cannot be determined.
    exit(1) # Use exit after import

# --- Module Logger Setup ---
# Get a logger specific to this module for general image processing logs.
logger = logging.getLogger(__name__)

# ----------------------------------------
# --- Private Helper Functions ---
# ----------------------------------------
# These functions support the main process_image logic but are not intended
# for direct use outside this module (indicated by leading underscore).

def _compute_adaptive_quality(image: Image.Image, base_quality: int) -> int:
    """
    Calculates an adaptive JPEG/WebP quality setting based on image complexity.

    Uses the standard deviation of the luminance channel ('L' mode) as a proxy
    for visual complexity. The idea is that less complex images (e.g., smooth
    gradients, flat colors) might show compression artifacts more readily,
    while more complex images (high detail, texture) might tolerate slightly
    lower quality settings without perceptual loss, thus saving file size.
    It adjusts the provided `base_quality` within reasonable bounds (e.g., 30-95).

    Args:
        image (Image.Image): The Pillow Image object to analyze. Must be successfully
                             convertible to 'L' mode (grayscale). A copy is used internally.
        base_quality (int): The starting quality value (typically sourced from config).

    Returns:
        int: The adjusted quality value, clamped within a predefined safe range [30, 95].
             Returns `base_quality` if calculation fails.
    """
    # --- Defensive Check ---
    # Ensure we have a valid image object to work with.
    if not image:
        logger.warning("Cannot compute adaptive quality: Invalid image object provided.")
        return base_quality

    try:
        # --- Complexity Analysis ---
        # Convert image to grayscale ('L' mode) to analyze luminance/brightness variation.
        # Use a copy to avoid modifying the original image object passed in.
        grayscale_img = image.copy().convert("L")
        # Calculate statistics for the grayscale image.
        stat = ImageStat.Stat(grayscale_img)
        # Standard deviation of pixel values. Higher std dev suggests more variation/complexity.
        # Provide a reasonable default (e.g., 50.0) if calculation fails or returns None/empty list.
        stddev: float = 50.0 # Default assumption: moderately complex
        if stat.stddev and stat.stddev[0] is not None:
            stddev = stat.stddev[0]
        logger.debug(f"Adaptive Quality Analysis: Image luminance std dev = {stddev:.2f}")

        # --- Quality Adjustment Logic ---
        # Define thresholds and adjustments based on standard deviation.
        # These thresholds are heuristic and may need tuning based on visual results across diverse images.
        # Rationale: Slightly increase quality for very complex images to retain detail,
        # slightly decrease quality for very simple images where artifacts might be more noticeable
        # if quality is too low, but allow more compression. Mid-range complexity uses base quality.
        quality_offset: int = 0
        if stddev < 30:  # Relatively simple image (low variation)
            quality_offset = -10 # Reduce quality slightly to save space
            logger.debug("Adaptive Quality: Low complexity detected, applying offset -10.")
        elif stddev > 60: # More complex image (high variation)
            quality_offset = 5   # Increase quality slightly to preserve detail
            logger.debug("Adaptive Quality: High complexity detected, applying offset +5.")
        # else: offset remains 0 for mid-range complexity

        # Calculate the initially adjusted quality.
        adjusted_quality: int = base_quality + quality_offset

        # --- Clamping ---
        # Clamp the final quality within a reasonable, safe range (e.g., 30 to 95)
        # to prevent excessively low (very poor quality) or unnecessarily high values.
        QUALITY_MIN: int = 30
        QUALITY_MAX: int = 95
        final_quality: int = max(QUALITY_MIN, min(QUALITY_MAX, adjusted_quality))

        logger.info(f"Adaptive Quality Calculated: Base={base_quality}, StdDev={stddev:.2f}, "
                    f"Adjusted={adjusted_quality}, Final Clamped Quality={final_quality}")
        return final_quality

    except Exception as e:
        # Catch potential errors during conversion, statistics calculation, etc.
        logger.warning(f"Could not compute adaptive quality due to error: {e}. "
                       f"Using base quality {base_quality} instead.", exc_info=False) # Avoid stack trace for common fallback
        # Fallback to the unmodified base quality if stats calculation fails.
        return base_quality


def _strip_selected_exif(exif_bytes: Optional[bytes], exif_option: str) -> Optional[bytes]:
    """
    Removes EXIF metadata from the provided EXIF byte string based on the
    specified option ('keep', 'date', 'camera', 'both', 'strip_all').

    Uses the 'piexif' library for partial removal ('date', 'camera', 'both')
    if it's available. Falls back to stripping all EXIF if 'piexif' is needed
    but unavailable or fails during processing, except when the option is 'keep'.

    Args:
        exif_bytes (Optional[bytes]): The raw EXIF data bytes extracted from the
                                      image (e.g., via `img.info.get('exif')`), or None.
        exif_option (str): The desired stripping option, matching keys used in
                           `config.py` and `ui.py` ('keep', 'date', 'camera', 'both', 'strip_all').

    Returns:
        Optional[bytes]: The processed EXIF data as bytes.
                         - Returns the original `exif_bytes` if `exif_option` is 'keep'.
                         - Returns `None` if `exif_option` is 'strip_all'.
                         - Returns modified bytes if partial stripping succeeds.
                         - Returns `None` if partial stripping is requested but fails
                           (e.g., piexif unavailable, load/dump error).
                         - Returns `None` if input `exif_bytes` was `None`.
    """
    # --- Handle No EXIF Input ---
    if not exif_bytes:
        logger.debug("No EXIF data provided to _strip_selected_exif; returning None.")
        return None

    # --- Handle Simple Cases ---
    if exif_option == 'keep':
        logger.debug("EXIF option 'keep'. Retaining original EXIF data.")
        # Return the original bytes unmodified.
        return exif_bytes
    if exif_option == 'strip_all':
        logger.debug("EXIF option 'strip_all'. Removing all EXIF data.")
        # Return None to indicate complete removal to the caller (Pillow's save uses None for no EXIF).
        return None

    # --- Partial Removal Logic (Requires piexif) ---
    logger.debug(f"Attempting partial EXIF removal (option: '{exif_option}'). Checking piexif availability.")

    # 1. Check if piexif is available (flag set during import).
    if not PIEXIF_AVAILABLE:
        # Log a warning and fallback to stripping all if piexif is needed but missing.
        logger_piexif.warning(f"piexif library not available. Cannot perform partial EXIF removal "
                              f"for option '{exif_option}'. Stripping all EXIF as fallback.")
        # Fallback behavior: Strip all EXIF data.
        return None

    # 2. Attempt piexif processing only if the library was successfully imported.
    try:
        # Load the raw EXIF bytes into a piexif dictionary structure.
        # This structure organizes tags by IFD (Image File Directory: 0th, Exif, GPS, etc.).
        # ValueError can occur if EXIF data is malformed.
        logger_piexif.debug(f"Loading EXIF data using piexif for option '{exif_option}'.")
        exif_dict: Dict[str, Dict[int, Any]] = piexif.load(exif_bytes)
        modified: bool = False # Flag to track if any changes were actually made.

        # --- Define Tags to Remove ---
        # Use piexif constants (e.g., piexif.ImageIFD.Make) for clarity and future-proofing.
        # Define lists of tag IDs to remove for each category.
        date_time_tags_0th: List[int] = [piexif.ImageIFD.DateTime] # Modification date of file
        date_time_tags_exif: List[int] = [
            piexif.ExifIFD.DateTimeOriginal,    # Original datetime of image capture
            piexif.ExifIFD.DateTimeDigitized,   # Datetime when digitized
            # Consider also: OffsetTime, OffsetTimeOriginal, OffsetTimeDigitized? SubSecTime*?
        ]
        camera_tags_0th: List[int] = [
            piexif.ImageIFD.Make,               # Camera manufacturer
            piexif.ImageIFD.Model,              # Camera model name
            piexif.ImageIFD.Software,           # Software used (often camera firmware or editor)
        ]
        camera_tags_exif: List[int] = [
             # Lens information often resides in ExifIFD
             piexif.ExifIFD.LensMake,
             piexif.ExifIFD.LensModel,
             piexif.ExifIFD.LensSpecification,
        ]

        # --- Determine Which Tags to Remove Based on Option ---
        tags_to_remove_0th: List[int] = []
        tags_to_remove_exif: List[int] = []

        if exif_option in ('date', 'both'):
            tags_to_remove_0th.extend(date_time_tags_0th)
            tags_to_remove_exif.extend(date_time_tags_exif)
            logger_piexif.debug("Targeting Date/Time EXIF tags for removal.")
        if exif_option in ('camera', 'both'):
            tags_to_remove_0th.extend(camera_tags_0th)
            tags_to_remove_exif.extend(camera_tags_exif)
            logger_piexif.debug("Targeting Camera/Lens/Software EXIF tags for removal.")

        # --- Perform Removal from EXIF Dictionary ---
        # Iterate through the main IFDs present in the dictionary.
        if "0th" in exif_dict and tags_to_remove_0th:
            for tag in tags_to_remove_0th:
                if tag in exif_dict["0th"]:
                    del exif_dict["0th"][tag]
                    logger_piexif.debug(f"Removed tag {tag} from 0th IFD.")
                    modified = True
            # Clean up IFD if it becomes empty after removal? Optional, piexif might handle this.
            # if not exif_dict["0th"]: del exif_dict["0th"]

        if "Exif" in exif_dict and tags_to_remove_exif:
            for tag in tags_to_remove_exif:
                if tag in exif_dict["Exif"]:
                    del exif_dict["Exif"][tag]
                    logger_piexif.debug(f"Removed tag {tag} from Exif IFD.")
                    modified = True
            # Clean up IFD if empty?
            # if not exif_dict["Exif"]: del exif_dict["Exif"]

        # Add logic for other IFDs (GPS, Interop, 1st) if needed, following the same pattern.
        # Example:
        # if exif_option == 'strip_gps' and "GPS" in exif_dict:
        #    del exif_dict["GPS"]
        #    logger_piexif.debug("Removed entire GPS IFD.")
        #    modified = True

        # --- Generate Updated EXIF Bytes ---
        if modified:
            # If changes were made, dump the modified dictionary back into bytes format.
            # This can also raise errors if the dictionary structure is invalid after manipulation.
            logger_piexif.debug("Attempting to dump modified EXIF data back to bytes.")
            try:
                updated_exif_bytes: bytes = piexif.dump(exif_dict)
                logger_piexif.info(f"Successfully performed partial EXIF removal (option: '{exif_option}').")
                return updated_exif_bytes
            except Exception as dump_e:
                # Catch errors during the dump process (e.g., invalid data format after modification).
                logger_piexif.error(f"piexif failed to dump modified EXIF dict: {dump_e}. "
                                    f"Stripping all EXIF as fallback.", exc_info=True)
                # Fallback behavior: Strip all EXIF if dumping fails.
                return None
        else:
            # If no targeted tags were found or removed for the selected option.
            logger_piexif.debug(f"No targeted EXIF tags found/removed for option '{exif_option}'. "
                                f"Returning original EXIF data.")
            return exif_bytes

    # --- Handle piexif Load/Processing Errors ---
    except ValueError as load_e:
        # piexif.load can raise ValueError for invalid EXIF structures.
        logger_piexif.warning(f"piexif could not load EXIF data (potentially invalid format): {load_e}. "
                              f"Stripping all EXIF as fallback.")
        # Fallback behavior: Strip all EXIF if loading fails.
        return None
    except Exception as e:
        # Catch any other unexpected errors during piexif processing.
        logger_piexif.error(f"Unexpected error during partial EXIF removal using piexif: {e}. "
                            f"Stripping all EXIF as fallback.", exc_info=True)
        # Fallback behavior: Strip all EXIF on unexpected errors.
        return None

# ----------------------------------------
# --- Main Image Processing Function ---
# ----------------------------------------

def process_image(
    file_path: Path,
    output_base_folder: Path,
    # shoot_config: Dict[str, Any], # Keep for potential future use, but currently unused
    global_choices: Dict[str, Any],
    dry_run: bool = False
) -> None:
    """
    Processes a single image file: loads, applies orientation correction,
    converts color mode, handles EXIF stripping based on global choices,
    generates Optimized and Compressed versions (in JPG and/or WebP formats),
    and saves them to the appropriate subfolders within the output structure.

    If `dry_run` is True, simulates all processing steps and logs intended save
    actions without actually writing any output files to disk.

    Args:
        file_path (Path): Absolute path to the source image file to process.
        output_base_folder (Path): The root output directory for the current shoot
                                   (e.g., /path/to/output/ClientA_Wedding).
        global_choices (Dict[str, Any]): Dictionary containing global processing
                                         options selected by the user or via CLI,
                                         such as 'generate_jpg', 'generate_webp',
                                         'generate_low_quality', 'exif_option'.
        dry_run (bool): If True, simulate processing and log intent without
                        saving output files. Defaults to False.

    Returns:
        None: Results are saved to disk (or simulated in dry run). Errors are logged.

    Raises:
        # This function aims to handle expected errors gracefully (logging them).
        # It might implicitly re-raise critical low-level errors from Pillow
        # if they occur outside the handled exceptions (e.g., severe memory errors),
        # which would then be caught by the caller (e.g., ProcessPoolExecutor in main.py).
        # Expected handled errors: FileNotFoundError, UnidentifiedImageError, Pillow IOErrors.
    """
    # --- Initial Setup & Logging ---
    # Determine log prefix based on dry_run status for clarity in logs.
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else ""
    logger.info(f"{action_prefix}Starting processing for Image: '{file_path.name}'")

    # --- Defensive Check: Pillow Availability ---
    if not PILLOW_AVAILABLE:
         logger.critical(f"Cannot process '{file_path.name}': Pillow library is not available.")
         # Cannot proceed without Pillow.
         return

    # --- Image Loading and Initial Processing ---
    try:
        # Use a 'with' statement ensures the image file handle is properly closed,
        # even if errors occur during processing below. This is crucial for resource management.
        with Image.open(file_path) as img:
            # Record original properties for logging and potential comparison.
            original_size: Tuple[int, int] = img.size
            original_mode: str = img.mode
            logger.debug(f"Opened '{file_path.name}'. Original Size={original_size}, Mode={original_mode}")

            # --- Pre-processing Stage ---
            # Work on a copy of the image data to avoid modifying the object associated
            # with the opened file handle, especially before EXIF extraction.
            img_processed: Image.Image = img.copy()

            # 1. Apply EXIF Orientation Correction (Robustly)
            # Rationale: Images straight from cameras often have an orientation tag (e.g., rotated 90 degrees).
            # ImageOps.exif_transpose reads this tag and rotates/flips the image data accordingly,
            # ensuring the image appears correctly oriented even in viewers that ignore the tag.
            # This should be done *before* resizing or other transformations.
            try:
                logger.debug("Applying EXIF orientation correction (ImageOps.exif_transpose)...")
                img_oriented: Image.Image = ImageOps.exif_transpose(img_processed)
                # Check if transpose actually returned a new object or changed dimensions
                if img_oriented is not img_processed or img_oriented.size != img_processed.size:
                    logger.info(f"Applied EXIF orientation correction to '{file_path.name}'. "
                                f"Original Dims: {img_processed.size}, Corrected Dims: {img_oriented.size}")
                    img_processed = img_oriented # Update working copy
                else:
                    logger.debug("No EXIF orientation correction needed or applied.")
            except Exception as transpose_e:
                # Log warning but continue processing with potentially incorrect orientation.
                # This allows processing images with corrupt orientation tags if possible.
                logger.warning(f"Could not apply EXIF transpose to '{file_path.name}': {transpose_e}. "
                               f"Processing with current orientation.", exc_info=False)

            # 2. Ensure Consistent Color Mode (RGB/RGBA)
            # Rationale: Different operations (like saving JPEG) require specific color modes.
            # Converting to RGB (no alpha) or RGBA (with alpha) upfront simplifies saving logic
            # and prevents errors. Preserve alpha channel if present in the original.
            # Check common modes indicating potential transparency ('A' in mode string, 'P' with transparency info).
            has_alpha: bool = 'A' in img_processed.mode or \
                              ('P' in img_processed.mode and 'transparency' in img_processed.info)
            target_mode: str = "RGBA" if has_alpha else "RGB"
            logger.debug(f"Determined target color mode based on original ({img_processed.mode}, alpha={has_alpha}): {target_mode}")

            # Convert only if necessary to avoid redundant operations.
            if img_processed.mode != target_mode:
                logger.debug(f"Converting image mode from {img_processed.mode} to {target_mode} for consistent processing.")
                try:
                    img_processed = img_processed.convert(target_mode)
                    logger.debug(f"Successfully converted image mode to {img_processed.mode}.")
                except Exception as convert_e:
                    # If mode conversion fails, we likely cannot proceed reliably with saving.
                    logger.error(f"{config.PREFIX_ERROR}Failed to convert image mode for '{file_path.name}'. "
                                 f"Error: {convert_e}. Skipping further processing for this file.", exc_info=True)
                    return # Exit processing for this specific file.

            # 3. Prepare RGB-only version for JPEG Saving
            # Rationale: JPEG format does not support alpha transparency. Saving an RGBA image
            # directly as JPEG can lead to errors or unexpected results (Pillow might blend
            # against black by default). We create an explicit RGB version for JPEGs.
            img_for_jpeg: Optional[Image.Image] = None
            if global_choices.get("generate_jpg", True): # Only needed if JPGs are being generated
                if img_processed.mode == "RGBA":
                    logger.debug("Creating RGB version (discarding alpha) specifically for JPEG saving.")
                    try:
                        # When converting RGBA->RGB, Pillow blends against a default black background.
                        # If a white background is desired (common for web JPEGs from PNGs):
                        # bg = Image.new("RGB", img_processed.size, (255, 255, 255))
                        # bg.paste(img_processed, mask=img_processed.split()[3]) # 3 is the alpha channel index
                        # img_for_jpeg = bg
                        # For now, use Pillow's default blend-to-black:
                        img_for_jpeg = img_processed.convert("RGB")
                        logger.debug("Successfully created RGB version for JPEG.")
                    except Exception as rgb_convert_e:
                        logger.error(f"{config.PREFIX_ERROR}Failed to create RGB version for JPEG saving: {rgb_convert_e}. "
                                     f"Skipping ALL JPEG outputs for '{file_path.name}'.", exc_info=True)
                        # If this fails, we cannot generate JPEGs for this image.
                        # Allow processing to continue for WebP if applicable.
                        img_for_jpeg = None # Mark as unavailable
                else:
                    # If already RGB (or another mode convertible implicitly by save), use the processed image directly.
                    # Make a copy if we might modify it later (e.g., for compressed resize).
                    # Since compressed might resize, we'll make the copy later if needed. For optimized JPEG, this is fine.
                    img_for_jpeg = img_processed # Use the main processed image if it's already suitable

            # --- EXIF Handling ---
            # Get original EXIF data (as bytes) from the initially loaded image's info dictionary.
            # It's crucial to get this from the *original* 'img' object before any processing/copying
            # might inadvertently discard or alter the 'info' dictionary.
            exif_bytes_original: Optional[bytes] = img.info.get("exif")
            # Determine the user's chosen EXIF handling option from global choices. Default to 'keep'.
            exif_option: str = global_choices.get("exif_option", "keep")
            # Process the EXIF bytes based on the chosen option using the helper function.
            # The result might be the original bytes, modified bytes, or None (for strip_all or errors).
            logger.debug(f"Processing EXIF data with option: '{exif_option}'")
            processed_exif_bytes: Optional[bytes] = _strip_selected_exif(exif_bytes_original, exif_option)
            if exif_bytes_original and processed_exif_bytes is None:
                 logger.info(f"EXIF data will be stripped for '{file_path.name}' based on option '{exif_option}' or fallback.")
            elif processed_exif_bytes == exif_bytes_original:
                 logger.debug(f"Original EXIF data retained for '{file_path.name}'.")
            else:
                 logger.info(f"EXIF data partially stripped for '{file_path.name}'.")

            # --- Define Output Paths ---
            # Construct the paths to the various output folders using constants from config.py
            # and the provided output_base_folder.
            opt_folder_jpg: Path = output_base_folder / config.FOLDER_NAMES['optimized'] / config.FOLDER_NAMES['optimized_jpg']
            opt_folder_webp: Path = output_base_folder / config.FOLDER_NAMES['optimized'] / config.FOLDER_NAMES['optimized_webp']
            comp_folder_jpg: Path = output_base_folder / config.FOLDER_NAMES['compressed'] / config.FOLDER_NAMES['compressed_jpg']
            comp_folder_webp: Path = output_base_folder / config.FOLDER_NAMES['compressed'] / config.FOLDER_NAMES['compressed_webp']
            # Use the original file stem for the output filename basis. Renaming happens later.
            output_file_stem: str = file_path.stem

            # =====================================
            # --- Generate & Save Optimized Files ---
            # =====================================
            # Check if Optimized generation is enabled (currently always true if processing occurs, but allows future flag).
            # The 'generate_high_quality' flag from ui primarily controls the 'Export' folder,
            # while 'generate_optimized' would control this section if made optional. Assume True for now.
            if global_choices.get("generate_optimized", True): # Placeholder for potential future flag
                logger.debug(f"{action_prefix}Processing Optimized versions (Quality: {config.OPTIMIZED_QUALITY})...")
                opt_quality: int = config.OPTIMIZED_QUALITY # Get quality target from config.

                # --- Save Optimized JPG ---
                if global_choices.get("generate_jpg", True):
                    if img_for_jpeg: # Check if we successfully prepared an RGB version
                        # Define the full output path. Change extension to .jpg.
                        opt_jpg_path: Path = opt_folder_jpg / f"{output_file_stem}.jpg"
                        logger.debug(f"{action_prefix}Target path for Optimized JPG: '{opt_jpg_path}'")

                        if dry_run:
                            # Log the intention without saving. Include quality and EXIF status.
                            exif_status = "stripped" if processed_exif_bytes is None else "kept/modified"
                            logger.info(f"{config.PREFIX_DRYRUN}Would save Optimized JPG: '{opt_jpg_path.name}' "
                                        f"(Quality: {opt_quality}, EXIF: {exif_status})")
                        else:
                            # --- Actual Save Operation ---
                            try:
                                # Ensure the target directory exists (should have been created by filesystem module).
                                # Use exist_ok=True for safety.
                                opt_jpg_path.parent.mkdir(parents=True, exist_ok=True)

                                # Save the RGB version (`img_for_jpeg`).
                                # optimize=True: Enables extra passes to find optimal Huffman tables (smaller file size). Recommended.
                                # quality=: Standard JPEG quality setting (1-100).
                                # exif=processed_exif_bytes: Embeds the processed EXIF data (or None if stripped).
                                img_for_jpeg.save(
                                    opt_jpg_path,
                                    format="JPEG",
                                    quality=opt_quality,
                                    optimize=True,
                                    exif=processed_exif_bytes
                                )
                                logger.info(f"Saved Optimized JPG: '{opt_jpg_path.name}' (Quality: {opt_quality})")
                            except Exception as e_save_opt_jpg:
                                logger.error(f"{config.PREFIX_ERROR}Failed to save Optimized JPG for '{file_path.name}' to "
                                             f"'{opt_jpg_path}'. Error: {e_save_opt_jpg}", exc_info=True)
                    else:
                         logger.warning(f"Skipping Optimized JPG for '{file_path.name}' because RGB conversion failed earlier.")

                # --- Save Optimized WebP ---
                if global_choices.get("generate_webp", True):
                    # Define the full output path. Change extension to .webp.
                    opt_webp_path: Path = opt_folder_webp / f"{output_file_stem}.webp"
                    logger.debug(f"{action_prefix}Target path for Optimized WebP: '{opt_webp_path}'")

                    if dry_run:
                        # Log the intention. Note: Pillow's WebP doesn't reliably save EXIF, so don't mention it misleadingly.
                        logger.info(f"{config.PREFIX_DRYRUN}Would save Optimized WebP: '{opt_webp_path.name}' "
                                    f"(Quality: {opt_quality}, Lossy)")
                    else:
                        # --- Actual Save Operation ---
                        try:
                            # Ensure the target directory exists.
                            opt_webp_path.parent.mkdir(parents=True, exist_ok=True)

                            # Save the potentially RGBA image (`img_processed`). WebP supports transparency.
                            # lossless=False: Use lossy compression (adjusts based on quality). Set True for lossless.
                            # quality=: Controls lossy compression level (0-100). Higher is better/larger.
                            # method=6: Preset for encoding effort/speed tradeoff (0=fast, 6=slowest/best compression). Use 6 for quality.
                            # alpha_quality=100: Ensure alpha channel is compressed losslessly if present.
                            # IMPORTANT CAVEAT: Pillow's built-in WebP saver may *not* preserve EXIF metadata reliably.
                            # If preserving EXIF in WebP is critical, external tools (`cwebp`) or different libraries might be needed.
                            img_processed.save(
                                opt_webp_path,
                                format="WEBP",
                                quality=opt_quality,
                                lossless=False,
                                method=6,
                                alpha_quality=100 # Ensure alpha isn't overly compressed if present
                                # exif=processed_exif_bytes # Typically ignored by Pillow's WebP save
                            )
                            logger.info(f"Saved Optimized WebP: '{opt_webp_path.name}' (Quality: {opt_quality})")
                        except Exception as e_save_opt_webp:
                            logger.error(f"{config.PREFIX_ERROR}Failed to save Optimized WebP for '{file_path.name}' to "
                                         f"'{opt_webp_path}'. Error: {e_save_opt_webp}", exc_info=True)
            else:
                 logger.debug(f"Skipping Optimized file generation for '{file_path.name}' as per configuration (generate_optimized=False).") # Should not happen with current logic

            # ======================================
            # --- Generate & Save Compressed Files ---
            # ======================================
            # Check if Compressed generation is enabled via global choices.
            if global_choices.get("generate_low_quality", True):
                logger.debug(f"{action_prefix}Processing Compressed versions (Target Pixels: {config.COMPRESSED_TARGET_PIXELS})...")

                # --- Resizing Logic ---
                # Work on a *fresh copy* of the orientation-corrected, mode-converted image.
                # This is important because resizing is destructive and shouldn't affect the original `img_processed`
                # which might still be needed (e.g., if only compressed WebP is generated).
                img_low: Image.Image = img_processed.copy()
                w, h = img_low.size
                current_pixels: int = w * h
                target_pixels: int = config.COMPRESSED_TARGET_PIXELS
                resized_dimensions: Tuple[int, int] = (w, h) # Default to original size if no resize needed
                needs_resize: bool = current_pixels > target_pixels

                if needs_resize:
                    # Calculate scaling factor based on the ratio of target pixels to current pixels (area).
                    # Use sqrt because dimensions scale linearly with the sqrt of the area factor.
                    scale_factor: float = math.sqrt(target_pixels / current_pixels)
                    # Calculate new dimensions, ensuring they are at least 1 pixel each.
                    new_w: int = max(1, int(w * scale_factor))
                    new_h: int = max(1, int(h * scale_factor))
                    resized_dimensions = (new_w, new_h)
                    logger.debug(f"Resize needed for compressed version. Original: {(w,h)}, Target Area: {target_pixels}px, "
                                 f"Calculated Target Dims: {resized_dimensions}")

                    # --- Perform Resize (only if not dry run) ---
                    if not dry_run:
                        try:
                            # Use LANCZOS resampling filter: Generally considered the highest quality for downscaling,
                            # though computationally more expensive than BICUBIC or BILINEAR. Prioritize quality here.
                            logger.debug(f"Performing resize to {resized_dimensions} using LANCZOS filter...")
                            img_low = img_low.resize(resized_dimensions, Image.Resampling.LANCZOS)
                            logger.info(f"Resized image for compression to {img_low.size}.")
                        except Exception as resize_e:
                            logger.error(f"{config.PREFIX_ERROR}Failed to resize image '{file_path.name}' for compression. "
                                         f"Error: {resize_e}. Using original size for compression attempt.", exc_info=True)
                            # Fallback: use the unresized (but oriented/mode-converted) image copy for compression.
                            img_low = img_processed.copy() # Recopy from the original processed state
                            resized_dimensions = (w,h) # Reset dimensions for logging consistency below
                    else:
                        # Log intended resize action even in dry run.
                        logger.info(f"{config.PREFIX_DRYRUN}Would resize image from {(w,h)} to {resized_dimensions} for compressed version.")
                else:
                    # Log that no resize was needed.
                    logger.debug(f"{action_prefix}Image is already at or below target pixel count ({target_pixels}px). "
                                 f"No resize needed for compressed version.")

                # --- Prepare for Saving Compressed ---
                # Create RGB version of the (potentially resized) image for JPEG saving
                # and for the adaptive quality calculation (which needs grayscale).
                img_low_for_jpeg: Optional[Image.Image] = None
                if global_choices.get("generate_jpg", True): # Only needed if generating compressed JPGs
                    if img_low.mode == "RGBA":
                        logger.debug("Creating RGB version of compressed image for JPEG saving.")
                        try:
                            # Use default blend-to-black or implement white background paste if needed.
                            img_low_for_jpeg = img_low.convert("RGB")
                        except Exception as rgb_low_e:
                            logger.error(f"{config.PREFIX_ERROR}Failed to create RGB version for compressed JPEG saving: {rgb_low_e}. "
                                         f"Skipping compressed JPEG for '{file_path.name}'.", exc_info=True)
                            img_low_for_jpeg = None # Mark as unavailable
                    else:
                        # If already RGB or similar, use it directly.
                        img_low_for_jpeg = img_low

                # Calculate adaptive quality using the (potentially resized) image.
                # Use the RGB version for consistency in luminance calculation.
                # If RGB conversion failed, use the base quality.
                comp_quality: int
                base_comp_quality: int = config.COMPRESSED_QUALITY_BASE
                logger.debug(f"Calculating adaptive quality for compressed version (Base Quality: {base_comp_quality})...")
                if img_low_for_jpeg: # Use the RGB version if available
                     comp_quality = _compute_adaptive_quality(img_low_for_jpeg, base_comp_quality)
                elif img_low.mode != "RGBA": # If original wasn't RGBA, try calculating on img_low itself
                     comp_quality = _compute_adaptive_quality(img_low, base_comp_quality)
                else: # If original was RGBA and RGB conversion failed
                     logger.warning("Cannot compute adaptive quality for compressed image as RGB conversion failed. Using base quality.")
                     comp_quality = base_comp_quality


                # --- Save Compressed JPG ---
                if global_choices.get("generate_jpg", True):
                    if img_low_for_jpeg: # Check if we successfully prepared an RGB version
                        comp_jpg_path: Path = comp_folder_jpg / f"{output_file_stem}.jpg"
                        logger.debug(f"{action_prefix}Target path for Compressed JPG: '{comp_jpg_path}'")

                        if dry_run:
                            exif_status = "stripped" if processed_exif_bytes is None else "kept/modified"
                            logger.info(f"{config.PREFIX_DRYRUN}Would save Compressed JPG: '{comp_jpg_path.name}' "
                                        f"(Target Size: {resized_dimensions}, Adaptive Quality: ~{comp_quality}, EXIF: {exif_status})")
                        else:
                            # --- Actual Save Operation ---
                            try:
                                comp_jpg_path.parent.mkdir(parents=True, exist_ok=True)
                                # Save the (potentially resized) RGB image using adaptive quality.
                                img_low_for_jpeg.save(
                                    comp_jpg_path,
                                    format="JPEG",
                                    quality=comp_quality,
                                    optimize=True,
                                    exif=processed_exif_bytes
                                )
                                logger.info(f"Saved Compressed JPG: '{comp_jpg_path.name}' "
                                            f"(Size: {img_low_for_jpeg.size}, Quality: {comp_quality})")
                            except Exception as e_save_comp_jpg:
                                logger.error(f"{config.PREFIX_ERROR}Failed to save Compressed JPG for '{file_path.name}' to "
                                             f"'{comp_jpg_path}'. Error: {e_save_comp_jpg}", exc_info=True)
                    else:
                         logger.warning(f"Skipping Compressed JPG for '{file_path.name}' because RGB conversion failed earlier.")


                # --- Save Compressed WebP ---
                if global_choices.get("generate_webp", True):
                    comp_webp_path: Path = comp_folder_webp / f"{output_file_stem}.webp"
                    logger.debug(f"{action_prefix}Target path for Compressed WebP: '{comp_webp_path}'")

                    if dry_run:
                        logger.info(f"{config.PREFIX_DRYRUN}Would save Compressed WebP: '{comp_webp_path.name}' "
                                    f"(Target Size: {resized_dimensions}, Adaptive Quality: ~{comp_quality}, Lossy)")
                    else:
                        # --- Actual Save Operation ---
                        try:
                            comp_webp_path.parent.mkdir(parents=True, exist_ok=True)
                            # Save the (potentially resized) RGBA/RGB image using adaptive quality.
                            img_low.save(
                                comp_webp_path,
                                format="WEBP",
                                quality=comp_quality,
                                lossless=False,
                                method=6, # Use slowest method for best compression
                                alpha_quality=100
                                # exif=processed_exif_bytes # Ignored
                            )
                            logger.info(f"Saved Compressed WebP: '{comp_webp_path.name}' "
                                        f"(Size: {img_low.size}, Quality: {comp_quality})")
                        except Exception as e_save_comp_webp:
                            logger.error(f"{config.PREFIX_ERROR}Failed to save Compressed WebP for '{file_path.name}' to "
                                         f"'{comp_webp_path}'. Error: {e_save_comp_webp}", exc_info=True)
            else:
                logger.debug(f"Skipping Compressed file generation for '{file_path.name}' as per configuration (generate_low_quality=False).")

            # --- Log Completion for Image ---
            logger.info(f"{action_prefix}Finished processing variants for: '{file_path.name}'")

    # --- Error Handling for File Load / Initial Processing ---
    except FileNotFoundError:
        # If the source image file doesn't exist when Image.open() is called.
        logger.error(f"{config.PREFIX_ERROR}Source image file not found: '{file_path}'. Skipping.")
        # No need to re-raise, just skip this file by returning.
        return
    except UnidentifiedImageError:
        # If Pillow cannot identify the file format (e.g., corrupt file, unsupported type).
        logger.error(f"{config.PREFIX_ERROR}Cannot identify image file (possibly corrupt or unsupported format): '{file_path.name}'. Skipping.")
        # Skip this file.
        return
    except Exception as e_load:
        # Catch any other unexpected errors during the loading or initial pre-processing phase.
        logger.error(f"{config.PREFIX_ERROR}Unexpected critical error processing image '{file_path.name}' during load/prep. Error: {e_load}", exc_info=True)
        # Re-raise unexpected errors so they are caught by the main loop's error handling
        # for the ProcessPoolExecutor, allowing it to count as a processing error.
        raise

# --- END: image_processing.py (Rewritten from Scratch) ---