#!/usr/bin/env python3
# [AUDIT COMPLETE 2025-05-07] This file has been reviewed and is compliant with project and modern Python standards.

# -*- coding: utf-8 -*-
"""
General utility functions for the PhotoPackager application.

This module provides helper functions that are potentially reusable across
different parts of the application or even other projects. Responsibilities include:
- Input validation helpers (e.g., checking for invalid filename characters).
- Platform-dependent desktop notification logic.
- System signal handling (e.g., for graceful Ctrl+C exit).
- Platform information helpers (e.g., CPU count).

It aims to encapsulate generic logic separate from the core application domains
like filesystem interaction or image processing.

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
Project: PhotoPackager v1.0.0-refactor
License: MIT License (Consult LICENSE.md file for full details)
"""

# --- Standard Library Imports ---
import platform  # For detecting OS (Windows, Darwin, Linux)
import subprocess  # For running external commands (notifications)
import ctypes  # For Windows MessageBox fallback notification
import logging  # For logging within utility functions
import signal  # For handling system signals (Ctrl+C)
import sys  # For exiting gracefully on signal
import os  # For os.cpu_count()
from typing import Optional, NoReturn  # Added NoReturn for signal handler

# --- Imports from Project ---
try:
    # Import config for constants like colors, if needed directly here.
    # Primarily used for fallback print notification.
    import config
except ImportError:
    # Define fallback dummy config object if config.py import fails.
    # This allows utils functions (like notification fallback) to run even
    # if the main config is unavailable, preventing crashes in utils itself.
    # Colors will simply be empty strings if config fails.
    config = type(
        "obj",
        (object,),
        {"BOLD": "", "RESET": "", "YELLOW": "", "RED": "", "GREEN": ""},
    )()

# --- Module Logger Setup ---
logger = logging.getLogger(__name__)

# ----------------------------------------
# --- Input Validation ---
# ----------------------------------------


def validate_name(name: str) -> bool:
    """
    Checks if a given string contains characters potentially invalid for file
    or folder names across common operating systems.

    Also considers empty strings invalid.

    Args:
        name (str): The string (e.g., shoot name, base name) to validate.

    Returns:
        bool: True if the name is considered valid, False otherwise.
    """
    # Rationale: Define a set of characters commonly problematic in filenames/paths
    # on Windows, macOS, and Linux to ensure cross-platform compatibility.
    # Includes backslash, forward slash, colon, asterisk, question mark,
    # double quote, less than, greater than, and pipe.
    invalid_chars: set[str] = set(r'\/:*?"<>|')

    # An empty name is never valid for a file or folder.
    if not name:
        return False

    # Check if any character in the name exists within the set of invalid characters.
    # The `any()` function efficiently checks this condition.
    contains_invalid = any(char in invalid_chars for char in name)

    # The name is valid if it does *not* contain any invalid characters.
    return not contains_invalid


# ----------------------------------------
# --- Desktop Notifications ---
# ----------------------------------------


def send_notification(message: str, title: str = "PhotoPackager") -> None:
    """
    Attempts to send a native desktop notification with the given title and message.

    Uses platform-specific methods:
    - macOS: Tries `osascript` first, then falls back to `terminal-notifier` if installed.
    - Windows: Tries `win10toast-reborn` (requires installation), falls back to `ctypes.MessageBoxW`.
    - Linux: Tries `notify-send` (common command-line tool).

    Logs success, warnings (if tool not found), or errors encountered. Provides
    a console print fallback if all methods fail.

    Args:
        message (str): The main content of the notification message.
        title (str): The title of the notification window/popup (defaults to "PhotoPackager").
    """
    # Determine the current operating system.
    system: str = platform.system()
    # Log the attempt regardless of success/failure for debugging.
    logger.info(f"Attempting desktop notification (OS: {system}): [{title}] {message}")

    try:
        # --- macOS Notification Logic ---
        if system == "Darwin":
            try:
                # Why osascript first? It's built-in to macOS.
                # Construct the AppleScript command to display a notification.
                cmd = [
                    "osascript",
                    "-e",
                    f'display notification "{message}" with title "{title}"',
                ]
                # Run the command. `check=True` raises CalledProcessError if it fails.
                # `capture_output=True` prevents script output from cluttering console.
                subprocess.run(
                    cmd, check=True, capture_output=True, timeout=5
                )  # Add timeout
                logger.debug("Sent notification via AppleScript (osascript).")
                return  # Success
            except FileNotFoundError:
                logger.warning(
                    "osascript command not found, cannot send native macOS notification this way."
                )
            except subprocess.TimeoutExpired:
                logger.warning("osascript command timed out.")
            except subprocess.CalledProcessError as e_osa:
                # Log specific error if osascript fails (e.g., syntax error in command).
                logger.warning(
                    f"osascript notification failed: {e_osa}. Stderr: {e_osa.stderr.decode(errors='ignore') if e_osa.stderr else 'N/A'}"
                )
            except Exception as e_osascript:
                # Catch other potential errors.
                logger.warning(
                    f"osascript notification failed unexpectedly: {e_osascript}. Trying terminal-notifier..."
                )

            # Why terminal-notifier fallback? It's a popular third-party tool providing more options.
            try:
                cmd = ["terminal-notifier", "-message", message, "-title", title]
                subprocess.run(
                    cmd, check=True, capture_output=True, timeout=5
                )  # Add timeout
                logger.debug("Sent notification via terminal-notifier.")
                return  # Success
            except FileNotFoundError:
                # This is common if the user hasn't installed terminal-notifier.
                logger.warning(
                    "'terminal-notifier' command not found. Cannot send macOS notification fallback."
                )
            except subprocess.TimeoutExpired:
                logger.warning("terminal-notifier command timed out.")
            except subprocess.CalledProcessError as e_tn:
                logger.warning(
                    f"terminal-notifier failed: {e_tn}. Stderr: {e_tn.stderr.decode(errors='ignore') if e_tn.stderr else 'N/A'}"
                )
            except Exception as e_notifier:
                logger.warning(f"terminal-notifier failed unexpectedly: {e_notifier}")

        # --- Windows Notification Logic ---
        elif system == "Windows":
            try:
                # Why win10toast-reborn first? Provides richer, non-blocking notifications.
                # Attempt to import the library (it's optional via requirements.txt).
                from win10toast_reborn import ToastNotifier

                toaster = ToastNotifier()
                # Show the toast notification. `duration` is in seconds.
                # `threaded=True` is crucial to prevent the main script from blocking while waiting for the notification to disappear.
                toaster.show_toast(title, message, duration=7, threaded=True)
                logger.debug("Sent notification via win10toast_reborn (threaded).")
                # Note: Because it's threaded, we don't easily know if the user *saw* it,
                # but the call was successfully made. We don't wait for it to close.
                return  # Success
            except ImportError:
                # This happens if win10toast-reborn isn't installed.
                logger.warning(
                    "'win10toast_reborn' library not installed. Falling back to Windows MessageBox."
                )
            except Exception as e_win10:
                # Catch errors from the library itself.
                logger.warning(
                    f"win10toast_reborn notification failed: {e_win10}. Falling back to Windows MessageBox."
                )

            # Why MessageBoxW fallback? It's built-in via ctypes, always available on Windows.
            try:
                # Use ctypes to call the native Windows MessageBoxW function.
                # `0` = No owner window handle (NULL).
                # `message`, `title` = Text content (expects wide strings, hence 'W').
                # `0x40 | 0x1000` = Flags: MB_ICONINFORMATION (info icon) | MB_SETFOREGROUND (bring window to front).
                # Note: This creates a *blocking* dialog box the user must click "OK" on.
                ctypes.windll.user32.MessageBoxW(0, message, title, 0x40 | 0x1000)
                logger.debug("Displayed notification via Windows MessageBoxW.")
                return  # Success (user acknowledged the blocking box)
            except Exception as e_msgbox:
                # Catch errors calling the ctypes function (highly unlikely).
                logger.error(
                    f"{config.PREFIX_ERROR}Windows MessageBoxW notification failed: {e_msgbox}"
                )

        # --- Linux Notification Logic ---
        elif system == "Linux":
            try:
                # Why notify-send? It's the standard command-line tool for desktop notifications
                # used by many Linux desktop environments (GNOME, KDE, XFCE, etc. via notification daemon).
                cmd = [
                    "notify-send",
                    "--urgency=normal",
                    "--icon=dialog-information",
                    title,
                    message,
                ]
                subprocess.run(
                    cmd, check=True, capture_output=True, timeout=5
                )  # Add timeout
                logger.debug("Sent notification via notify-send.")
                return  # Success
            except FileNotFoundError:
                # Common if `notify-send` or a notification daemon isn't installed.
                logger.warning(
                    "'notify-send' command not found or notification daemon not running. Cannot send Linux desktop notification."
                )
            except subprocess.TimeoutExpired:
                logger.warning("notify-send command timed out.")
            except subprocess.CalledProcessError as e_ns:
                logger.warning(
                    f"notify-send failed: {e_ns}. Stderr: {e_ns.stderr.decode(errors='ignore') if e_ns.stderr else 'N/A'}"
                )
            except Exception as e_notify:
                logger.warning(f"notify-send failed unexpectedly: {e_notify}")

        # --- Fallback Notification ---
        # If all platform-specific methods fail or the platform is unrecognized,
        # print the notification clearly to the console as a last resort.
        print(
            f"\n{config.YELLOW}{config.BOLD}[NOTIFICATION]{config.RESET} {config.BOLD}{title}:{config.RESET} {message}\n"
        )

    except Exception as e_general:
        # Catch any truly unexpected errors in the notification logic.
        logger.error(
            f"{config.PREFIX_ERROR}General notification sending failed: {e_general}",
            exc_info=True,
        )
        # Still attempt console fallback.
        print(
            f"\n{config.YELLOW}{config.BOLD}[NOTIFICATION]{config.RESET} {config.BOLD}{title}:{config.RESET} {message}\n"
        )


# ----------------------------------------
# --- Signal Handling ---
# ----------------------------------------

# Flag to prevent double handling if Ctrl+C is pressed rapidly
_interrupted: bool = False


def signal_handler_func(sig: int, frame: Optional[object]) -> NoReturn:
    """
    Custom handler function for SIGINT (Ctrl+C).

    Prints/logs a clean message and exits the application gracefully with code 0.
    Uses a flag to avoid redundant messages on rapid presses.

    Args:
        sig (int): The signal number received (e.g., signal.SIGINT).
        frame (Optional[object]): The current stack frame at the time of the signal.

    Returns:
        NoReturn: This function exits the program.
    """
    global _interrupted
    # Only process the first time Ctrl+C is caught
    if not _interrupted:
        _interrupted = True
        msg = f"\n{config.YELLOW}Operation interrupted by user (Ctrl+C detected). Exiting gracefully...{config.RESET}"
        # Use logger if available (might not be fully set up if interrupted early).
        # Fallback to print otherwise.
        try:
            logger.warning("Process interrupted by user (SIGINT). Exiting.")
            print(msg)  # Still print a clear message to console
        except NameError:
            print(msg)
        # Exit the program. Exit code 0 often used for intentional user cancellation.
        sys.exit(0)
    # If already interrupted, do nothing more.


def setup_signal_handler() -> None:
    """
    Sets up the custom handler for the SIGINT signal (Ctrl+C).
    """
    try:
        # Register the custom handler function for the SIGINT signal.
        signal.signal(signal.SIGINT, signal_handler_func)
        logger.debug("SIGINT (Ctrl+C) handler registered successfully.")
    except ValueError:
        # This can happen if trying to set a signal handler in a non-main thread
        # where it's not allowed. Log a warning but don't crash.
        logger.warning(
            "Cannot set SIGINT handler in this context (likely not main thread). Ctrl+C might not exit gracefully."
        )
    except Exception as e:
        # Catch other potential errors during signal registration.
        logger.error(
            f"{config.PREFIX_ERROR}Could not set up SIGINT handler: {e}", exc_info=True
        )


# ----------------------------------------
# --- Platform Helpers ---
# ----------------------------------------


def get_cpu_count() -> int:
    """
    Safely gets the number of logical CPU cores available to the system.

    Provides a fallback value of 1 if the count cannot be determined.

    Returns:
        int: The number of CPU cores, or 1 as a fallback.
    """
    try:
        # os.cpu_count() returns the number of logical CPUs.
        # It might return None on some systems or configurations.
        cpus = os.cpu_count()
        # Return the count if it's a positive integer, otherwise return 1.
        count = cpus if cpus and cpus > 0 else 1
        logger.debug(f"Determined CPU count: {count}")
        return count
    except NotImplementedError:
        # Handle cases where os.cpu_count() is not implemented on the platform.
        logger.warning(
            "os.cpu_count() not implemented on this platform. Defaulting to 1 worker."
        )
        return 1
    except Exception as e:
        # Catch unexpected errors.
        logger.error(
            f"Error getting CPU count: {e}. Defaulting to 1 worker.", exc_info=True
        )
        return 1


# --- Add other general utility functions as needed below ---
