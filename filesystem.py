#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import zipfile
import logging
from pathlib import Path
from typing import List

try:
    import config
except ImportError:
    raise ImportError("Critical: config.py is missing. The application cannot run.")

logger = logging.getLogger(__name__)


def scan_directory(source_dir: Path, include_raw: bool = True):
    """
    Scan a directory for standard images and RAW files.
    
    Args:
        source_dir (Path): Directory to scan for image files
        include_raw (bool): Whether to include RAW files in the scan
        
    Returns:
        tuple: (standard_images, raw_images) - Lists of Path objects
    """
    if not source_dir.exists():
        raise FileNotFoundError(f"Source directory does not exist: {source_dir}")
        
    standard_images = []
    raw_images = []
    
    for file_path in source_dir.glob("**/*"):
        if not file_path.is_file():
            continue
            
        # Get lowercase extension for comparison
        ext = file_path.suffix.lower()
        
        # Check file type
        if ext in config.STANDARD_IMAGE_EXTENSIONS:
            standard_images.append(file_path)
        elif include_raw and ext in config.RAW_IMAGE_EXTENSIONS:
            raw_images.append(file_path)
    
    logger.info(f"Found {len(standard_images)} standard images and {len(raw_images)} RAW files in {source_dir}")
    return standard_images, raw_images


def create_raw_readme(raw_folder: Path, dry_run: bool = False):
    """
    Create a README.txt file in the RAW folder explaining RAW files.
    
    Args:
        raw_folder (Path): Path to the RAW folder
        dry_run (bool): If True, simulate without creating files
    """
    readme_path = raw_folder / config.FOLDER_NAMES["raw_readme"]
    
    if dry_run:
        logger.info(f"[DRYRUN] Would create RAW README at {readme_path}")
        return
        
    logger.info(f"Creating RAW README at {readme_path}")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(config.RAW_README_TEMPLATE)


def _get_top_level_readme_content(
    shoot_name: str,
    delivery_company_name: str,
    delivery_website: str,
    delivery_support_email: str,
) -> str:
    """
    Generate the content for the top-level README file for a digital delivery package.

    Args:
        shoot_name (str): The name of the photo shoot or project.
        delivery_company_name (str): The company name for delivery branding.
        delivery_website (str): The website for delivery branding.
        delivery_support_email (str): The support email for delivery branding.
    Returns:
        str: The formatted README text for the delivery root.
    """
    content = f"""DIGITAL DELIVERY README
===========================================

Thank you for opening your digital delivery from {delivery_company_name}!
Project: {shoot_name}

We are excited to deliver your professionally processed images. Please find them organized in the folders below.

Folder Structure Explained:
---------------------------
1.  **{config.FOLDER_NAMES['raw']}/**
    * This folder is reserved for the original, unedited RAW image files (e.g., .CR2, .NEF, .ARW).
    * RAW files offer maximum editing flexibility but are very large.
    * *Access to RAW files is typically a premium service.* If this folder is empty, RAWs may not have been included in your package or require separate arrangements. Please see the README inside this folder for contact details if needed.

2.  **{config.FOLDER_NAMES['export']}/{config.FOLDER_NAMES['export_originals']}/**
    * Contains high-resolution copies (or the originals, if moved during processing) of your source images.
    * These are suitable for archival, large prints, or further detailed editing. Quality is preserved.

3.  **{config.FOLDER_NAMES['optimized']}/**
    * `{config.FOLDER_NAMES['optimized_jpg']}/`: High-quality JPG versions suitable for most print and digital uses. Uses quality setting ~{config.OPTIMIZED_QUALITY}/100.
    * `{config.FOLDER_NAMES['optimized_webp']}/`: High-quality WebP versions. WebP offers excellent quality at smaller file sizes compared to JPG, making it great for web use (check compatibility if needed). Uses quality setting ~{config.OPTIMIZED_QUALITY}/100.

4.  **{config.FOLDER_NAMES['compressed']}/**
    * `{config.FOLDER_NAMES['compressed_jpg']}/`: Resized (approx. {config.COMPRESSED_TARGET_PIXELS/1e6:.1f} Megapixels) and more compressed JPGs. Ideal for quick sharing, social media, web galleries, or email where smaller file sizes are important. Uses adaptive quality based on ~{config.COMPRESSED_QUALITY_BASE}/100.
    * `{config.FOLDER_NAMES['compressed_webp']}/`: Resized (approx. {config.COMPRESSED_TARGET_PIXELS/1e6:.1f} Megapixels) and highly compressed WebP images. Offers potentially even smaller file sizes than the compressed JPGs for web use. Uses adaptive quality based on ~{config.COMPRESSED_QUALITY_BASE}/100.

ZIP Archives (If Provided):
---------------------------
For convenience, you might find `.zip` archive files (e.g., `{config.FOLDER_NAMES['zip_optimized']}`) in the main folder.

* **What is a ZIP File?** It's a single compressed file containing multiple files and folders. This makes downloading large sets of images easier and faster.
* **How to Open (Extract/Unzip):** You need to "extract" or "unzip" the archive to access the images inside.
    * *Windows:* Right-click the .zip file -> "Extract All...".
    * *macOS:* Double-click the .zip file.
    * *Mobile/Other:* Use built-in file managers or search your app store for "unzip" or "file extractor" apps (e.g., Files by Google, iZip, ZArchiver).

Need Help with These Files?
---------------------------
If you have questions about the photos themselves, usage rights, or need further assistance with this specific delivery, please contact {delivery_company_name}:

* Website: {delivery_website}
* Support: {delivery_support_email}

Thank you!

---
*Package generated using {config.TOOL_DISPLAY_NAME}. Original tool developed by {config.ORIGINAL_AUTHOR}. Find out more: {config.ORIGINAL_TOOL_REPO}*
"""
    return content.strip()


def _get_raw_readme_content() -> str:
    """
    Generate the content for the README file inside the RAW images folder.

    Returns:
        str: The formatted README text for the RAW folder.
    """
    content = f"""{config.FOLDER_NAMES['raw'].upper()} INFORMATION
===========================================

Important Notice Regarding RAW Files:
-------------------------------------
The '{config.FOLDER_NAMES['raw']}' folder is designated for the original, unedited RAW image files captured by the camera (e.g., .CR2, .NEF, .ARW, .DNG). These files contain the maximum image data and offer the greatest flexibility for professional photo editing software.

RAW Images as a Premium Option:
--------------------------------
Due to their large file sizes and specialized nature (requiring specific software to open and edit), access to RAW files is typically provided as a premium, add-on service and may not be included in standard delivery packages from {config.USER_COMPANY_NAME}.

* **If this folder appears empty or is missing:** Access to RAW files might require an additional arrangement or purchase based on your agreement with {config.USER_COMPANY_NAME}.
* **If files are present:** You have received the requested RAW images as part of your delivery.

Need Access or Have Questions?
-----------------------------
If you require access to the RAW images and did not initially arrange for it, or if you have questions about RAW file delivery, pricing, or usage rights related to *your specific project*, please contact {config.USER_COMPANY_NAME} directly:

* Website: {config.USER_WEBSITE}
* Support: {config.USER_SUPPORT_EMAIL}
    *(Please refer to your contract or invoice for additional contact methods if needed)*

We appreciate your understanding and are happy to discuss your specific requirements.

Thank you,
{config.USER_COMPANY_NAME}
"""
    return content.strip()


def create_output_structure(
    shoot_name: str,
    output_parent: Path,
    delivery_company_name: str,
    delivery_website: str,
    delivery_support_email: str,
    has_raw_files: bool = False,
    include_raw: bool = True,
    dry_run: bool = False
) -> Path:
    """
    Create the full output directory structure for a photo shoot delivery, including
    all subfolders and README files.

    Args:
        shoot_name (str): Name of the shoot/project.
        output_parent (Path): Parent directory for the output structure.
        dry_run (bool): If True, simulate actions without making changes.
    Returns:
        Path: Path to the root of the created output structure.
    Raises:
        OSError: If directory creation fails.
        Exception: For unexpected errors.
    """
    top_folder: Path = output_parent / shoot_name
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[SETUP]"
    logger.info(
        f"{action_prefix}Planning output structure for '{shoot_name}' inside '{output_parent}'"
    )
    # Start with top folder and standard structure
    folders_to_create: List[Path] = [
        top_folder,
        top_folder
        / config.FOLDER_NAMES["export"]
        / config.FOLDER_NAMES["export_originals"],
        top_folder
        / config.FOLDER_NAMES["optimized"]
        / config.FOLDER_NAMES["optimized_jpg"],
        top_folder
        / config.FOLDER_NAMES["optimized"]
        / config.FOLDER_NAMES["optimized_webp"],
        top_folder
        / config.FOLDER_NAMES["compressed"]
        / config.FOLDER_NAMES["compressed_jpg"],
        top_folder
        / config.FOLDER_NAMES["compressed"]
        / config.FOLDER_NAMES["compressed_webp"],
    ]
    
    # Only add RAW folder if RAW files were found and user wants to include them
    if has_raw_files and include_raw:
        logger.info(f"{action_prefix} Including RAW folder in output structure")
        folders_to_create.append(top_folder / config.FOLDER_NAMES["raw"])
    else:
        logger.info(f"{action_prefix} Skipping RAW folder creation (has_raw_files={has_raw_files}, include_raw={include_raw})")
    readme_path: Path = top_folder / config.FOLDER_NAMES["top_level_readme"]
    raw_readme_path: Path = (
        top_folder / config.FOLDER_NAMES["raw"] / config.FOLDER_NAMES["raw_readme"]
    )
    log_file_path: Path = top_folder / config.FOLDER_NAMES["log_file"]
    try:
        for folder_path in folders_to_create:
            if dry_run:
                logger.info(
                    f"{config.PREFIX_DRYRUN}Would create directory: '{folder_path}'"
                )
            else:
                folder_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Ensured directory exists: '{folder_path}'")
        for folder_key in ["optimized", "compressed", "export_originals"]:
            folder_path = top_folder / config.FOLDER_NAMES[folder_key]
            if dry_run:
                logger.info(
                    f"{config.PREFIX_DRYRUN}Would create directory: '{folder_path}'"
                )
            else:
                folder_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Ensured output subfolder exists: {folder_path}")
        if dry_run:
            logger.info(
                f"{config.PREFIX_DRYRUN}Would write top-level README to: '{readme_path}'"
            )
            logger.info(
                f"{config.PREFIX_DRYRUN}Would write RAW README to: '{raw_readme_path}'"
            )
        else:
            readme_content = _get_top_level_readme_content(
                shoot_name,
                delivery_company_name,
                delivery_website,
                delivery_support_email
            )
            readme_path.write_text(readme_content, encoding="utf-8")
            logger.debug(f"Created/Updated README: '{readme_path}'")
        if include_raw:
            raw_folder = top_folder / config.FOLDER_NAMES["raw"]
            if not raw_folder.exists():
                raw_folder.mkdir(parents=True, exist_ok=True)
            # Always create the README, regardless of has_raw_files
            raw_readme_path = raw_folder / config.FOLDER_NAMES["raw_readme"]
            raw_readme_content = _get_raw_readme_content()
            if dry_run:
                logger.info(
                    f"{config.PREFIX_DRYRUN}Would write RAW README to: '{raw_readme_path}'"
                )
            else:
                raw_readme_path.write_text(raw_readme_content, encoding="utf-8")
                logger.debug(f"Created/Updated README: '{raw_readme_path}'")
        logger.info(f"{action_prefix}Log file target path: '{log_file_path}'")
        logger.info(
            f"{config.PREFIX_DONE}Ensured output structure root at '{top_folder}'"
        )
        return top_folder
    except OSError as e:
        logger.error(
            f"{config.PREFIX_ERROR}Failed to create output structure at '{top_folder}'. Error: {e}",
            exc_info=True,
        )
        raise
    except Exception as e:
        logger.error(
            f"{config.PREFIX_ERROR}Unexpected error planning/creating output structure: {e}",
            exc_info=True,
        )
        raise


def gather_image_files(source_folder: Path) -> List[Path]:
    """
    Recursively gather all image files in the given folder matching allowed extensions.

    Args:
        source_folder (Path): Directory to search for images.
    Returns:
        List[Path]: List of image file paths found.
    """
    logger.debug(f"Scanning for allowed image types in '{source_folder}'...")
    if not source_folder.is_dir():
        logger.error(
            f"{config.PREFIX_ERROR}Source path is not a valid directory: '{source_folder}'"
        )
        return []
    files: List[Path] = []
    try:
        for item in source_folder.rglob("*"):
            if item.is_file() and item.suffix.lower() in config.ALLOWED_EXTENSIONS:
                files.append(item)
    except PermissionError as e:
        logger.error(
            f"{config.PREFIX_ERROR}Permission denied scanning folder '{source_folder}': {e}"
        )
        return []
    except Exception as e:
        logger.error(
            f"{config.PREFIX_ERROR}Error scanning source folder '{source_folder}': {e}",
            exc_info=True,
        )
        return []
    logger.info(
        f"{config.PREFIX_INFO}Found {len(files)} image file(s) matching allowed extensions in '{source_folder}'."
    )
    return files


def rename_files_in_folder(folder: Path, base_name: str, dry_run: bool = False) -> int:
    """
    Rename all image files in a folder using a base name and sequential numbering.

    Args:
        folder (Path): Folder containing files to rename.
        base_name (str): Base name for new files.
        dry_run (bool): If True, simulate renaming without changes.
    Returns:
        int: Number of files renamed or considered.
    """
    renamed_count: int = 0
    would_rename_count: int = 0
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[RENAME]"
    logger.debug(
        f"{action_prefix}Checking folder '{folder}' for files to rename with base '{base_name}'"
    )
    if not folder.is_dir():
        logger.warning(
            f"{config.PREFIX_WARN}Cannot rename files: Folder '{folder}' does not exist or is not a directory."
        )
        return 0
    files_to_rename: List[Path] = []
    try:
        for f_path in folder.iterdir():
            if (
                f_path.is_file()
                and f_path.suffix.lower() in config.ALLOWED_EXTENSIONS.union({".webp"})
            ):
                files_to_rename.append(f_path)
    except PermissionError as e:
        logger.error(
            f"{config.PREFIX_ERROR}Permission denied accessing folder '{folder}' for renaming: {e}"
        )
        return 0
    except Exception as e:
        logger.error(
            f"{config.PREFIX_ERROR}Error listing files in folder '{folder}' for renaming: {e}",
            exc_info=True,
        )
        return 0
    if not files_to_rename:
        logger.debug(f"No image files found to rename in '{folder}'.")
        return 0
    files_to_rename.sort(key=lambda x: x.name)
    logger.debug(
        f"Found {len(files_to_rename)} files to potentially rename in '{folder}'."
    )
    counter: int = 1
    for f_path in files_to_rename:
        try:
            new_stem: str = f"{counter:03d}-{base_name}"
            new_name: str = f"{new_stem}{f_path.suffix.lower()}"
            new_path: Path = folder / new_name
            if f_path == new_path:
                logger.debug(
                    f"File '{f_path.name}' already has the correct name. Skipping."
                )
                would_rename_count += 1
                if not dry_run:
                    renamed_count += 1
                counter += 1
                continue
            if dry_run:
                logger.info(
                    f"{config.PREFIX_DRYRUN}Would rename '{f_path.name}' to '{new_name}' in '{folder.name}'"
                )
                would_rename_count += 1
                counter += 1
            else:
                if new_path.exists():
                    logger.warning(
                        f"{config.PREFIX_WARN}Target rename path '{new_path}' already exists! Skipping rename for '{f_path.name}' to avoid overwrite."
                    )
                    continue
                f_path.rename(new_path)
                renamed_count += 1
                counter += 1
        except OSError as e:
            logger.error(
                f"{config.PREFIX_ERROR}Rename failed for '{f_path.name}' to '{new_name}'. Error: {e}",
                exc_info=True,
            )
        except Exception as e:
            logger.error(
                f"{config.PREFIX_ERROR}Unexpected error renaming '{f_path.name}'. Error: {e}",
                exc_info=True,
            )
    final_count = would_rename_count if dry_run else renamed_count
    status_verb = "considered for rename" if dry_run else "renamed"
    logger.info(
        f"{config.PREFIX_DONE}Finished rename scan for '{folder.name}'. Files {status_verb}: {final_count}."
    )
    return final_count


def rename_processed_files(
    output_base_folder: Path, base_name: str, dry_run: bool = False
) -> None:
    """
    Rename all processed image files in the output structure using a base name.

    Args:
        output_base_folder (Path): Root output folder containing processed images.
        base_name (str): Base name for new files.
        dry_run (bool): If True, simulate renaming without changes.
    Returns:
        None
    """
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[RENAME]"
    status_verb = "Simulating renaming" if dry_run else "Starting renaming"
    logger.info(
        f"{action_prefix}{status_verb} process in '{output_base_folder}' using base name '{base_name}'..."
    )
    subfolders_to_process: List[Path] = [
        output_base_folder
        / config.FOLDER_NAMES["export"]
        / config.FOLDER_NAMES["export_originals"],
        output_base_folder
        / config.FOLDER_NAMES["optimized"]
        / config.FOLDER_NAMES["optimized_jpg"],
        output_base_folder
        / config.FOLDER_NAMES["optimized"]
        / config.FOLDER_NAMES["optimized_webp"],
        output_base_folder
        / config.FOLDER_NAMES["compressed"]
        / config.FOLDER_NAMES["compressed_jpg"],
        output_base_folder
        / config.FOLDER_NAMES["compressed"]
        / config.FOLDER_NAMES["compressed_webp"],
    ]
    total_processed_count: int = 0
    for folder in subfolders_to_process:
        if dry_run or folder.is_dir():
            try:
                count = rename_files_in_folder(folder, base_name, dry_run=dry_run)
                total_processed_count += count
            except Exception as e:
                logger.error(
                    f"{config.PREFIX_ERROR}Error during rename processing for folder '{folder}'. Error: {e}",
                    exc_info=True,
                )
        else:
            logger.debug(
                f"Subfolder '{folder}' not found or not a directory. Skipping rename for this folder."
            )
    status_verb_done = "simulation" if dry_run else "process"
    count_verb = "considered" if dry_run else "processed"
    logger.info(
        f"{config.PREFIX_DONE}Rename {status_verb_done} finished. Total files {count_verb} across folders: {total_processed_count}."
    )


def create_zip_archive(
    folder_to_zip: Path, zip_file_path: Path, dry_run: bool = False
) -> bool:
    """
    Create a ZIP archive of a folder and its contents.

    Args:
        folder_to_zip (Path): Folder to archive.
        zip_file_path (Path): Destination ZIP file path.
        dry_run (bool): If True, simulate ZIP creation.
    Returns:
        bool: True if ZIP created (or simulated) successfully, False otherwise.
    """
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[ZIP]"
    status_verb = "Simulating ZIP creation" if dry_run else "Creating ZIP archive"
    logger.info(
        f"{action_prefix}{status_verb} '{zip_file_path.name}' from folder '{folder_to_zip.name}'..."
    )
    if dry_run:
        logger.info(f"{config.PREFIX_DRYRUN}Source folder: '{folder_to_zip}'")
        logger.info(f"{config.PREFIX_DRYRUN}Target ZIP file: '{zip_file_path}'")
        return True
    if not folder_to_zip.is_dir():
        logger.warning(
            f"{config.PREFIX_WARN}Cannot create ZIP: Source folder '{folder_to_zip}' does not exist."
        )
        return False
    try:
        has_files = any(item.is_file() for item in folder_to_zip.rglob("*"))
    except PermissionError as e:
        logger.error(
            f"{config.PREFIX_ERROR}Permission denied checking contents of '{folder_to_zip}' for zipping: {e}"
        )
        return False
    except Exception as e:
        logger.error(
            f"{config.PREFIX_ERROR}Error checking contents of '{folder_to_zip}' for zipping: {e}",
            exc_info=True,
        )
        return False
    if not has_files:
        logger.info(
            f"{config.PREFIX_INFO}Skipping ZIP creation for empty folder: '{folder_to_zip.name}'"
        )
        return True
    try:
        with zipfile.ZipFile(
            zip_file_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6
        ) as zipf:
            all_files = [item for item in folder_to_zip.rglob("*") if item.is_file()]
            total_files = len(all_files)
            logger.info(f"[ZIP] Found {total_files} files to archive in '{folder_to_zip}'.")
            for idx, item_path in enumerate(all_files, 1):
                arcname: Path = item_path.relative_to(folder_to_zip)
                logger.info(f"[ZIP] Zipping file {idx}/{total_files}: {arcname}")
                zipf.write(item_path, arcname=arcname)
                # logger.debug(f"Adding to ZIP: {arcname}")
        logger.info(
            f"{config.PREFIX_DONE}Successfully created ZIP archive: '{zip_file_path}'"
        )
        return True
    except zipfile.BadZipFile as e:
        logger.error(
            f"{config.PREFIX_ERROR}Failed to create ZIP archive '{zip_file_path}'. Invalid ZIP file format: {e}",
            exc_info=True,
        )
    except OSError as e:
        logger.error(
            f"{config.PREFIX_ERROR}Failed to create ZIP archive '{zip_file_path}'. OS Error: {e}",
            exc_info=True,
        )
    except Exception as e:
        logger.error(
            f"{config.PREFIX_ERROR}Unexpected error creating ZIP archive '{zip_file_path}'. Error: {e}",
            exc_info=True,
        )
    if zip_file_path.exists():
        try:
            zip_file_path.unlink()
            logger.info(
                f"Cleaned up potentially incomplete ZIP file '{zip_file_path}' after error."
            )
        except Exception as cleanup_e:
            logger.error(
                f"{config.PREFIX_ERROR}Failed to cleanup incomplete ZIP file '{zip_file_path}' after error. Cleanup Error: {cleanup_e}"
            )
    return False
