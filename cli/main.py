"""
cli/main.py - Command Line Interface for PhotoPackager

This module provides the core logic for the CLI operations of PhotoPackager.
It's called by app.py when the 'cli' subcommand is used.
"""

import os
import sys
import logging
import json
import argparse
from pathlib import Path

# Ensure the project root is in the Python path
# to allow imports from other project modules like 'job' or 'config'
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from job import PhotoPackagerJob, PhotoPackagerSettings
from config import FOLDER_NAMES

logger = logging.getLogger(f"PhotoPackager.{__name__}") # Use a child logger of the main app logger

def define_cli_arguments(parser: argparse.ArgumentParser):
    """Adds PhotoPackager job-specific arguments to the provided argparse parser."""
    # General behavior
    parser.add_argument('--dry-run', action='store_true', help='Simulate the run without actual file operations. Defaults to False if not specified.')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging output. Defaults to False if not specified.')
    parser.add_argument('--workers', type=int, default=None, help='Number of worker processes (0 for auto).')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'], default=None, help='Set logging level (overrides config file).')

    # Originals handling
    parser.add_argument('--originals-action', choices=['copy', 'move', 'leave', 'none'], default=None, help='Action for original files.')
    parser.add_argument('--skip-export', action=argparse.BooleanOptionalAction, default=None, help='Skip exporting/handling originals (e.g., --skip-export or --no-skip-export).')
    
    # EXIF policy
    parser.add_argument('--exif-policy', choices=['keep', 'date', 'camera', 'both', 'strip_all'], default=None, help='EXIF data handling policy.')

    # Output generation - Booleans often use store_true/store_false with careful dest naming or post-processing
    # For simplicity here, we'll rely on None default and merge logic in app.py for True/False flags
    # Or, use a helper function to add boolean flags more robustly (e.g., --feature/--no-feature)
    parser.add_argument('--generate-jpg', action=argparse.BooleanOptionalAction, default=None, help='Generate JPGs (default: True).')
    parser.add_argument('--generate-webp', action=argparse.BooleanOptionalAction, default=None, help='Generate WebPs (default: True).')
    parser.add_argument('--generate-compressed-jpg', action=argparse.BooleanOptionalAction, default=None, help='Generate compressed JPGs (default: True).')
    parser.add_argument('--generate-compressed-webp', action=argparse.BooleanOptionalAction, default=None, help='Generate compressed WebPs (default: True).')
    parser.add_argument('--create-zip', action=argparse.BooleanOptionalAction, default=None, help='Create final ZIP archive(s) (default: True).')

    # RAW file handling
    parser.add_argument('--include-raw', action=argparse.BooleanOptionalAction, default=None, help='Include/process RAW files (default: True).')
    parser.add_argument('--raw-action', choices=['copy', 'move', 'leave'], default=None, help='Action for RAW files.')

    # Naming
    parser.add_argument('--add-prefix', action=argparse.BooleanOptionalAction, default=None, help='Add prefixes (Original_, RAW_) to filenames (default: True).')
    
    # Delivery branding
    parser.add_argument('--delivery-company-name', default=None, help='Company name for delivery README.')
    parser.add_argument('--delivery-website', default=None, help='Company website for delivery README.')
    parser.add_argument('--delivery-support-email', default=None, help='Support email for delivery README.')

def run_cli(settings: PhotoPackagerSettings):
    """
    Runs the PhotoPackager job with parameters from the fully resolved PhotoPackagerSettings object.
    """
    output_base = Path(settings.output_folder)
    root_logger = logging.getLogger() # Get the root logger
    # Clear existing handlers to avoid duplicate logs if run_cli is called multiple times
    for handler in list(root_logger.handlers): # Iterate over a copy
        root_logger.removeHandler(handler)

    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout) # Log to stdout
    # Use a simple format for CLI console output, as app.py logger already has detailed format
    # console_formatter = logging.Formatter('%(levelname)s: %(message)s') 
    # Let's use the main app's formatter for consistency for now, can simplify later if needed.
    # Get formatter from one of the app's existing handlers, or create a default one
    app_logger = logging.getLogger("PhotoPackager") # Main application logger
    formatter = None
    if app_logger.handlers:
        formatter = app_logger.handlers[0].formatter
    else: # Fallback if PhotoPackager logger has no handlers (e.g. if app.py didn't set them up)
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Determine log level for CLI specific logging
    if settings.verbose:
        root_logger.setLevel(logging.DEBUG)
    else:
        root_logger.setLevel(logging.INFO)

    # Setup file logging to photopackager_run.log in the output_base directory
    # Only if it's NOT a dry run
    if not settings.dry_run:
        log_file_path = output_base / FOLDER_NAMES["log_file"] # Updated usage
        try:
            # Ensure the directory for the log file exists
            log_file_path.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file_path, mode='a') # Append mode
            file_handler.setFormatter(formatter) # Use the same formatter as console
            root_logger.addHandler(file_handler)
            logger.info(f"CLI output also being logged to: {log_file_path}")
        except Exception as e:
            logger.error(f"Failed to set up file logging to {log_file_path}: {e}")

    logger.info(
        f"CLI run initiated with settings from app.py: Source: '{settings.source_folder}', Destination: '{settings.output_folder}'"
    )
    # All other settings are already in the 'settings' object passed to this function.
    logger.debug(f"CLI Effective Settings: {settings.__dict__}")

    try:
        job = PhotoPackagerJob(settings) # Use the passed settings object
        logs = [] # Capture logs from the job run
        job.run(log_callback=logs.append) 
        
        error_lines = [l for l in logs if '[ERROR]' in l or 'CRITICAL' in l]
        if error_lines:
            logger.error("CLI job completed with errors.")
            return {'status': 'error', 'message': 'Job completed with errors.', 'errors': error_lines, 'logs': logs}
        else:
            logger.info("CLI job completed successfully.")
            return {'status': 'success', 'message': 'Job completed successfully.', 'logs': logs}

    except Exception as e:
        logger.error(f"CLI job execution failed: {e}", exc_info=True)
        return {'status': 'failure', 'message': f"Job execution failed: {str(e)}"}

if __name__ == '__main__':
    # This allows direct execution for testing, though app.py is the main entry point.
    print("This module is intended to be called from app.py. For direct testing:")
    print("Provide mock settings_from_app, source, and destination.")
    # Example (very basic, replace with actual paths and a proper settings dict for testing):
    # mock_settings = {
    #     'default_generate_zips': True, 
    #     'default_workers': 1,
    #     # ... other necessary defaults ...
    # }
    # test_source = '/path/to/source'
    # test_destination = '/path/to/destination'
    # if os.path.exists(test_source) and os.path.exists(os.path.dirname(test_destination)):
    #     results = run_cli(mock_settings, test_source, test_destination)
    #     print(json.dumps(results, indent=2))
    # else:
    #     print(f"Test paths invalid. Update script for testing.")
    pass
