# -*- mode: python ; coding: utf-8 -*-

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
    print(f"PyInstaller Spec: Error collecting PIL data files: {e}")
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
    pathex=[r'/Users/stevenseagondollar/Desktop/PhotoPackager'],
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
    hooksconfig={},
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
    name='PhotoPackager',
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
    icon='/Users/stevenseagondollar/Desktop/PhotoPackager/assets/PhotoPackager_Patch_Design.icns',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='PhotoPackager',
)

app = BUNDLE(
    coll,
    name='PhotoPackager.app',
    icon='/Users/stevenseagondollar/Desktop/PhotoPackager/assets/PhotoPackager_Patch_Design.icns',
    bundle_identifier='com.dropshockdigital.photopackager',
    info_plist={
        'CFBundleShortVersionString': '1.0.0', 
        'CFBundleVersion': '1.0.0', 
        'CFBundleName': 'PhotoPackager', 
        'CFBundleDisplayName': 'PhotoPackager', 
        'CFBundleGetInfoString': 'PhotoPackager 1.0.0', 
        'CFBundleIdentifier': 'com.dropshockdigital.photopackager',
        'NSPrincipalClass': 'NSApplication',
        'NSHighResolutionCapable': True,
        'LSMinimumSystemVersion': '10.15',
        'NSRequiresAquaSystemAppearance': False,
        'LSMultipleInstancesProhibited': True,
    },
)
