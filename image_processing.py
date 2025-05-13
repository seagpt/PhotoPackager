#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import math
import logging
from pathlib import Path
from typing import Optional, Tuple, List, Dict
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
            exc_info=True
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
) -> int:
    """
    Process a single image file: load, correct orientation, convert color mode, handle EXIF stripping,
    and generate optimized/compressed versions (JPG and/or WebP) as configured.

    If `dry_run` is True, simulates all processing steps and logs intended save
    actions without actually writing any output files to disk.

    Args:
        file_path (Path): Path to the source image file.
        output_base_folder (Path): Base directory for all generated output files.
        global_choices: An object or dictionary containing all processing choices/settings
                        (e.g., generate_jpg, generate_webp, exif_policy, quality settings, etc.).
        dry_run (bool): If True, simulates processing without writing files.

    Returns:
        int: The number of output files successfully generated and saved.
             Errors are logged.
    """
    if not PILLOW_AVAILABLE:
        logger.error(
            f"{config.PREFIX_ERROR}Pillow library not available. Cannot process image: {file_path.name}"
        )
        return 0

    logger.info(f"Processing image: '{file_path.name}' with dry_run={dry_run}")
    action_prefix = config.PREFIX_DRYRUN if dry_run else ""
    generated_count = 0

    try:
        with Image.open(file_path) as img:
            logger.debug(f"Opened image '{file_path.name}'. Original mode: {img.mode}, Original size: {img.size}")
            
            # --- Preserve original EXIF data early ---
            original_exif_bytes = img.info.get("exif")
            if original_exif_bytes:
                logger.debug(f"Original EXIF data captured for '{file_path.name}' ({len(original_exif_bytes)} bytes).")
            else:
                logger.debug(f"No EXIF data found in original image '{file_path.name}'.")

            # --- Apply EXIF Policy using _strip_selected_exif ---
            # The exif_policy should come from global_choices
            current_exif_policy = global_choices.get('exif_option', 'keep') # Default to 'keep', use 'exif_option' key
            logger.info(f"Applying EXIF policy: '{current_exif_policy}' for '{file_path.name}'.")
            processed_exif_bytes = _strip_selected_exif(original_exif_bytes, current_exif_policy)
            if processed_exif_bytes:
                logger.debug(f"EXIF data after processing with policy '{current_exif_policy}': {len(processed_exif_bytes)} bytes.")
            else:
                logger.debug(f"EXIF data stripped or no EXIF to process after policy '{current_exif_policy}'.")

            # --- Image Orientation Correction (EXIF-based) ---
            try:
                img = ImageOps.exif_transpose(img)
            except Exception as transpose_e:
                logger.warning(
                    f"Could not apply EXIF transpose to '{file_path.name}': {transpose_e}. "
                    f"Processing with current orientation.",
                    exc_info=False
                )
            
            # --- Check for alpha channel ---
            has_alpha = "A" in img.mode or (
                "P" in img.mode and "transparency" in img.info
            )
            
            # --- Color Mode Conversion ---
            target_mode = "RGBA" if has_alpha else "RGB"
            logger.debug(f"Target color mode based on original ({img.mode}, alpha={has_alpha}): {target_mode}")
            
            if img.mode != target_mode:
                logger.debug(f"Converting mode from {img.mode} to {target_mode}")
                try:
                    img = img.convert(target_mode)
                    logger.debug(f"Successfully converted image mode to {img.mode}.")
                except Exception as convert_e:
                    logger.error(
                        f"{config.PREFIX_ERROR}Failed to convert image mode for '{file_path.name}'. "
                        f"Error: {convert_e}. Skipping further processing for this file.",
                        exc_info=True
                    )
                    return generated_count
            
            # --- Setup for JPEG processing ---
            # For JPEG output, we need an RGB image (no alpha)
            img_for_jpeg = None
            if global_choices.get("generate_jpg", True) and has_alpha:
                try:
                    # Create a white background for alpha images when saving to JPG
                    white_bg = Image.new("RGB", img.size, (255, 255, 255))
                    if has_alpha:
                        # Composite the transparent image onto white background
                        img_for_jpeg = Image.alpha_composite(white_bg.convert("RGBA"), img)
                        img_for_jpeg = img_for_jpeg.convert("RGB")
                    else:
                        img_for_jpeg = img.convert("RGB")
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
                img_for_jpeg = img if not has_alpha else None
            
            # --- Generate Optimized Images ---
            # These are full-resolution, high-quality versions
            logger.debug(f"{action_prefix}Processing Optimized versions (Quality: {config.OPTIMIZED_QUALITY})...")
            opt_quality = config.OPTIMIZED_QUALITY
            
            # --- Generate Optimized JPG if enabled ---
            if global_choices.get("generate_jpg", True):
                if img_for_jpeg:
                    opt_jpg_path = output_base_folder / config.FOLDER_NAMES["optimized"] / config.FOLDER_NAMES["optimized_jpg"] / f"{file_path.stem}.jpg"
                    logger.debug(f"{action_prefix}Target path for Optimized JPG: '{opt_jpg_path}'")
                    
                    if dry_run:
                        exif_status = "stripped" if processed_exif_bytes is None else "kept/modified"
                        logger.info(
                            f"{config.PREFIX_DRYRUN}Would save Optimized JPG: '{opt_jpg_path.name}' "
                            f"(Quality: {opt_quality}, EXIF: {exif_status})"
                        )
                    else:
                        try:
                            opt_jpg_path.parent.mkdir(parents=True, exist_ok=True)
                            logger.info(f"Attempting to save Optimized JPG: Path='{opt_jpg_path}', Mode='{img_for_jpeg.mode}', Size='{img_for_jpeg.size}', EXIF_Bytes_Type='{type(processed_exif_bytes)}'")
                            if processed_exif_bytes is None:
                                logger.info("Processed EXIF bytes is None, as expected for strip_all or similar.")
                            else:
                                logger.info(f"Processed EXIF bytes length: {len(processed_exif_bytes) if processed_exif_bytes is not None else 'N/A'}")

                            save_kwargs = {
                                "format": "JPEG",
                                "quality": config.OPTIMIZED_QUALITY,
                                "optimize": True,
                                "progressive": True,
                            }
                            if processed_exif_bytes is not None:
                                save_kwargs["exif"] = processed_exif_bytes
                            
                            img_for_jpeg.save(opt_jpg_path, **save_kwargs)
                            
                            logger.info(f"Successfully called img.save() for Optimized JPG: '{opt_jpg_path}'")
                            dual_log(f"[INFO] Saved Optimized JPG: {opt_jpg_path}", output_base_folder)
                            logger.info(
                                f"Saved Optimized JPG: '{opt_jpg_path.name}' "
                                f"(Quality: {config.OPTIMIZED_QUALITY})"
                            )
                            generated_count += 1
                        except Exception as e_save_opt_jpg:
                            logger.error(
                                f"{config.PREFIX_ERROR}Failed to save Optimized JPG for '{file_path.name}' to "
                                f"'{opt_jpg_path}'. Error: {e_save_opt_jpg}",
                                exc_info=True
                            )
                            raise
                else:
                    logger.warning(
                        f"Skipping Optimized JPG for '{file_path.name}' because RGB conversion failed earlier."
                    )
            
            # --- Generate Optimized WebP if enabled ---
            if global_choices.get("generate_webp", True):
                opt_webp_path = output_base_folder / config.FOLDER_NAMES["optimized"] / config.FOLDER_NAMES["optimized_webp"] / f"{file_path.stem}.webp"
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
                        img.save(
                            opt_webp_path,
                            format="WEBP",
                            quality=opt_quality,
                            lossless=False,
                            method=6,  # Use slowest method for best compression
                            exif=processed_exif_bytes,  # Use processed EXIF
                            alpha_quality=100
                        )
                        logger.info(f"Saved Optimized WebP: '{opt_webp_path.name}' (Quality: {opt_quality})")
                        generated_count += 1
                    except Exception as e_save_opt_webp:
                        logger.error(
                            f"{config.PREFIX_ERROR}Failed to save Optimized WebP for '{file_path.name}' to "
                            f"'{opt_webp_path}'. Error: {e_save_opt_webp}",
                            exc_info=True
                        )
                        raise
            
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
                original_width, original_height = img.size
                original_pixels = original_width * original_height
                target_pixels = config.COMPRESSED_TARGET_PIXELS
                
                # Only resize if the original is larger than our target
                if original_pixels > target_pixels:
                    scale_factor = math.sqrt(target_pixels / original_pixels)
                    new_width = int(original_width * scale_factor)
                    new_height = int(original_height * scale_factor)
                    
                    try:
                        # Resize using high-quality Lanczos resampling
                        img_low = img.resize((new_width, new_height), Image.LANCZOS)
                        resized_dimensions = f"{new_width}x{new_height}"
                    except Exception as resize_e:
                        logger.error(
                            f"{config.PREFIX_ERROR}Failed to resize image for compressed output: {resize_e}. "
                            f"Using original size.",
                            exc_info=True
                        )
                        img_low = img
                        resized_dimensions = f"{original_width}x{original_height} (original)"
                else:
                    # No need to resize, already smaller than target
                    img_low = img
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
                        comp_jpg_path = output_base_folder / config.FOLDER_NAMES["compressed"] / config.FOLDER_NAMES["compressed_jpg"] / f"{file_path.stem}.jpg"
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
                                    exif=processed_exif_bytes  # Use processed EXIF
                                )
                                dual_log(f"[INFO] Saved Compressed JPG: {comp_jpg_path}", output_base_folder)
                                logger.info(
                                    f"Saved Compressed JPG: '{comp_jpg_path.name}' "
                                    f"(Size: {img_low_jpg.size}, Quality: {comp_quality})"
                                )
                                generated_count += 1
                            except Exception as e_save_comp_jpg:
                                logger.error(
                                    f"{config.PREFIX_ERROR}Failed to save Compressed JPG for '{file_path.name}': {e_save_comp_jpg}",
                                    exc_info=True
                                )
                                raise
                
                # --- Save Compressed WebP ---
                if generate_compressed_webp:
                    comp_webp_path = output_base_folder / config.FOLDER_NAMES["compressed"] / config.FOLDER_NAMES["compressed_webp"] / f"{file_path.stem}.webp"
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
                                exif=processed_exif_bytes  # Use processed EXIF
                            )
                            dual_log(f"[INFO] Saved Compressed WebP: {comp_webp_path}", output_base_folder)
                            logger.info(
                                f"Saved Compressed WebP: '{comp_webp_path.name}' "
                                f"(Size: {img_low.size}, Quality: {comp_quality})"
                            )
                            generated_count += 1
                        except Exception as e_save_comp_webp:
                            logger.error(
                                f"{config.PREFIX_ERROR}Failed to save Compressed WebP: {e_save_comp_webp}",
                                exc_info=True
                            )
                            raise
            else:
                logger.debug(f"Skipping Compressed file generation as per configuration.")
            
            # --- Log Completion ---
            logger.info(f"{action_prefix}Finished processing all variants for: '{file_path.name}'")
    
    except (FileNotFoundError, OSError, UnidentifiedImageError) as img_e:
        # Handle issues with file access or format identification
        logger.error(f"{config.PREFIX_ERROR}Error opening image '{file_path.name}': {img_e}. Skipping file.")
        return generated_count
    except Exception as unexpected_e:
        # Catch any other unexpected errors
        logger.error(
            f"{config.PREFIX_ERROR}Unexpected error processing '{file_path.name}': {unexpected_e}",
            exc_info=True
        )
        # Re-raise to be caught by the caller's error handling
        # but first return the stats accumulated so far (if any)
        # For safety, return current stats before re-raising. The job.py handler will mark it as an error.
        # However, if the intent is that any exception here means NO successful processing for THIS image,
        # then returning the initial empty/partially filled stats is appropriate.
        # The worker in job.py will catch this re-raised exception and record an error for the file.
        # return generated_count # No, if we re-raise, this return is moot. Let job.py handle it.
        raise
    
    logger.info(f"{action_prefix}Finished processing for '{file_path.name}'. Generated {generated_count} files.")
    return generated_count

# --- END: image_processing.py (Rewritten from Scratch) ---
