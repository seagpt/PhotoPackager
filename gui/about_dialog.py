from PySide6.QtWidgets import QDialog, QVBoxLayout, QLabel, QPushButton

class AboutDialog(QDialog):
    def __init__(self, version: str, company: str, website: str, parent=None):
        super().__init__(parent)
        self.setWindowTitle("About PhotoPackager")
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(f"<b>PhotoPackager</b> v{version}"))
        layout.addWidget(QLabel(f"&copy; {company}"))
        layout.addWidget(QLabel(f"<a href='{website}'>{website}</a>"))
        btn_close = QPushButton("Close", self)
        btn_close.clicked.connect(self.accept)
        layout.addWidget(btn_close)
