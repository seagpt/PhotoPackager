#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Handles all file system operations for the PhotoPackager application.

This module is responsible for:
- Creating the standardized output folder structure for each shoot.
- Generating explanatory README.txt files within the output structure.
- Gathering input image files from source directories.
- Copying or moving original source files to the 'Export Originals' location.
- Renaming processed image files sequentially within their respective folders.
- Optionally creating ZIP archives of key output directories.
- Implementing '--dry-run' functionality to simulate operations without execution.

It relies heavily on constants defined in `config.py` for naming conventions
and interacts with the file system using Python's `pathlib` and `shutil` modules.
Robust error handling is included for file operations.

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
Project: PhotoPackager v1.0.0-refactor
License: MIT License (Consult LICENSE.md file for full details)
"""

import os
import shutil
import zipfile
import logging
from pathlib import Path
from typing import List

# --- Imports ---
try:
    # Attempt to import the configuration module. Crucial for all operations.
    import config
except ImportError:
    # Critical error if config.py is missing, as it contains all necessary paths and settings.
    print("ERROR: Failed to import 'config' module in filesystem.py. Ensure config.py is present.")
    # Exit immediately as the module cannot function without configuration.
    exit(1)

# --- Module Logger Setup ---
# Obtain a logger specific to this module for targeted logging.
logger = logging.getLogger(__name__)

# ----------------------------------------
# --- README Content Generation ---
# ----------------------------------------
# Functions responsible for generating the text content for README files
# that are placed within the output structure.

def _get_top_level_readme_content(shoot_name: str) -> str:
    """
    Generates the content for the main README.txt file placed in the root
    of the output shoot folder.

    This README explains the overall structure and content of the package
    delivered to the end-client, using branding configured by the user
    (the studio running the tool) via config.py, while also including
    mandatory attribution to the original tool author.

    Args:
        shoot_name (str): The name of the specific shoot being processed, used for titling.

    Returns:
        str: The fully formatted content for the top-level README.txt file.
    """
    # --- README Content Template ---
    # Uses f-string for dynamic insertion of configuration values and shoot name.
    # Includes explanations for end-client understanding (e.g., What is ZIP?).
    # *** CRITICAL: Includes the mandatory attribution footer. ***
    content = f"""DIGITAL DELIVERY README
===========================================

Thank you for opening your digital delivery from {config.USER_COMPANY_NAME}!
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
If you have questions about the photos themselves, usage rights, or need further assistance with this specific delivery, please contact {config.USER_COMPANY_NAME}:

* Website: {config.USER_WEBSITE}
* Support: {config.USER_SUPPORT_EMAIL}

Thank you!

---
*Package generated using {config.TOOL_DISPLAY_NAME}. Original tool developed by {config.ORIGINAL_AUTHOR}. Find out more: {config.ORIGINAL_TOOL_REPO}*
"""
    # --- End of Template ---
    return content.strip() # Remove leading/trailing whitespace


def _get_raw_readme_content() -> str:
    """
    Generates the content for the README.txt file placed specifically inside
    the 'RAW Files' folder.

    This README explains the nature of RAW files and the typical policy
    regarding their delivery (often premium/optional), directing inquiries
    to the studio running the tool.

    Returns:
        str: The formatted content for the RAW folder's README.txt file.
    """
    # Uses user branding for contact info, as the inquiry is about *content access*.
    # Does NOT include the tool attribution footer here.
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


# ----------------------------------------
# --- File System Operations ---
# ----------------------------------------

def create_output_structure(shoot_name: str, output_parent: Path, dry_run: bool = False) -> Path:
    """
    Creates the standard output folder hierarchy for a given shoot name within
    the specified parent directory. Also writes the necessary README files.

    Args:
        shoot_name (str): The name used for the main output folder.
        output_parent (Path): The parent directory where the shoot folder will be created.
        dry_run (bool): If True, simulate actions and log intent without modifying the filesystem.

    Returns:
        Path: The path to the created (or intended) root output folder for the shoot.

    Raises:
        OSError: If folder creation fails due to permissions or other OS issues (and not dry_run).
    """
    # Determine the root path for this specific shoot's output.
    top_folder: Path = output_parent / shoot_name
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[SETUP]" # Use specific prefix

    logger.info(f"{action_prefix}Planning output structure for '{shoot_name}' inside '{output_parent}'")

    # Define all folder paths based on constants from config.py
    # This makes it easy to change the structure by only modifying config.py
    folders_to_create: List[Path] = [
        top_folder,
        top_folder / config.FOLDER_NAMES['raw'],
        top_folder / config.FOLDER_NAMES['export'] / config.FOLDER_NAMES['export_originals'],
        top_folder / config.FOLDER_NAMES['optimized'] / config.FOLDER_NAMES['optimized_jpg'],
        top_folder / config.FOLDER_NAMES['optimized'] / config.FOLDER_NAMES['optimized_webp'],
        top_folder / config.FOLDER_NAMES['compressed'] / config.FOLDER_NAMES['compressed_jpg'],
        top_folder / config.FOLDER_NAMES['compressed'] / config.FOLDER_NAMES['compressed_webp'],
    ]

    # Define paths for README files
    readme_path: Path = top_folder / config.FOLDER_NAMES['top_level_readme']
    raw_readme_path: Path = top_folder / config.FOLDER_NAMES['raw'] / config.FOLDER_NAMES['raw_readme']
    log_file_path: Path = top_folder / config.FOLDER_NAMES['log_file'] # Define log path for logging intent

    try:
        # --- Create Folders ---
        logger.debug(f"{action_prefix}Processing target folders...")
        for folder_path in folders_to_create:
            if dry_run:
                # Log the intention without creating the folder.
                logger.info(f"{config.PREFIX_DRYRUN}Would create directory: '{folder_path}'")
            else:
                # Attempt to create the directory.
                # `parents=True` creates necessary parent directories.
                # `exist_ok=True` prevents an error if the directory already exists.
                folder_path.mkdir(parents=True, exist_ok=True)
                logger.debug(f"Ensured directory exists: '{folder_path}'")

        # --- Write README Files ---
        logger.debug(f"{action_prefix}Processing README files...")
        if dry_run:
            # Log the intention without writing the files.
            logger.info(f"{config.PREFIX_DRYRUN}Would write top-level README to: '{readme_path}'")
            logger.info(f"{config.PREFIX_DRYRUN}Would write RAW README to: '{raw_readme_path}'")
        else:
            # Generate and write the top-level README.
            readme_content = _get_top_level_readme_content(shoot_name)
            readme_path.write_text(readme_content, encoding="utf-8")
            logger.debug(f"Created/Updated README: '{readme_path}'")

            # Generate and write the README inside the RAW folder.
            raw_readme_content = _get_raw_readme_content()
            raw_readme_path.write_text(raw_readme_content, encoding="utf-8")
            logger.debug(f"Created/Updated README: '{raw_readme_path}'")

        # Log intent regarding the log file path (actual file handler setup is in main).
        logger.info(f"{action_prefix}Log file target path: '{log_file_path}'")

        # Log overall success message for this stage.
        status = "Planned" if dry_run else "Ensured"
        logger.info(f"{config.PREFIX_DONE}{status} output structure root at '{top_folder}'")
        # Return the intended root path, even in dry run mode.
        return top_folder

    except OSError as e:
        # Catch specific OS errors related to file operations (permissions, disk full, etc.).
        logger.error(f"{config.PREFIX_ERROR}Failed to create output structure at '{top_folder}'. Error: {e}", exc_info=True)
        # Re-raise the exception to halt processing for this shoot if structure creation fails.
        raise
    except Exception as e:
        # Catch any other unexpected errors during this process.
        logger.error(f"{config.PREFIX_ERROR}Unexpected error planning/creating output structure: {e}", exc_info=True)
        raise


def gather_image_files(source_folder: Path) -> List[Path]:
    """
    Recursively finds all image files within a source folder that have extensions
    defined in `config.ALLOWED_EXTENSIONS`.

    Args:
        source_folder (Path): The directory to scan for images.

    Returns:
        List[Path]: A list of Path objects representing the found image files.
                    Returns an empty list if the source folder is invalid or
                    an error occurs during scanning.
    """
    logger.debug(f"Scanning for allowed image types in '{source_folder}'...")
    # Ensure the source is a valid directory before proceeding.
    if not source_folder.is_dir():
        logger.error(f"{config.PREFIX_ERROR}Source path is not a valid directory: '{source_folder}'")
        return []

    files: List[Path] = []
    try:
        # Use rglob('*') for recursive globbing to find files in subdirectories.
        for item in source_folder.rglob("*"):
            # Check if the item is a file and its extension (lowercase) is in the allowed set.
            if item.is_file() and item.suffix.lower() in config.ALLOWED_EXTENSIONS:
                files.append(item)
    except PermissionError as e:
         logger.error(f"{config.PREFIX_ERROR}Permission denied scanning folder '{source_folder}': {e}")
         return [] # Return empty list on permission error
    except Exception as e:
         # Catch other potential errors during file system traversal.
         logger.error(f"{config.PREFIX_ERROR}Error scanning source folder '{source_folder}': {e}", exc_info=True)
         return [] # Return empty list on error

    logger.info(f"{config.PREFIX_INFO}Found {len(files)} image file(s) matching allowed extensions in '{source_folder}'.")
    return files


def rename_files_in_folder(folder: Path, base_name: str, dry_run: bool = False) -> int:
    """
    Renames image files (matching ALLOWED_EXTENSIONS + .webp) within a specific
    folder to a sequential format (e.g., 001-BaseName.ext, 002-BaseName.ext).

    Files are sorted alphabetically before renaming for consistent order.

    Args:
        folder (Path): The directory containing files to be renamed.
        base_name (str): The base name to use for the renamed files.
        dry_run (bool): If True, simulate renames and log intent without modifying files.

    Returns:
        int: The number of files successfully renamed (or that would be renamed in dry run).
    """
    renamed_count: int = 0
    would_rename_count: int = 0
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[RENAME]"

    logger.debug(f"{action_prefix}Checking folder '{folder}' for files to rename with base '{base_name}'")

    # Basic validation: Check if the target folder exists and is a directory.
    if not folder.is_dir():
         logger.warning(f"{config.PREFIX_WARN}Cannot rename files: Folder '{folder}' does not exist or is not a directory.")
         return 0

    files_to_rename: List[Path] = []
    try:
        # Iterate through items in the directory.
        for f_path in folder.iterdir():
             # Only consider files whose extensions match the allowed input list OR .webp (for processed output)
             if f_path.is_file() and f_path.suffix.lower() in config.ALLOWED_EXTENSIONS.union({".webp"}):
                 files_to_rename.append(f_path)
    except PermissionError as e:
         logger.error(f"{config.PREFIX_ERROR}Permission denied accessing folder '{folder}' for renaming: {e}")
         return 0 # Cannot proceed if listing files fails.
    except Exception as e:
         logger.error(f"{config.PREFIX_ERROR}Error listing files in folder '{folder}' for renaming: {e}", exc_info=True)
         return 0

    if not files_to_rename:
        logger.debug(f"No image files found to rename in '{folder}'.")
        return 0

    # Sort files alphabetically by their current name for predictable sequential numbering.
    # This ensures 'IMG_001.jpg' comes before 'IMG_002.jpg'.
    files_to_rename.sort(key=lambda x: x.name)
    logger.debug(f"Found {len(files_to_rename)} files to potentially rename in '{folder}'.")

    # --- Renaming Loop ---
    # Use a counter starting from 1 for sequential naming.
    counter: int = 1
    for f_path in files_to_rename:
        try:
            # Construct the new filename stem (e.g., "001-ShootName").
            # Use zfill(3) or f-string formatting for leading zeros (e.g., 001, 010, 100).
            new_stem: str = f"{counter:03d}-{base_name}"
            # Combine stem with the original file extension (lowercase for consistency).
            new_name: str = f"{new_stem}{f_path.suffix.lower()}"
            # Construct the full new path.
            new_path: Path = folder / new_name

            # Optimization: If the file already has the target name, skip the rename operation.
            if f_path == new_path:
                logger.debug(f"File '{f_path.name}' already has the correct name. Skipping.")
                # Still increment counts as it matches the target state
                would_rename_count += 1
                if not dry_run: renamed_count +=1 # Count as 'renamed' if not dry run
                counter += 1
                continue

            # --- Dry Run Simulation ---
            if dry_run:
                logger.info(f"{config.PREFIX_DRYRUN}Would rename '{f_path.name}' to '{new_name}' in '{folder.name}'")
                would_rename_count += 1
                # Crucially, increment counter even in dry run to maintain the correct sequence simulation.
                counter += 1
            # --- Actual Rename Operation ---
            else:
                # Safety Check: Prevent overwriting existing files unintentionally.
                # Although sequential renaming should make this rare, it's a good safeguard.
                if new_path.exists():
                     logger.warning(f"{config.PREFIX_WARN}Target rename path '{new_path}' already exists! Skipping rename for '{f_path.name}' to avoid overwrite.")
                     # Decide how to handle this: skip counter? Here we skip counter to avoid gaps if possible,
                     # but this means the final count might be lower than the number of files if collisions occur.
                     # A different strategy might be needed if strict sequence without gaps is mandatory even with collisions.
                     continue

                # Perform the actual rename operation.
                logger.debug(f"Renaming '{f_path.name}' to '{new_name}' in folder '{folder.name}'")
                f_path.rename(new_path)
                renamed_count += 1
                counter += 1 # Increment counter after successful rename.

        except OSError as e:
            # Catch OS-level errors during rename (permissions, invalid name, etc.).
            logger.error(f"{config.PREFIX_ERROR}Rename failed for '{f_path.name}' to '{new_name}'. Error: {e}", exc_info=True)
            # Continue with the next file even if one fails.
        except Exception as e:
            # Catch any other unexpected errors.
            logger.error(f"{config.PREFIX_ERROR}Unexpected error renaming '{f_path.name}'. Error: {e}", exc_info=True)

    # Log summary for the folder.
    final_count = would_rename_count if dry_run else renamed_count
    status_verb = "considered for rename" if dry_run else "renamed"
    logger.info(f"{config.PREFIX_DONE}Finished rename scan for '{folder.name}'. Files {status_verb}: {final_count}.")
    # Return the count of files processed (or simulated).
    return final_count


def rename_processed_files(output_base_folder: Path, base_name: str, dry_run: bool = False) -> None:
    """
    Orchestrates the renaming process across all standard output subfolders
    where processed images are expected.

    Args:
        output_base_folder (Path): The root output folder for the shoot.
        base_name (str): The base name to use for renaming files within subfolders.
        dry_run (bool): If True, simulate renames without modifying files.
    """
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[RENAME]"
    status_verb = "Simulating renaming" if dry_run else "Starting renaming"
    logger.info(f"{action_prefix}{status_verb} process in '{output_base_folder}' using base name '{base_name}'...")

    # Define the list of subfolders where renaming should occur, using config constants.
    subfolders_to_process: List[Path] = [
        output_base_folder / config.FOLDER_NAMES['export'] / config.FOLDER_NAMES['export_originals'],
        output_base_folder / config.FOLDER_NAMES['optimized'] / config.FOLDER_NAMES['optimized_jpg'],
        output_base_folder / config.FOLDER_NAMES['optimized'] / config.FOLDER_NAMES['optimized_webp'],
        output_base_folder / config.FOLDER_NAMES['compressed'] / config.FOLDER_NAMES['compressed_jpg'],
        output_base_folder / config.FOLDER_NAMES['compressed'] / config.FOLDER_NAMES['compressed_webp'],
    ]

    total_processed_count: int = 0
    # Iterate through the defined subfolders.
    for folder in subfolders_to_process:
        # In dry run mode, the folder might not physically exist yet.
        # We proceed with the simulation assuming it *would* exist.
        # If not dry run, we check if it's actually a directory.
        if dry_run or folder.is_dir():
            try:
                # Call the renaming function for each subfolder, passing the dry_run flag.
                count = rename_files_in_folder(folder, base_name, dry_run=dry_run)
                total_processed_count += count
            except Exception as e:
                 # Catch unexpected errors from the called function, though it should handle its own logging.
                 logger.error(f"{config.PREFIX_ERROR}Error during rename processing for folder '{folder}'. Error: {e}", exc_info=True)
        else:
            logger.debug(f"Subfolder '{folder}' not found or not a directory. Skipping rename for this folder.")

    # Log overall summary for the renaming phase.
    status_verb_done = "simulation" if dry_run else "process"
    count_verb = "considered" if dry_run else "processed"
    logger.info(f"{config.PREFIX_DONE}Rename {status_verb_done} finished. Total files {count_verb} across folders: {total_processed_count}.")


def create_zip_archive(folder_to_zip: Path, zip_file_path: Path, dry_run: bool = False) -> bool:
    """
    Creates a ZIP archive containing all files within a specified folder.

    Args:
        folder_to_zip (Path): The directory whose contents should be zipped.
        zip_file_path (Path): The full path where the output ZIP file should be saved.
        dry_run (bool): If True, simulate ZIP creation and log intent without creating the file.

    Returns:
        bool: True if the ZIP was created successfully (or simulated successfully),
              False otherwise.
    """
    action_prefix: str = config.PREFIX_DRYRUN if dry_run else "[ZIP]"
    status_verb = "Simulating ZIP creation" if dry_run else "Creating ZIP archive"
    logger.info(f"{action_prefix}{status_verb} '{zip_file_path.name}' from folder '{folder_to_zip.name}'...")

    # --- Dry Run Simulation ---
    if dry_run:
        # Log the intention without performing any file checks or creation.
        # Assume the source folder *would* exist and contain files in a real run.
        logger.info(f"{config.PREFIX_DRYRUN}Source folder: '{folder_to_zip}'")
        logger.info(f"{config.PREFIX_DRYRUN}Target ZIP file: '{zip_file_path}'")
        # Simulate success for dry run.
        return True

    # --- Actual ZIP Creation ---
    # Check if the source folder exists before attempting to zip.
    if not folder_to_zip.is_dir():
        logger.warning(f"{config.PREFIX_WARN}Cannot create ZIP: Source folder '{folder_to_zip}' does not exist.")
        return False # Cannot proceed if source doesn't exist.

    # Optimization: Check if the folder is empty before creating the ZIP file.
    # Use a generator expression for efficiency, stopping at the first file found.
    try:
        has_files = any(item.is_file() for item in folder_to_zip.rglob('*'))
    except PermissionError as e:
        logger.error(f"{config.PREFIX_ERROR}Permission denied checking contents of '{folder_to_zip}' for zipping: {e}")
        return False
    except Exception as e:
        logger.error(f"{config.PREFIX_ERROR}Error checking contents of '{folder_to_zip}' for zipping: {e}", exc_info=True)
        return False

    if not has_files:
        logger.info(f"{config.PREFIX_INFO}Skipping ZIP creation for empty folder: '{folder_to_zip.name}'")
        return True # Considered success, as there's nothing to zip.

    # Proceed with creating the ZIP file.
    try:
        # Open the ZIP file in write mode ('w').
        # Use ZIP_DEFLATED for compression (standard algorithm).
        # compresslevel=6 is a balance between speed and compression ratio (0=none, 9=max).
        with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
            # Use rglob to recursively find all items in the folder_to_zip.
            for item_path in folder_to_zip.rglob('*'):
                 # IMPORTANT: Only add files to the zip archive, not directories.
                 if item_path.is_file():
                    # Calculate the path *inside* the zip archive.
                    # `relative_to` creates the correct internal structure.
                    arcname: Path = item_path.relative_to(folder_to_zip)
                    # Write the file to the zip archive under the calculated internal path.
                    zipf.write(item_path, arcname=arcname)
                    logger.debug(f"Adding to ZIP: {arcname}")

        # Log success after the 'with' block closes the file properly.
        logger.info(f"{config.PREFIX_DONE}Successfully created ZIP archive: '{zip_file_path}'")
        return True

    except zipfile.BadZipFile as e:
        logger.error(f"{config.PREFIX_ERROR}Failed to create ZIP archive '{zip_file_path}'. Invalid ZIP file format: {e}", exc_info=True)
    except OSError as e:
        # Catch OS errors like permission denied, disk full.
        logger.error(f"{config.PREFIX_ERROR}Failed to create ZIP archive '{zip_file_path}'. OS Error: {e}", exc_info=True)
    except Exception as e:
        # Catch any other unexpected errors during zipping.
        logger.error(f"{config.PREFIX_ERROR}Unexpected error creating ZIP archive '{zip_file_path}'. Error: {e}", exc_info=True)

    # --- Cleanup on Failure ---
    # If an error occurred, attempt to delete any partially created ZIP file.
    if zip_file_path.exists():
        try:
            zip_file_path.unlink()
            logger.info(f"Cleaned up potentially incomplete ZIP file '{zip_file_path}' after error.")
        except Exception as cleanup_e:
            # Log if cleanup fails, but don't mask the original error.
            logger.error(f"{config.PREFIX_ERROR}Failed to cleanup incomplete ZIP file '{zip_file_path}' after error. Cleanup Error: {cleanup_e}")

    # Return False if any exception occurred during ZIP creation.
    return False