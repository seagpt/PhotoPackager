"""
main.py – GUI Entrypoint for PhotoPackager

This file serves as the main entrypoint for launching the PhotoPackager GUI application.
All legacy CLI and interactive logic has been removed. For all user interactions, the GUI is used.
"""

import sys
import os
import logging
import argparse
import traceback
from pathlib import Path
from datetime import datetime

# Set up crash logging to a file
crash_log_path = os.path.expanduser("~/PhotoPackager_crash.log")
logging.basicConfig(
    filename=crash_log_path,
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Ensure we're in the right directory when launched from .app bundle
try:
    if getattr(sys, 'frozen', False):
        # Running as app bundle (.app)
        bundle_dir = os.path.dirname(sys.executable)
        bundle_parent = os.path.dirname(os.path.dirname(os.path.dirname(bundle_dir)))
        os.chdir(bundle_parent)
        logger.info(f"Running as app bundle. Set working dir to: {bundle_parent}")
except Exception as e:
    logger.error(f"Failed to set working directory: {e}")

if __name__ == "__main__":
    try:
        logger.info(f"Starting PhotoPackager at {datetime.now()}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Python executable: {sys.executable}")
        logger.info(f"Command line arguments: {sys.argv}")
        
        import multiprocessing
        import config
        from job import PhotoPackagerJob, PhotoPackagerSettings

        parser = argparse.ArgumentParser(
            description="PhotoPackager CLI (non-interactive). Use --help for options."
        )
        parser.add_argument(
            "--source",
            type=str,
            required=False,
            help="Source folder (required for CLI mode)",
        )
        parser.add_argument(
            "--output",
            type=str,
            required=False,
            help="Output folder (required for CLI mode)",
        )
        parser.add_argument(
            "--base-name", type=str, required=False, help="Base name for renaming files"
        )
        parser.add_argument(
            "--originals-action",
            type=str,
            choices=["copy", "move", "leave", "skip"],
            default="copy",
            help="How to handle originals: copy, move, leave, or skip",
        )
        parser.add_argument(
            "--exif-policy",
            type=str,
            choices=["keep", "strip_all", "date", "camera", "both"],
            default="keep",
            help="EXIF policy",
        )
        parser.add_argument(
            "--workers",
            type=int,
            default=multiprocessing.cpu_count(),
            help="Number of worker processes (default: CPU count)",
        )
        parser.add_argument(
            "--delivery-company",
            type=str,
            default=config.USER_COMPANY_NAME,
            help="Delivery company name (for branding)",
        )
        parser.add_argument(
            "--delivery-website",
            type=str,
            default=config.USER_WEBSITE,
            help="Delivery website (for branding)",
        )
        parser.add_argument(
            "--delivery-email",
            type=str,
            default=config.USER_SUPPORT_EMAIL,
            help="Delivery support email (for branding)",
        )
        parser.add_argument(
            "--no-jpg",
            action="store_false",
            dest="generate_jpg",
            help="Disable JPG generation",
        )
        parser.add_argument(
            "--no-webp",
            action="store_false",
            dest="generate_webp",
            help="Disable WebP generation",
        )
        parser.add_argument(
            "--skip-compressed",
            action="store_true",
            help="Skip creating compressed versions",
        )
        parser.add_argument(
            "--no-zip",
            action="store_false",
            dest="create_zip",
            help="Disable final ZIP archive creation",
        )
        parser.add_argument(
            "--dry-run", action="store_true", help="Simulate actions without writing files"
        )
        parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

        args, unknown = parser.parse_known_args()
        cli_mode = args.source is not None and args.output is not None

        if cli_mode:
            # Run CLI mode
            try:
                settings = PhotoPackagerSettings(
                    source_folder=args.source,
                    output_folder=args.output,
                    originals_action=args.originals_action,
                    exif_policy=args.exif_policy,
                    generate_jpg=(
                        args.generate_jpg if hasattr(args, "generate_jpg") else True
                    ),
                    generate_webp=(
                        args.generate_webp if hasattr(args, "generate_webp") else True
                    ),
                    skip_compressed=args.skip_compressed,
                    create_zip=args.create_zip,
                    workers=args.workers,
                    dry_run=args.dry_run,
                    verbose=args.verbose,
                    delivery_company_name=args.delivery_company,
                    delivery_website=args.delivery_website,
                    delivery_support_email=args.delivery_email,
                )
                job = PhotoPackagerJob(settings)
                job.run()
            except Exception as exc:
                logger.exception("PhotoPackager CLI execution failed.")
                print(f"[ERROR] CLI execution failed: {exc}", file=sys.stderr)
                sys.exit(2)
        else:
            # Launch GUI
            try:
                from gui.main_window import run_app
                logger.info("Successfully imported GUI main window")
            except ImportError as e:
                error_msg = f"Failed to import GUI main window: {e}"
                logger.critical(error_msg)
                logger.critical(traceback.format_exc())
                print(
                    "[ERROR] Failed to import GUI components. Make sure you have PySide6 installed.",
                    file=sys.stderr,
                )
                print(f"Detailed error: {e}", file=sys.stderr)
                print(f"Check crash log at: {crash_log_path}")
                sys.exit(1)

            try:
                logger.info("Starting GUI application")
                run_app()
            except Exception as exc:
                error_msg = f"Unhandled exception during GUI launch: {exc}"
                logger.critical(error_msg)
                logger.critical(traceback.format_exc())
                print(f"[CRITICAL] Unhandled exception: {exc}", file=sys.stderr)
                print(f"Check crash log at: {crash_log_path}")
                sys.exit(1)
    except Exception as e:
        # Last-resort exception handler
        error_msg = f"Critical unhandled exception in main: {e}"
        logger.critical(error_msg)
        logger.critical(traceback.format_exc())
        with open(crash_log_path, 'a') as f:
            f.write(f"\n{datetime.now()} - CRASH: {error_msg}\n")
            f.write(traceback.format_exc())
        print(f"[CRITICAL] An unexpected error occurred: {e}")
        print(f"Check crash log at: {crash_log_path}")
        sys.exit(1)
