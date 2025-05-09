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
fh = logging.FileHandler("debug_log.txt", encoding="utf-8")
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
    def __init__(self):
        super().__init__()
        # Import all default values from config at the beginning
        from config import (
            USER_COMPANY_NAME, USER_WEBSITE, USER_SUPPORT_EMAIL,
            DEFAULT_GENERATE_JPG, DEFAULT_GENERATE_WEBP, DEFAULT_GENERATE_COMPRESSED_JPG,
            DEFAULT_GENERATE_COMPRESSED_WEBP, DEFAULT_ORIGINAL_ACTION, DEFAULT_RAW_ACTION, 
            DEFAULT_EXIF_OPTION, DEFAULT_GENERATE_ZIPS, DEFAULT_WORKERS, DEFAULT_INCLUDE_RAW, 
            DEFAULT_ADD_PREFIX
        )
        
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
        self.src_browse = QPushButton("Browse...")
        grid.addWidget(self.src_edit, 0, 1)
        grid.addWidget(self.src_browse, 0, 2)
        self.src_browse.clicked.connect(self.browse_src_folder)
        # Output folder
        grid.addWidget(QLabel("Output Folder:"), 1, 0)
        self.out_edit = QLineEdit()
        self.out_edit.setToolTip("Where to save all the processed files and folder structure")
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
        default_originals_index = self.originals_combo.findText(DEFAULT_ORIGINAL_ACTION.capitalize())
        if default_originals_index >= 0:
            self.originals_combo.setCurrentIndex(default_originals_index)
        
        # RAW Files
        self.include_raw_checkbox = QCheckBox("RAW Files")
        self.include_raw_checkbox.setChecked(DEFAULT_INCLUDE_RAW)
        self.include_raw_checkbox.setToolTip("Include RAW camera files (.arw, .cr2, etc.) in the output package")
        
        self.raw_combo = QComboBox()
        self.raw_combo.addItems(["Copy", "Move", "Leave"])
        self.raw_combo.setToolTip("How to handle RAW files:\n• Copy: Make a copy in the output (safest)\n• Move: Relocate RAW files to output (use with caution)\n• Leave: Reference RAW files in their original location")
        default_raw_index = self.raw_combo.findText(DEFAULT_RAW_ACTION.capitalize())
        if default_raw_index >= 0:
            self.raw_combo.setCurrentIndex(default_raw_index)
        
        # --- GENERATED FILES ---
        # Optimized Files
        self.jpg_checkbox = QCheckBox("Optimized JPG")
        self.jpg_checkbox.setChecked(DEFAULT_GENERATE_JPG)
        self.jpg_checkbox.setToolTip("Generate high-quality JPG versions")
        
        self.webp_checkbox = QCheckBox("Optimized WebP")
        self.webp_checkbox.setChecked(DEFAULT_GENERATE_WEBP)
        self.webp_checkbox.setToolTip("Generate high-quality WebP versions (smaller file size, modern format)")
        
        # Compressed Files
        self.compressed_jpg_checkbox = QCheckBox("Compressed JPG")
        self.compressed_jpg_checkbox.setChecked(DEFAULT_GENERATE_COMPRESSED_JPG)
        self.compressed_jpg_checkbox.setToolTip("Create smaller, lower-quality JPG images for web or preview use")
        
        self.compressed_webp_checkbox = QCheckBox("Compressed WebP")
        self.compressed_webp_checkbox.setChecked(DEFAULT_GENERATE_COMPRESSED_WEBP) 
        self.compressed_webp_checkbox.setToolTip("Create smaller, lower-quality WebP images for web or preview use")
        
        # --- PROCESSING OPTIONS ---
        # Quality Prefixes
        self.add_prefix_checkbox = QCheckBox("Quality Prefixes")
        self.add_prefix_checkbox.setChecked(DEFAULT_ADD_PREFIX)
        self.add_prefix_checkbox.setToolTip("Add prefixes to filenames:\nRAW_, Original_, Optimized_, Compressed_")
        
        # Keep EXIF
        self.keep_exif_checkbox = QCheckBox("Keep EXIF Data") 
        self.keep_exif_checkbox.setChecked(DEFAULT_EXIF_OPTION == "keep")
        self.keep_exif_checkbox.setToolTip("Preserve photo metadata like camera info and date")
        
        # Create ZIP
        self.zip_checkbox = QCheckBox("Create ZIP Archives")
        self.zip_checkbox.setChecked(DEFAULT_GENERATE_ZIPS)
        self.zip_checkbox.setToolTip("Generate ZIP archives of output folders\nMakes for easier client delivery")
        
        # Dry Run
        self.dry_run_checkbox = QCheckBox("Dry Run Mode")
        self.dry_run_checkbox.setToolTip("Test mode - shows what would happen without actually creating files")
        
        # CPU Threads
        self.workers_spin = QSpinBox()
        self.workers_spin.setMinimum(1)
        self.workers_spin.setMaximum(64)
        self.workers_spin.setValue(DEFAULT_WORKERS)
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

        self.delivery_company_edit = QLineEdit(USER_COMPANY_NAME)
        self.delivery_company_edit.setToolTip("Your company/studio name to be included in delivery documentation")
        
        self.delivery_website_edit = QLineEdit(USER_WEBSITE)
        self.delivery_website_edit.setToolTip("Your website URL to be included in delivery documentation")
        
        self.delivery_support_edit = QLineEdit(USER_SUPPORT_EMAIL)
        self.delivery_support_edit.setToolTip("Support email shown to clients in delivery documentation")
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
        self.start_btn.setMinimumHeight(45)
        self.start_btn.setStyleSheet("font-weight: bold; font-size: 14px;")
        
        # Save defaults button with icon indication
        self.save_defaults_btn = QPushButton("💾 Save as Default")
        self.save_defaults_btn.setToolTip("Save current settings as default values in config.py")
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        left_layout.addWidget(self.progress_bar)
        
        action_layout.addWidget(self.start_btn, 3)  # Give more space to the main button
        action_layout.addWidget(self.save_defaults_btn, 1)
        left_layout.addLayout(action_layout)
        # Status bar
        self.status_bar = QLabel("Idle")
        left_layout.addWidget(self.status_bar)
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
        self.save_defaults_btn.clicked.connect(self.save_settings_as_default)
        # Exception hook for GUI log
        sys.excepthook = GuiExceptionLogger(self.log)

    def log(self, msg):
        self.log_display.append(msg)
        self.log_display.ensureCursorVisible()

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
        """Save current UI settings as defaults in config.py"""
        try:
            import re
            from pathlib import Path
            
            # Get the project root directory
            project_root = Path(__file__).resolve().parent.parent
            config_path = project_root / "config.py"
            
            # Read the current config.py file
            with open(config_path, 'r') as f:
                config_content = f.read()
            
            # Get current settings from UI
            generate_jpg = self.jpg_checkbox.isChecked()
            generate_webp = self.webp_checkbox.isChecked()
            generate_compressed_jpg = self.compressed_jpg_checkbox.isChecked()
            generate_compressed_webp = self.compressed_webp_checkbox.isChecked()
            # For backward compatibility
            generate_low_quality = generate_compressed_jpg or generate_compressed_webp
            original_action = self.originals_combo.currentText().lower()
            exif_option = "keep" if self.keep_exif_checkbox.isChecked() else "strip_all"
            generate_zips = self.zip_checkbox.isChecked()
            workers = self.workers_spin.value()
            # New options
            include_raw = self.include_raw_checkbox.isChecked()
            raw_action = self.raw_combo.currentText().lower()
            add_prefix = self.add_prefix_checkbox.isChecked()
            
            company_name = self.delivery_company_edit.text().strip()
            company_website = self.delivery_website_edit.text().strip()
            company_email = self.delivery_support_edit.text().strip()
            
            # Define patterns and their replacements
            replacements = [
                (r'DEFAULT_GENERATE_JPG: bool = .*', f'DEFAULT_GENERATE_JPG: bool = {generate_jpg}'),
                (r'DEFAULT_GENERATE_WEBP: bool = .*', f'DEFAULT_GENERATE_WEBP: bool = {generate_webp}'),
                (r'DEFAULT_GENERATE_COMPRESSED_JPG: bool = .*', f'DEFAULT_GENERATE_COMPRESSED_JPG: bool = {generate_compressed_jpg}'),
                (r'DEFAULT_GENERATE_COMPRESSED_WEBP: bool = .*', f'DEFAULT_GENERATE_COMPRESSED_WEBP: bool = {generate_compressed_webp}'),
                (r'DEFAULT_GENERATE_LOW_QUALITY: bool = .*', f'DEFAULT_GENERATE_LOW_QUALITY: bool = {generate_low_quality}'),
                (r'DEFAULT_ORIGINAL_ACTION: str = .*', f'DEFAULT_ORIGINAL_ACTION: str = "{original_action}"'),
                (r'DEFAULT_EXIF_OPTION: str = .*', f'DEFAULT_EXIF_OPTION: str = "{exif_option}"'),
                (r'DEFAULT_GENERATE_ZIPS: bool = .*', f'DEFAULT_GENERATE_ZIPS: bool = {generate_zips}'),
                (r'DEFAULT_WORKERS: int = .*', f'DEFAULT_WORKERS: int = {workers}'),
                (r'DEFAULT_INCLUDE_RAW: bool = .*', f'DEFAULT_INCLUDE_RAW: bool = {include_raw}'),
                (r'DEFAULT_ADD_PREFIX: bool = .*', f'DEFAULT_ADD_PREFIX: bool = {add_prefix}'),
                (r'DEFAULT_RAW_ACTION: str = .*', f'DEFAULT_RAW_ACTION: str = "{raw_action}"'),
                # Branding
                (r'USER_COMPANY_NAME: str = .*', f'USER_COMPANY_NAME: str = "{company_name}"'),
                (r'USER_WEBSITE: str = .*', f'USER_WEBSITE: str = "{company_website}"'),
                (r'USER_SUPPORT_EMAIL: str = .*', f'USER_SUPPORT_EMAIL: str = "{company_email}"'),
            ]
            
            # Apply all replacements
            new_config = config_content
            for pattern, replacement in replacements:
                new_config = re.sub(pattern, replacement, new_config)
            
            # Write the updated config back to file
            with open(config_path, 'w') as f:
                f.write(new_config)
                
            self.log("✅ Settings successfully saved as defaults in config.py")
        except Exception as e:
            self.log(f"❌ Error saving settings to config.py: {str(e)}")
            traceback.print_exc()
    
    def start_worker(self):
        self.start_btn.setEnabled(False)
        self.set_status("Processing...")
        self.progress_bar.setValue(0)
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
        settings = PhotoPackagerSettings(
            source_folder=source_folder,
            output_folder=output_folder,
            move_originals=move_originals,
            exif_policy=exif_policy,
            generate_jpg=generate_jpg,
            generate_webp=generate_webp,
            generate_compressed_jpg=generate_compressed_jpg,
            generate_compressed_webp=generate_compressed_webp,
            skip_compressed=(not generate_low_quality),
            create_zip=create_zip,
            workers=1,  # Force single-threaded mode for GUI stability on Windows (multiprocessing is unsafe)
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
        self.worker_thread.started.connect(self.worker.run)
        self.worker_thread.start()


def run_app():
    import sys
    print("STARTING APP")
    try:
        from PySide6.QtWidgets import QApplication
        app = QApplication(sys.argv)
        from gui.main_window import MainWindow as MW
        win = MW()
        win.show()
        sys.exit(app.exec())
    except Exception as e:
        import traceback
        with open("/tmp/photopackager_crash.log", "w") as f:
            f.write(traceback.format_exc())
        raise


if __name__ == "__main__":
    run_app()
