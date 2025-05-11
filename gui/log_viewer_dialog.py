from PySide6.QtWidgets import QDialog, QTextEdit, QVBoxLayout, QLabel

class LogViewerDialog(QDialog):
    def __init__(self, log_file_path: str, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Application Log Viewer")
        layout = QVBoxLayout(self)
        label = QLabel(f"Log File: {log_file_path}", self)
        layout.addWidget(label)
        self.text_edit = QTextEdit(self)
        self.text_edit.setReadOnly(True)
        try:
            with open(log_file_path, 'r', encoding='utf-8') as f:
                self.text_edit.setPlainText(f.read())
        except Exception as e:
            self.text_edit.setPlainText(f"Failed to load log file: {e}")
        layout.addWidget(self.text_edit)
