"""
PhotoPackagerJob: New API entry point for GUI/automated use.
This class will encapsulate all core settings and workflow logic, calling into filesystem.py and image_processing.py.
"""

from dataclasses import dataclass
import logging
import shutil
from typing import Callable, Optional


# Example settings dataclass for clarity and type safety
@dataclass
class PhotoPackagerSettings:
    """
    Dataclass for PhotoPackager job settings. Encapsulates all configurable options.
    """

    source_folder: str
    output_folder: str
    move_originals: bool = False
    originals_action: str = "copy"  # copy/move/leave/none
    exif_policy: str = "keep"  # keep/date/camera/both/strip_all
    skip_export: bool = False
    generate_jpg: bool = True
    generate_webp: bool = True
    generate_compressed_jpg: bool = True
    generate_compressed_webp: bool = True
    skip_compressed: bool = False  # Legacy flag - maintained for backward compatibility
    create_zip: bool = True
    workers: int = 0  # 0 = auto (CPU count)
    dry_run: bool = False
    verbose: bool = False
    # RAW file handling
    include_raw: bool = True  # Whether to handle RAW files found in source folder
    raw_action: str = "copy"  # How to handle RAW files: copy/move/leave
    # File naming options
    add_prefix: bool = False  # Whether to add prefixes like RAW_, Original_, etc.
    # Delivery branding fields (for README and client-facing output)
    delivery_company_name: str = "DropShock Digital LLC"
    delivery_website: str = "https://dropshock.com"
    delivery_support_email: str = "support@dropshock.com"
    # Add other options as needed from config.py/CLI


class PhotoPackagerJob:
    """
    Main job orchestrator for PhotoPackager. Handles processing and packaging workflow.
    Designed for GUI/automation use (no CLI logic).
    """

    def __init__(self, settings: PhotoPackagerSettings):
        self.settings = settings
        self.logger = logging.getLogger("PhotoPackagerJob")
        self.progress_callback: Optional[Callable[[float], None]] = None
        self.log_callback: Optional[Callable[[str], None]] = None
        self.cancel_requested = False

    def run(
        self,
        progress_callback: Optional[Callable[[float], None]] = None,
        log_callback: Optional[Callable[[str], None]] = None,
    ):
        """
        Run the packaging job. Callbacks are for GUI integration.

        Args:
            progress_callback (Optional[Callable[[float], None]]): Progress update callback for GUI.
            log_callback (Optional[Callable[[str], None]]): Logging callback for GUI/log window.
        Returns:
            None
        Raises:
            FileNotFoundError: If the source folder does not exist.
        """
        if log_callback:
            log_callback(
                "<span style='color:#888;'>[PhotoPackagerJob] Entered run() method.</span>"
            )

        import os
        from pathlib import Path
        import filesystem
        import config
        from concurrent.futures import ProcessPoolExecutor, as_completed

        self.progress_callback = progress_callback
        self.log_callback = log_callback
        self._log(f"Starting PhotoPackager job with settings: {self.settings}")

        # Validate and normalize paths
        src = Path(self.settings.source_folder).expanduser().resolve()
        out = Path(self.settings.output_folder).expanduser().resolve()
        if not src.is_dir():
            self._log(f"[ERROR] Source folder does not exist: {src}")
            raise FileNotFoundError(f"Source folder does not exist: {src}")
        # output_base is the shoot-specific folder INSIDE 'out'
        output_base = out / src.name 
        # Parent of output_base is 'out'. Create 'out' first if it doesn't exist.
        out.mkdir(parents=True, exist_ok=True) 

        self._log(f"[DEBUG] dry_run={self.settings.dry_run}, workers={self.settings.workers}, output_base={output_base}, total_images to be scanned in {src}")

        # Gather both standard images and RAW files
        standard_images, raw_images = filesystem.scan_directory(src, include_raw=self.settings.include_raw)
        image_files = standard_images # Primarily process standard images for export types
        
        if not standard_images and not raw_images:
            self._log("[WARN] No image files found in the source folder.")
            self._progress(1.0)
            return # Exit early if no images

        total_images_to_process = len(image_files) # Base progress on standard images
        self._log(f"Found {total_images_to_process} standard images and {len(raw_images)} RAW files.")

        # Create output structure using the refactored function
        # output_base.parent is 'out', the general output directory selected by user.
        # shoot_name is derived inside create_output_structure from settings.source_folder
        structure_paths = filesystem.create_output_structure(
            output_parent=out, # The parent for the shoot folder
            settings=self.settings,
            has_raw_files=len(raw_images) > 0
        )

        # Retrieve paths from the returned dictionary
        # output_base should align with structure_paths["top_level_dir"]
        # For safety, let's use the one from structure_paths if available, or re-verify alignment.
        actual_output_base = structure_paths.get("top_level_dir")
        if actual_output_base is None: # Should always be created by create_output_structure
            self._log(f"[CRITICAL_ERROR] Top-level directory was not created by create_output_structure. Expected at {output_base}")
            # Fallback or raise, though create_output_structure should raise if top_folder fails
            actual_output_base = output_base 
        else:
            output_base = actual_output_base # Use the path returned by the structure creator

        export_files_path = structure_paths.get("originals_dir") # This is for 'Export Originals'
        optimized_jpg_dir = structure_paths.get("optimized_jpg_dir")
        # optimized_webp_dir = structure_paths.get("optimized_webp_dir") # Not directly used later by name
        compressed_jpg_dir = structure_paths.get("compressed_jpg_dir")
        # compressed_webp_dir = structure_paths.get("compressed_webp_dir") # Not directly used later by name
        raw_dir_path = structure_paths.get("raw_dir")

        # Ensure export_files_path (for originals) is created if it's going to be used.
        # This is now handled by create_output_structure based on settings.
        if not self.settings.skip_export and self.settings.originals_action.lower() in ["copy", "move"]:
            if export_files_path:
                self._log(f"'Export Originals' directory set to: {export_files_path}")
            else:
                # This case should ideally not happen if settings dictate originals handling and create_output_structure works.
                self._log(f"[WARN] Originals are set to be copied/moved, but 'Export Originals' path was not provided by create_output_structure.")
                # Fallback: define it based on output_base and config, but it should have been made.
                # This might indicate an issue in create_output_structure logic if settings say copy/move but dir isn't made.
                # For robustness, let's log and potentially try to use a default, though the test expects it to be created.
                export_files_path = output_base / config.FOLDER_NAMES["originals"] 
                if not self.settings.dry_run: export_files_path.mkdir(parents=True, exist_ok=True) # Ensure if fallback used

        processed_count = 0
        images_with_errors = []

        # Prepare processing options
        global_choices = {
            "move_originals": self.settings.move_originals,
            "skip_export": self.settings.skip_export,
            "generate_jpg": self.settings.generate_jpg,
            "generate_webp": self.settings.generate_webp,
            "generate_compressed_jpg": self.settings.generate_compressed_jpg,
            "generate_compressed_webp": self.settings.generate_compressed_webp,
            "skip_compressed": self.settings.skip_compressed,
            "exif_option": self.settings.exif_policy,
            "dry_run": self.settings.dry_run,
        }
        import logging
        logging.getLogger(__name__).info(f"DIAGNOSTIC: Job global_choices: {global_choices}")

        # Parallel or serial processing
        workers = self.settings.workers or getattr(
            config, "DEFAULT_WORKERS", os.cpu_count() or 1
        )
        processed = 0
        total = len(image_files)
        worker_args = {
            "output_base": output_base,
            "global_choices": global_choices,
            "dry_run": self.settings.dry_run,
        }

        def log_result(result):
            if isinstance(result, tuple) and len(result) == 2:
                img_path, error = result
                if error:
                    self._log(f"[ERROR] Failed to process {img_path.name}: {error}")
                else:
                    self._log(f"Processed: {img_path.name}")

        # SERIAL: Use single-threaded loop if dry_run or workers==1 (test/CLI robustness)
        if self.settings.dry_run or self.settings.workers <= 1:
            self._log("[INFO] Running in single-threaded mode (dry_run or workers=1). No process pool will be used.")
            for i, img in enumerate(image_files, 1):
                if getattr(self, 'cancel_requested', False):
                    self._log("[CANCELLED] Job was cancelled by user.")
                    return
                try:
                    result = PhotoPackagerJob.process_and_report(img, worker_args)
                    log_result(result)
                except Exception as exc:
                    self._log(f"[ERROR] Exception processing {img}: {exc}")
                processed += 1
                self._progress(processed / total)
        else:
            self._log(f"Processing images with {self.settings.workers} worker(s)...")
            from concurrent.futures import ProcessPoolExecutor, as_completed
            try:
                with ProcessPoolExecutor(max_workers=self.settings.workers) as executor:
                    futures = {
                        executor.submit(
                            PhotoPackagerJob.process_and_report, img, worker_args
                        ): img
                        for img in image_files
                    }
                    for i, future in enumerate(as_completed(futures), 1):
                        try:
                            result = future.result()
                            log_result(result)
                        except Exception as exc:
                            self._log(f"[ERROR] Exception in worker for {futures[future]}: {exc}")
                        processed += 1
                        self._progress(processed / total)
            except Exception as e:
                self._log(f"[ERROR] Multiprocessing pool failed: {e}")

        self._log("[INFO] All images processed. Proceeding to ZIP creation phase.")

        # Write README with delivery branding
        readme_content = filesystem._get_top_level_readme_content(
            shoot_name=self.settings.source_folder,
            delivery_company_name=self.settings.delivery_company_name,
            delivery_website=self.settings.delivery_website,
            delivery_support_email=self.settings.delivery_support_email,
        )
        readme_path = output_base / config.FOLDER_NAMES["top_level_readme"]
        if self.settings.dry_run:
            self._log(f"[DRYRUN] Would write delivery README: {readme_path}")
        else:
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(readme_content)
            self._log(f"Wrote delivery README: {readme_path}")

        # --- Handle Export Originals logic ---
        originals_action = getattr(self.settings, 'originals_action', 'copy')
        # Process standard images
        if self.settings.skip_export:
            self._log("Skipping export of originals (--skip-export)")
        elif originals_action in ["copy", "move"]:
            # Process standard images first
            self._log(f"Processing {len(standard_images)} standard images...")
            
            for idx, img_path in enumerate(standard_images):
                if getattr(self, 'cancel_requested', False):
                    self._log("[CANCELLED] Job was cancelled by user during originals export.")
                    return
                # Calculate progress for standard images
                total_files = len(standard_images) + (len(raw_images) if self.settings.include_raw else 0)
                self._progress(idx / total_files * 0.25)  # First 25% of progress
                
                # Get original filename or add prefix if requested
                img_name = img_path.name
                if self.settings.add_prefix:
                    img_name = config.FILE_PREFIXES["original"] + img_name
                
                target_path = export_files_path / img_name
                
                if self.settings.dry_run:
                    self._log(f"[DRYRUN] Would {originals_action} {img_path.name} to exports folder as {img_name}")
                else:
                    try:
                        if originals_action == "move":
                            shutil.move(img_path, target_path)
                            self._log(f"Moved original: {img_path.name} → {img_name}")
                        else:  # copy
                            shutil.copy2(img_path, target_path)
                            self._log(f"Copied original: {img_path.name} → {img_name}")
                    except PermissionError as pe:
                        self._log(f"[ERROR] Permission denied for {img_path.name}: {pe}")
                    except Exception as e:
                        self._log(f"[ERROR] Failed to process {img_path.name}: {e}")

        # Process RAW files if found and enabled
        if raw_images and self.settings.include_raw:
            self._log(f"Processing {len(raw_images)} RAW files...")

            # Only create RAW folder and README if action is not 'leave'
            raw_action = getattr(self.settings, 'raw_action', 'copy')
            raw_folder_path = output_base / config.FOLDER_NAMES["raw"]
            if raw_action in ["copy", "move"]:
                if not self.settings.dry_run:
                    raw_folder_path.mkdir(exist_ok=True, parents=True)
                    # Create RAW README if not present
                    import filesystem
                    filesystem.create_raw_readme(raw_folder_path, dry_run=self.settings.dry_run)

            for idx, raw_path in enumerate(raw_images):
                if getattr(self, 'cancel_requested', False):
                    self._log("[CANCELLED] Job was cancelled by user during RAW export.")
                    return
                # Continue progress calculation from where standard images left off
                progress_base = 0.25 * (len(standard_images) / total_files) if standard_images else 0
                progress_increment = 0.25 / len(raw_images)
                self._progress(progress_base + idx * progress_increment)

                # Get original filename or add prefix if requested
                raw_name = raw_path.name
                if self.settings.add_prefix:
                    raw_name = config.FILE_PREFIXES["raw"] + raw_name

                target_path = raw_folder_path / raw_name

                # Skip file operations if 'leave' is selected
                if raw_action == "leave":
                    self._log(f"Leaving RAW file: {raw_path.name} in original location")
                    continue

                if self.settings.dry_run:
                    self._log(f"[DRYRUN] Would {raw_action} {raw_path.name} to RAW folder as {raw_name}")
                else:
                    try:
                        if raw_action == "move":
                            shutil.move(raw_path, target_path)
                            self._log(f"Moved RAW file: {raw_path.name} → {raw_name}")
                        else:  # copy
                            shutil.copy2(raw_path, target_path)
                            self._log(f"Copied RAW file: {raw_path.name} → {raw_name}")
                    except PermissionError as pe:
                        self._log(f"[ERROR] Permission denied for {raw_path.name}: {pe}")
                    except Exception as e:
                        self._log(f"[ERROR] Failed to process {raw_path.name}: {e}")

        # Optionally create ZIPs for all main outputs
        if self.settings.create_zip and not self.settings.dry_run:
            zip_targets = []
            # Export Files (Originals) ZIP - only if originals were handled and path exists
            if export_files_path and export_files_path.exists() and any(export_files_path.iterdir()):
                 zip_targets.append((export_files_path, output_base / f"{config.FOLDER_NAMES['originals']}.zip"))
            
            # Optimized Files ZIP (parent of Optimized JPGs and WebPs)
            # Assuming config.FOLDER_NAMES["optimized"] is "Optimized Files"
            optimized_parent_dir = output_base / config.FOLDER_NAMES["optimized"]
            if optimized_parent_dir.exists() and any(optimized_parent_dir.iterdir()):
                zip_targets.append((optimized_parent_dir, output_base / f"{config.FOLDER_NAMES['optimized']}.zip"))

            # Compressed Files ZIP (parent of Compressed JPGs and WebPs)
            # Assuming config.FOLDER_NAMES["compressed"] is "Compressed Files"
            compressed_parent_dir = output_base / config.FOLDER_NAMES["compressed"]
            if compressed_parent_dir.exists() and any(compressed_parent_dir.iterdir()):
                zip_targets.append((compressed_parent_dir, output_base / f"{config.FOLDER_NAMES['compressed']}.zip"))

            # Add RAW ZIP if RAWs were included and raw_dir_path exists and is non-empty
            if self.settings.include_raw and raw_dir_path and raw_dir_path.exists() and any(raw_dir_path.iterdir()):
                zip_targets.append((raw_dir_path, output_base / f"{config.FOLDER_NAMES['raw']}.zip"))
            
            if not zip_targets:
                self._log("[INFO] No suitable folders found for ZIP creation.")
            else:
                total_zip_tasks = len(zip_targets)
                current_zip_task = 0
                for i, (folder, zip_path) in enumerate(zip_targets):
                    current_zip_task +=1
                    self._log(f"Preparing to ZIP {folder.name} ({current_zip_task}/{total_zip_tasks})")
                    def zip_progress_callback(zip_prog):
                        # Map progress for each ZIP to the final 10% of the overall bar, divided by number of ZIPs
                        # Example: if 2 zips, first is 0.9-0.95, second is 0.95-1.0
                        zip_phase_progress_start = 0.9 
                        zip_phase_total_progress = 0.1 # Allocate 10% of total progress to zipping
                        
                        # Progress within the current ZIP's allocated portion
                        current_zip_progress_share = zip_prog * (zip_phase_total_progress / total_zip_tasks)
                        
                        # Progress accomplished by previous zips within the zipping phase
                        progress_from_previous_zips = (i / total_zip_tasks) * zip_phase_total_progress
                        
                        overall_prog = zip_phase_progress_start + progress_from_previous_zips + current_zip_progress_share
                        overall_prog = min(max(overall_prog, 0.0), 1.0) # Clamp to [0, 1]
                        self._progress(overall_prog)

                    ok = filesystem.create_zip_archive(folder, zip_path, dry_run=False, progress_callback=zip_progress_callback)
                    if ok:
                        self._log(f"Created ZIP archive: {zip_path}")
                    else:
                        self._log(f"[WARN] ZIP archive not created or failed: {zip_path}")
        self._progress(1.0)
        self._log("PhotoPackager job complete.")


    def process_and_report(img_path, worker_args):
        """
        Worker function for parallel image processing. Handles error reporting.

        Args:
            img_path (Path): Path to the image file.
            worker_args (dict): Arguments for processing (output_base, global_choices, dry_run).
        Returns:
            tuple: (img_path, error) where error is None if successful, else error message.
        """
        import image_processing

        try:
            image_processing.process_image(
                img_path,
                worker_args["output_base"],
                worker_args["global_choices"],
                dry_run=worker_args["dry_run"],
            )
            return (img_path, None)
        except Exception as e:
            return (img_path, str(e))

    def _progress(self, value: float):
        """
        Internal method to report progress to the callback, if set.
        Args:
            value (float): Progress value between 0 and 1.
        Returns:
            None
        """
        if self.progress_callback:
            self.progress_callback(value)

    def _log(self, message: str):
        """
        Internal method to log a message to the callback (if set) and to the logger.
        Args:
            message (str): Log message.
        Returns:
            None
        """
        if self.log_callback:
            self.log_callback(message)
        self.logger.info(message)
