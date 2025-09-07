from pathlib import Path

# --- Core Application Paths ---
# Base directory for all final packaged outputs.
OUTPUTS_DIR = Path("./outputs")
TEMP_UPLOADS_DIR = Path("./temp_uploads")

# --- Image Processing ---
# Default JPEG quality for the 'Optimized' variant (1-100)
OPTIMIZED_QUALITY = 95

# Default JPEG quality for the 'Compressed' variant (1-100)
COMPRESSED_QUALITY = 80
