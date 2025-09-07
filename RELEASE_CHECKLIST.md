# PhotoPackager: Release Build Checklist

This checklist outlines all necessary steps to build, test, code sign, notarize, and distribute PhotoPackager on macOS. Follow each step in order to avoid common issues with packaging, plugin support, and distribution.

## 🔍 Pre-Build Testing & Verification

- [ ] Run all tests to ensure they pass: `pytest -v tests/`
- [ ] Run the Pillow diagnostic tool to check plugin support: `python main.py --diagnose-pillow`
- [ ] Verify real test images exist in the `assets/` directory, including at least one JPEG and WebP
- [ ] Update version number in all relevant files:
  - [ ] `main.py` (VERSION constant)
  - [ ] `pyproject.toml` or `setup.py` (if applicable)
  - [ ] Any other version references in the UI or About screens
- [ ] Create a git tag for the release version: `git tag -a v1.x.x -m "Version 1.x.x release"`

## 📦 Building the .app Bundle

- [ ] Ensure your PyInstaller spec properly includes all Pillow plugins:
  ```python
  # In spec file
  a.datas += collect_data_files('PIL')
  ```
- [ ] Run PyInstaller using the spec file: `pyinstaller PhotoPackager.spec`
- [ ] Verify the app launches correctly: `open dist/PhotoPackager.app`
- [ ] Run a built-in test within the app (basic image processing)
- [ ] Check Pillow plugin support in the built app: `dist/PhotoPackager.app/Contents/MacOS/PhotoPackager --diagnose-pillow`

## 🔐 Code Signing

- [ ] Ensure you have a valid Apple Developer ID certificate
- [ ] Sign the app bundle:
  ```bash
  codesign --deep --force --options runtime --sign "Developer ID Application: Your Name (TEAM_ID)" dist/PhotoPackager.app
  ```
- [ ] Verify the signature:
  ```bash
  codesign -vvv --deep --strict dist/PhotoPackager.app
  spctl -a -t exec -vv dist/PhotoPackager.app
  ```

## 💿 Creating DMG Installer

- [ ] Create a DMG for distribution:
  ```bash
  create-dmg \
    --volname "PhotoPackager Installer" \
    --window-pos 200 120 \
    --window-size 800 400 \
    --icon-size 100 \
    --icon "PhotoPackager.app" 200 190 \
    --app-drop-link 600 185 \
    "PhotoPackager-{VERSION}.dmg" \
    "dist/PhotoPackager.app"
  ```

## 🛡️ Notarization

- [ ] Submit the DMG for notarization:
  ```bash
  xcrun notarytool submit "PhotoPackager-{VERSION}.dmg" \
    --apple-id "your@email.com" \
    --password "app-specific-password" \
    --team-id "TEAM_ID" \
    --wait
  ```
- [ ] Staple the ticket to the DMG:
  ```bash
  xcrun stapler staple "PhotoPackager-{VERSION}.dmg"
  ```

## 🧪 Final Validation

- [ ] Install from the notarized DMG on a clean system
- [ ] Verify Gatekeeper allows the app to run
- [ ] Test all major functionality:
  - [ ] Image processing
  - [ ] EXIF handling options
  - [ ] File renaming
  - [ ] ZIP creation
- [ ] Check for any unexpected prompts or permissions issues

## 🚀 Distribution

- [ ] Upload the signed and notarized DMG to chosen distribution channels
- [ ] Update download links on website or documentation
- [ ] Create a GitHub release (if applicable)
- [ ] Update changelog or release notes
- [ ] Announce the release to users

## 📋 Automation Script Template

```bash
#!/bin/bash
# PhotoPackager macOS Build Script

VERSION="1.0.0"  # Update for each release
APPLE_ID="your@email.com"
TEAM_ID="YOURTEAMID"
APP_PASSWORD="app-specific-password"

# 1. Pre-build testing
echo "Running tests..."
pytest -v tests/

# 2. Check Pillow plugin support
echo "Checking Pillow plugins..."
python main.py --diagnose-pillow

# 3. Build the app
echo "Building .app bundle..."
pyinstaller PhotoPackager.spec

# 4. Verify the built app's plugin support
echo "Verifying built app plugin support..."
dist/PhotoPackager.app/Contents/MacOS/PhotoPackager --diagnose-pillow

# 5. Sign the app
echo "Code signing..."
codesign --deep --force --options runtime --sign "Developer ID Application: Your Name ($TEAM_ID)" dist/PhotoPackager.app

# 6. Create DMG
echo "Creating DMG..."
create-dmg \
  --volname "PhotoPackager Installer" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "PhotoPackager.app" 200 190 \
  --app-drop-link 600 185 \
  "PhotoPackager-$VERSION.dmg" \
  "dist/PhotoPackager.app"

# 7. Notarize
echo "Submitting for notarization..."
xcrun notarytool submit "PhotoPackager-$VERSION.dmg" --apple-id "$APPLE_ID" --password "$APP_PASSWORD" --team-id "$TEAM_ID" --wait

# 8. Staple
echo "Stapling ticket..."
xcrun stapler staple "PhotoPackager-$VERSION.dmg"

echo "Build complete! Final DMG: PhotoPackager-$VERSION.dmg"
```

## 🔄 Common Issues & Solutions

- **Pillow Plugin Support**: If the built app is missing plugins, ensure your spec file properly includes PIL plugins using `collect_data_files('PIL')`.
- **Code Signing Issues**: Make sure your Developer ID is valid and you're using `--deep --force --options runtime` flags.
- **Notarization Failures**: Check Apple's notarization service status and ensure your app meets current security requirements.
- **Gatekeeper Blocking**: If Gatekeeper blocks the app, the signature or notarization may have failed - check both steps.
