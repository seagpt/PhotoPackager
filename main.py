#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Main entry point and orchestrator for the PhotoPackager application.

This script coordinates the entire workflow:
1. Checks if running as the main script (`if __name__ == "__main__":`).
2. If so, runs the `bootstrap.py` script via subprocess to check the environment
   and dependencies *only once* at the start.
3. Imports necessary project modules (`config`, `ui`, `utils`, `filesystem`,
   `image_processing`, `tqdm`) *after* bootstrap confirms dependencies.
4. Sets up logging: Configures a root logger with a console handler (using a
   clean format) and prepares for per-shoot file handlers (using a detailed format).
5. Defines the main application logic within functions (`process_shoot`, `main`).
6. Defines `process_shoot` to handle the workflow for a single shoot:
   - Sets up shoot-specific file logging (if not dry run).
   - Gathers image files using `filesystem`.
   - Creates/plans the output structure using `filesystem`.
   - Handles original files (copy/move/leave) using `shutil` and `filesystem` paths.
   - Processes images in parallel using `concurrent.futures.ProcessPoolExecutor`
     and `image_processing.process_image`.
   - Renames processed files using `filesystem`.
   - Optionally creates ZIP archives using `filesystem`.
   - Provides per-shoot summary and notifications.
   - Cleans up the shoot-specific file logger.
7. Defines the `main` function to orchestrate the overall run:
   - Sets up signal handling (`utils.setup_signal_handler`).
   - Records start time.
   - Parses command-line arguments using the parser from `ui.setup_arg_parser`.
   - Adjusts logging level based on `--verbose`.
   - Displays the intro screen using `ui.print_intro`.
   - Determines source path(s) and processing mode (`single`/`multi`) via args or `ui` prompts.
   - Gathers global processing options via `ui.ask_global_options` and overrides with CLI args.
   - Identifies and configures individual shoots via `ui.ask_shoot_specific_options`.
   - Iterates through each configured shoot, calling `process_shoot`.
   - Provides final summary and notification.
   - Ensures logging is shut down cleanly.
8. Calls the `main()` function within the `if __name__ == "__main__":` guard.

Relies heavily on configurations from `config.py` and functions from other modules.
Includes robust error handling and aims for clarity and maintainability according
to DropShock Digital standards.

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
Project: PhotoPackager v1.0.0-refactor
License: MIT License (Consult LICENSE.md file for full details)
"""

# --- Standard Library Imports ---
# Keep standard library imports outside the main guard if they are needed globally
# or by functions defined before the main guard.
import subprocess
import sys
import logging
import argparse # Keep import for type hint in main()
import os
import shutil # Still needed for copy/move action_func in process_shoot
import time   # For timing execution
from pathlib import Path
# concurrent.futures is essential for parallel processing
from concurrent.futures import ProcessPoolExecutor, as_completed
# Import necessary types for hinting
from typing import Dict, List, Any, Optional, Union, Tuple # Ensure all needed types are here

# ----------------------------------------
# --- Bootstrap Environment Check --- MOVED ---
# ----------------------------------------
# The actual execution of bootstrap.py is now MOVED inside the
# `if __name__ == "__main__":` block further down to prevent it from
# running when the script is imported by subprocesses.

# ----------------------------------------
# --- Main Script Imports ---
# ----------------------------------------
# Import local project modules AFTER bootstrap conceptually runs.
# These might fail if bootstrap didn't install dependencies, hence the
# original check's importance. Use try-except for extra safety.
try:
    import config
    import ui
    import utils
    import filesystem
    import image_processing
    # Import tqdm here as it's used directly in the process_shoot loop.
    from tqdm import tqdm
except ImportError as e:
    # Handle cases where core project modules might be missing even after bootstrap
    # (e.g., file deleted). Log and exit.
    # Use print as logging setup might rely on config.
    print(f"CRITICAL ERROR: Failed to import a required project module ({e}). "
          "Ensure all .py files are present and bootstrap completed successfully.", file=sys.stderr)
    sys.exit(1) # Exit if core modules are missing.
except Exception as import_err:
    # Catch unexpected errors during module imports.
    print(f"CRITICAL ERROR: An unexpected error occurred during main module imports: {import_err}", file=sys.stderr)
    sys.exit(1)

# ----------------------------------------
# --- Logging Setup ---
# ----------------------------------------
# Configure the root logger. Specific file handlers will be added per shoot later.

# Define formatters: one detailed for files, one clean for console.
# Rationale: File logs need full context (timestamp, level, module name) for debugging.
# Console logs should be cleaner for user readability, omitting the module name.
file_log_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)-7s] [%(name)-18s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S" # Consistent timestamp format
)
console_log_formatter = logging.Formatter(
    # OMITTING %(name) for cleaner console output
    "%(asctime)s [%(levelname)-7s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Get the root logger.
logger = logging.getLogger()

# --- Console Handler (Always Active) ---
# Use stdout for info/debug, stderr is implicitly used for warning+ by default streams.
console_handler = logging.StreamHandler(sys.stdout)
# Apply the CLEAN format specifically to the console handler.
console_handler.setFormatter(console_log_formatter)
# Add the console handler to the root logger.
logger.addHandler(console_handler)

# --- Set Initial Logging Level ---
# Default to INFO. This will be overridden by --verbose flag later in main().
logger.setLevel(logging.INFO)
console_handler.setLevel(logging.INFO) # Ensure handler also respects initial level
logger.debug("Root logger configured with console handler (clean format). File handler format prepared.")

# ----------------------------------------
# --- Core Application Logic ---
# ----------------------------------------

def process_shoot(
    shoot_source_path: Path,
    shoot_config: Dict[str, Any],
    global_choices: Dict[str, Any],
    args: argparse.Namespace
) -> None:
    """
    Handles the entire processing workflow for a single shoot.

    Orchestrates calls to filesystem, image_processing, and utils modules based
    on the shoot configuration, global options, and command-line arguments (like dry_run).
    Manages shoot-specific logging setup and teardown.

    Args:
        shoot_source_path (Path): The validated source directory containing images for this shoot.
        shoot_config (Dict[str, Any]): Dictionary containing shoot-specific settings
                                       ('shoot_name', 'base_name', 'output_parent', 'source_path').
        global_choices (Dict[str, Any]): Dictionary containing global processing options
                                         ('generate_jpg', 'original_action', 'exif_option', etc.).
        args (argparse.Namespace): Parsed command-line arguments, used crucially to access flags
                                   like `dry_run`, `workers`, `verbose`.

    Returns:
        None. Results are saved to disk (or simulated), and progress/errors are logged.

    Raises:
        KeyboardInterrupt: If caught during processing, allowing main loop to handle.
        # Other exceptions should be logged within the function, preventing crash of entire run if possible.
    """
    # --- Setup & Variable Extraction ---
    # Extract necessary variables for clarity and easier access.
    shoot_name: str = shoot_config["shoot_name"]
    base_name: str = shoot_config["base_name"]
    output_parent: Path = shoot_config["output_parent"]
    # CRITICAL: Get the dry_run status directly from the parsed arguments object.
    is_dry_run: bool = args.dry_run
    # Determine log prefix based on dry_run status.
    action_prefix: str = config.PREFIX_DRYRUN if is_dry_run else ""

    # Log the start of processing for this specific shoot.
    logger.info(f"{config.BOLD}--- Starting {action_prefix}processing for shoot: '{shoot_name}' ---{config.RESET}")
    logger.info(f"{action_prefix}Source image folder: '{shoot_source_path}'")
    logger.info(f"{action_prefix}Output parent folder: '{output_parent}'")
    # Use DEBUG level for potentially verbose config/choices logging.
    logger.debug(f"{action_prefix}Global choices for this shoot: {global_choices}")
    logger.debug(f"{action_prefix}Shoot config for this shoot: {shoot_config}")

    # Initialize shoot-specific variables
    file_handler: Optional[logging.FileHandler] = None
    output_base_folder: Optional[Path] = None
    image_files: List[Path] = []
    processed_count: int = 0
    errors_processing: int = 0
    skipped_processing_count: int = 0 # Track images skipped before processing pool

    try:
        # --- 1. Gather Image Files ---
        # Scan the source directory for valid image files based on ALLOWED_EXTENSIONS.
        logger.info(f"{action_prefix}Scanning for image files in '{shoot_source_path}'...")
        image_files = filesystem.gather_image_files(shoot_source_path)
        if not image_files:
            # If no compatible images are found, log a warning and skip the rest of the processing for this shoot.
            logger.warning(f"{config.PREFIX_WARN}No compatible image files found in '{shoot_source_path}'. Skipping this shoot.")
            # No 'return' needed here, subsequent steps check image_files list.
            # Update: Better to return early if no images.
            return

        # --- 2. Create Output Structure & Setup Shoot Logging ---
        logger.info(f"{action_prefix}Planning/Creating output directory structure...")
        # Call filesystem function to create (or simulate creation of) the folder hierarchy.
        # Pass the dry_run flag. This returns the path to the root output folder for the shoot.
        output_base_folder = filesystem.create_output_structure(shoot_name, output_parent, dry_run=is_dry_run)
        # Determine the full path for the shoot-specific log file using config constant.
        log_file_path: Path = output_base_folder / config.FOLDER_NAMES['log_file']

        # --- Setup File Logging (Only if NOT dry run) ---
        # Rationale: We don't want empty log files created during a dry run.
        if not is_dry_run:
            try:
                # Create and configure a file handler specific to this shoot's log.
                # Mode 'w' overwrites the log file if it exists from a previous run for this shoot.
                file_handler = logging.FileHandler(str(log_file_path), mode="w", encoding="utf-8")
                # Apply the DETAILED format (including logger name) to the file handler.
                file_handler.setFormatter(file_log_formatter)
                # Set the level for the file handler (usually DEBUG if verbose, else INFO).
                file_handler.setLevel(logging.DEBUG if args.verbose else logging.INFO)
                # Add this specific handler to the root logger.
                logger.addHandler(file_handler)
                logger.info(f"Shoot-specific file logging started at: '{log_file_path}'")

                # --- Log Tool Attribution (Once per shoot log, if not dry run) ---
                # Rationale: Ensure attribution is present in the persistent log record.
                logger.info(f"Processing performed by {config.TOOL_DISPLAY_NAME} vX.Y.Z " # TODO: Add version from config/importlib.metadata
                            f"(Original Developer: {config.ORIGINAL_AUTHOR})")
                # Log key config/choices again to the file for context
                logger.info(f"Run Config - Shoot Name: {shoot_name}, Base Name: {base_name}")
                logger.info(f"Run Config - Output Target: {output_base_folder}")
                logger.info(f"Run Config - Global Choices: {global_choices}")
                logger.info(f"Run Config - Workers: {args.workers}, Verbose: {args.verbose}")

            except Exception as log_setup_e:
                # If setting up the file logger fails, log to console and continue without file logging for this shoot.
                logger.error(f"{config.PREFIX_ERROR}Failed to setup file logging for shoot '{shoot_name}' at '{log_file_path}'. "
                             f"Error: {log_setup_e}. Proceeding with console logging only.", exc_info=True)
                # Ensure file_handler is None so cleanup doesn't fail
                if file_handler:
                     logger.removeHandler(file_handler)
                     file_handler.close()
                     file_handler = None
        else:
            # Log the intention if in dry run mode.
            logger.info(f"{config.PREFIX_DRYRUN}Would create log file at: '{log_file_path}'")

        # --- 3. Handle Original Files (Copy/Move/Leave) ---
        # Determine action based on global choices. Default defensively to 'copy'.
        original_action: str = global_choices.get("original_action", "copy")
        # Check if the Export structure (and thus original handling) should happen at all.
        generate_export: bool = global_choices.get("generate_high_quality", True)
        # Define the target folder for originals within the output structure.
        export_originals_folder: Path = output_base_folder / config.FOLDER_NAMES['export'] / config.FOLDER_NAMES['export_originals']

        if generate_export and original_action != "leave":
            action_desc: str = "Copying" if original_action == "copy" else "Moving"
            logger.info(f"{action_prefix}Starting original file handling ({action_desc}) for {len(image_files)} files...")
            # Choose the appropriate shutil function. copy2 preserves more metadata than copy.
            # Rationale: Using shutil is standard for basic file ops. More complex sync might need other tools.
            action_func = shutil.copy2 if original_action == "copy" else shutil.move
            errors_orig: int = 0

            # Use tqdm for progress bar during this potentially long serial operation.
            # Disable progress bar if verbose logging is on (to avoid clutter) or if dry run.
            disable_tqdm: bool = args.verbose or is_dry_run
            progress_bar_orig = tqdm(image_files, desc=f"{action_prefix}{action_desc} originals", unit="file", disable=disable_tqdm, leave=False)

            for src_path in progress_bar_orig:
                try:
                    # Construct the destination path inside the export originals folder.
                    # Use the original filename initially; renaming happens later if needed.
                    dest_path: Path = export_originals_folder / src_path.name

                    # --- Dry Run Simulation ---
                    if is_dry_run:
                        # Log the intended action clearly.
                        logger.info(f"{config.PREFIX_DRYRUN}Would {original_action} '{src_path.name}' to '{dest_path}'")
                    # --- Actual Operation ---
                    else:
                        # Ensure the parent directory exists (should be true if structure creation worked).
                        # This check is slightly redundant if create_output_structure succeeded, but adds safety.
                        # Use exist_ok=True for mkdir.
                        dest_path.parent.mkdir(parents=True, exist_ok=True)
                        # Execute the copy or move operation. Use str paths for shutil compatibility.
                        action_func(str(src_path), str(dest_path))
                        logger.debug(f"Performed {original_action}: '{src_path.name}' -> '{dest_path}'")

                except (FileNotFoundError, shutil.Error, OSError) as e_orig:
                    # Catch specific expected errors related to file operations.
                    logger.error(f"{config.PREFIX_ERROR}Failed to {original_action} '{src_path.name}'. Error: {e_orig}", exc_info=args.verbose)
                    errors_orig += 1
                except Exception as e_orig_unexpected:
                    # Catch unexpected errors during this specific file operation.
                    logger.error(f"{config.PREFIX_ERROR}Unexpected error handling original '{src_path.name}'. Error: {e_orig_unexpected}", exc_info=True)
                    errors_orig += 1
            # Close the progress bar explicitly
            progress_bar_orig.close()

            # Log summary for this stage.
            summary_verb = "simulation" if is_dry_run else "operation"
            if errors_orig > 0:
                logger.warning(f"{config.PREFIX_WARN}Encountered {errors_orig} errors during original file handling {summary_verb}.")
            else:
                logger.info(f"{config.PREFIX_DONE}Successfully completed original file handling {summary_verb} ({action_desc}).")

        elif generate_export and original_action == "leave":
            logger.info(f"{action_prefix}Original files will be left in source folder ('{shoot_source_path}') as requested.")
        else: # Corresponds to original_action == 'none'
            logger.info(f"{action_prefix}Skipping original file handling and '{config.FOLDER_NAMES['export']}' folder generation as requested.")

        # --- 4. Process Images in Parallel (Optimized/Compressed) ---
        # Determine the list of image paths to process. This depends on whether originals were moved.
        processing_tasks: List[Tuple[Path, Path, Dict[str, Any], bool]] = [] # Define tuple structure for clarity
        logger.info(f"{action_prefix}Preparing image processing tasks...")

        for img_path in image_files:
            # Determine the path to the image file that should be used as input for processing.
            current_img_path_for_processing: Path = img_path # Assume original path initially

            if original_action == "move" and generate_export:
                # If originals were moved, the source for processing is now in the export folder.
                moved_path: Path = export_originals_folder / img_path.name
                # Check if the moved file exists (or assume it would exist in dry run).
                if is_dry_run or moved_path.exists():
                    current_img_path_for_processing = moved_path
                    logger.debug(f"Using moved file path for processing task: '{moved_path}'")
                else: # Original was supposed to move but isn't found there (and not dry run).
                    logger.error(f"{config.PREFIX_ERROR}Original file '{img_path.name}' was set to 'move' but not found at expected location "
                                 f"'{moved_path}'. Skipping processing for this image.")
                    skipped_processing_count += 1
                    continue # Skip adding this task
            elif not current_img_path_for_processing.exists() and not is_dry_run and original_action != "move":
                # If copying or leaving, and the original source file is gone unexpectedly, log error and skip.
                # This shouldn't happen if `gather_image_files` worked initially, but check defensively.
                logger.error(f"{config.PREFIX_ERROR}Source file '{current_img_path_for_processing}' not found for processing (Action: {original_action}). Skipping.")
                skipped_processing_count += 1
                continue # Skip adding this task

            # Add the task details to the list for the process pool.
            # Pass necessary arguments to image_processing.process_image:
            # (source image path, output base folder, global choices dict, dry run flag)
            # Note: shoot_config is currently omitted as image_processing doesn't use it directly, simplifies pickling.
            processing_tasks.append((current_img_path_for_processing, output_base_folder, global_choices, is_dry_run))

        # Only proceed if there are tasks to run after validation.
        if processing_tasks:
            num_tasks = len(processing_tasks)
            status_verb = "Simulating" if is_dry_run else "Processing"
            # Use configured number of workers from args.
            num_workers = args.workers
            logger.info(f"{action_prefix}Starting parallel image {status_verb.lower()} for {num_tasks} images using {num_workers} workers...")

            # Use ProcessPoolExecutor for CPU-bound image processing tasks.
            # `with` statement ensures the pool is properly shut down.
            with ProcessPoolExecutor(max_workers=num_workers) as executor:
                # Submit tasks to the pool. Store future->task mapping for error reporting context.
                # Rationale: This allows us to know which input file caused an error in the worker.
                future_to_task_map: Dict[Any, Tuple] = {
                    executor.submit(image_processing.process_image, *task_args): task_args
                    for task_args in processing_tasks
                }

                # Setup progress bar for parallel tasks using tqdm.
                disable_tqdm = args.verbose or is_dry_run
                progress_bar_proc = tqdm(as_completed(future_to_task_map), total=num_tasks,
                                         desc=f"{action_prefix}{status_verb} '{shoot_name}'", unit="image",
                                         disable=disable_tqdm, leave=True) # leave=True keeps bar after completion

                try:
                    # Iterate through completed futures as they finish.
                    for future in progress_bar_proc:
                        task_args_completed = future_to_task_map[future]
                        source_path_used = task_args_completed[0] # Get the source path used for this completed task
                        try:
                            # Call result() to retrieve the result (None in this case) or
                            # Reraise any exception that occurred in the worker process.
                            future.result()
                            # If result() doesn't raise, the task completed successfully.
                            processed_count += 1
                        except Exception as exc:
                            # Log errors that happened *within* the worker process.
                            # Include the source path that caused the error.
                            logger.error(f"{config.PREFIX_ERROR}Error processing image derived from '{source_path_used.name}'. "
                                         f"Worker Error: {exc}", exc_info=args.verbose) # Show traceback if verbose
                            errors_processing += 1
                except KeyboardInterrupt:
                    # Handle interruption gracefully during parallel processing.
                    logger.warning(f"{config.PREFIX_WARN}Parallel processing interrupted by user (Ctrl+C). Attempting shutdown...")
                    # Attempt to cancel pending futures and shutdown the pool without waiting indefinitely.
                    # Note: Tasks already running might complete or be terminated abruptly depending on OS.
                    executor.shutdown(wait=False, cancel_futures=True)
                    # Re-raise the interrupt to stop the main script execution.
                    raise
                except Exception as pool_exc:
                    # Catch errors related to the pool itself (e.g., process management issues).
                    logger.critical(f"{config.PREFIX_ERROR}A critical error occurred in the process pool manager: {pool_exc}", exc_info=True)
                    # Assume all remaining tasks failed if the pool itself has an issue.
                    errors_processing = num_tasks + skipped_processing_count - processed_count # Update error count

            # Log summary after pool finishes or is interrupted.
            status_verb_done = "simulation" if is_dry_run else "processing"
            final_error_count = errors_processing + skipped_processing_count
            logger.info(f"{config.PREFIX_DONE}Image {status_verb_done} finished. "
                        f"Successfully processed/simulated: {processed_count}, "
                        f"Errors/Skipped: {final_error_count}")
        else:
            # Log if no images were available or prepared for processing.
            logger.info(f"{action_prefix}No images available or prepared for processing stage.")
            final_error_count = skipped_processing_count # Keep track of skips

        # --- 5. Rename Processed Files ---
        # This step should run even if there were processing errors, as some files might have been created.
        # Renaming uses the base_name provided by the user.
        rename_status_verb = "simulation" if is_dry_run else "process"
        logger.info(f"{action_prefix}Starting final file renaming {rename_status_verb}...")
        try:
            # Call the filesystem function to handle renaming in all relevant output subfolders.
            # Pass the dry_run flag. It should handle non-existent folders gracefully.
            filesystem.rename_processed_files(output_base_folder, base_name, dry_run=is_dry_run)
            logger.info(f"{config.PREFIX_DONE}File renaming {rename_status_verb} completed.")
        except Exception as rename_e:
            logger.error(f"{config.PREFIX_ERROR}An unexpected error occurred during file renaming {rename_status_verb}: {rename_e}", exc_info=True)

        # --- 6. Create ZIP Archives (Optional) ---
        # Check if ZIP generation is enabled globally via choices.
        if global_choices.get("generate_zips", False):
            zip_status_verb = "simulation" if is_dry_run else "process"
            logger.info(f"{action_prefix}Starting ZIP archive creation {zip_status_verb}...")
            # Define the parent folder where ZIPs will be saved (usually the root shoot output folder).
            zip_parent_folder: Path = output_base_folder

            # Define source folders and target zip paths using config constants.
            # Rationale: Centralize mapping for clarity.
            folders_to_zip_map: Dict[str, Path] = {}
            zip_filenames: Dict[str, Path] = {}

            # Conditionally add folders to map based on whether they were generated.
            if generate_export:
                 folders_to_zip_map["zip_export"] = output_base_folder / config.FOLDER_NAMES['export']
                 zip_filenames["zip_export"] = zip_parent_folder / config.FOLDER_NAMES['zip_export']
            if global_choices.get("generate_optimized", True): # Assumed True
                 folders_to_zip_map["zip_optimized"] = output_base_folder / config.FOLDER_NAMES['optimized']
                 zip_filenames["zip_optimized"] = zip_parent_folder / config.FOLDER_NAMES['zip_optimized']
            if global_choices.get("generate_low_quality", True):
                 folders_to_zip_map["zip_compressed"] = output_base_folder / config.FOLDER_NAMES['compressed']
                 zip_filenames["zip_compressed"] = zip_parent_folder / config.FOLDER_NAMES['zip_compressed']

            zip_errors: int = 0
            # Iterate through the folders intended for zipping.
            for zip_key, folder_to_zip in folders_to_zip_map.items():
                zip_file_path = zip_filenames.get(zip_key)
                if zip_file_path:
                    try:
                        # Call the filesystem function, passing the dry_run flag.
                        # It returns True on success/simulation, False on error.
                        success = filesystem.create_zip_archive(folder_to_zip, zip_file_path, dry_run=is_dry_run)
                        if not success and not is_dry_run:
                             zip_errors += 1
                    except Exception as zip_e:
                         logger.error(f"{config.PREFIX_ERROR}Unexpected error calling create_zip_archive for '{zip_key}': {zip_e}", exc_info=True)
                         zip_errors += 1
                else:
                     logger.warning(f"Could not find target ZIP filename for key '{zip_key}'. Skipping ZIP.")


            if zip_errors > 0:
                 logger.warning(f"{config.PREFIX_WARN}Encountered {zip_errors} errors during ZIP archive creation.")
            else:
                 logger.info(f"{config.PREFIX_DONE}ZIP archive creation {zip_status_verb} finished.")
        else:
            # Log if ZIP creation was skipped via global choice.
            logger.info(f"{action_prefix}Skipping ZIP archive creation as requested.")

        # --- Shoot Completion Summary ---
        summary_mode_text = f" {config.BOLD}(DRY RUN){config.RESET}" if is_dry_run else ""
        final_total_errors = final_error_count # Combine processing skips/errors and other potential errors (e.g., zip)
        summary_msg = (f"Shoot '{shoot_name}'{summary_mode_text} complete. "
                       f"Images Found: {len(image_files)}, Processed: {processed_count}, Errors/Skipped: {final_total_errors}.")
        logger.info(f"{config.BOLD}{config.GREEN}{summary_msg}{config.RESET}")

        # Print a cleaner summary block to the console for the user.
        print(f"\n{config.GREEN}{config.BOLD}=== SUMMARY for '{shoot_name}'{summary_mode_text} ==={config.RESET}")
        print(f"  Source: '{shoot_source_path}'")
        print(f"  Output Target: '{output_base_folder}'")
        print(f"  Images Found: {len(image_files)}")
        if processing_tasks: # Only show processing stats if tasks were attempted
            processed_verb = "Would process/simulate" if is_dry_run else "Successfully Processed"
            print(f"  {processed_verb}: {processed_count}")
            print(f"  Processing Errors/Skipped: {final_total_errors}")
        elif skipped_processing_count > 0:
             print(f"  Processing Skipped (No valid images found/prepared after initial scan/move check).")
             print(f"  Files Skipped: {skipped_processing_count}")
        else: # Should only happen if initial gather found 0 files
             print(f"  Processing Skipped (No images found in source).")

        # Show log file path if created, or intended path if dry run.
        if not is_dry_run and file_handler:
            print(f"  Log file: '{log_file_path}'")
        elif output_base_folder: # Check if output_base_folder was determined
            print(f"  Log file target: '{log_file_path}' (Dry Run)")
        print(f"{config.GREEN}{'='* (len(shoot_name) + len(summary_mode_text) + 20)}{config.RESET}")

        # Send desktop notification (only if *not* dry run and processing happened).
        # Check if output_base_folder exists as a proxy for whether processing was attempted.
        if not is_dry_run and output_base_folder:
            try:
                utils.send_notification(summary_msg, f"{config.TOOL_DISPLAY_NAME}: '{shoot_name}' Done")
            except Exception as notify_e:
                # Catch errors from notification utility, but don't stop the main flow.
                logger.warning(f"Failed to send desktop notification for shoot '{shoot_name}': {notify_e}", exc_info=False)

    finally:
        # --- Cleanup Shoot-Specific Logger ---
        # This block ensures the file handler is removed and closed even if errors occurred during the shoot processing.
        if file_handler:
            logger.info(f"Closing log file handler for shoot '{shoot_name}'.")
            try:
                logger.removeHandler(file_handler)
                file_handler.close()
            except Exception as e_close:
                # Log if closing the handler fails, but don't prevent overall completion.
                logger.error(f"{config.PREFIX_ERROR}Error closing log handler for shoot '{shoot_name}': {e_close}")


def main() -> None:
    """Main function to initialize, parse arguments, configure, and orchestrate shoot processing."""
    # --- Initial Setup ---
    # Setup Ctrl+C signal handler early for graceful exit.
    utils.setup_signal_handler()
    # Record start time for overall duration calculation.
    start_time_all = time.time()

    try:
        # --- Argument Parsing ---
        # Get the configured ArgumentParser from the ui module.
        parser: argparse.ArgumentParser = ui.setup_arg_parser()
        # Parse the command-line arguments provided by the user.
        args: argparse.Namespace = parser.parse_args()

        # --- Logging Level Adjustment ---
        # Set logging level based on --verbose flag *after* parsing args.
        if args.verbose:
            logger.setLevel(logging.DEBUG)
            console_handler.setLevel(logging.DEBUG) # Ensure console shows debug too
            logger.debug("Verbose logging enabled via command line (--verbose).")
        else:
            logger.setLevel(logging.INFO)
            console_handler.setLevel(logging.INFO) # Ensure console shows INFO+

        # --- Log Tool Info ---
        # Log basic tool and developer info once per run start.
        logger.info(f"Starting {config.TOOL_DISPLAY_NAME} run...")
        logger.info(f"Original Developer: {config.ORIGINAL_AUTHOR}")
        # Explicitly log if dry run mode is active.
        if args.dry_run:
            # Use config colors for emphasis.
            logger.warning(f"{config.YELLOW}{config.BOLD}--- DRY RUN MODE ACTIVE --- No filesystem changes will be made.{config.RESET}")
            print(f"\n{config.YELLOW}{config.BOLD}*** DRY RUN MODE ENABLED ***{config.RESET} (No files will be created or modified)\n")


        # --- Display Intro Screen ---
        # Show the polished introduction unless suppressed by a potential future flag (e.g., --quiet).
        # Rationale: Provides immediate context and branding.
        ui.print_intro()

        # --- Determine Source Path ---
        # Use path from --source argument if provided, otherwise prompt interactively.
        source_input_path: Optional[Path] = None
        if args.source:
            logger.info(f"Source path provided via command line: '{args.source}'")
            # Validate the command-line source path. Use the same logic as interactive prompt.
            try:
                # Use ui.input_path's validation logic internally, bypassing prompt
                expanded_path = os.path.expanduser(args.source.strip().strip("'\""))
                validated_source = Path(expanded_path).resolve(strict=False)
                if not validated_source.is_dir():
                     logger.critical(f"{config.PREFIX_ERROR}Source path specified via --source is not a valid directory: '{validated_source}'. Exiting.")
                     sys.exit(1)
                source_input_path = validated_source
                logger.info(f"Validated command line source path: {source_input_path}")
            except Exception as e_source_val:
                logger.critical(f"{config.PREFIX_ERROR}Invalid --source path provided ('{args.source}'). Error: {e_source_val}. Exiting.")
                sys.exit(1)
        else:
            # Prompt user interactively if --source not used.
            logger.info("Source path not provided via command line. Prompting user interactively...")
            # Use the dedicated ui function for robust path input.
            source_input_path = ui.input_path("Enter the path to the folder containing shoot images OR shoot subfolders")

        # Exit if source path determination failed (shouldn't happen with validation, but defensive).
        if not source_input_path:
             logger.critical("Could not determine a valid source path. Exiting.")
             sys.exit(1)

        # --- Determine Mode (Multi/Single) ---
        # Use mode from --mode argument if provided, otherwise determine/ask interactively.
        is_multi_mode: bool
        if args.mode:
            is_multi_mode = (args.mode == 'multi')
            logger.info(f"Using processing mode from command line: {'Multi-shoot' if is_multi_mode else 'Single-shoot'}")
        else:
            # Simple interactive check if not specified via CLI.
            logger.info(f"Processing mode not provided via command line. Prompting user interactively based on source: '{source_input_path.name}'...")
            # Rationale: Provide context (source folder name) in the prompt.
            mode_resp: str = input(f"{config.YELLOW}Is '{source_input_path.name}' a container for MULTIPLE shoot subfolders? [y/N] (Press Enter for 'N'): {config.RESET}").strip().lower()
            is_multi_mode = (mode_resp == "y")
            logger.info(f"Processing mode determined interactively: {'Multi-shoot' if is_multi_mode else 'Single-shoot'}")

        # --- Gather Global Options ---
        # Ask interactively unless all options are covered by CLI flags.
        # The ui.ask_global_options function now uses defaults from config.py.
        logger.info(f"{config.BOLD}Gathering global processing options...{config.RESET}")
        global_choices: Dict[str, Any] = ui.ask_global_options() # This now reflects config defaults if user hits Enter.

        # --- Override Interactive Choices/Config Defaults with Explicit CLI Flags ---
        # Rationale: Command-line flags always take precedence over defaults or interactive choices.
        logger.debug("Applying command-line argument overrides to global choices...")
        # Apply --move flag
        if args.move:
            if global_choices.get("original_action") != "move":
                 logger.info("Overriding original action to 'move' based on --move flag. (Confirmation assumed accepted via CLI).")
                 global_choices["original_action"] = "move"
        # Apply --skip-export flag
        if args.skip_export:
             if global_choices.get("generate_high_quality", True):
                 logger.info("Overriding to skip Export Files generation based on --skip-export flag.")
                 global_choices["generate_high_quality"] = False
                 global_choices["original_action"] = "none" # Ensure action is consistent
        # Apply --no-jpg / --no-webp flags
        if args.no_jpg and global_choices.get("generate_jpg", True):
            logger.info("Overriding to disable JPG generation based on --no-jpg flag.")
            global_choices["generate_jpg"] = False
        if args.no_webp and global_choices.get("generate_webp", True):
            logger.info("Overriding to disable WebP generation based on --no-webp flag.")
            global_choices["generate_webp"] = False
        # Re-validate that at least one format is selected *after* applying overrides.
        if not (global_choices.get("generate_jpg", False) or global_choices.get("generate_webp", False)):
            logger.critical(f"{config.PREFIX_ERROR}Processing aborted: After applying command-line flags (--no-jpg/--no-webp), "
                            f"no output image formats (JPG or WebP) are selected to be generated.")
            sys.exit(1)
        # Apply --skip-compressed flag
        if args.skip_compressed and global_choices.get("generate_low_quality", True):
            logger.info("Overriding to skip Compressed Files generation based on --skip-compressed flag.")
            global_choices["generate_low_quality"] = False
        # Apply --no-zip flag
        if args.no_zip and global_choices.get("generate_zips", True):
            logger.info("Overriding to disable ZIP generation based on --no-zip flag.")
            global_choices["generate_zips"] = False
        # Apply --exif flag (only if different from the default/interactive choice)
        if args.exif != global_choices.get("exif_option"):
            logger.info(f"Overriding EXIF handling to '{args.exif}' based on --exif flag.")
            global_choices["exif_option"] = args.exif

        logger.debug(f"Final global choices after applying CLI overrides: {global_choices}")

        # --- Identify and Configure Shoots to Process ---
        shoots_to_process_config: List[Dict[str, Any]] = []
        if is_multi_mode:
            # Find potential shoot subdirectories within the source path.
            logger.info(f"Multi-shoot mode: Identifying subfolders in '{source_input_path}'...")
            try:
                # List items, filter for directories. Use list comprehension.
                potential_shoots = [d for d in source_input_path.iterdir() if d.is_dir()]
            except PermissionError as e_perm:
                logger.critical(f"{config.PREFIX_ERROR}Permission denied listing directories in multi-shoot source '{source_input_path}': {e_perm}. Exiting.")
                sys.exit(1)
            except Exception as e_list:
                logger.critical(f"{config.PREFIX_ERROR}Error listing directories in multi-shoot source '{source_input_path}': {e_list}. Exiting.")
                sys.exit(1)

            if not potential_shoots:
                logger.critical(f"{config.PREFIX_ERROR}Multi-shoot mode selected, but no subfolders found in '{source_input_path}'. Exiting.")
                sys.exit(1)

            logger.info(f"Found {len(potential_shoots)} potential shoot subfolders. Configuring each interactively...")
            # Configure each potential shoot subfolder using the interactive UI function.
            for shoot_dir in potential_shoots:
                # Get shoot-specific name, base name, output parent (uses contextual defaults).
                shoot_config = ui.ask_shoot_specific_options(shoot_dir)
                # --- Apply --output Override (if provided) ---
                # Rationale: Allow a global output parent override via CLI for all shoots.
                if args.output:
                    try:
                        output_parent_path = Path(os.path.expanduser(args.output.strip("'\""))).resolve(strict=False)
                        # Attempt to create/validate the path (same logic as interactive prompt)
                        output_parent_path.mkdir(parents=True, exist_ok=True)
                        if output_parent_path.is_dir():
                            if shoot_config["output_parent"] != output_parent_path:
                                 logger.info(f"Overriding output parent for '{shoot_config['shoot_name']}' "
                                             f"to CLI value: '{output_parent_path}'")
                                 shoot_config["output_parent"] = output_parent_path
                        else:
                            logger.warning(f"Cannot use specified --output path '{args.output}' as it's not a directory "
                                           f"(resolved: '{output_parent_path}'). Using default parent for this shoot.")
                    except Exception as e_out_override:
                        logger.warning(f"Cannot use or create --output path '{args.output}' (Error: {e_out_override}). "
                                       f"Using default parent for shoot '{shoot_config['shoot_name']}'.")
                shoots_to_process_config.append(shoot_config)
        else:
            # Single shoot mode: Configure the source path itself as the single shoot.
            logger.info("Single-shoot mode selected. Configuring source folder as the shoot...")
            shoot_config = ui.ask_shoot_specific_options(source_input_path)
            # Apply --output Override (if provided) - same logic as multi-mode case.
            if args.output:
                try:
                    output_parent_path = Path(os.path.expanduser(args.output.strip("'\""))).resolve(strict=False)
                    output_parent_path.mkdir(parents=True, exist_ok=True)
                    if output_parent_path.is_dir():
                        if shoot_config["output_parent"] != output_parent_path:
                             logger.info(f"Overriding output parent for '{shoot_config['shoot_name']}' "
                                         f"to CLI value: '{output_parent_path}'")
                             shoot_config["output_parent"] = output_parent_path
                    else:
                        logger.warning(f"Cannot use specified --output path '{args.output}' as it's not a directory "
                                       f"(resolved: '{output_parent_path}'). Using default parent.")
                except Exception as e_out_override:
                    logger.warning(f"Cannot use or create --output path '{args.output}' (Error: {e_out_override}). "
                                   f"Using default parent for shoot '{shoot_config['shoot_name']}'.")
            shoots_to_process_config.append(shoot_config)

        # --- Validate if any shoots were actually configured ---
        if not shoots_to_process_config:
            logger.critical("Configuration complete, but no valid shoots were identified or configured for processing. Exiting.")
            sys.exit(1)

        total_shoots = len(shoots_to_process_config)
        logger.info(f"{config.PREFIX_INFO}Configuration complete. Ready to process {total_shoots} shoot(s).")

        # --- Process Each Identified Shoot ---
        # Iterate through the list of configured shoot dictionaries.
        for i, shoot_config_item in enumerate(shoots_to_process_config):
            shoot_start_time = time.time()
            # Log clearly which shoot is starting.
            logger.info(f"{config.BOLD}--- Processing Shoot {i+1} of {total_shoots}: '{shoot_config_item['shoot_name']}' ---{config.RESET}")
            try:
                # Call the main processing function for the shoot.
                # CRITICAL: Pass the full `args` object so `process_shoot` can access `args.dry_run`, `args.workers`, etc.
                process_shoot(shoot_config_item["source_path"], shoot_config_item, global_choices, args)
            except KeyboardInterrupt:
                # Catch interrupt specifically during a shoot process. Log and re-raise.
                logger.warning(f"{config.PREFIX_WARN}Processing for shoot '{shoot_config_item['shoot_name']}' interrupted by user. Stopping run.")
                # Re-raise to be caught by the outer handler in the main try block.
                raise
            except Exception as e_proc_shoot:
                # Log critical errors occurring during a shoot's processing, but attempt to continue to the next shoot.
                # Rationale: Prevent one bad shoot from stopping the entire batch in multi-mode.
                logger.error(f"{config.PREFIX_ERROR}An unexpected critical error occurred while processing shoot '{shoot_config_item['shoot_name']}'. "
                             f"Error: {e_proc_shoot}", exc_info=args.verbose) # Show traceback if verbose
                # Also print to console for immediate user feedback.
                print(f"\n{config.RED}{config.PREFIX_ERROR}Critical error processing shoot '{shoot_config_item['shoot_name']}', see logs. "
                      f"Attempting to continue with the next shoot if any...{config.RESET}\n")
                # Continue to the next iteration of the loop.

            # Log shoot completion time.
            shoot_end_time = time.time()
            shoot_duration = shoot_end_time - shoot_start_time
            logger.info(f"{config.BOLD}--- Finished Shoot {i+1} of {total_shoots}: '{shoot_config_item['shoot_name']}' in {shoot_duration:.2f} seconds ---{config.RESET}")

        # --- Overall Completion ---
        end_time_all = time.time()
        total_duration = end_time_all - start_time_all
        # Log final completion message.
        final_summary_log = f"All processing complete ({total_shoots} shoots processed or attempted) in {total_duration:.2f} seconds."
        logger.info(f"{config.BOLD}{config.GREEN}=== {final_summary_log} ==={config.RESET}")
        # Print final summary to console.
        final_summary_console = f"Finished processing {total_shoots} shoot(s) in {total_duration:.2f} seconds."
        print(f"\n{config.GREEN}{config.BOLD}{final_summary_console}{config.RESET}")

        # Send a final overall notification (only if *not* dry run).
        if not args.dry_run:
             try:
                 utils.send_notification(final_summary_console, f"{config.TOOL_DISPLAY_NAME}: All Shoots Done")
             except Exception as notify_final_e:
                  logger.warning(f"Failed to send final desktop notification: {notify_final_e}", exc_info=False)

    # --- Exception Handling for Main Flow ---
    except KeyboardInterrupt:
        # Handle Ctrl+C cleanly if it occurs outside the main shoot processing loop (e.g., during config).
        # The signal handler in utils.py should ideally catch this first, but have fallback.
        logger.warning(f"{config.PREFIX_WARN}Main process caught KeyboardInterrupt. Exiting application.")
        print(f"\n{config.YELLOW}Operation cancelled by user.{config.RESET}")
        sys.exit(0) # Exit cleanly on user cancellation.
    except SystemExit as e:
        # Allow sys.exit calls (e.g., from bootstrap failure, validation errors) to propagate cleanly.
        logger.info(f"Application exiting with code {e.code}.")
        # No need to call sys.exit(e.code) again, it's already happening.
    except Exception as e_main_critical:
        # Catch any unexpected critical errors in the main execution flow.
        logger.critical(f"{config.PREFIX_ERROR}An unexpected critical error occurred in the main application: {e_main_critical}", exc_info=True)
        # Print error to console for immediate visibility.
        print(f"\n{config.RED}{config.BOLD}CRITICAL ERROR:{config.RESET} {config.RED}An unexpected error occurred. "
              f"Please check the application logs for details. Error: {e_main_critical}{config.RESET}\n")
        sys.exit(1) # Exit with error code 1 on critical failure.
    finally:
        # --- Ensure Logging Cleanup ---
        # This block executes regardless of whether an exception occurred or not.
        # Rationale: Properly close file handlers and shut down the logging system.
        logger.info("Shutting down logging system.")
        logging.shutdown()


# --- Script Execution Guard ---
# Ensures the following code only runs when this script is executed directly.
if __name__ == "__main__":
    # --- Bootstrap Environment Check (MOVED INSIDE GUARD) ---
    # Critical first step: Ensure the Python environment and dependencies are suitable.
    # Run bootstrap.py as a separate process *before* importing project modules or running main logic.
    # Rationale: Prevents import errors if dependencies are missing; ensures isolation.
    # Moved here to prevent execution in multiprocessing subprocesses.
    try:
        print("--- Running Environment Bootstrap Check ---")
        # Use sys.executable to ensure the same Python interpreter is used.
        # Pass '-u' for unbuffered output from bootstrap if needed for debugging.
        bootstrap_script_path = Path(__file__).parent / "bootstrap.py"
        if not bootstrap_script_path.is_file():
             print(f"CRITICAL ERROR: bootstrap.py not found at '{bootstrap_script_path}'. Cannot proceed.", file=sys.stderr)
             sys.exit(1)

        subprocess.check_call([sys.executable, str(bootstrap_script_path)])
        # If bootstrap.py exits successfully (code 0), execution continues here.
        print("--- Bootstrap Check Passed ---")

    except subprocess.CalledProcessError as bootstrap_err:
        # bootstrap.py likely exited with a non-zero code (error or user cancellation).
        # bootstrap.py should print its own specific error messages.
        print(f"\nERROR: Environment bootstrap process failed (exit code {bootstrap_err.returncode}). Cannot continue.", file=sys.stderr)
        # Exit the main script as the environment is not ready.
        sys.exit(1)
    except FileNotFoundError:
        # Should be caught above by explicit check, but handle defensively.
        print("CRITICAL ERROR: bootstrap.py script not found. Cannot proceed.", file=sys.stderr)
        sys.exit(1)
    except Exception as boot_exec_e:
        # Catch any other unexpected errors during the bootstrap subprocess execution itself.
        print(f"CRITICAL ERROR: An unexpected error occurred while trying to run bootstrap.py: {boot_exec_e}", file=sys.stderr)
        sys.exit(1)
    # --- Bootstrap Complete ---

    # --- Call the Main Application Logic ---
    # Now that bootstrap has presumably succeeded, call the main() function which contains
    # the rest of the application setup and execution flow.
    main()