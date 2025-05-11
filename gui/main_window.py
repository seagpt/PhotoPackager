import sys
import os
from pathlib import Path

# --- Ensure project root is in sys.path for root-level imports ---
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import traceback
import logging
from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QLabel,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QLineEdit,
    QPushButton,
    QTextEdit,
    QComboBox,
    QCheckBox,
    QSpinBox,
    QProgressBar,
    QGroupBox,
)
from PySide6.QtGui import QPixmap, QIcon
from PySide6.QtCore import Qt, QObject, Signal, QThread
from job import PhotoPackagerJob, PhotoPackagerSettings

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
# Get a proper user-writable location for logs
log_dir = os.path.join(os.path.expanduser("~"), ".photopackager")
os.makedirs(log_dir, exist_ok=True)  # Create directory if it doesn't exist
log_path = os.path.join(log_dir, "debug_log.txt")
fh = logging.FileHandler(log_path, encoding="utf-8")
formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
fh.setFormatter(formatter)
if not logger.hasHandlers():
    logger.addHandler(fh)


# Exception hook to log to both GUI and debug_log.txt
class GuiExceptionLogger:
    def __init__(self, log_callback):
        self.log_callback = log_callback

    def __call__(self, exctype, value, tb):
        msg = "".join(traceback.format_exception(exctype, value, tb))
        logger.error(f"UNCAUGHT: {msg}")
        if self.log_callback:
            self.log_callback(f"UNCAUGHT: {msg}")


def resource_path(relative_path):
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), relative_path)


LOGO_PATH = resource_path("assets/PhotoPackager_Patch_Design.png")
GITHUB_URL = "https://github.com/seagpt/PhotoPackager"


class JobWorker(QObject):
    log_signal = Signal(str)
    status_signal = Signal(str)
    progress_signal = Signal(int)
    finished_signal = Signal()

    def __init__(self, settings):
        super().__init__()
        self.settings = settings

    def run(self):
        try:
            self.status_signal.emit("Processing...")

            def log_callback(msg):
                self.log_signal.emit(msg)

            def progress_callback(val):
                self.progress_signal.emit(int(val * 100))

            job = PhotoPackagerJob(self.settings)
            job.run(progress_callback=progress_callback, log_callback=log_callback)
            self.status_signal.emit("Done!")
            self.progress_signal.emit(100)
            self.finished_signal.emit()
        except Exception as e:
            tb = traceback.format_exc()
            self.log_signal.emit(f"ERROR: {e}\n{tb}")
            logger.error(f"ERROR: {e}\n{tb}")
            self.status_signal.emit("Error!")
            self.finished_signal.emit()


class MainWindow(QMainWindow):
    def _make_drag_enter_event(self):
        """Create a function to handle drag enter events for folder paths"""
        def drag_enter_event(event):
            if event.mimeData().hasUrls():
                event.acceptProposedAction()
        return drag_enter_event
    
    def _make_drop_event(self, target_edit):
        """Create a function to handle drop events for folder paths"""
        def drop_event(event):
            if event.mimeData().hasUrls():
                url = event.mimeData().urls()[0]
                path = url.toLocalFile()
                if os.path.isdir(path):
                    target_edit.setText(path)
                event.acceptProposedAction()
        return drop_event
        
    def __init__(self, settings=None):
        super().__init__()
        
        self.settings = settings
        # debug_qt support removed for simplicity
        
        try:
            # Use provided settings or fall back to defaults

            self.setWindowTitle("PhotoPackager by DropShock Digital")
            self.setWindowIcon(QIcon(LOGO_PATH))
            # --- Responsive sizing: fit to screen ---
            from PySide6.QtGui import QGuiApplication
            screen = QGuiApplication.primaryScreen()
            if screen:
                avail_geom = screen.availableGeometry()
                screen_h = avail_geom.height()
                width = int(screen_h * 1.2)
                height = int(screen_h * 0.75)
                self.resize(width, height)
            else:
                self.resize(1100, 520)  # Fallback
            # Central widget and main layout
            central = QWidget()
            main_hlayout = QHBoxLayout(central)
            # --- LEFT COLUMN (everything except log) ---
            left_col = QWidget()
            left_layout = QVBoxLayout(left_col)
            # Logo
            logo = QLabel()
            pixmap = QPixmap(LOGO_PATH)
            logo.setPixmap(pixmap.scaledToWidth(360, Qt.SmoothTransformation))
            logo.setAlignment(Qt.AlignCenter)
            left_layout.addWidget(logo)
            # Input Area
            grid = QGridLayout()
            # Source folder
            grid.addWidget(QLabel("Source Folder:"), 0, 0)
            self.src_edit = QLineEdit()
            self.src_edit.setToolTip("The folder containing your original photo files to process")
            self.src_edit.setPlaceholderText("Drag or browse to select the source folder")
            self.src_edit.setAcceptDrops(True)
            self.src_edit.dragEnterEvent = self._make_drag_enter_event()
            self.src_edit.dropEvent = self._make_drop_event(self.src_edit)

            self.src_browse = QPushButton("Browse...")
            grid.addWidget(self.src_edit, 0, 1)
            grid.addWidget(self.src_browse, 0, 2)
            self.src_browse.clicked.connect(self.browse_src_folder)
            # Output folder
            grid.addWidget(QLabel("Output Folder:"), 1, 0)
            self.out_edit = QLineEdit()
            self.out_edit.setToolTip("Where to save all the processed files and folder structure")
            self.out_edit.setPlaceholderText("Drag or browse to select the output folder")
            self.out_edit.setAcceptDrops(True)
            self.out_edit.dragEnterEvent = self._make_drag_enter_event()
            self.out_edit.dropEvent = self._make_drop_event(self.out_edit)

            self.out_browse = QPushButton("Browse...")
            grid.addWidget(self.out_edit, 1, 1)
            grid.addWidget(self.out_browse, 1, 2)
            self.out_browse.clicked.connect(self.browse_out_folder)
            # Shoot base name
            grid.addWidget(QLabel("Shoot Base Name (optional):"), 2, 0)
            self.basename_edit = QLineEdit()
            self.basename_edit.setToolTip("Prefix/base name for renaming all processed files\nLeave empty to keep original filenames")
            self.basename_edit.setPlaceholderText("Leave empty to keep original filenames")
            grid.addWidget(self.basename_edit, 2, 1, 1, 2)
            left_layout.addLayout(grid)
            # Settings Area - Organized in groups
            settings_section = QVBoxLayout()
            
            # Create titled group boxes for the 3-panel layout
            input_files_group = QGroupBox("Input/Output Files")
            generated_files_group = QGroupBox("Generated Files")
            processing_group = QGroupBox("Processing Options")
            # Create UI widgets with values from config
            
            # --- INPUT/OUTPUT FILES ---
            # Original Files
            self.originals_checkbox = QCheckBox("Original Files")
            self.originals_checkbox.setChecked(True)  # Always checked by default
            self.originals_checkbox.setToolTip("Include original files in the output package\nThis option cannot be disabled as original files are required")
            self.originals_checkbox.setEnabled(False)  # Always on - required
            
            self.originals_combo = QComboBox()
            self.originals_combo.addItems(["Copy", "Move", "Leave"])
            self.originals_combo.setToolTip("How to handle original files:\n• Copy: Make a copy in the output (safest)\n• Move: Relocate originals to output (use with caution)\n• Leave: Don't touch originals")
            default_originals_index = self.originals_combo.findText(getattr(self.settings, 'default_original_action', 'Copy').capitalize())
            if default_originals_index >= 0:
                self.originals_combo.setCurrentIndex(default_originals_index)
            
            # RAW Files
            self.include_raw_checkbox = QCheckBox("RAW Files")
            self.include_raw_checkbox.setChecked(getattr(self.settings, 'default_include_raw', True))
            self.include_raw_checkbox.setToolTip("Include RAW camera files (.arw, .cr2, etc.) in the output package")
            
            self.raw_combo = QComboBox()
            self.raw_combo.addItems(["Copy", "Move", "Leave"])
            self.raw_combo.setToolTip("How to handle RAW files:\n• Copy: Make a copy in the output (safest)\n• Move: Relocate RAW files to output (use with caution)\n• Leave: Reference RAW files in their original location")
            default_raw_index = self.raw_combo.findText(getattr(self.settings, 'default_raw_action', 'Copy').capitalize())
            if default_raw_index >= 0:
                self.raw_combo.setCurrentIndex(default_raw_index)
            
            # --- GENERATED FILES ---
            # Optimized Files
            self.jpg_checkbox = QCheckBox("Optimized JPG")
            self.jpg_checkbox.setChecked(getattr(self.settings, 'default_generate_jpg', True))
            self.jpg_checkbox.setToolTip("Generate high-quality JPG versions")
            
            self.webp_checkbox = QCheckBox("Optimized WebP")
            self.webp_checkbox.setChecked(getattr(self.settings, 'default_generate_webp', True))
            self.webp_checkbox.setToolTip("Generate high-quality WebP versions (smaller file size, modern format)")
            
            # Compressed Files
            self.compressed_jpg_checkbox = QCheckBox("Compressed JPG")
            self.compressed_jpg_checkbox.setChecked(getattr(self.settings, 'default_generate_compressed_jpg', True))
            self.compressed_jpg_checkbox.setToolTip("Create smaller, lower-quality JPG images for web or preview use")
            
            self.compressed_webp_checkbox = QCheckBox("Compressed WebP")
            self.compressed_webp_checkbox.setChecked(getattr(self.settings, 'default_generate_compressed_webp', True))
            self.compressed_webp_checkbox.setToolTip("Create smaller, lower-quality WebP images for web or preview use")
            
            # --- PROCESSING OPTIONS ---
            # Quality Prefixes
            self.add_prefix_checkbox = QCheckBox("Quality Prefixes")
            self.add_prefix_checkbox.setChecked(getattr(self.settings, 'default_add_prefix', True))
            self.add_prefix_checkbox.setToolTip("Add prefixes to filenames:\nRAW_, Original_, Optimized_, Compressed_")
            
            # Keep EXIF
            self.keep_exif_checkbox = QCheckBox("Keep EXIF Data") 
            self.keep_exif_checkbox.setChecked(getattr(self.settings, 'default_exif_option', 'keep') == "keep")
            self.keep_exif_checkbox.setToolTip("Preserve photo metadata like camera info and date")
            
            # Create ZIP
            self.zip_checkbox = QCheckBox("Create ZIP Archives")
            self.zip_checkbox.setChecked(getattr(self.settings, 'default_generate_zips', True))
            self.zip_checkbox.setToolTip("Generate ZIP archives of output folders\nMakes for easier client delivery")
            
            # Dry Run
            self.dry_run_checkbox = QCheckBox("Dry Run Mode")
            self.dry_run_checkbox.setToolTip("Test mode - shows what would happen without actually creating files")
            
            # CPU Threads
            self.workers_spin = QSpinBox()
            self.workers_spin.setMinimum(1)
            self.workers_spin.setMaximum(64)
            self.workers_spin.setValue(getattr(self.settings, 'default_workers', 5))
            self.workers_spin.setToolTip("Number of CPU threads for processing\nRecommended: half your total CPU cores")
            
            # Organize settings into logical groups
            # 1. Input/Output Files Panel
            input_files_layout = QVBoxLayout()
            
            # Original Files section with dropdown
            originals_section = QGridLayout()
            originals_section.addWidget(self.originals_checkbox, 0, 0)
            handling_label = QLabel("Handling:")
            handling_label.setToolTip("How to handle original image files")
            originals_section.addWidget(handling_label, 1, 0)
            originals_section.addWidget(self.originals_combo, 1, 1)
            input_files_layout.addLayout(originals_section)
            
            # Add spacing
            input_files_layout.addSpacing(10)
            
            # RAW Files section
            raw_section = QGridLayout()
            raw_section.addWidget(self.include_raw_checkbox, 0, 0)
            raw_handling_label = QLabel("Handling:")
            raw_handling_label.setToolTip("How to handle RAW camera files")
            raw_section.addWidget(raw_handling_label, 1, 0)
            raw_section.addWidget(self.raw_combo, 1, 1)
            input_files_layout.addLayout(raw_section)
            
            # Add stretch to push everything to the top
            input_files_layout.addStretch(1)
            input_files_group.setLayout(input_files_layout)
            
            # 2. Generated Files Panel
            generated_files_layout = QVBoxLayout()
            
            # Optimized Files section
            generated_files_layout.addWidget(QLabel("<b>Optimized Files:</b>"))
            generated_files_layout.addWidget(self.jpg_checkbox)
            generated_files_layout.addWidget(self.webp_checkbox)
            
            generated_files_layout.addSpacing(10)
            
            # Compressed Files section
            generated_files_layout.addWidget(QLabel("<b>Compressed Files:</b>"))
            generated_files_layout.addWidget(self.compressed_jpg_checkbox)
            generated_files_layout.addWidget(self.compressed_webp_checkbox)
            
            # Add stretch
            generated_files_layout.addStretch(1)
            generated_files_group.setLayout(generated_files_layout)
            
            # 3. Processing Options Panel
            processing_layout = QVBoxLayout()
            
            # File Options
            processing_layout.addWidget(self.add_prefix_checkbox)
            processing_layout.addWidget(self.keep_exif_checkbox)
            processing_layout.addWidget(self.zip_checkbox)
            processing_layout.addWidget(self.dry_run_checkbox)
            
            processing_layout.addSpacing(10)
            
            # CPU Threads
            threads_layout = QHBoxLayout()
            threads_label = QLabel("CPU Threads:")
            threads_label.setToolTip("Number of parallel threads to use for processing")
            threads_layout.addWidget(threads_label)
            threads_layout.addWidget(self.workers_spin)
            threads_layout.addStretch(1)
            processing_layout.addLayout(threads_layout)
            
            # Add stretch
            processing_layout.addStretch(1)
            processing_group.setLayout(processing_layout)
            
            # Add all panels to settings section
            settings_row = QHBoxLayout()
            settings_row.addWidget(input_files_group)
            settings_row.addWidget(generated_files_group)
            settings_row.addWidget(processing_group)
            settings_section.addLayout(settings_row)
            
            left_layout.addLayout(settings_section)

            # Delivery Branding Area - More clearly labeled
            branding_group = QGroupBox("Client Delivery Information")
            branding_layout = QGridLayout()

            default_company = 'DropShock Digital LLC'
            default_website = 'https://www.dropshockdigital.com'
            default_email = 'support@dropshockdigital.com'

            self.delivery_company_edit = QLineEdit(getattr(self.settings, 'delivery_company_name', default_company))
            self.delivery_company_edit.setToolTip("Your company/studio name to be included in delivery documentation")
            self.delivery_company_edit.setPlaceholderText("e.g. DropShock Digital LLC")
            
            self.delivery_website_edit = QLineEdit(getattr(self.settings, 'delivery_website', default_website))
            self.delivery_website_edit.setToolTip("Your website URL to be included in delivery documentation")
            self.delivery_website_edit.setPlaceholderText("e.g. https://www.dropshockdigital.com")
            
            self.delivery_support_edit = QLineEdit(getattr(self.settings, 'delivery_support_email', default_email))
            self.delivery_support_edit.setToolTip("Support email shown to clients in delivery documentation")
            self.delivery_support_edit.setPlaceholderText("e.g. support@dropshockdigital.com")
            branding_layout.addWidget(QLabel("Company Name:"), 0, 0)
            branding_layout.addWidget(self.delivery_company_edit, 0, 1)
            branding_layout.addWidget(QLabel("Website URL:"), 1, 0)
            branding_layout.addWidget(self.delivery_website_edit, 1, 1)
            branding_layout.addWidget(QLabel("Support Email:"), 2, 0)
            branding_layout.addWidget(self.delivery_support_edit, 2, 1)
            branding_group.setLayout(branding_layout)
            left_layout.addWidget(branding_group)
            # Action Area - Enhanced with clearer labels and styling
            action_layout = QHBoxLayout()
            
            # Main processing button
            self.start_btn = QPushButton("▶ Start Processing")
            self.cancel_btn = QPushButton("✖ Cancel")
            self.save_defaults_btn = QPushButton("Save as Defaults")
            self.save_defaults_btn.setEnabled(False)
            self.save_defaults_btn.setToolTip(
                "Setting custom defaults is not available in this version. "
                "Please contact DropShock Digital for assistance."
            )
            self.cancel_btn.setEnabled(False)
            self.start_btn.setMinimumHeight(45)
            self.start_btn.setStyleSheet("font-weight: bold; font-size: 14px;")
            
            action_layout.addWidget(self.start_btn, 3)  # Give more space to the main button
            action_layout.addWidget(self.cancel_btn, 1)
            action_layout.addWidget(self.save_defaults_btn, 1)
            left_layout.addLayout(action_layout)
            # Status bar and progress bar
            status_layout = QHBoxLayout()
            self.status_bar = QLabel("Idle")
            self.progress_bar = QProgressBar()
            self.progress_bar.setMinimum(0)
            self.progress_bar.setMaximum(100)
            self.progress_bar.setValue(0)
            status_layout.addWidget(self.status_bar, 1)
            status_layout.addWidget(self.progress_bar, 2)
            left_layout.addLayout(status_layout)
            # --- RIGHT COLUMN: Processing Log ---
            right_col = QWidget()
            right_layout = QVBoxLayout(right_col)
            self.log_display = QTextEdit()
            self.log_display.setReadOnly(True)
            self.log_display.setMinimumWidth(340)
            self.log_display.setMaximumWidth(380)
            self.log_display.setMinimumHeight(400)
            self.log_display.setStyleSheet("font-family: monospace; font-size: 13px;")
            right_layout.addWidget(QLabel("Processing Log"))
            right_layout.addWidget(self.log_display)
            # --- Assemble columns ---
            main_hlayout.addWidget(left_col, stretch=2)
            main_hlayout.addWidget(right_col, stretch=1)
            self.setCentralWidget(central)
            # Connect signals
            self.start_btn.clicked.connect(self.start_worker)
            # Exception hook for GUI log
            sys.excepthook = GuiExceptionLogger(self.log)
            logger.info("MainWindow.__init__: Initialization finished successfully.")
        except Exception as e:
            logger.critical(f"MainWindow.__init__: CRITICAL ERROR during initialization: {e}\n{traceback.format_exc()}", exc_info=True)
            # If UI setup failed, it might be hard to show an error, but we try.
            # Depending on how much of the UI is broken, QMessageBox might not work.
            try:
                QMessageBox.critical(self, "Initialization Error", f"A critical error occurred during application startup: {e}")
            except Exception as q_e:
                logger.error(f"MainWindow.__init__: Failed to show QMessageBox for critical error: {q_e}")
            # Re-raise the exception so it can be caught by run_app if needed, or crash if run_app doesn't catch it.
            raise

    def log(self, msg):
        self.log_display.append(msg)
        self.log_display.ensureCursorVisible()
        # Parse log messages for summary stats
        if hasattr(self, '_job_summary'):
            if msg.startswith('Processed: '):
                self._job_summary['processed'] += 1
            elif msg.startswith('[ERROR] Failed to process '):
                self._job_summary['errors'] += 1
                file = msg.split(':',2)[-1].strip()
                self._job_summary['error_files'].append(file)
            elif msg.startswith('[SKIP]') or msg.startswith('[WARN]'):
                self._job_summary['skipped'] += 1
            elif msg.startswith('Copied original:') or msg.startswith('Moved original:') or msg.startswith('Copied RAW file:') or msg.startswith('Moved RAW file:'):
                import re
                import os
                m = re.search(r'→ (.+)$', msg)
                if m:
                    try:
                        fpath = m.group(1)
                        if os.path.exists(fpath):
                            self._job_summary['total_size'] += os.path.getsize(fpath)
                    except Exception:
                        pass

    def set_status(self, msg):
        self.status_bar.setText(msg)

    def set_progress(self, val):
        self.progress_bar.setValue(val)

    def browse_src_folder(self):
        from PySide6.QtWidgets import QFileDialog

        folder = QFileDialog.getExistingDirectory(self, "Select Source Folder")
        if folder:
            self.src_edit.setText(folder)

    def browse_out_folder(self):
        from PySide6.QtWidgets import QFileDialog

        folder = QFileDialog.getExistingDirectory(self, "Select Output Folder")
        if folder:
            self.out_edit.setText(folder)

    def save_settings_as_default(self):
        """Save current UI settings as defaults. THIS FUNCTION IS NO LONGER ACTIVE."""
        self.log("ℹ️ 'Save as Defaults' is currently disabled. Contact DropShock Digital for custom configurations.")
        logger.info("'Save as Defaults' button clicked, but feature is currently disabled for end-users.")
        return

    def start_worker(self):
        import os
        from PySide6.QtWidgets import QMessageBox
        source_folder = self.src_edit.text().strip()
        output_folder = self.out_edit.text().strip()
        # Estimate required space: total size of source folder + 10%
        def get_folder_size(path):
            total = 0
            for dirpath, dirnames, filenames in os.walk(path):
                for f in filenames:
                    try:
                        fp = os.path.join(dirpath, f)
                        if os.path.isfile(fp):
                            total += os.path.getsize(fp)
                    except Exception:
                        pass
            return total
        if os.path.isdir(source_folder) and os.path.isdir(os.path.dirname(output_folder)):
            required = int(get_folder_size(source_folder) * 1.1)
            stat = os.statvfs(output_folder)
            free = stat.f_bavail * stat.f_frsize
            if free < required:
                QMessageBox.warning(self, "Insufficient Disk Space", f"Not enough space on the output drive.\nRequired: {required/1024/1024:.2f} MB\nAvailable: {free/1024/1024:.2f} MB")
                return
        self.start_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self.set_status("Processing...")
        self.progress_bar.setValue(0)
        # Reset job summary stats
        self._job_summary = {
            'processed': 0,
            'skipped': 0,
            'errors': 0,
            'error_files': [],
            'total_size': 0
        }
        # Gather settings from GUI
        source_folder = self.src_edit.text().strip()
        output_folder = self.out_edit.text().strip()
        originals_action = self.originals_combo.currentText().lower()
        move_originals = originals_action == "move"
        exif_policy = "keep" if self.keep_exif_checkbox.isChecked() else "strip_all"
        generate_jpg = self.jpg_checkbox.isChecked()
        generate_webp = self.webp_checkbox.isChecked()
        generate_compressed_jpg = self.compressed_jpg_checkbox.isChecked()
        generate_compressed_webp = self.compressed_webp_checkbox.isChecked()
        # For backward compatibility
        generate_low_quality = generate_compressed_jpg or generate_compressed_webp
        create_zip = self.zip_checkbox.isChecked()
        workers = self.workers_spin.value()
        dry_run = self.dry_run_checkbox.isChecked()
        # Delivery branding fields
        delivery_company_name = self.delivery_company_edit.text().strip()
        delivery_website = self.delivery_website_edit.text().strip()
        delivery_support_email = self.delivery_support_edit.text().strip()
        
        # Get shoot name from GUI, or None if empty
        gui_shoot_name = self.basename_edit.text().strip()
        shoot_name_for_settings = gui_shoot_name if gui_shoot_name else None

        settings = PhotoPackagerSettings(
            source_folder=source_folder,
            output_folder=output_folder,
            shoot_name=shoot_name_for_settings, # <<< Pass the shoot name here
            move_originals=move_originals,
            exif_policy=exif_policy,
            generate_jpg=generate_jpg,
            generate_webp=generate_webp,
            generate_compressed_jpg=generate_compressed_jpg,
            generate_compressed_webp=generate_compressed_webp,
            skip_compressed=(not generate_low_quality),
            create_zip=create_zip,
            workers=workers,  # Use the user's selected value
            dry_run=dry_run,
            verbose=True,
            # Branding fields
            delivery_company_name=delivery_company_name,
            delivery_website=delivery_website,
            delivery_support_email=delivery_support_email,
            # Handling options
            originals_action=originals_action, 
            # New options
            include_raw=self.include_raw_checkbox.isChecked(),
            raw_action=self.raw_combo.currentText().lower(),
            add_prefix=self.add_prefix_checkbox.isChecked(),
        )
        self.worker_thread = QThread()
        self.worker = JobWorker(settings)
        self.worker.moveToThread(self.worker_thread)
        self.worker.log_signal.connect(self.log)
        self.worker.status_signal.connect(self.set_status)
        self.worker.progress_signal.connect(self.set_progress)
        self.worker.finished_signal.connect(self.worker_thread.quit)
        self.worker.finished_signal.connect(lambda: self.start_btn.setEnabled(True))
        self.worker.finished_signal.connect(lambda: self.cancel_btn.setEnabled(False))
        self.worker.finished_signal.connect(self.show_job_summary_dialog)
        self.cancel_btn.clicked.connect(self.cancel_worker)
        self.worker_thread.started.connect(self.worker.run)
        self.worker_thread.start()
    def cancel_worker(self):
        if hasattr(self, 'worker') and self.worker is not None:
            self.worker.cancel_requested = True
            self.set_status("Cancelling...")
            self.cancel_btn.setEnabled(False)
    def show_job_summary_dialog(self):
        from PySide6.QtWidgets import QMessageBox
        from PySide6.QtGui import QPixmap
        import os
        s = self._job_summary

        # Count all output file types in the output directory
        output_folder = self.out_edit.text().strip()
        file_counts = {"JPG": 0, "WebP": 0, "RAW": 0, "ZIP": 0, "Other": 0}
        exts_map = {".jpg": "JPG", ".jpeg": "JPG", ".webp": "WebP", ".arw": "RAW", ".cr2": "RAW", ".nef": "RAW", ".dng": "RAW", ".zip": "ZIP"}
        total_files = 0
        for root, _, files in os.walk(output_folder):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                key = exts_map.get(ext, None)
                if key:
                    file_counts[key] += 1
                else:
                    file_counts["Other"] += 1
                total_files += 1

        breakdown = ", ".join(f"{k}: {v}" for k, v in file_counts.items() if v > 0)
        summary = (
            f"Processed: {s['processed']}\n"
            f"Skipped: {s['skipped']}\n"
            f"Errors: {s['errors']}\n"
            f"Total saved size: {s['total_size']/1024/1024:.2f} MB\n"
            f"Output breakdown: {breakdown}\n"
            f"Total output files: {total_files}"
        )

        # Prepare the message box
        msgbox = QMessageBox(self)
        if s['errors'] > 0:
            msgbox.setWindowTitle("PhotoPackager - Job Completed with Errors")
            details = '\n'.join(s['error_files'])
            msgbox.setIcon(QMessageBox.Critical)
            msgbox.setText(summary + "\n\nFiles with errors:\n" + details)
        else:
            msgbox.setWindowTitle("PhotoPackager - Job Complete")
            msgbox.setIcon(QMessageBox.Information)
            msgbox.setText(summary)
        # Set PhotoPackager logo as the icon
        try:
            logo_path = getattr(self.settings, 'logo_path', None)
            if not logo_path:
                logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets/logo.png")
            if os.path.exists(logo_path):
                pixmap = QPixmap(logo_path)
                if not pixmap.isNull():
                    msgbox.setIconPixmap(pixmap.scaledToHeight(48))
        except Exception as e:
            # Fallback: do nothing if logo fails
            pass
        msgbox.exec()


def run_app(settings):
    logger = logging.getLogger("PhotoPackager")
    logger.info("run_app: Entered.")
    logger.info(f"run_app: Received settings: {settings}")
    try:
        from PySide6.QtWidgets import QApplication
        app = QApplication(sys.argv)
        logger.info("run_app: QApplication initialized successfully.")
    except Exception as e:
        logger.critical(f"run_app: CRITICAL ERROR during QApplication initialization: {e}\n{traceback.format_exc()}", exc_info=True)
        sys.exit(1)

    try:
        from gui.main_window import MainWindow as MW
        win = MW(settings=settings)
        logger.info("run_app: MainWindow initialized successfully.")
    except Exception as e:
        logger.critical(f"run_app: CRITICAL ERROR during MainWindow initialization: {e}\n{traceback.format_exc()}", exc_info=True)
        sys.exit(1)

    try:
        win.show()
        logger.info("run_app: window.show() called successfully.")
    except Exception as e:
        logger.critical(f"run_app: CRITICAL ERROR during window.show(): {e}\n{traceback.format_exc()}", exc_info=True)
        sys.exit(1)

    exit_code = -1 # Default to error unless app.exec() returns
    try:
        logger.info("run_app: Calling app.exec()...")
        exit_code = app.exec()
        logger.info(f"run_app: app.exec() returned with exit_code: {exit_code}")
    except Exception as e:
        logger.critical(f"run_app: CRITICAL ERROR during app.exec(): {e}\n{traceback.format_exc()}", exc_info=True)
        # No sys.exit(1) here as app.exec() might be part of shutdown
    finally:
        logger.info(f"run_app: Exiting with final_exit_code: {exit_code}")
        sys.exit(exit_code)


if __name__ == "__main__":
    print("⚠️ This module should not be run directly.")
    print("Please use 'python app.py' to launch PhotoPackager properly.")
    import sys
    sys.exit(1)
