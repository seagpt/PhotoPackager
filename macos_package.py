#!/usr/bin/env python3
"""
PhotoPackager macOS Packaging Script
This script automates the entire process of building a macOS .app bundle,
creating a DMG, and preparing a release ZIP file for GitHub.
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path

# --- Configuration ---
APP_NAME = "PhotoPackager"
APP_VERSION = "1.1.0"  # Updated for current release
DEVELOPER_ID = None  # "Developer ID Application: Your Name (TEAM_ID)"
GITHUB_RELEASE = True
NOTARIZE = False  # Set to True when you have Apple credentials configured

# --- Paths ---
SCRIPT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = SCRIPT_DIR / "dist"
BUILD_DIR = SCRIPT_DIR / "build"
SPEC_FILE = SCRIPT_DIR / f"{APP_NAME}.spec"
ICON_FILE = SCRIPT_DIR / "assets/PhotoPackager_Patch_Design.icns"  # Using existing .icns file
APP_PATH = DIST_DIR / f"{APP_NAME}.app"
DMG_NAME = f"{APP_NAME}_GUI.dmg"
DMG_PATH = SCRIPT_DIR / DMG_NAME
ZIP_PATH = SCRIPT_DIR / f"{DMG_NAME}.zip"

# Clean previous builds if requested
def clean_build(args):
    if args.clean:
        print("🧹 Cleaning previous builds...")
        if DIST_DIR.exists():
            shutil.rmtree(DIST_DIR)
        if BUILD_DIR.exists():
            shutil.rmtree(BUILD_DIR)
        if SPEC_FILE.exists():
            os.remove(SPEC_FILE)
        if DMG_PATH.exists():
            os.remove(DMG_PATH)
        if ZIP_PATH.exists():
            os.remove(ZIP_PATH)
        print("✅ Build directories cleaned")

# Create PyInstaller spec file
def create_spec_file():
    if SPEC_FILE.exists():
        print("✅ Using existing spec file")
        return
    
    print("📝 Creating PyInstaller spec file...")
    
    icon_path_str = str(ICON_FILE.resolve())
    script_dir_str = str(SCRIPT_DIR.resolve())

    # Get the values from the script's context to embed directly
    app_name_val = APP_NAME
    app_version_val = APP_VERSION

    spec_content = f"""# -*- mode: python ; coding: utf-8 -*-

import sys
import os
import PIL
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# --- Pre-filter PIL data files --- 
pil_pkg_dir = os.path.dirname(PIL.__file__)
try:
    pil_datas_raw = collect_data_files('PIL', include_py_files=True)
except Exception as e:
    print(f"PyInstaller Spec: Error collecting PIL data files: {{e}}")
    pil_datas_raw = []

_filtered_pil_datas = []
for _item in pil_datas_raw:
    if not (isinstance(_item, tuple) and len(_item) == 2):
        continue
    _src_orig, _dst_in_bundle = _item

    if not os.path.isabs(_src_orig):
        _src_resolved = os.path.join(pil_pkg_dir, _src_orig)
    else:
        _src_resolved = _src_orig
    
    if os.path.isfile(_src_resolved):
        _filtered_pil_datas.append((_src_resolved, _dst_in_bundle))
# --- End pre-filter PIL data files ---


qt_plugins = ['platforms', 'imageformats', 'styles', 'iconengines']
added_files = []

a = Analysis(
    ['app.py'],
    pathex=[r'{script_dir_str}'],
    binaries=[],
    datas=[('assets', 'assets')] + _filtered_pil_datas,
    hiddenimports=[
        'PIL._tkinter_finder',
        'piexif',
        'PySide6.QtCore',
        'PySide6.QtGui',
        'PySide6.QtWidgets',
        'PySide6.QtSvg',
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='{APP_NAME}',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=True,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='{icon_path_str}',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='{APP_NAME}',
)

app = BUNDLE(
    coll,
    name='{APP_NAME}.app',
    icon='{icon_path_str}',
    bundle_identifier='com.dropshockdigital.photopackager',
    info_plist={{
        'CFBundleShortVersionString': '{app_version_val}', 
        'CFBundleVersion': '{app_version_val}', 
        'CFBundleName': '{app_name_val}', 
        'CFBundleDisplayName': '{app_name_val}', 
        'CFBundleGetInfoString': '{app_name_val} {app_version_val}', 
        'CFBundleIdentifier': 'com.dropshockdigital.photopackager',
        'NSPrincipalClass': 'NSApplication',
        'NSHighResolutionCapable': True,
        'LSMinimumSystemVersion': '10.15',
        'NSRequiresAquaSystemAppearance': False,
        'LSMultipleInstancesProhibited': True,
    }},
)
"""
    
    with open(SPEC_FILE, "w") as f:
        f.write(spec_content)
    print(f"✅ Created spec file: {SPEC_FILE}")

# Build the app using PyInstaller
def build_app(args):
    print("🔨 Building macOS app bundle with PyInstaller...")
    
    # Create the spec file first if it doesn't exist
    create_spec_file()
    
    # Set up PyInstaller command
    pyinstaller_cmd = [
        "python3", "-m", "PyInstaller",
        "--noconfirm",
        str(SPEC_FILE),
    ]

    if args.clean:
        pyinstaller_cmd.insert(3, "--clean") # Insert --clean before --noconfirm

    try:
        subprocess.run(pyinstaller_cmd, check=True)
        print(f"✅ PyInstaller completed successfully - app bundle at {APP_PATH}")
        
        # Optional: Test that the app actually runs
        if not args.skip_app_test:
            print("🧪 Testing if the app launches (will exit after 2 seconds)...")
            try:
                # Launch app and kill after 2 seconds - just to ensure it starts
                app_test = subprocess.Popen(["open", APP_PATH], 
                                           stdout=subprocess.PIPE,
                                           stderr=subprocess.PIPE)
                import time
                time.sleep(2)
                app_test.terminate()
                print("✅ App launched successfully")
            except Exception as e:
                print(f"⚠️ App launch test failed: {e}")
    
    except subprocess.CalledProcessError as e:
        print(f"❌ PyInstaller failed: {e}")
        sys.exit(1)

# Sign the app bundle
def sign_app(args):
    if not args.sign or not DEVELOPER_ID:
        print("⏩ Skipping code signing (no developer ID provided)")
        return
    
    print(f"🔐 Code signing app bundle...")
    try:
        subprocess.run([
            "codesign",
            "--deep",
            "--force",
            "--options", "runtime",
            "--sign", DEVELOPER_ID,
            str(APP_PATH)
        ], check=True)
        print("✅ Code signing completed")
        
        # Verify signature
        subprocess.run([
            "codesign", 
            "-vvv", 
            "--deep", 
            "--strict", 
            str(APP_PATH)
        ], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Code signing warning: {e}")
        # Continue anyway - may be unsigned for development

# Create DMG using create-dmg
def create_dmg(args):
    if DMG_PATH.exists() and not args.force_dmg:
        print(f"⏩ DMG already exists at {DMG_PATH}. Use --force-dmg to recreate.")
        return
    
    print("💿 Creating DMG file...")
    
    # Check if create-dmg is installed
    try:
        subprocess.run(["which", "create-dmg"], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("❌ create-dmg not found! Please install it with: brew install create-dmg")
        sys.exit(1)
    
    # Prepare create-dmg command
    dmg_cmd = [
        "create-dmg",
        "--volname", f"{APP_NAME} {APP_VERSION}",
        "--window-pos", "200", "120",
        "--window-size", "600", "400",
        "--icon-size", "100",
        "--icon", f"{APP_NAME}.app", "150", "190",
        "--hide-extension", f"{APP_NAME}.app",
        "--app-drop-link", "450", "190",
        str(DMG_PATH),
        str(APP_PATH)
    ]
    
    try:
        subprocess.run(dmg_cmd, check=True)
        print(f"✅ Created DMG: {DMG_PATH}")
    except subprocess.CalledProcessError as e:
        print(f"❌ DMG creation failed: {e}")
        sys.exit(1)

# Notarize the DMG - optional
def notarize_dmg(args):
    if not args.notarize or not NOTARIZE:
        print("⏩ Skipping notarization (not enabled)")
        return
    
    # This would require Apple ID credentials to be set up
    print("⚠️ Notarization requires valid Apple ID credentials")
    print("⚠️ Edit this script to add your notarization commands or run manually")
    # Example commands are in your RELEASE_CHECKLIST.md

# Create ZIP of the DMG file for GitHub
def create_zip(args):
    if not args.zip:
        print("⏩ Skipping ZIP creation (use --zip to enable)")
        return
    
    print("🤐 Creating ZIP of DMG for GitHub release...")
    
    if ZIP_PATH.exists():
        os.remove(ZIP_PATH)
    
    try:
        subprocess.run([
            "zip",
            "-j",  # junk the path names
            str(ZIP_PATH),
            str(DMG_PATH)
        ], check=True)
        print(f"✅ Created ZIP: {ZIP_PATH}")
    except subprocess.CalledProcessError as e:
        print(f"❌ ZIP creation failed: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Build and package PhotoPackager for macOS")
    parser.add_argument("--clean", action="store_true", help="Clean build directories before building")
    parser.add_argument("--sign", action="store_true", help="Sign the app bundle (requires Developer ID)")
    parser.add_argument("--notarize", action="store_true", help="Notarize the app (requires Apple credentials)")
    parser.add_argument("--force-dmg", action="store_true", help="Force recreation of DMG even if it exists")
    parser.add_argument("--zip", action="store_true", help="Create ZIP file of DMG for GitHub")
    parser.add_argument("--skip-app-test", action="store_true", help="Skip testing if app launches")
    parser.add_argument("--all", action="store_true", help="Perform all steps (clean, build, DMG, ZIP)")
    
    args = parser.parse_args()
    
    # If --all is specified, enable all options
    if args.all:
        args.clean = True
        args.sign = True
        args.force_dmg = True
        args.zip = True
    
    # Display what actions will be taken
    print("\n📦 PhotoPackager macOS Packaging Tool 📦")
    print(f"App Name: {APP_NAME}")
    print(f"Version: {APP_VERSION}")
    print("Steps to perform:")
    print(f"  - Clean build: {'Yes' if args.clean else 'No'}")
    print(f"  - Build app: Yes")
    print(f"  - Code sign: {'Yes' if args.sign and DEVELOPER_ID else 'No' + (' (No Developer ID)' if args.sign else '')}")
    print(f"  - Create DMG: Yes")
    print(f"  - Notarize: {'Yes' if args.notarize and NOTARIZE else 'No' + (' (Not enabled)' if args.notarize else '')}")
    print(f"  - Create ZIP: {'Yes' if args.zip else 'No'}")
    print("\n")
    
    # Execute the build steps
    clean_build(args)
    build_app(args)
    sign_app(args)
    create_dmg(args)
    notarize_dmg(args)
    create_zip(args)
    
    print("\n✨ macOS packaging completed successfully! ✨")
    print(f"App Bundle: {APP_PATH}")
    print(f"DMG File: {DMG_PATH}")
    if args.zip:
        print(f"ZIP File: {ZIP_PATH}")
    print("\nReady for distribution!\n")

if __name__ == "__main__":
    main()
