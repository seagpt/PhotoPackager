#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import math
import logging
from pathlib import Path
from typing import Optional, Tuple, List
import sys
import threading

def dual_log(message: str, output_base_folder: Optional[Path] = None):
    print(message)
    if output_base_folder:
        try:
            log_path = output_base_folder / 'photopackager_run.log'
            with threading.Lock():
                with open(log_path, 'a', encoding='utf-8') as f:
                    f.write(message + '\n')
        except Exception as e:
            print(f'[LOGGING ERROR] Could not write to log file: {e}', file=sys.stderr)


try:
    from PIL import Image, ImageStat, ImageOps, UnidentifiedImageError

    Image.MAX_IMAGE_PIXELS = None
    PILLOW_AVAILABLE = True
    logger_pillow = logging.getLogger(__name__ + ".pillow")
    logger_pillow.debug("Pillow library successfully imported and configured.")
except ImportError:
    PILLOW_AVAILABLE = False
    logger_pillow = logging.getLogger(__name__ + ".pillow")
    print(
        "CRITICAL ERROR: Pillow (PIL) library not found. PhotoPackager cannot perform image processing."
    )
    logger_pillow.critical("Pillow library import failed!")
try:
    import piexif

    PIEXIF_AVAILABLE = True
    logger_piexif = logging.getLogger(__name__ + ".piexif")
except ImportError:
    PIEXIF_AVAILABLE = False
    logger_piexif = logging.getLogger(__name__ + ".piexif")
    logger_piexif.warning(
        "Optional 'piexif' library not found. Partial EXIF removal ('date', 'camera', 'both') will fallback to 'strip_all' if selected."
    )
try:
    import config
except ImportError:
    print(
        "CRITICAL ERROR: Failed to import 'config' module in image_processing.py. Cannot proceed."
    )
    exit(1)
logger = logging.getLogger(__name__)

# ----------------------------------------
# --- Private Helper Functions ---
# ----------------------------------------
# These functions support the main process_image logic but are not intended
# for direct use outside this module (indicated by leading underscore).


def _compute_adaptive_quality(image: Image.Image, base_quality: int) -> int:
    """
    Compute an adaptive JPEG/WebP quality value based on image luminance complexity.

    Args:
        image (Image.Image): The Pillow image object.
        base_quality (int): The base quality value to start from.
    Returns:
        int: The computed (possibly adjusted) quality value.
    """
    if not image:
        logger.warning(
            "Cannot compute adaptive quality: Invalid image object provided."
        )
        return base_quality
    try:
        grayscale_img = image.copy().convert("L")
        stat = ImageStat.Stat(grayscale_img)
        stddev: float = 50.0
        if stat.stddev and stat.stddev[0] is not None:
            stddev = stat.stddev[0]
        logger.debug(
            f"Adaptive Quality Analysis: Image luminance std dev = {stddev:.2f}"
        )
        quality_offset: int = 0
        if stddev < 30:
            quality_offset = -10
            logger.debug(
                "Adaptive Quality: Low complexity detected, applying offset -10."
            )
        elif stddev > 60:
            quality_offset = 5
        final_quality = max(30, min(95, base_quality + quality_offset))
        logger.debug(
            f"Final adaptive quality set to {final_quality} (base {base_quality}, offset {quality_offset})"
        )
        logger.info(
            f"Adaptive Quality Calculated: Base={base_quality}, StdDev={stddev:.2f}, Final Clamped Quality={final_quality}"
        )
        return final_quality
    except Exception as e:
        logger.warning(
            f"Could not compute adaptive quality due to error: {e}. Using base quality {base_quality} instead.",
            exc_info=False,
        )
        return base_quality


def _strip_selected_exif(
    exif_bytes: Optional[bytes], exif_option: str
) -> Optional[bytes]:
    """
    Strip or selectively remove EXIF data according to the chosen option.

    Args:
        exif_bytes (Optional[bytes]): The original EXIF data bytes.
        exif_option (str): One of 'keep', 'strip_all', 'date', 'camera', or 'both'.
    Returns:
        Optional[bytes]: The modified EXIF data bytes, or None if all EXIF is stripped.
    """
    if not exif_bytes:
        return None
    if exif_option == "keep":
        return exif_bytes
    if exif_option == "strip_all":
        return None

    # For 'date'/'camera'/'both' options, we need the piexif library to selectively modify EXIF
    if not PIEXIF_AVAILABLE:
        logger_piexif.warning(
            f"Cannot selectively strip EXIF with option '{exif_option}': piexif library not available. "
            f"Stripping all EXIF as fallback."
        )
        return None

    try:
        # Parse the EXIF data into a dictionary structure for manipulation
        exif_dict = piexif.load(exif_bytes)
        modified = False

        # Map options to the EXIF tag groups to remove
        remove_tags = {
            "date": ["0th", "Exif"],  # Remove date info from 0th and Exif IFDs
            "camera": ["0th"],  # Camera info is mostly in the 0th IFD
            "both": ["0th", "Exif"],  # Both date and camera info in these IFDs
        }

        # Date-specific tags (to be removed selectively for 'date' and 'both' options)
        date_tags = {
            "0th": [piexif.ImageIFD.DateTime],
            "Exif": [
                piexif.ExifIFD.DateTimeOriginal,
                piexif.ExifIFD.DateTimeDigitized,
                piexif.ExifIFD.SubSecTime,
                piexif.ExifIFD.SubSecTimeOriginal,
                piexif.ExifIFD.SubSecTimeDigitized,
            ],
        }

        # Camera-specific tags (to be removed selectively for 'camera' and 'both' options)
        camera_tags = {
            "0th": [
                piexif.ImageIFD.Make,
                piexif.ImageIFD.Model,
                piexif.ImageIFD.Software,
                piexif.ImageIFD.ProcessingSoftware,
            ]
        }

        # Selectively remove tags based on the exif_option
        for ifd_name in remove_tags.get(exif_option, []):
            if ifd_name in exif_dict:
                if exif_option in ["date", "both"]:
                    # For date-related tags, only remove specific date tags
                    for tag in date_tags.get(ifd_name, []):
                        if tag in exif_dict[ifd_name]:
                            del exif_dict[ifd_name][tag]
                            modified = True
                            logger_piexif.debug(
                                f"Removed date-related tag {tag} from IFD '{ifd_name}'"
                            )

                if exif_option in ["camera", "both"]:
                    # For camera-related tags, only remove specific camera tags
                    for tag in camera_tags.get(ifd_name, []):
                        if tag in exif_dict[ifd_name]:
                            del exif_dict[ifd_name][tag]
                            modified = True
                            logger_piexif.debug(
                                f"Removed camera-related tag {tag} from IFD '{ifd_name}'"
                            )

        if modified:
            try:
                # Convert the modified EXIF dictionary back to bytes
                processed_exif = piexif.dump(exif_dict)
                logger_piexif.debug(
                    f"Successfully stripped selected EXIF data as per option '{exif_option}'"
                )
                return processed_exif
            except Exception as dump_e:
                logger_piexif.error(
                    f"piexif failed to dump modified EXIF dict: {dump_e}. "
                    f"Stripping all EXIF as fallback.",
                    exc_info=True,
                )
                # Fallback behavior: Strip all EXIF if dumping fails.
                return None
        else:
            # If no targeted tags were found or removed for the selected option.
            logger_piexif.debug(
                f"No targeted EXIF tags found/removed for option '{exif_option}'. "
                f"Returning original EXIF data."
            )
            return exif_bytes

    except Exception as e:
        logger_piexif.error(
            f"Error while attempting selective EXIF processing: {e}. "
            f"Stripping all EXIF as fallback.",
            exc_info=True,
        )
        return None


# ----------------------------------------
# --- Main Image Processing Function ---
# ----------------------------------------

def process_image(
    file_path: Path,
    output_base_folder: Path,
    global_choices,
    dry_run: bool = False,
) -> None:
    """
    Process a single image file: load, correct orientation, convert color mode, handle EXIF stripping,
    and generate optimized/compressed versions (JPG and/or WebP) as configured.

    If `dry_run` is True, simulates all processing steps and logs intended save
    actions without actually writing any output files to disk.

    Args:
        file_path (Path): Absolute path to the source image file to process.
        output_base_folder (Path): The root output directory for the current shoot
                                   (e.g., /path/to/output/ClientA_Wedding).
        global_choices (dict): Dictionary containing global processing
                                options selected by the user or via CLI,
                                such as 'generate_jpg', 'generate_webp',
                                'skip_compressed', 'exif_option'.
        dry_run (bool): If True, simulate processing and log intent without
                        saving output files. Defaults to False.

    Returns:
        None: Results are saved to disk (or simulated in dry run). Errors are logged.
    """
    # --- Initial Setup & Logging ---
    # Determine log prefix based on dry_run status for clarity in logs.
    action_prefix = config.PREFIX_DRYRUN if dry_run else ""
    logger.info(f"{action_prefix}Starting processing for Image: '{file_path.name}'")
    
    # --- Debugging: Log global_choices ---
    print(f"[DEBUG] Processing: {file_path.name}")
    print(f"[DEBUG] Output base: {output_base_folder}")
    print(f"[DEBUG] Global choices: {global_choices}")
    print(f"[DEBUG] Dry run: {dry_run}")
    
    # --- Defensive Check: Pillow Availability ---
    if not PILLOW_AVAILABLE:
        logger.critical(f"Cannot process '{file_path.name}': Pillow library is not available.")
        return
    
    # Create log file
    try:
        log_path = output_base_folder / 'photopackager_run.log'
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"\n[{file_path.name}] Processing started\n")
            f.write(f"global_choices: {global_choices}\n")
            f.write(f"dry_run: {dry_run}\n")
    except Exception as log_e:
        print(f"[ERROR] Failed to write to log: {log_e}")
    
    # Add extensive debug output to help diagnose issues
    logger.info("=" * 50)
    logger.info(f"DIAGNOSTIC: Processing image: {file_path}")
    logger.info(f"DIAGNOSTIC: Output base folder: {output_base_folder}")
    logger.info("DIAGNOSTIC: Settings (global_choices):")
    for key, value in global_choices.items():
        logger.info(f"  - {key}: {value}")
    logger.info(f"DIAGNOSTIC: generate_jpg: {global_choices.get('generate_jpg', False)}")
    logger.info(f"DIAGNOSTIC: generate_webp: {global_choices.get('generate_webp', False)}")
    logger.info(f"DIAGNOSTIC: generate_compressed_jpg: {global_choices.get('generate_compressed_jpg', False)}")
    logger.info(f"DIAGNOSTIC: generate_compressed_webp: {global_choices.get('generate_compressed_webp', False)}")
    logger.info(f"DIAGNOSTIC: dry_run: {dry_run}")
    # Confirm fix for user
    logger.info("DIAGNOSTIC: If generate_compressed_jpg or generate_compressed_webp are True, the corresponding images should be created!")

    # --- Configuration Validation ---
    logger.info(f"Processing '{file_path.name}': " 
              f"JPG={'Yes' if global_choices.get('generate_jpg', True) else 'No'}, "
              f"WebP={'Yes' if global_choices.get('generate_webp', True) else 'No'}, "
              f"Compressed={'Yes' if not global_choices.get('skip_compressed', False) else 'No'}")
    
    if not (global_choices.get('generate_jpg', True) or global_choices.get('generate_webp', True)):
        logger.warning(f"No output formats enabled for '{file_path.name}'. Skipping processing.")
        return
    
    # ... (rest of the code remains the same)
    # Get subfolder paths from config
    try:
        opt_folder_jpg = output_base_folder / config.FOLDER_NAMES["optimized"] / config.FOLDER_NAMES["optimized_jpg"]
        opt_folder_webp = output_base_folder / config.FOLDER_NAMES["optimized"] / config.FOLDER_NAMES["optimized_webp"]
        comp_folder_jpg = output_base_folder / config.FOLDER_NAMES["compressed"] / config.FOLDER_NAMES["compressed_jpg"]
        comp_folder_webp = output_base_folder / config.FOLDER_NAMES["compressed"] / config.FOLDER_NAMES["compressed_webp"]
    except (KeyError, AttributeError) as e:
        logger.error(f"Config error when building output paths: {e}. Cannot continue processing.")
        return
    
    # --- Define output_file_stem for output filenames ---
    output_file_stem = file_path.stem

    # --- Image Loading Phase ---
    try:
        with Image.open(file_path) as img:
            # Record original properties for logging and comparison
            original_size = img.size
            original_mode = img.mode
            logger.debug(f"Opened '{file_path.name}'. Original Size={original_size}, Mode={original_mode}")
            
            # Make a working copy of the image
            img_processed = img.copy()
            
            # --- Apply EXIF orientation correction if present ---
            try:
                img_oriented = ImageOps.exif_transpose(img_processed)
                if img_oriented is not img_processed or img_oriented.size != img_processed.size:
                    logger.info(f"Applied EXIF orientation correction to '{file_path.name}'. "
                               f"Original Dims: {img_processed.size}, Corrected Dims: {img_oriented.size}")
                    img_processed = img_oriented
                else:
                    logger.debug("No EXIF orientation correction needed or applied.")
            except Exception as transpose_e:
                logger.warning(
                    f"Could not apply EXIF transpose to '{file_path.name}': {transpose_e}. "
                    f"Processing with current orientation.",
                    exc_info=False
                )
            
            # --- Check for alpha channel ---
            has_alpha = "A" in img_processed.mode or (
                "P" in img_processed.mode and "transparency" in img_processed.info
            )
            
            # --- Color Mode Conversion ---
            target_mode = "RGBA" if has_alpha else "RGB"
            logger.debug(f"Target color mode based on original ({img_processed.mode}, alpha={has_alpha}): {target_mode}")
            
            if img_processed.mode != target_mode:
                logger.debug(f"Converting mode from {img_processed.mode} to {target_mode}")
                try:
                    img_processed = img_processed.convert(target_mode)
                    logger.debug(f"Successfully converted image mode to {img_processed.mode}.")
                except Exception as convert_e:
                    logger.error(
                        f"{config.PREFIX_ERROR}Failed to convert image mode for '{file_path.name}'. "
                        f"Error: {convert_e}. Skipping further processing for this file.",
                        exc_info=True
                    )
                    return
            
            # --- Setup for JPEG processing ---
            # For JPEG output, we need an RGB image (no alpha)
            img_for_jpeg = None
            if global_choices.get("generate_jpg", True) and has_alpha:
                try:
                    # Create a white background for alpha images when saving to JPG
                    white_bg = Image.new("RGB", img_processed.size, (255, 255, 255))
                    if has_alpha:
                        # Composite the transparent image onto white background
                        img_for_jpeg = Image.alpha_composite(white_bg.convert("RGBA"), img_processed)
                        img_for_jpeg = img_for_jpeg.convert("RGB")
                    else:
                        img_for_jpeg = img_processed.convert("RGB")
                    logger.debug(
                        f"Created RGB version of '{file_path.name}' for JPG output. "
                        f"Result mode: {img_for_jpeg.mode}"
                    )
                except Exception as rgb_conversion_e:
                    logger.error(
                        f"{config.PREFIX_ERROR}Failed to create RGB version for JPG output: {rgb_conversion_e}. "
                        f"JPG output will be skipped.",
                        exc_info=True
                    )
            else:
                # No alpha channel, can use the processed image directly for JPG
                img_for_jpeg = img_processed if not has_alpha else None
            
            # --- EXIF Processing ---
            # Handle EXIF data according to user preference (strip, keep, or selectively modify)
            exif_option = global_choices.get("exif_option", "keep")
            processed_exif_bytes = None
            
            try:
                exif_bytes = getattr(img, "info", {}).get("exif", None)
                if exif_bytes:
                    logger.debug(f"Image '{file_path.name}' has EXIF data. Processing according to option: {exif_option}")
                    processed_exif_bytes = _strip_selected_exif(exif_bytes, exif_option)
                else:
                    logger.debug(f"No EXIF data found in '{file_path.name}'.")
            except Exception as exif_e:
                logger.warning(
                    f"Error processing EXIF for '{file_path.name}': {exif_e}. "
                    f"EXIF will be stripped from outputs.",
                    exc_info=True
                )
                processed_exif_bytes = None
            
            # --- Generate Optimized Images ---
            # These are full-resolution, high-quality versions
            logger.debug(f"{action_prefix}Processing Optimized versions (Quality: {config.OPTIMIZED_QUALITY})...")
            opt_quality = config.OPTIMIZED_QUALITY
            
            # --- Generate Optimized JPG if enabled ---
            if global_choices.get("generate_jpg", True):
                if img_for_jpeg:
                    opt_jpg_path = opt_folder_jpg / f"{output_file_stem}.jpg"
                    logger.debug(f"{action_prefix}Target path for Optimized JPG: '{opt_jpg_path}'")
                    
                    if dry_run:
                        exif_status = "stripped" if processed_exif_bytes is None else "kept/modified"
                        logger.info(
                            f"{config.PREFIX_DRYRUN}Would save Optimized JPG: '{opt_jpg_path.name}' "
                            f"(Quality: {opt_quality}, EXIF: {exif_status})"
                        )
                    else:
                        try:
                            # Create directory if it doesn't exist
                            opt_jpg_path.parent.mkdir(parents=True, exist_ok=True)
                            
                            # Save the optimized JPG
                            img_for_jpeg.save(
                                opt_jpg_path,
                                format="JPEG",
                                quality=opt_quality,
                                optimize=True,
                                exif=processed_exif_bytes
                            )
                            logger.info(f"Saved Optimized JPG: '{opt_jpg_path.name}' (Quality: {opt_quality})")
                        except Exception as e_save_opt_jpg:
                            logger.error(
                                f"{config.PREFIX_ERROR}Failed to save Optimized JPG for '{file_path.name}' to "
                                f"'{opt_jpg_path}'. Error: {e_save_opt_jpg}",
                                exc_info=True
                            )
                            try:
                                from PySide6.QtWidgets import QApplication, QMessageBox
                                import sys
                                app = QApplication.instance() or QApplication(sys.argv)
                                QMessageBox.critical(None, "Image Save Error", f"Failed to save Optimized JPG for '{file_path.name}'. Pillow may be missing JPEG support.\n\nError: {e_save_opt_jpg}")
                            except Exception:
                                pass
                else:
                    logger.warning(
                        f"Skipping Optimized JPG for '{file_path.name}' because RGB conversion failed earlier."
                    )
            
            # --- Generate Optimized WebP if enabled ---
            if global_choices.get("generate_webp", True):
                opt_webp_path = opt_folder_webp / f"{output_file_stem}.webp"
                logger.debug(f"{action_prefix}Target path for Optimized WebP: '{opt_webp_path}'")
                
                if dry_run:
                    logger.info(
                        f"{config.PREFIX_DRYRUN}Would save Optimized WebP: '{opt_webp_path.name}' "
                        f"(Quality: {opt_quality}, Lossy)"
                    )
                else:
                    try:
                        # Create directory if it doesn't exist
                        opt_webp_path.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Save the optimized WebP
                        img_processed.save(
                            opt_webp_path,
                            format="WEBP",
                            quality=opt_quality,
                            lossless=False,
                            method=6,  # Use slowest method for best compression
                            alpha_quality=100
                            # exif=processed_exif_bytes # Typically ignored by Pillow's WebP save
                        )
                        logger.info(f"Saved Optimized WebP: '{opt_webp_path.name}' (Quality: {opt_quality})")
                    except Exception as e_save_opt_webp:
                        logger.error(
                            f"{config.PREFIX_ERROR}Failed to save Optimized WebP for '{file_path.name}' to "
                            f"'{opt_webp_path}'. Error: {e_save_opt_webp}",
                            exc_info=True
                        )
            
            # --- Generate Compressed versions if not disabled ---
            # First check if either compressed format is enabled
            generate_compressed_jpg = global_choices.get("generate_compressed_jpg", True)
            generate_compressed_webp = global_choices.get("generate_compressed_webp", True)
            # Legacy flag support
            if global_choices.get("skip_compressed", False):
                generate_compressed_jpg = False
                generate_compressed_webp = False
                
            if generate_compressed_jpg or generate_compressed_webp:
                logger.debug(f"{action_prefix}Processing Compressed versions...")
                
                # Calculate target dimensions while maintaining aspect ratio
                original_width, original_height = img_processed.size
                original_pixels = original_width * original_height
                target_pixels = config.COMPRESSED_TARGET_PIXELS
                
                # Only resize if the original is larger than our target
                if original_pixels > target_pixels:
                    scale_factor = math.sqrt(target_pixels / original_pixels)
                    new_width = int(original_width * scale_factor)
                    new_height = int(original_height * scale_factor)
                    
                    try:
                        # Resize using high-quality Lanczos resampling
                        img_low = img_processed.resize((new_width, new_height), Image.LANCZOS)
                        resized_dimensions = f"{new_width}x{new_height}"
                    except Exception as resize_e:
                        logger.error(
                            f"{config.PREFIX_ERROR}Failed to resize image for compressed output: {resize_e}. "
                            f"Using original size.",
                            exc_info=True
                        )
                        img_low = img_processed
                        resized_dimensions = f"{original_width}x{original_height} (original)"
                else:
                    # No need to resize, already smaller than target
                    img_low = img_processed
                    resized_dimensions = f"{original_width}x{original_height} (original)"
                
                # Calculate adaptive quality based on image content complexity
                comp_quality = _compute_adaptive_quality(img_low, config.COMPRESSED_QUALITY_BASE)
                logger.debug(f"Compressed quality set to {comp_quality} (base: {config.COMPRESSED_QUALITY_BASE})")
                
                # --- Save Compressed JPG ---
                if generate_compressed_jpg:
                    # Prepare JPEG version of the resized image
                    if has_alpha:
                        try:
                            # Create a white background for alpha images
                            white_bg_low = Image.new("RGB", img_low.size, (255, 255, 255))
                            img_low_jpg = Image.alpha_composite(white_bg_low.convert("RGBA"), img_low)
                            img_low_jpg = img_low_jpg.convert("RGB")
                        except Exception as comp_rgb_e:
                            logger.error(
                                f"{config.PREFIX_ERROR}Failed to prepare compressed JPG with alpha: {comp_rgb_e}. "
                                f"Skipping compressed JPG output.",
                                exc_info=True
                            )
                            img_low_jpg = None
                    else:
                        # No alpha, can use resized image directly
                        img_low_jpg = img_low.convert("RGB") if img_low.mode != "RGB" else img_low
                    
                    if img_low_jpg:
                        comp_jpg_path = comp_folder_jpg / f"{output_file_stem}.jpg"
                        logger.debug(f"{action_prefix}Target path for Compressed JPG: '{comp_jpg_path}'")
                        
                        if dry_run:
                            logger.info(
                                f"{config.PREFIX_DRYRUN}Would save Compressed JPG: '{comp_jpg_path.name}' "
                                f"(Target Size: {resized_dimensions}, Adaptive Quality: ~{comp_quality})"
                            )
                        else:
                            try:
                                # Create directory if it doesn't exist
                                comp_jpg_path.parent.mkdir(parents=True, exist_ok=True)
                                
                                # Save the compressed JPG
                                img_low_jpg.save(
                                    comp_jpg_path,
                                    format="JPEG",
                                    quality=comp_quality,
                                    optimize=True,
                                    exif=processed_exif_bytes
                                )
                                dual_log(f"[INFO] Saved Compressed JPG: {comp_jpg_path}", output_base_folder)
                                logger.info(
                                    f"Saved Compressed JPG: '{comp_jpg_path.name}' "
                                    f"(Size: {img_low_jpg.size}, Quality: {comp_quality})"
                                )
                            except Exception as e_save_comp_jpg:
                                logger.error(
                                    f"{config.PREFIX_ERROR}Failed to save Compressed JPG for '{file_path.name}': {e_save_comp_jpg}",
                                    exc_info=True
                                )
                                try:
                                    from PySide6.QtWidgets import QApplication, QMessageBox
                                    import sys
                                    app = QApplication.instance() or QApplication(sys.argv)
                                    QMessageBox.critical(None, "Image Save Error", f"Failed to save Compressed JPG for '{file_path.name}'. Pillow may be missing JPEG support.\n\nError: {e_save_comp_jpg}")
                                except Exception:
                                    pass
                
                # --- Save Compressed WebP ---
                if generate_compressed_webp:
                    comp_webp_path = comp_folder_webp / f"{output_file_stem}.webp"
                    logger.debug(f"{action_prefix}Target path for Compressed WebP: '{comp_webp_path}'")
                    
                    if dry_run:
                        logger.info(
                            f"{config.PREFIX_DRYRUN}Would save Compressed WebP: '{comp_webp_path.name}' "
                            f"(Target Size: {resized_dimensions}, Adaptive Quality: ~{comp_quality}, Lossy)"
                        )
                    else:
                        try:
                            # Create directory if it doesn't exist
                            comp_webp_path.parent.mkdir(parents=True, exist_ok=True)
                            
                            # Save the compressed WebP
                            img_low.save(
                                comp_webp_path,
                                format="WEBP",
                                quality=comp_quality,
                                lossless=False,
                                method=6,  # Use slowest method for best compression
                                alpha_quality=100
                                # exif=processed_exif_bytes # Ignored for WebP in Pillow
                            )
                            dual_log(f"[INFO] Saved Compressed WebP: {comp_webp_path}", output_base_folder)
                            logger.info(
                                f"Saved Compressed WebP: '{comp_webp_path.name}' "
                                f"(Size: {img_low.size}, Quality: {comp_quality})"
                            )
                        except Exception as e_save_comp_webp:
                            logger.error(
                                f"{config.PREFIX_ERROR}Failed to save Compressed WebP: {e_save_comp_webp}",
                                exc_info=True
                            )
                            try:
                                from PySide6.QtWidgets import QApplication, QMessageBox
                                import sys
                                app = QApplication.instance() or QApplication(sys.argv)
                                QMessageBox.critical(None, "Image Save Error", f"Failed to save Compressed WebP for '{file_path.name}'. Pillow may be missing WebP support.\n\nError: {e_save_comp_webp}")
                            except Exception:
                                pass
            else:
                logger.debug(f"Skipping Compressed file generation as per configuration.")
            
            # --- Log Completion ---
            logger.info(f"{action_prefix}Finished processing all variants for: '{file_path.name}'")
    
    except (FileNotFoundError, OSError, UnidentifiedImageError) as img_e:
        # Handle issues with file access or format identification
        logger.error(f"{config.PREFIX_ERROR}Error opening image '{file_path.name}': {img_e}. Skipping file.")
        return
    except Exception as unexpected_e:
        # Catch any other unexpected errors
        logger.error(
            f"{config.PREFIX_ERROR}Unexpected error processing '{file_path.name}': {unexpected_e}",
            exc_info=True
        )
        # Re-raise to be caught by the caller's error handling
        raise

# --- END: image_processing.py (Rewritten from Scratch) ---
