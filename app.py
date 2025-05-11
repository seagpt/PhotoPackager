#!/usr/bin/env python3
"""
app.py - Main entry point for PhotoPackager application

This shim file exists solely to provide a clear, unambiguous entry point
for PyInstaller to build the application. It simply imports and calls the
main GUI window.

When packaging PhotoPackager, ALWAYS use this file as the entry point
for PyInstaller to avoid confusion between multiple main files.
"""

import os
import sys
import logging
import traceback
from datetime import datetime
from pathlib import Path
import argparse
import json
import importlib.util
from job import PhotoPackagerSettings # Import for constructing settings

# --- Forceful Pillow Plugin Imports ---
# This helps ensure PyInstaller bundles all necessary Pillow components.
# Keep these specific imports if they were found to be necessary for robust Pillow functionality in packaged apps.
try:
    import PIL
    import PIL.Image
    import PIL.JpegImagePlugin
    import PIL.PngImagePlugin
    import PIL.WebPImagePlugin
    import PIL.BmpImagePlugin
    import PIL.TiffImagePlugin
    import PIL.ImageFilter
    import PIL.ImageOps
    # Ensure ImageFont is explicitly imported if needed for watermarking, etc.
    # It's a common one to miss if not directly used but indirectly required by a font operation.
    import PIL.ImageFont 
except ImportError as e:
    # If these imports fail at this stage, it's a critical issue.
    # Logging might not be set up yet, so print to stderr and consider exiting.
    print(f"[CRITICAL PRE-LOGGING] Could not import a core Pillow plugin: {e}", file=sys.stderr)
    # Depending on how critical these are, you might want to sys.exit(1) here.
    # For now, we'll let it proceed to see if later parts of the app can handle it or provide better error reporting.

# Make sure we can find modules in the project root
project_dir = Path(__file__).resolve().parent
if str(project_dir) not in sys.path:
    sys.path.insert(0, str(project_dir))

from cli.main import define_cli_arguments # Import the new function

__version__ = "0.1.0-logging-debug"

# --- Globals ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Use Desktop for crash log for easier access during debugging
crash_log_path = os.path.join(os.path.expanduser('~/Desktop'), 'photopackager_crash.log')

# Ensure the log file directory exists (Desktop should always exist)
# os.makedirs(os.path.dirname(crash_log_path), exist_ok=True)

# --- Logging Setup ---
def setup_logging():
    # Create a logger
    logger = logging.getLogger("PhotoPackager")
    logger.setLevel(logging.DEBUG)

    # Create a file handler
    file_handler = logging.FileHandler(crash_log_path)
    file_handler.setLevel(logging.DEBUG)

    # Create a console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Create a formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

def log_to_file_and_stderr(message, level="info"):
    logger = logging.getLogger("PhotoPackager")
    if level == "info":
        logger.info(message)
    elif level == "warning":
        logger.warning(message)
    elif level == "error":
        logger.error(message)
    elif level == "critical":
        logger.critical(message)
    elif level == "debug":
        logger.debug(message)
    else:
        logger.info(message) # Default to info

# --- Pillow Self-Test ---
def pillow_self_test():
    # Slightly modified to use app.py's logger if available, or print if not.
    # And to use PySide6 for the message box consistently if GUI is an option.
    logger = logging.getLogger("PhotoPackager") # Try to get the configured logger
    try:
        from PIL import features
        jpeg_ok = features.check('jpg')
        webp_ok = features.check('webp')
        # Add check for FreeType support if text rendering/watermarking is used
        freetype_ok = features.check('freetype2')

        if not jpeg_ok or not webp_ok or not freetype_ok:
            missing_features = []
            if not jpeg_ok: missing_features.append("JPEG")
            if not webp_ok: missing_features.append("WebP")
            if not freetype_ok: missing_features.append("FreeType (for text/watermarks)")
            
            msg = (
                "PhotoPackager critical error: Pillow is missing essential features.\n\n" 
                f"Missing: {', '.join(missing_features)}\n\n"
                "Please ensure your Python environment or packaged application includes full Pillow support.\n"
                "This might involve reinstalling Pillow with appropriate libraries (libjpeg, libwebp, freetype)."
            )
            logger.critical(msg.replace("\n\n", " ").replace("\n", " ")) # Log a compact version
            try:
                from PySide6.QtWidgets import QApplication, QMessageBox
                # Ensure QApplication instance exists if we are to show a GUI message box
                if not QApplication.instance():
                    _app = QApplication(sys.argv) # Create a temporary one
                else:
                    _app = QApplication.instance()
                
                QMessageBox.critical(None, "Critical Pillow Error", msg)
            except Exception as e_gui:
                logger.error(f"Could not display Pillow critical error via GUI: {e_gui}")
                print(msg, file=sys.stderr) # Fallback to console
            sys.exit(1)
        else:
            logger.info("Pillow self-test passed: JPEG, WebP, and FreeType support confirmed.")

    except ImportError as e_pil:
        msg = f"PhotoPackager critical error: Failed to import Pillow for self-test: {e_pil}. Application cannot continue."
        logger.critical(msg)
        print(msg, file=sys.stderr)
        sys.exit(1)
    except Exception as e_test:
        msg = f"PhotoPackager critical error: An unexpected error occurred during Pillow self-test: {e_test}. Application cannot continue."
        logger.critical(msg)
        print(msg, file=sys.stderr)
        sys.exit(1)


# --- Main Application Logic ---
def main():
    # Initial raw log to capture absolute start, before logging is configured
    try:
        with open(crash_log_path, "a") as f:
            f.write(f"\n\n===== PRE-LOGGING APP STARTUP ({datetime.now()}) =====\n")
            f.write(f"Python version: {sys.version}\n")
            f.write(f"Base directory: {BASE_DIR}\n")
            f.write(f"Crash log path: {crash_log_path}\n")
        print(f"RAW START ({datetime.now()}). Crash log: {crash_log_path}", file=sys.stderr)
    except Exception as e:
        print(f"RAW FAILED TO WRITE INITIAL LOG: {e}", file=sys.stderr)

    logger = None  # Initialize logger to None
    try:
        setup_logging() # Sets up 'PhotoPackager' logger
        logger = logging.getLogger("PhotoPackager") # Get the logger
        
        # --- Set CWD for Frozen App ---
        # This should be done early, before accessing relative paths extensively.
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            # Running as PyInstaller bundle
            bundle_dir = Path(sys._MEIPASS)
            logger.info(f"Running as frozen app (PyInstaller). Original sys.executable: {sys.executable}")
            logger.info(f"Bundle (sys._MEIPASS) directory: {bundle_dir}")
            # PyInstaller generally handles paths correctly with _MEIPASS,
            # but chdir can be useful if non-Python libs expect CWD to be the app root.
            # The traditional chdir to parent of Contents/MacOS:
            # app_root_dir = Path(sys.executable).resolve().parent.parent.parent
            # More robust might be to chdir to where app.py (or the main script) is, if not already there.
            # For now, let's assume _MEIPASS and get_resource_path are sufficient for most cases.
            # If specific issues arise, os.chdir can be re-introduced here carefully.
            # Example of chdir to app bundle's top-level directory (e.g., PhotoPackager.app/):
            # if sys.platform == "darwin":
            #     expected_cwd = Path(sys.executable).resolve().parent.parent.parent
            #     if Path.cwd() != expected_cwd:
            #         try:
            #             os.chdir(expected_cwd)
            #             logger.info(f"Changed CWD for frozen app to: {expected_cwd}")
            #         except Exception as e_chdir:
            #             logger.error(f"Failed to change CWD for frozen app: {e_chdir}")
            pass # For now, relying on _MEIPASS and get_resource_path
        else:
            logger.info(f"Not running as a PyInstaller frozen app or _MEIPASS not set.")

        # --- Run Pillow Self-Test --- 
        pillow_self_test() # Critical check before proceeding

        logger.info("=================================================")
        logger.info(f"PhotoPackager App Started at {datetime.now()}")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Platform: {sys.platform}")
        logger.info(f"Base directory: {BASE_DIR}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Crash log path: {crash_log_path}")
        logger.info("Logging system initialized.")

        parser = argparse.ArgumentParser(description="PhotoPackager: Streamline your photo packaging workflow.")
        parser.add_argument("--version", action="version", version=f"PhotoPackager {__version__}", help="Show program's version number and exit.")
        subparsers = parser.add_subparsers(dest="command", help="Available commands")
        gui_parser = subparsers.add_parser("gui", help="Launch the graphical user interface.")
        cli_parser = subparsers.add_parser("cli", help="Run the command-line interface.")
        cli_parser.add_argument("source", help="Source directory containing photos.")
        cli_parser.add_argument("destination", help="Destination directory for the package.")
        cli_parser.add_argument('--config_file', help='Path to a JSON config file to load. CLI args override this.') # Clarified help
        define_cli_arguments(cli_parser) # Add all other CLI arguments from cli.main

        args = parser.parse_args()

        logger.debug(f"Arguments parsed: {args}")

        # Load base settings from config files (defaults -> config.py -> user JSONs)
        # Note: load_settings() currently returns a dict. We might want it to return a PhotoPackagerSettings object directly.
        # For now, we'll work with the dict it returns.
        base_settings_dict = load_settings() 
        logger.debug(f"Base settings loaded from files: {base_settings_dict}")

        # Get the valid field names from PhotoPackagerSettings
        valid_setting_keys = PhotoPackagerSettings.__annotations__.keys()

        # Filter base_settings_dict to only include valid keys for PhotoPackagerSettings
        filtered_base_settings = {k: v for k, v in base_settings_dict.items() if k in valid_setting_keys}

        if args.command == "gui":
            logger.info("Running in GUI mode.")
            # GUI mode might still use the dict from load_settings(), or be updated.
            # For now, let's assume MainWindow can handle the dict or we adapt it later.
            # For consistency, it might be better if GUI also worked from a PhotoPackagerSettings object.
            # Temp: Create settings object for GUI too, for consistency, if MainWindow can take it.
            gui_settings = PhotoPackagerSettings(**filtered_base_settings)
            from gui.main_window import run_app
            run_app(gui_settings) # Assuming run_app can take PhotoPackagerSettings object
            logger.info("GUI mode finished.")
        elif args.command == "cli":
            logger.info("Running in CLI mode.")
            try:
                # Start with settings from config file (already filtered to valid PhotoPackagerSettings keys)
                cli_constructor_params = filtered_base_settings.copy()

                # Add/Override with mandatory CLI arguments from 'args'
                cli_constructor_params['source_folder'] = args.source
                cli_constructor_params['output_folder'] = args.destination

                # Add/Override with other optional CLI arguments if they were provided
                cli_args_dict = vars(args) # Get all parsed CLI arguments as a dict
                for setting_key in valid_setting_keys: # valid_setting_keys are from PhotoPackagerSettings.__annotations__
                    if setting_key in cli_args_dict and cli_args_dict[setting_key] is not None:
                        # This condition ensures we only use CLI args that were actually set
                        # and correspond to a PhotoPackagerSettings field.
                        # source_folder and output_folder are already handled above.
                        if setting_key not in ['source_folder', 'output_folder']:
                            cli_constructor_params[setting_key] = cli_args_dict[setting_key]
                
                # Instantiate PhotoPackagerSettings with the fully prepared parameters
                cli_settings_obj = PhotoPackagerSettings(**cli_constructor_params)
                
                from cli.main import run_cli
                run_cli(cli_settings_obj)

            except SystemExit as e:
                if logger:
                    logger.info(f"SystemExit caught: {e.code}")
                else:
                    print(f"SystemExit caught before logger init: {e.code}", file=sys.stderr)
                # Let SystemExit propagate to exit with the specified code
                raise
            except Exception as e:
                if logger:
                    logger.critical(f"CRITICAL ERROR in main: {e}\n{traceback.format_exc()}", exc_info=True)
                else:
                    # Fallback if logger failed to initialize
                    print(f"CRITICAL ERROR (pre-logger) in main: {e}", file=sys.stderr)
                    traceback.print_exc(file=sys.stderr)
                    try:
                        with open(crash_log_path, "a") as f:
                            f.write(f"===== CRITICAL ERROR (pre-logger) ({datetime.now()}) =====\n")
                            f.write(str(e) + "\n")
                            f.write(traceback.format_exc() + "\n")
                    except Exception as log_e:
                        print(f"Failed to write pre-logger critical error to crash log: {log_e}", file=sys.stderr)
                sys.exit(1) # Ensure a non-zero exit code on unhandled exceptions
        else:
            logger.warning("No command specified, defaulting to GUI mode.")
            from gui.main_window import run_app
            run_app(filtered_base_settings)
            logger.info("Default GUI mode finished.")

    except SystemExit as e:
        if logger:
            logger.info(f"SystemExit caught: {e.code}")
        else:
            print(f"SystemExit caught before logger init: {e.code}", file=sys.stderr)
        # Let SystemExit propagate to exit with the specified code
        raise
    except Exception as e:
        if logger:
            logger.critical(f"CRITICAL ERROR in main: {e}\n{traceback.format_exc()}", exc_info=True)
        else:
            # Fallback if logger failed to initialize
            print(f"CRITICAL ERROR (pre-logger) in main: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            try:
                with open(crash_log_path, "a") as f:
                    f.write(f"===== CRITICAL ERROR (pre-logger) ({datetime.now()}) =====\n")
                    f.write(str(e) + "\n")
                    f.write(traceback.format_exc() + "\n")
            except Exception as log_e:
                print(f"Failed to write pre-logger critical error to crash log: {log_e}", file=sys.stderr)
        sys.exit(1) # Ensure a non-zero exit code on unhandled exceptions
    finally:
        if logger:
            logger.info(f"PhotoPackager App Normally Finishing at {datetime.now()}")
            logger.info("=================================================")
        else:
            print(f"RAW END ({datetime.now()}). Main function finally block reached pre-logger.", file=sys.stderr)
            try:
                with open(crash_log_path, "a") as f:
                    f.write(f"===== RAW APP END (finally block, pre-logger) ({datetime.now()}) =====\n")
            except Exception as log_e:
                print(f"Failed to write raw finally log: {log_e}", file=sys.stderr)

def get_bundled_config_path() -> Path:
    """Returns the path to the config.py bundled with the application."""
    # This assumes config.py is in the same directory as app.py when run from source,
    # or at the root of the bundle if sys._MEIPASS is set (PyInstaller).
    if hasattr(sys, "_MEIPASS"): # Running in a PyInstaller bundle
        return Path(sys._MEIPASS) / "config.py"
    else: # Running as a script
        return Path(__file__).resolve().parent / "config.py"

def load_settings(): 
    logger = logging.getLogger("PhotoPackager")
    logger.info(f"load_settings called. Bundled config will be used.")

    fallback_settings = {
        "user_company_name": "DropShock Digital LLC", 
        "user_website": "https://www.dropshockdigital.com", 
        "user_support_email": "support@dropshockdigital.com",
        "logo_path": get_resource_path("assets/logo.png"), 
        "default_generate_zips": True, # Consistent with desired default
        "default_workers": os.cpu_count() // 2 if os.cpu_count() else 1,
        "error_loading": True, # Flag to indicate settings are not from file
        "default_original_action": "Copy",
        "default_raw_action": "Copy",
        "default_include_raw": True,
        "default_generate_jpg": True,
        "default_generate_webp": True,
        "default_generate_compressed_jpg": True,
        "default_generate_compressed_webp": True,
        "default_add_prefix": True,
        "default_exif_option": "keep",
    }

    bundled_config_path = get_bundled_config_path()
    logger.info(f"Attempting to load settings from bundled config: {bundled_config_path}")

    if not bundled_config_path.exists():
        logger.error(f"CRITICAL: Bundled config file not found at {bundled_config_path}. Using hardcoded fallback settings.")
        return fallback_settings

    try:
        import importlib.util

        # Ensure the module is reloaded from disk by removing it from sys.modules if it exists
        module_name = "photopackager_config" # Consistent name for the bundled config
        if module_name in sys.modules:
            logger.info(f"Removing '{module_name}' from sys.modules to force reload.")
            del sys.modules[module_name]
        else:
            logger.info(f"'{module_name}' not in sys.modules. Will load fresh.")

        spec = importlib.util.spec_from_file_location(module_name, str(bundled_config_path))
        if spec is None or spec.loader is None:
            logger.error(f"Could not create spec or loader for config file at {bundled_config_path}.")
            raise ImportError(f"Cannot load spec/loader for {bundled_config_path}")
        
        config = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = config 
        spec.loader.exec_module(config)

        settings = {
            key: getattr(config, key.upper() if not key.startswith("default_") and key not in ["user_company_name", "user_website", "user_support_email", "logo_path"] else key.upper().replace("default_", "DEFAULT_", 1), fallback_settings[key])
            for key in fallback_settings
        }
        logger.info(f"Settings loaded from {bundled_config_path}: {{key_count: {len(settings.keys())}}}")
        return settings
    except Exception as e:
        logger.error(f"Failed to load settings from {bundled_config_path}: {e}", exc_info=True)
        # Fallback to more comprehensive hardcoded defaults if loading bundled config fails
        return {
            "user_company_name": "DropShock Digital LLC", 
            "user_website": "https://www.dropshockdigital.com", 
            "user_support_email": "support@dropshockdigital.com",
            "logo_path": get_resource_path("assets/logo.png"), 
            "default_generate_zips": True, # Consistent with desired default
            "default_workers": os.cpu_count() // 2 if os.cpu_count() else 1,
            "error_loading": True, # Flag to indicate settings are not from file
            # Add other essential defaults here to prevent crashes
            "default_original_action": "Copy",
            "default_raw_action": "Copy",
            "default_include_raw": True,
            "default_generate_jpg": True,
            "default_generate_webp": True,
            "default_generate_compressed_jpg": True,
            "default_generate_compressed_webp": True,
            "default_add_prefix": True,
            "default_exif_option": "keep",
        }

# Helper for resource paths (potentially needed by load_settings or MainWindow)
def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'): # PyInstaller temporary path
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), "assets", relative_path) # Ensure it points to project's assets dir

# --- Pillow Diagnostics ---
def diagnose_pillow():
    """Run a diagnostic check on Pillow plugin support and print results."""
    logger = logging.getLogger("PhotoPackager")
    logger.info("Starting Pillow Plugin Diagnostics...")
    from io import BytesIO

    try:
        from PIL import features, Image, __version__ as pillow_version

        diagnostic_lines = []
        diagnostic_lines.append("\nPhotoPackager - Pillow Plugin Diagnostics")
        diagnostic_lines.append("-----------------------------------")
        diagnostic_lines.append(f"Pillow Version: {pillow_version}")
        diagnostic_lines.append(f"Python Version: {sys.version.split()[0]}")
        diagnostic_lines.append("\nSupported Formats (feature check):")
        
        # Formats to check using features.check()
        feature_check_formats = {
            'JPEG': 'jpg',
            'WebP': 'webp',
            'PNG': 'png',
            'GIF': 'gif',
            'TIFF': 'tiff',
            'BMP': 'bmp',
            'FreeType/FT': 'freetype2', # For text rendering
            'LittleCMS/LCMS': 'littlecms2', # For color management
        }
        
        for fmt_name, feature_key in feature_check_formats.items():
            supported = features.check(feature_key)
            status = "✓ SUPPORTED" if supported else "✗ NOT SUPPORTED"
            diagnostic_lines.append(f"  {fmt_name} ({feature_key}): {status}")

        diagnostic_lines.append("\nAvailable Encoders/Decoders (Image.codecs):")
        if hasattr(Image, 'codecs'):
            for codec_name, codec_status in Image.codecs.items():
                diagnostic_lines.append(f"  {codec_name}: {codec_status}")
        else:
            diagnostic_lines.append("  Image.codecs not available in this Pillow version.")

        diagnostic_lines.append("\nSupported Operations:")
        diagnostic_lines.append(f"  EXIF Reading (Built-in): {'✓ SUPPORTED' if hasattr(Image.Exif, ' capitaine') or hasattr(Image, '_getexif') else '✗ NOT SUPPORTED'}") # Check for a known attribute or method
        
        try:
            import piexif
            version_info = "installed"
            if hasattr(piexif, '__version__'):
                version_info = f"v{piexif.__version__}"
            diagnostic_lines.append(f"  EXIF Writing (piexif): ✓ SUPPORTED ({version_info})")
        except ImportError:
            diagnostic_lines.append("  EXIF Writing (piexif): ✗ NOT SUPPORTED - piexif not installed")
        
        diagnostic_lines.append("\nSystem Information:")
        diagnostic_lines.append(f"  Platform: {sys.platform}")
        diagnostic_lines.append(f"  Executable: {sys.executable}")
        
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            diagnostic_lines.append(f"  Running as frozen application (PyInstaller bundle at {sys._MEIPASS})")
        else:
            diagnostic_lines.append("  Running in standard Python environment.")
        
        diagnostic_output = "\n".join(diagnostic_lines)
        logger.info(diagnostic_output)
        print(diagnostic_output) # Also print to console for CLI usage or immediate feedback

    except ImportError as e_pil_diag:
        msg = f"Pillow Diagnostics Error: Failed to import Pillow components: {e_pil_diag}"
        logger.error(msg)
        print(msg, file=sys.stderr)
    except Exception as e_diag:
        msg = f"Pillow Diagnostics Error: An unexpected error occurred: {e_diag}"
        logger.error(msg, exc_info=True)
        print(msg, file=sys.stderr)

if __name__ == "__main__":
    main()
