from PySide6.QtWidgets import QDialog, QVBoxLayout, QPushButton

class SettingsDialog(QDialog):
    def __init__(self, settings: dict, parent=None):
        super().__init__(parent)
        self._settings = settings
        self.setWindowTitle("Preferences")
        layout = QVBoxLayout(self)
        # Placeholder UI: OK/Cancel buttons
        btn_ok = QPushButton("OK", self)
        btn_ok.clicked.connect(self.accept)
        layout.addWidget(btn_ok)

    def get_settings(self) -> dict:
        return self._settings
