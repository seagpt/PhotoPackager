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
    skip_compressed: bool = False
    create_zip: bool = True
    workers: int = 0  # 0 = auto (CPU count)
    dry_run: bool = False
    verbose: bool = False
    # Delivery branding fields (for README and client-facing output)
    delivery_company_name: str = ""
    delivery_website: str = ""
    delivery_support_email: str = ""
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
        out.mkdir(parents=True, exist_ok=True)
        self._log(f"[DEBUG] dry_run={self.settings.dry_run}, workers={self.settings.workers}, output_base={out / src.name}, total_images={len(list(src.iterdir()))}")

        # Gather images
        image_files = filesystem.gather_image_files(src)
        if not image_files:
            self._log(f"[WARN] No images found in: {src}")
            return
        self._log(f"Found {len(image_files)} images to process.")
        if len(image_files) == 0:
            self._log("[ERROR] No images found to process. Exiting job early.")

        # Prepare output structure
        shoot_name = src.name
        filesystem.create_output_structure(
            shoot_name,
            out,
            self.settings.delivery_company_name,
            self.settings.delivery_website,
            self.settings.delivery_support_email,
            dry_run=self.settings.dry_run
        )
        output_base = out / shoot_name

        # Prepare processing options
        global_choices = {
            "move_originals": self.settings.move_originals,
            "skip_export": self.settings.skip_export,
            "generate_jpg": self.settings.generate_jpg,
            "generate_webp": self.settings.generate_webp,
            "skip_compressed": self.settings.skip_compressed,
            "exif_option": self.settings.exif_policy,
            "dry_run": self.settings.dry_run,
        }

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
        export_originals_path = output_base / config.FOLDER_NAMES["export_originals"]
        logging.debug(f"Checking dry_run before handling originals: {self.settings.dry_run}")
        if originals_action in ["copy", "move"]:
            if self.settings.dry_run:
                self._log(f"[DRYRUN] Would {originals_action} originals to: {export_originals_path}")
            else:
                self._log(f"{originals_action.capitalize()}ing originals to: {export_originals_path}")
                original_files = [f for f in src.iterdir() if f.is_file()]
                for src_path in original_files:
                    dest_path = export_originals_path / src_path.name
                    logging.debug(f"Attempting to {originals_action} original from {src_path} to {dest_path}")
                    try:
                        if originals_action == "copy":
                            logging.info(f"Attempting copy of {src_path} to {dest_path}...")
                            copied_path = shutil.copy2(src_path, dest_path)
                            logging.info(f"shutil.copy2 returned: {copied_path}")
                            if Path(dest_path).exists():
                                logging.info(f"VERIFIED: Destination file exists: {dest_path}")
                            else:
                                logging.error(f"VERIFICATION FAILED: Destination file NOT found after copy attempt: {dest_path}")
                            logging.info(f"Successfully copied {src_path} to {dest_path}.")
                            self._log(f"Copied: {src_path} -> {dest_path}")
                        elif originals_action == "move":
                            logging.info(f"Attempting move of {src_path} to {dest_path}...")
                            moved_path = shutil.move(src_path, dest_path)
                            logging.info(f"shutil.move returned: {moved_path}")
                            if Path(dest_path).exists():
                                logging.info(f"VERIFIED: Destination file exists: {dest_path}")
                            else:
                                logging.error(f"VERIFICATION FAILED: Destination file NOT found after move attempt: {dest_path}")
                            logging.info(f"Successfully moved {src_path} to {dest_path}.")
                            self._log(f"Moved: {src_path} -> {dest_path}")
                    except Exception:
                        logging.exception(f"ERROR {originals_action}ing original file:")

        # Optionally create ZIPs for all main outputs
        if self.settings.create_zip and not self.settings.dry_run:
            zip_targets = [
                (export_originals_path, output_base / "Export Originals.zip"),
                (
                    output_base / config.FOLDER_NAMES["optimized"],
                    output_base / "Optimized Files.zip",
                ),
                (
                    output_base / config.FOLDER_NAMES["compressed"],
                    output_base / "Compressed Files.zip",
                ),
            ]
            for folder, zip_path in zip_targets:
                if folder.exists():
                    ok = filesystem.create_zip_archive(folder, zip_path, dry_run=False)
                    if ok:
                        self._log(f"Created ZIP archive: {zip_path}")
                    else:
                        self._log(
                            f"[WARN] ZIP archive not created or failed: {zip_path}"
                        )
                else:
                    self._log(
                        f"[SKIP] ZIP not created, folder does not exist: {folder}"
                    )

        self._progress(1.0)
        self._log("PhotoPackager job complete.")

    @staticmethod
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
