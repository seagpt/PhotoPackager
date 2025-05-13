#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "PhotoPackager macOS Build Script"
echo "--------------------------------"

# --- Configuration ---
APP_NAME="PhotoPackager"
ENTRY_POINT="app.py"
CONFIG_FILE="config.py"
ASSETS_DIR="assets"
ICON_FILE="$ASSETS_DIR/PhotoPackager_Patch_Design.icns"

# --- Helper Functions ---
cleanup() {
    echo "Cleaning up old build artifacts..."
    rm -rf build/
    rm -rf dist/
    rm -f *.spec
    rm -f ${APP_NAME}_v*.dmg # Refined globbing
    rm -f ${APP_NAME}.dmg    # Refined globbing (catches generic APP_NAME.dmg)
    rm -f ${APP_NAME}_temp.dmg # Explicitly remove temp dmg
    # Remove temporary dmg folder if create-dmg leaves it
    rm -rf dmg_temp/
    echo "Cleanup complete."
}

# --- Main Build Process ---
echo "Starting build..."

# Check for create-dmg command
if ! command -v create-dmg &> /dev/null
then
    echo "Error: create-dmg command not found. Please install it (e.g., 'brew install create-dmg')."
    exit 1
fi

# Activate virtual environment
VENV_PATH="venv_mac/bin/activate"
if [ -f "$VENV_PATH" ]; then
    echo "Activating virtual environment: $VENV_PATH"
    source "$VENV_PATH"
else
    echo "Warning: Virtual environment not found at $VENV_PATH. Using system Python."
    # Consider exiting if venv is strictly required:
    # echo "Error: Virtual environment $VENV_PATH not found. Please create and provision it."
    # exit 1
fi

# 1. Cleanup
cleanup

# 2. Get App Version from app.py (using python3 from venv)
APP_VERSION_FULL=$(python3 -c "import sys; sys.path.insert(0, '.'); from app import __version__; print(__version__)")
if [ -z "$APP_VERSION_FULL" ]; then
    echo "Error: Could not extract version from $ENTRY_POINT using Python 3 from venv."
    exit 1
fi
# Strip suffixes like -beta, -alpha, -rc, -logging-debug for the DMG filename
APP_VERSION_CLEAN=$(echo "$APP_VERSION_FULL" | sed -E 's/-(alpha|beta|rc|logging-debug|dev)[0-9]*//g')
echo "App Full Version: $APP_VERSION_FULL"
echo "App Clean Version for DMG: $APP_VERSION_CLEAN"

# 3. Run PyInstaller (using python3 from venv)
echo "Running PyInstaller..."
PYINSTALLER_CMD=(
    python3 -m PyInstaller --noconfirm --onedir --windowed \
    --name "$APP_NAME" \
    --icon "$ICON_FILE" \
    --add-data "$ASSETS_DIR:assets" \
    --add-data "$CONFIG_FILE:." \
    --collect-all "tkinterdnd2" \
    --hidden-import "PIL.ImageFont" \
    --hidden-import "PIL.JpegImagePlugin" \
    --hidden-import "PIL.PngImagePlugin" \
    --hidden-import "PIL.WebPImagePlugin" \
    --hidden-import "PIL.TiffImagePlugin" \
    --hidden-import "PIL.BmpImagePlugin" \
    --hidden-import "piexif" \
    --hidden-import "send2trash" \
    --hidden-import "PySide6.QtSvg" \
    --hidden-import "PySide6.QtNetwork" \
    --hidden-import "PySide6.QtPrintSupport" \
    "$ENTRY_POINT"
)

# Execute PyInstaller
"${PYINSTALLER_CMD[@]}"

if [ ! -d "dist/$APP_NAME.app" ]; then
    echo "Error: PyInstaller did not create the .app bundle."
    exit 1
fi
echo "PyInstaller completed successfully."

# Deactivate virtual environment (optional, good practice if script does more after this)
# if type deactivate &> /dev/null; then
#     echo "Deactivating virtual environment."
#     deactivate
# fi

# 4. Create DMG
echo "Creating DMG..."
# Using a temporary name for the DMG first, then renaming
TEMP_DMG_NAME="${APP_NAME}_temp.dmg" 

# Improved create-dmg command for better UX
create-dmg \
  --volname "${APP_NAME} ${APP_VERSION_CLEAN}" \
  --volicon "$ICON_FILE" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "${APP_NAME}.app" 200 190 \
  --hide-extension "${APP_NAME}.app" \
  --app-drop-link 600 185 \
  "$TEMP_DMG_NAME" \
  "dist/${APP_NAME}.app"

if [ ! -f "$TEMP_DMG_NAME" ]; then
    echo "Error: create-dmg failed to create the DMG."
    exit 1
fi
echo "DMG created successfully: $TEMP_DMG_NAME"

# 5. Rename DMG with version
VERSIONED_DMG_NAME="${APP_NAME}_v${APP_VERSION_CLEAN}.dmg"
mv "$TEMP_DMG_NAME" "$VERSIONED_DMG_NAME"
echo "DMG renamed to: $VERSIONED_DMG_NAME"

# --- Completion ---
echo "--------------------------------"
echo "Build complete!"
echo "Output DMG: $(pwd)/$VERSIONED_DMG_NAME"
echo "To run the app from the bundle before distributing, you can use: open dist/$APP_NAME.app"
echo "--------------------------------"
