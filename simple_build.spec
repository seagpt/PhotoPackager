# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['gui/main_window.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('assets', 'assets'),  # Include the assets folder with images
        ('gui', 'gui'), 
        ('job.py', '.'),
        ('image_processing.py', '.'),
        ('filesystem.py', '.'),
        ('config.py', '.')
    ],
    hiddenimports=[
        'PySide6',
        'PIL',
        'piexif',
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
    console=False,  # Set to False for GUI
    disable_windowed_traceback=False,
    argv_emulation=False,  # Set to False for Mac apps 
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/PhotoPackager_Patch_Design.png'
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
    icon='assets/PhotoPackager_Patch_Design.png',
    bundle_identifier='com.seagpt.photopackager',
)
