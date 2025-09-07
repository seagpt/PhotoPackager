{{ ... }}
from typing import Optional, Tuple, List, Dict
import sys
import threading

logger = logging.getLogger(__name__)


try:
    from PIL import Image, ImageStat, ImageOps, UnidentifiedImageError

    Image.MAX_IMAGE_PIXELS = None
    PILLOW_AVAILABLE = True
    logger.debug("Pillow library successfully imported and configured.")
except ImportError:
    PILLOW_AVAILABLE = False
    logger.critical(
        "CRITICAL ERROR: Pillow (PIL) library not found. PhotoPackager cannot perform image processing."
    )
try:
    import piexif

    PIEXIF_AVAILABLE = True
except ImportError:
    PIEXIF_AVAILABLE = False
    logger.warning(
        "Optional 'piexif' library not found. Partial EXIF removal ('date', 'camera', 'both') will fallback to 'strip_all' if selected."
    )

# Local application imports
try:
    from . import config
except ImportError:
    logger.critical("CRITICAL ERROR: Failed to import 'config' module. Cannot proceed.")
    # In a web context, we shouldn't exit, but raise an exception that the framework can handle.
    raise ImportError("Critical 'config' module is missing.")

# ----------------------------------------
# --- Private Helper Functions ---
{{ ... }}
                                # Save the optimized JPG
                                img_high.save(
                                    opt_jpg_path,
                                    format="JPEG",
                                    quality=opt_quality,
                                    optimize=True,
                                    progressive=True,
                                    exif=processed_exif_bytes,  # Use processed EXIF
                                )
                                logger.info(f"Saved Optimized JPG: {opt_jpg_path}")
                                generated_count += 1
                            except Exception as e_save_opt_jpg:
                                logger.error(
{{ ... }}
                                # Save the optimized WebP
                                img_high.save(
                                    opt_webp_path,
                                    format="WEBP",
                                    quality=opt_quality,
                                    lossless=True,  # Keep it high-quality
                                    method=4,  # Balance between speed and quality
                                    exif=processed_exif_bytes,  # Use processed EXIF
                                )
                                logger.info(f"Saved Optimized WebP: {opt_webp_path}")
                                generated_count += 1
                            except Exception as e_save_opt_webp:
                                logger.error(
{{ ... }}
                            # Save the compressed JPG
                            img_low.save(
                                comp_jpg_path,
                                format="JPEG",
                                quality=comp_quality,
                                optimize=True,
                                progressive=True,
                                exif=processed_exif_bytes,  # Use processed EXIF
                            )
                            logger.info(f"Saved Compressed JPG: {comp_jpg_path}")
                            generated_count += 1
                        except Exception as e_save_comp_jpg:
                            logger.error(
{{ ... }}
                            # Save the compressed WebP
                            img_low.save(
                                comp_webp_path,
                                format="WEBP",
                                quality=comp_quality,
                                lossless=False,
                                method=6,  # Use slowest method for best compression
                                exif=processed_exif_bytes,  # Use processed EXIF
                            )
                            logger.info(f"Saved Compressed WebP: {comp_webp_path}")
                            generated_count += 1
                        except Exception as e_save_comp_webp:
                            logger.error(
{{ ... }}
