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
        self.setWindowTitle("PhotoPackager by DropShock Digital")
        self.setWindowIcon(QIcon(LOGO_PATH))
        self.resize(700, 600)
        # Central widget and main layout
        central = QWidget()
        main_layout = QVBoxLayout(central)
        # Logo
        logo = QLabel()
        pixmap = QPixmap(LOGO_PATH)
        logo.setPixmap(pixmap.scaledToWidth(360, Qt.SmoothTransformation))
        logo.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(logo)
        # Input Area
        grid = QGridLayout()
        # Source folder
        grid.addWidget(QLabel("Source Folder:"), 0, 0)
        self.src_edit = QLineEdit()
        self.src_browse = QPushButton("Browse...")
        grid.addWidget(self.src_edit, 0, 1)
        grid.addWidget(self.src_browse, 0, 2)
        self.src_browse.clicked.connect(self.browse_src_folder)
        # Output folder
        grid.addWidget(QLabel("Output Folder:"), 1, 0)
        self.out_edit = QLineEdit()
        self.out_browse = QPushButton("Browse...")
        grid.addWidget(self.out_edit, 1, 1)
        grid.addWidget(self.out_browse, 1, 2)
        self.out_browse.clicked.connect(self.browse_out_folder)
        # Shoot base name
        grid.addWidget(QLabel("Shoot Base Name:"), 2, 0)
        self.basename_edit = QLineEdit()
        grid.addWidget(self.basename_edit, 2, 1, 1, 2)
        main_layout.addLayout(grid)
        # Settings Area
        settings_layout = QHBoxLayout()
        self.originals_combo = QComboBox()
        self.originals_combo.addItems(["Copy", "Move", "Leave"])
        self.exif_combo = QComboBox()
        self.exif_combo.addItems(["Keep", "Strip All"])
        self.jpg_checkbox = QCheckBox("JPG")
        self.jpg_checkbox.setChecked(True)
        self.webp_checkbox = QCheckBox("WebP")
        self.webp_checkbox.setChecked(True)
        self.skip_compressed_checkbox = QCheckBox("Skip Compressed")
        self.zip_checkbox = QCheckBox("Create ZIP")
        self.zip_checkbox.setChecked(True)
        self.workers_spin = QSpinBox()
        self.workers_spin.setMinimum(1)
        self.workers_spin.setMaximum(64)
        self.workers_spin.setValue(4)
        self.dry_run_checkbox = QCheckBox("Dry Run")
        # Add to settings layout
        settings_layout.addWidget(QLabel("Originals:"))
        settings_layout.addWidget(self.originals_combo)
        settings_layout.addWidget(QLabel("EXIF:"))
        settings_layout.addWidget(self.exif_combo)
        settings_layout.addWidget(self.jpg_checkbox)
        settings_layout.addWidget(self.webp_checkbox)
        settings_layout.addWidget(self.skip_compressed_checkbox)
        settings_layout.addWidget(self.zip_checkbox)
        settings_layout.addWidget(QLabel("Workers:"))
        settings_layout.addWidget(self.workers_spin)
        settings_layout.addWidget(self.dry_run_checkbox)
        main_layout.addLayout(settings_layout)

        # Delivery Branding Area
        branding_layout = QHBoxLayout()
        from config import USER_COMPANY_NAME, USER_WEBSITE, USER_SUPPORT_EMAIL

        self.delivery_company_edit = QLineEdit(USER_COMPANY_NAME)
        self.delivery_website_edit = QLineEdit(USER_WEBSITE)
        self.delivery_support_edit = QLineEdit(USER_SUPPORT_EMAIL)
        branding_layout.addWidget(QLabel("Delivery Company:"))
        branding_layout.addWidget(self.delivery_company_edit)
        branding_layout.addWidget(QLabel("Website:"))
        branding_layout.addWidget(self.delivery_website_edit)
        branding_layout.addWidget(QLabel("Support Email:"))
        branding_layout.addWidget(self.delivery_support_edit)
        main_layout.addLayout(branding_layout)
        # Action Area
        self.start_btn = QPushButton("Start Processing")
        main_layout.addWidget(self.start_btn)
        # Feedback Area
        feedback_layout = QVBoxLayout()
        self.status_label = QLabel("Idle")
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.log_area = QTextEdit()
        self.log_area.setReadOnly(True)
        feedback_layout.addWidget(self.status_label)
        feedback_layout.addWidget(self.progress_bar)
        feedback_layout.addWidget(self.log_area)
        main_layout.addLayout(feedback_layout)
        # About/GitHub link
        about_layout = QHBoxLayout()
        about_layout.addStretch()
        self.github_link = QLabel('<a href="{}">About / GitHub</a>'.format(GITHUB_URL))
        self.github_link.setOpenExternalLinks(True)
        about_layout.addWidget(self.github_link)
        main_layout.addLayout(about_layout)
        # Set layout
        self.setCentralWidget(central)
        # Connect signals
        self.start_btn.clicked.connect(self.start_worker)
        # Exception hook for GUI log
        sys.excepthook = GuiExceptionLogger(self.log)

    def log(self, msg):
        self.log_area.append(msg)

    def set_status(self, msg):
        self.status_label.setText(msg)

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

    def start_worker(self):
        self.start_btn.setEnabled(False)
        self.set_status("Processing...")
        self.progress_bar.setValue(0)
        # Gather settings from GUI
        source_folder = self.src_edit.text().strip()
        output_folder = self.out_edit.text().strip()
        originals_action = self.originals_combo.currentText().lower()
        move_originals = originals_action == "move"
        exif_policy = (
            self.exif_combo.currentText().replace(" ", "_").lower()
        )  # e.g. 'keep', 'strip_all'
        generate_jpg = self.jpg_checkbox.isChecked()
        generate_webp = self.webp_checkbox.isChecked()
        skip_compressed = self.skip_compressed_checkbox.isChecked()
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
            skip_compressed=skip_compressed,
            create_zip=create_zip,
            workers=1,  # Force single-threaded mode for GUI stability on Windows (multiprocessing is unsafe)
            dry_run=dry_run,
            verbose=True,
            delivery_company_name=delivery_company_name,
            delivery_website=delivery_website,
            delivery_support_email=delivery_support_email,
            originals_action=originals_action,
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
    """Initialize and run the PhotoPackager application.
    This function is imported by main.py when launching the app.
    """
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    run_app()
