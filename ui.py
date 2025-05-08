#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Handles all console user interaction for the PhotoPackager application.

This module is solely responsible for managing the command-line interface (CLI)
experience. Its duties include:
- Displaying the stylized introductory information screen (`print_intro`).
- Setting up and managing the command-line argument parser (`argparse`).
- Prompting the user for necessary input paths and settings using standardized,
  colored prompts, including immediate input validation and sanitization
  (`input_path`, `get_valid_name`, `get_valid_folder_path_input`).
- Interactively gathering global processing choices (`ask_global_options`) and
  shoot-specific configurations (`ask_shoot_specific_options`).
- Implementing mandatory safety confirmations for potentially destructive actions
  (specifically, the 'move' operation for original files).

This module strictly avoids performing core application logic (like image
processing or filesystem operations), delegating those tasks to other specialized
modules (`image_processing.py`, `filesystem.py`). It relies heavily on constants
defined in `config.py` for consistent UI appearance (colors, names, prefixes)
and default values, and uses helper functions from `utils.py` for validation.

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
Project: PhotoPackager v1.0.0-refactor
License: MIT License (Consult LICENSE.md file for full details)
"""

# --- Standard Library Imports ---
import os
import logging
import argparse
from pathlib import Path

# Import necessary types for hinting
from typing import Union, Tuple, Optional, List

# --- Project-Specific Imports ---
# Use try-except to handle potential import errors gracefully, although these
# core modules are expected to be present after bootstrap.
try:
    # config.py: Central repository for ALL constants and settings. CRITICAL.
    import config
    # utils.py: Provides generic helper functions like name validation.
except ImportError as e:
    print(f"[ERROR] Failed to import a required module: {e}")
    exit(1)

# --- Module Logger Setup ---
# Get a logger specific to this module for internal UI-related logging.
# Note: The main application logger (root) is configured in main.py.
logger = logging.getLogger(__name__)

# ----------------------------------------
# --- Introduction Screen ---
# ----------------------------------------


def print_intro() -> None:
    """
    Prints the stylized introduction screen using constants from config.py.

    This function constructs and displays the initial welcome message, branding,
    workflow overview, and important operational notes to the user upon starting
    the application. It strictly adheres to the DropShock aesthetic standard
    for polish and clarity, dynamically incorporating user and original author
    branding configured in config.py.

    Args:
        None

    Returns:
        None
    """
    # --- Introduction Text Construction ---
    # Uses an f-string to dynamically build the multi-line introduction text.
    # All display names, branding details, folder names, and stylistic elements
    # (colors, bolding) are sourced *exclusively* from the config module
    # to ensure central control and consistency.
    intro_text = f"""
{config.ORANGE}{config.BOLD}============================================================
                     {config.TOOL_DISPLAY_NAME}
            Intelligent Photo Organization & Processing
============================================================{config.RESET}

{config.BOLD}Powered by:{config.RESET} {config.USER_COMPANY_NAME}
{config.BOLD}Website:{config.RESET}    {config.USER_WEBSITE}
{config.BOLD}Support:{config.RESET}    {config.USER_SUPPORT_EMAIL}

Welcome to {config.TOOL_DISPLAY_NAME}, your automated solution for preparing professional
photo deliveries. This tool organizes, optimizes, renames, and packages
your images efficiently, saving you valuable time.

{config.YELLOW}{config.BOLD}Core Workflow:{config.RESET}
------------------------------------------------------------
1.  {config.BOLD}Input:{config.RESET} Provide a source folder (single shoot or multi-shoot container).
2.  {config.BOLD}Configure:{config.RESET} Choose output formats (JPG/WebP), original file handling (copy/move/leave),
    EXIF metadata options, and optional ZIP creation.
3.  {config.BOLD}Process:{config.RESET} The tool automatically:
    * Creates a standardized output folder structure ({config.FOLDER_NAMES['export']}, {config.FOLDER_NAMES['optimized']}, {config.FOLDER_NAMES['compressed']}).
    * Generates high-quality 'Optimized' and web-friendly 'Compressed' versions.
"""
    # --- Print to Console ---
    # Print the fully constructed introduction text.
    print(intro_text)
    # Log that the intro was displayed (useful for debugging flow).
    logger.debug("Introduction screen printed to console.")


# ----------------------------------------
# --- Input Helper Functions ---
# ----------------------------------------
# These functions are responsible for reliably getting specific types of input
# from the user via the console, incorporating validation, sanitization,
# clear prompting, and adherence to the UI standards.


def input_path(prompt: str) -> Path:
    """
    Gets a valid, existing directory path from the user via console input.

    This function repeatedly prompts the user until a valid directory path is
    entered. It handles path normalization (expanding '~', resolving '..'),
    basic sanitization (removing whitespace, quotes), and ensures the final
    path points to an accessible directory on the filesystem.

    Args:
        prompt (str): The message to display to the user when asking for the path,
                      formatted according to UI standards (e.g., without trailing colon).

    Returns:
        Path: A pathlib.Path object representing the validated, absolute directory path
              provided by the user.

    Raises:
        KeyboardInterrupt: If the user presses Ctrl+C during the prompt.
    """
    while True:
        try:
            # --- Prompt User ---
            # Construct the prompt with standard styling (Yellow, Reset) from config.
            # Use .strip() and .strip("'\"") for basic sanitization against common copy-paste issues.
            raw_path_input: str = (
                input(f"{config.YELLOW}{prompt}:{config.RESET} ").strip().strip("'\"")
            )

            # --- Basic Input Check ---
            # Ensure the user provided some input.
            if not raw_path_input:
                print(
                    f"{config.RED}{config.PREFIX_ERROR}Input cannot be empty. Please provide a valid folder path.{config.RESET}"
                )
                continue  # Re-prompt

            # --- Path Normalization and Validation ---
            # Use a try-except block specifically for path operations.
            try:
                # Expand user home directory alias (e.g., '~') if present.
                expanded_path: str = os.path.expanduser(raw_path_input)
                # Create a Path object and resolve it to an absolute path, handling '..' etc.
                # This can raise OSError on invalid formats (e.g., on Windows with illegal chars).
                normalized_path: Path = Path(expanded_path).resolve(
                    strict=False
                )  # strict=False allows resolving non-existent paths initially

                # THE CRITICAL VALIDATION: Check if the resolved path exists AND is a directory.
                if normalized_path.is_dir():
                    logger.debug(f"Validated input directory path: '{normalized_path}'")
                    # If valid, return the Path object.
                    return normalized_path
                else:
                    # Provide specific feedback if the path is not a directory or doesn't exist.
                    if normalized_path.exists():
                        print(
                            f"{config.RED}{config.PREFIX_ERROR}Path exists but is not a directory: '{normalized_path}'. Please enter a valid folder path.{config.RESET}"
                        )
                    else:
                        print(
                            f"{config.RED}{config.PREFIX_ERROR}Directory not found: '{normalized_path}'. Please check the path and try again.{config.RESET}"
                        )
                    continue  # Re-prompt

            # --- Handle Path Resolution/Validation Errors ---
            except OSError as e_os:
                # Catch OS-level errors during path resolution (e.g., invalid syntax for the OS).
                print(
                    f"{config.RED}{config.PREFIX_ERROR}Error resolving path '{raw_path_input}': {e_os}. Please enter a valid path format.{config.RESET}"
                )
                logger.warning(
                    f"OSError resolving user path input '{raw_path_input}': {e_os}"
                )
                continue  # Re-prompt
            except Exception as e_path:
                # Catch any other unexpected errors during path processing.
                print(
                    f"{config.RED}{config.PREFIX_ERROR}An unexpected error occurred validating the path: {e_path}. Please try again.{config.RESET}"
                )
                logger.error(
                    f"Unexpected error validating path in input_path: {e_path}",
                    exc_info=True,
                )
                continue  # Re-prompt

        # --- Handle Keyboard Interrupt ---
        except KeyboardInterrupt:
            # Allow Ctrl+C to interrupt the input loop gracefully.
            # The main signal handler (in utils/main) will catch this and exit.
            logger.warning("User interrupted path input.")
            raise  # Re-raise KeyboardInterrupt to be caught by the main handler.
        except EOFError:
            # Handle unexpected end-of-file (e.g., if input is piped and ends)
            print(
                f"\n{config.RED}{config.PREFIX_ERROR}Input stream ended unexpectedly. Exiting.{config.RESET}"
            )
            logger.error("EOFError encountered during input prompt.")
            exit(1)  # Cannot proceed without input


def get_valid_name(prompt: str, default: str) -> str:
    """
    Gets a valid name (for shoots, file bases) from the user, ensuring it
    doesn't contain characters invalid for file/folder names and is not empty.

    Uses a default value if the user enters nothing, provided the default itself
    is valid according to `utils.validate_name`.

    Args:
        prompt (str): The message to display to the user (without trailing colon).
        default (str): The default value to suggest and use if the user provides no input.

    Returns:
        str: The validated, non-empty name suitable for use in file/folder naming.

    Raises:
        KeyboardInterrupt: If the user presses Ctrl+C during the prompt.
    """
    while True:
        try:
            # --- Prompt User ---
            # Show the prompt and the default value clearly.
            # Use .strip() for basic whitespace sanitization.
            user_input_name: str = input(
                f"{config.YELLOW}{prompt} (default: '{default}'):{config.RESET} "
            ).strip()

            # --- Handle Input Cases ---
            # 1. User pressed Enter (no input provided)
            if not user_input_name:
                # Validate the *default* name before accepting it.
                if utils.validate_name(default):
                    logger.debug(f"Using valid default name: '{default}'")
                    return default
                else:
                    # This indicates an issue with the provided default value itself.
                    # It should be caught during development, but handled defensively here.
                    print(
                        f"{config.RED}{config.PREFIX_ERROR}The default name ('{default}') contains invalid characters. "
                        f"Please provide a valid name manually.{config.RESET}"
                    )
                    # Loop continues, forcing user input as the default is unusable.
                    continue

            # 2. User provided input - Validate it.
            elif not utils.validate_name(user_input_name):
                # Provide specific feedback about invalid characters.
                # Guidance: Refer to standard OS limitations.
                print(
                    f"{config.RED}{config.PREFIX_ERROR}The name '{user_input_name}' contains invalid characters. "
                    f'Avoid using: \\ / : * ? " < > | etc. Please try again.{config.RESET}'
                )
                # Loop continues.
                continue

            # 3. User provided valid, non-empty input.
            else:
                logger.debug(f"Using user-provided valid name: '{user_input_name}'")
                return user_input_name

        # --- Handle Keyboard Interrupt ---
        except KeyboardInterrupt:
            logger.warning("User interrupted name input.")
            raise  # Re-raise for main handler
        except EOFError:
            # Handle unexpected end-of-file
            print(
                f"\n{config.RED}{config.PREFIX_ERROR}Input stream ended unexpectedly. Exiting.{config.RESET}"
            )
            logger.error("EOFError encountered during name input prompt.")
            exit(1)


def get_valid_folder_path_input(prompt: str, default: Path) -> Path:
    """
    Gets a valid *output* folder path from the user. If the path doesn't exist,
    it attempts to create it. Verifies writability implicitly via mkdir.

    Args:
        prompt (str): The message to display to the user (without trailing colon).
        default (Path): The *resolved* default Path object to use if the user provides no input.

    Returns:
        Path: The validated Path object, ensured to exist and be accessible (or created).

    Raises:
        KeyboardInterrupt: If the user presses Ctrl+C during the prompt.
    """
    while True:
        try:
            # --- Prompt User ---
            # Show prompt and the string representation of the default path.
            folder_input: str = (
                input(f"{config.YELLOW}{prompt} (default: '{default}'):{config.RESET} ")
                .strip()
                .strip("'\"")
            )

            target_path: Path
            is_default_used: bool = False

            # --- Determine Target Path (Default or User Input) ---
            if not folder_input:
                # User hit Enter, use the provided default path object.
                target_path = default
                is_default_used = True
                logger.debug(f"Attempting to use default output path: '{target_path}'")
            else:
                # User provided input, process it.
                try:
                    expanded_path: str = os.path.expanduser(folder_input)
                    # Resolve the path. Allow non-existent paths for now (mkdir will create).
                    target_path = Path(expanded_path).resolve(strict=False)
                    logger.debug(
                        f"Attempting to use user-provided output path: '{target_path}'"
                    )
                except OSError as e_os:
                    print(
                        f"{config.RED}{config.PREFIX_ERROR}Error resolving path '{folder_input}': {e_os}. Please enter a valid path format.{config.RESET}"
                    )
                    logger.warning(
                        f"OSError resolving user output path input '{folder_input}': {e_os}"
                    )
                    continue  # Re-prompt
                except Exception as e_resolve:
                    print(
                        f"{config.RED}{config.PREFIX_ERROR}An unexpected error occurred processing the path: {e_resolve}. Please try again.{config.RESET}"
                    )
                    logger.error(
                        f"Unexpected error resolving path in get_valid_folder_path_input: {e_resolve}",
                        exc_info=True,
                    )
                    continue  # Re-prompt

            # --- Validate by Attempting Creation / Check Existing ---
            # Use a try-except block for the filesystem interaction (mkdir).
            try:
                # Attempt to create the directory.
                # `parents=True`: Creates needed parent directories.
                # `exist_ok=True`: Doesn't raise an error if it already exists.
                # This implicitly checks for writability in the parent dir if creating,
                # or accessibility if it already exists.
                target_path.mkdir(parents=True, exist_ok=True)

                # One final check to ensure it IS a directory after mkdir (belt and suspenders)
                if not target_path.is_dir():
                    # This case is unlikely if mkdir succeeded but possible in race conditions or weird FS states.
                    print(
                        f"{config.RED}{config.PREFIX_ERROR}Path was created or existed, but is not a directory: '{target_path}'. Please check the path.{config.RESET}"
                    )
                    logger.error(
                        f"Path '{target_path}' confirmed not a directory after mkdir attempt."
                    )
                    continue  # Re-prompt

                # If mkdir succeeded or the directory already existed and is accessible:
                log_source = "default" if is_default_used else "user-specified"
                logger.info(
                    f"Confirmed valid output parent directory ({log_source}): '{target_path}'"
                )
                return target_path

            # --- Handle Creation/Access Errors ---
            except PermissionError:
                # Specific feedback for permission issues.
                print(
                    f"{config.RED}{config.PREFIX_ERROR}Permission denied. Cannot create or access folder at: '{target_path}'. "
                    f"Check permissions or choose a different location.{config.RESET}"
                )
                logger.warning(
                    f"PermissionError accessing/creating output directory '{target_path}'"
                )
                continue  # Re-prompt
            except OSError as e_os_create:
                # Catch other OS errors during mkdir (e.g., invalid name component on some OS, disk full).
                print(
                    f"{config.RED}{config.PREFIX_ERROR}Cannot create or access folder at '{target_path}'. OS Error: {e_os_create}. "
                    f"Please check the path or disk space.{config.RESET}"
                )
                logger.error(
                    f"OSError creating/accessing output directory '{target_path}': {e_os_create}",
                    exc_info=True,
                )
                continue  # Re-prompt
            except Exception as e_create:
                # Catch any other unexpected errors during directory creation/check.
                print(
                    f"{config.RED}{config.PREFIX_ERROR}An unexpected error occurred confirming the output directory: {e_create}. "
                    f"Please try again.{config.RESET}"
                )
                logger.error(
                    f"Unexpected error creating/checking directory in get_valid_folder_path_input: {e_create}",
                    exc_info=True,
                )
                continue  # Re-prompt

        # --- Handle Keyboard Interrupt ---
        except KeyboardInterrupt:
            logger.warning("User interrupted output path input.")
            raise  # Re-raise for main handler
        except EOFError:
            # Handle unexpected end-of-file
            print(
                f"\n{config.RED}{config.PREFIX_ERROR}Input stream ended unexpectedly. Exiting.{config.RESET}"
            )
            logger.error("EOFError encountered during output path input prompt.")
            exit(1)


# ----------------------------------------
# --- Option Gathering Functions ---
# ----------------------------------------


def ask_global_options() -> dict:
    """
    Asks the user interactively for global processing options that apply to all
    shoots being processed in the current run. Includes the mandatory safety
    confirmation for the 'move' action.

    This function handles the interactive gathering of settings like output formats,
    original file handling strategy, EXIF stripping preferences, and ZIP generation.
    It performs immediate validation where necessary (e.g., ensuring at least one
    output format is selected).

    Args:
        None

    Returns:
        dict: A dictionary containing the user's validated choices.
            Keys include: 'generate_jpg', 'generate_webp', 'generate_optimized',
                          'generate_low_quality', 'generate_high_quality',
                          'original_action', 'exif_option', 'generate_zips'.

    Raises:
        KeyboardInterrupt: If the user presses Ctrl+C during any prompt.
        SystemExit: If validation fails critically (e.g., no output format selected).
    """
    # Initialize dictionary to store choices.
    user_choices = {}
    print(
        f"\n{config.BOLD}--- Global Processing Options (Apply to all shoots in this run) ---{config.RESET}"
    )

    try:
        # --- Image Formats ---
        # Use `!= "n"` logic: Default is 'yes' unless user explicitly types 'n'.
        val_jpg: str = (
            input(
                f"{config.YELLOW}Generate JPG editions? [Y/n] (default: yes):{config.RESET} "
            )
            .strip()
            .lower()
        )
        user_choices["generate_jpg"] = val_jpg != "n"

        val_webp: str = (
            input(
                f"{config.YELLOW}Generate WebP editions? [Y/n] (default: yes):{config.RESET} "
            )
            .strip()
            .lower()
        )
        user_choices["generate_webp"] = val_webp != "n"

        # CRITICAL VALIDATION: Ensure at least one output format is selected.
        if not (user_choices["generate_jpg"] or user_choices["generate_webp"]):
            print(
                f"{config.RED}{config.PREFIX_ERROR}Processing aborted: You must select at least one output format (JPG or WebP).{config.RESET}"
            )
            logger.critical("User selected no output formats. Aborting.")
            exit(1)  # Exit application if no formats are chosen.
        logger.info(
            f"Output formats selected: JPG={user_choices['generate_jpg']}, WebP={user_choices['generate_webp']}"
        )

        # --- Output Versions ---
        # Optimized files are currently always generated as they are prerequisites for compressed.
        # This could become configurable later if needed.
        user_choices["generate_optimized"] = True
        logger.info(
            "Optimized files (high-quality) will always be generated if processing occurs."
        )

        # Ask about generating Compressed files (~2MP small versions).
        val_low: str = (
            input(
                f"{config.YELLOW}Generate Compressed Files (~{config.COMPRESSED_TARGET_PIXELS/1e6:.1f}MP web-friendly)? [Y/n] (default: yes):{config.RESET} "
            )
            .strip()
            .lower()
        )
        user_choices["generate_low_quality"] = val_low != "n"
        logger.info(
            f"Generate Compressed files: {user_choices['generate_low_quality']}"
        )

        # --- Handling Originals for Export Folder ---
        # Explain the options clearly using folder names from config.
        print(
            f"\n{config.YELLOW}How should original source images be handled for the '{config.FOLDER_NAMES['export']}' output folder?{config.RESET}"
        )
        print(
            f"  {config.BOLD}copy{config.RESET} : Create exact copies in '{config.FOLDER_NAMES['export_originals']}'. (Safest, Recommended Default)"
        )
        print(
            f"  {config.BOLD}move{config.RESET} : {config.RED}PERMANENTLY MOVE{config.RESET} originals to '{config.FOLDER_NAMES['export_originals']}'. Source folder will be empty!"
        )
        print(
            f"  {config.BOLD}leave{config.RESET}: Leave originals untouched. ('{config.FOLDER_NAMES['export_originals']}' will be empty if Export is generated)"
        )
        print(
            f"  {config.BOLD}n{config.RESET}    : Skip creating the '{config.FOLDER_NAMES['export']}' structure entirely."
        )
        val_export: str = (
            input(
                f"{config.YELLOW}Enter choice [copy/move/leave/n] (default: copy):{config.RESET} "
            )
            .strip()
            .lower()
        )

        # Set choices based on input. Default to 'copy' if input is invalid/empty.
        if val_export == "n":
            user_choices["generate_high_quality"] = (
                False  # Flag to skip Export folder creation.
            )
            user_choices["original_action"] = (
                "none"  # Indicate no action needed on originals.
            )
            logger.info("Skipping Export Originals generation entirely.")
        elif val_export == "move":
            user_choices["generate_high_quality"] = (
                True  # Export folder is needed to contain moved files.
            )
            user_choices["original_action"] = "move"
            logger.warning(
                "Selected 'move' action for original files. MANDATORY CONFIRMATION REQUIRED."
            )

            # --- MANDATORY 'move' CONFIRMATION (Non-Negotiable Safety Feature) ---
            while True:
                # Explicitly warn the user about the destructive nature of 'move'.
                confirm_move = (
                    input(
                        f"{config.RED}{config.BOLD}WARNING:{config.RESET} {config.RED}You chose 'move'. This will PERMANENTLY move files from "
                        f"your source folder(s). This action cannot be undone. "
                        f"Ensure you have backups. Are you ABSOLUTELY SURE? [y/N]:{config.RESET} "
                    )
                    .strip()
                    .lower()
                )
                if confirm_move == "y":
                    # Only proceed if user explicitly types 'y'.
                    logger.warning("User explicitly confirmed 'move' action.")
                    break  # Exit confirmation loop, retaining 'move' choice.
                elif confirm_move == "n" or confirm_move == "":  # Default to 'N' (No)
                    # If user types 'n' or just hits Enter, revert to the safe 'copy' action.
                    logger.warning(
                        "'move' action CANCELLED by user confirmation. Reverting to 'copy'."
                    )
                    user_choices["original_action"] = "copy"  # Revert choice.
                    print(
                        f"{config.YELLOW}Original file handling set back to 'copy'.{config.RESET}"
                    )
                    break  # Exit confirmation loop.
                else:
                    # Handle invalid confirmation input.
                    print(
                        f"{config.RED}Invalid input. Please enter 'y' or 'n'.{config.RESET}"
                    )
                    # Loop continues until 'y' or 'n'/'Enter' is provided.
            # --- End Confirmation ---

        elif val_export == "leave":
            user_choices["generate_high_quality"] = (
                True  # Still generate Export structure, but don't populate Originals.
            )
            user_choices["original_action"] = "leave"
            logger.info(
                "Original files will be left in source. '{0}' will be empty.".format(
                    config.FOLDER_NAMES["export_originals"]
                )
            )
        else:  # Default behavior or explicit 'copy'.
            user_choices["generate_high_quality"] = True
            user_choices["original_action"] = "copy"
            logger.info(
                "Original files will be COPIED to '{0}'.".format(
                    config.FOLDER_NAMES["export_originals"]
                )
            )

        # --- EXIF Handling ---
        print(
            f"\n{config.YELLOW}Choose EXIF metadata handling (affects Optimized/Compressed outputs):{config.RESET}"
        )
        print(f"  {config.BOLD}0{config.RESET}: Keep all original EXIF data. (Default)")
        print(f"  {config.BOLD}1{config.RESET}: Remove only Date/Time related tags.")
        print(f"  {config.BOLD}2{config.RESET}: Remove only Camera Make/Model tags.")
        print(f"  {config.BOLD}3{config.RESET}: Remove both Date/Time and Camera tags.")
        print(f"  {config.BOLD}4{config.RESET}: Remove ALL EXIF data.")
        # Explain dependency if partial stripping is chosen
        print(
            f"  (Options 1-3 require the optional 'piexif' library to be installed; otherwise reverts to 'strip_all')"
        )
        exif_val: str = input(
            f"{config.YELLOW}Enter choice [0/1/2/3/4] (default: 0):{config.RESET} "
        ).strip()

        # Mapping from user input number to internal string representation used by image_processing.
        # This provides a slightly friendlier interface than typing the strings.
        exif_mapping = {
            "0": "keep",
            "1": "date",
            "2": "camera",
            "3": "both",
            "4": "strip_all",
        }
        # Default to 'keep' if input is invalid or empty.
        user_choices["exif_option"] = exif_mapping.get(exif_val, "keep")
        logger.info(f"EXIF handling option set to: '{user_choices['exif_option']}'")
        if user_choices["exif_option"] in ["date", "camera", "both"]:
            logger.info("Note: Partial EXIF stripping requires 'piexif' library.")

        # --- ZIP Generation ---
        val_zip: str = (
            input(
                f"\n{config.YELLOW}Generate ZIP archives for key output folders (Export, Optimized, Compressed)? [Y/n] (default: yes):{config.RESET} "
            )
            .strip()
            .lower()
        )
        user_choices["generate_zips"] = val_zip != "n"
        logger.info(f"Generate ZIP archives: {user_choices['generate_zips']}")

        # --- Return gathered choices ---
        logger.debug(f"Completed gathering global options: {user_choices}")
        return user_choices

    # --- Handle Keyboard Interrupt ---
    except KeyboardInterrupt:
        logger.warning("User interrupted global option gathering.")
        raise  # Re-raise for main handler
    except EOFError:
        # Handle unexpected end-of-file
        print(
            f"\n{config.RED}{config.PREFIX_ERROR}Input stream ended unexpectedly. Exiting.{config.RESET}"
        )
        logger.error("EOFError encountered during global options prompt.")
        exit(1)


def ask_shoot_specific_options(shoot_folder: Path) -> dict:
    """
    Asks the user interactively for options specific to a single shoot, such as
    its display name, the base name for renamed files, and the parent directory
    for its output.

    Derives sensible defaults from the provided `shoot_folder` path. Uses
    validation helpers to ensure names and paths are usable.

    Args:
        shoot_folder (Path): The pathlib.Path object representing the source folder
                             for this specific shoot. Used to suggest default names
                             and the default output parent location.

    Returns:
        dict: A dictionary containing the shoot-specific configuration.
            Keys: 'shoot_name' (str), 'base_name' (str),
                  'output_parent' (Path), 'source_path' (Path).

    Raises:
        KeyboardInterrupt: If the user presses Ctrl+C during any prompt.
    """
    # Initialize dictionary to store shoot-specific data.
    shoot_data = {}
    print(
        f"\n{config.BOLD}--- Configuring Shoot Options for Source: '{shoot_folder.name}' ---{config.RESET}"
    )

    try:
        # --- Get Shoot Name ---
        # Suggest the shoot name based on the source folder's name. Validate input.
        shoot_data["shoot_name"] = get_valid_name(
            prompt="Enter a name for this shoot (used for the main output folder name)",
            default=shoot_folder.name,  # Use source folder name as default
        )

        # --- Get Base Name for Files ---
        # Suggest the base name based on the (potentially modified) shoot name. Validate input.
        shoot_data["base_name"] = get_valid_name(
            prompt="Enter a base name for sequentially renamed files (e.g., 001-BaseName.jpg)",
            default=shoot_data["shoot_name"],  # Use the chosen shoot name as default
        )

        # --- Get Output Parent Directory ---
        # Determine the default output parent directory (typically the parent of the source shoot folder).
        # Handle edge case where the source might be a root directory (e.g., C:\).
        default_parent: Path = (
            shoot_folder.parent if shoot_folder.parent != shoot_folder else Path.cwd()
        )
        shoot_data["output_parent"] = get_valid_folder_path_input(
            prompt=f"Enter the PARENT directory to save the '{shoot_data['shoot_name']}' output folder inside",
            default=default_parent,  # Default to parent of source, or CWD if source is root.
        )

        # --- Store Original Source Path ---
        # Keep track of the original source path for this shoot configuration.
        shoot_data["source_path"] = shoot_folder

        # Log the gathered configuration for this specific shoot.
        logger.info(
            f"Configuration gathered for shoot '{shoot_data['shoot_name']}': "
            f"Output Parent='{shoot_data['output_parent']}', File Base Name='{shoot_data['base_name']}'"
        )
        return shoot_data

    # --- Handle Keyboard Interrupt ---
    except KeyboardInterrupt:
        logger.warning(
            f"User interrupted configuration for shoot '{shoot_folder.name}'."
        )
        raise  # Re-raise for main handler
    except EOFError:
        # Handle unexpected end-of-file
        print(
            f"\n{config.RED}{config.PREFIX_ERROR}Input stream ended unexpectedly. Exiting.{config.RESET}"
        )
        logger.error(
            f"EOFError encountered during shoot options prompt for '{shoot_folder.name}'."
        )
        exit(1)


# ----------------------------------------
# --- Argument Parser Setup ---
# ----------------------------------------


def setup_arg_parser() -> argparse.ArgumentParser:
    """
    Configures and returns the ArgumentParser instance for the application.

    Defines all command-line arguments, logically groups them for clarity in the
    help message, provides detailed help text explaining each argument's purpose
    and behavior, and incorporates default values or naming conventions sourced
    from the central `config.py` module where applicable. This setup enables
    non-interactive execution and automation.

    Args:
        None

    Returns:
        argparse.ArgumentParser: The fully configured argument parser instance, ready
                                 to parse command-line arguments in `main.py`.
    """
    # --- Initialize Parser ---
    # Use RawTextHelpFormatter to preserve formatting (like newlines) in help strings.
    # Use the TOOL_DISPLAY_NAME from config for consistent branding.
    parser = argparse.ArgumentParser(
        description=f"{config.BOLD}{config.TOOL_DISPLAY_NAME}:{config.RESET} Organize, process, and package photo shoots.",
        formatter_class=argparse.RawTextHelpFormatter,
        usage=f"python main.py [--source <path>] [--output <path>] [options]",  # Basic usage example
    )

    # --- Argument Group: Input/Output ---
    # Group related arguments together for better --help output readability.
    io_group = parser.add_argument_group(
        f"{config.YELLOW}Input/Output Options{config.RESET}",
        "Control source locations and where results are saved.",
    )
    io_group.add_argument(
        "--source",
        type=str,
        metavar="<path>",  # Indicate that a value (path) is expected
        help="REQUIRED (if not interactive): Path to the source folder containing:\n"
        " - Images for a single shoot (use with --mode single or let it auto-detect).\n"
        " - Subfolders, each containing images for a separate shoot (use with --mode multi).",
        # Rationale: Clearly state when this is mandatory.
    )
    io_group.add_argument(
        "--mode",
        choices=["single", "multi"],
        help="Explicitly set processing mode:\n"
        " 'single': Source path contains images for one shoot.\n"
        " 'multi': Source path contains subfolders, each being a shoot.\n"
        " (If omitted, script will ask interactively based on source path).",
    )
    io_group.add_argument(
        "--output",
        type=str,
        metavar="<path>",
        help="Path to the PARENT directory where final shoot output folder(s) will be created.\n"
        "(If omitted, defaults to the parent directory of the source folder/shoot subfolder).",
    )

    # --- Argument Group: Processing Options ---
    proc_group = parser.add_argument_group(
        f"{config.YELLOW}Processing Options{config.RESET}",
        "Control image formats, quality, original file handling, and EXIF data.",
    )
    # Rationale: Use action='store_true' for boolean flags that default to False.
    proc_group.add_argument(
        "--move",
        action="store_true",
        # CRITICAL: Use RED and BOLD from config for high-visibility warning in help text.
        help=f"{config.RED}{config.BOLD}USE WITH EXTREME CAUTION:{config.RESET} {config.RED}PERMANENTLY MOVE{config.RESET} original source files to the\n"
        f"'{config.FOLDER_NAMES['export_originals']}' folder instead of copying. Ensure backups exist.",
    )
    # Rationale: Make --skip-export explicit to match interactive 'n' option.
    proc_group.add_argument(
        "--skip-export",
        action="store_true",
        help=f"Skip creating the '{config.FOLDER_NAMES['export']}' structure entirely (no copy/move/leave of originals).",
    )
    # Use choices to restrict valid inputs for --exif. State default explicitly.
    proc_group.add_argument(
        "--exif",
        choices=["keep", "date", "camera", "both", "strip_all"],
        default="keep",  # Explicitly state default matches interactive
        help="Control how EXIF metadata is handled in generated files:\n"
        " 'keep': Retain all original EXIF data (default).\n"
        " 'date': Remove only date/time tags.\n"
        " 'camera': Remove only camera make/model tags.\n"
        " 'both': Remove both date and camera tags.\n"
        " 'strip_all': Remove ALL EXIF data.\n"
        " (Options 'date', 'camera', 'both' require the optional 'piexif' library).",
    )
    proc_group.add_argument(
        "--no-jpg",
        action="store_true",
        help="Disable generation of JPG format output files (Optimized/Compressed).",
    )
    proc_group.add_argument(
        "--no-webp",
        action="store_true",
        help="Disable generation of WebP format output files (Optimized/Compressed).",
    )
    proc_group.add_argument(
        "--skip-compressed",
        action="store_true",
        # Dynamically include target resolution and folder name from config.
        help=f"Skip generation of '{config.FOLDER_NAMES['compressed']}' "
        f"(~{config.COMPRESSED_TARGET_PIXELS/1e6:.1f}MP web-friendly) image sets.",
    )
    proc_group.add_argument(
        "--no-zip",
        action="store_true",
        help="Disable final creation of ZIP archives for output folders.",
    )

    # --- Argument Group: Runtime Control ---
    runtime_group = parser.add_argument_group(
        f"{config.YELLOW}Runtime Control{config.RESET}",
        "Control execution behavior like parallelism, logging, and simulation.",
    )
    # Ensure type is int, provide default from config, add metavar for clarity.
    runtime_group.add_argument(
        "--workers",
        type=int,
        default=config.DEFAULT_WORKERS,
        metavar="<N>",
        help="Number of parallel worker processes for image processing.\n"
        f"(Default: {config.DEFAULT_WORKERS}, typically based on system CPU cores). Use 1 for serial processing.",
    )
    # Standard verbose flag.
    runtime_group.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable detailed DEBUG level logging to console and log file(s).",
    )
    # CRITICAL: Dry run flag. Explain its purpose clearly.
    runtime_group.add_argument(
        "--dry-run",
        action="store_true",
        help=f"{config.BOLD}Simulate the entire process without creating folders or modifying/saving any files.{config.RESET}\n"
        f"Logs intended actions with '{config.PREFIX_DRYRUN}' prefix. HIGHLY RECOMMENDED FOR TESTING.",
    )

    logger.debug("Argument parser setup complete.")
    return parser


# All CLI input functions have been removed. This module is now a stub for GUI integration.
# Any reusable helpers should be moved to utils.py or job.py as needed.

# --- END: ui.py (Modernized for GUI) ---
