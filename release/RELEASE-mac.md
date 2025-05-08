# PhotoPackager 1.0.0 for macOS

## Release Date: May 8, 2025

### Overview
PhotoPackager is a desktop application for processing and packaging photo shoots. It provides both a graphical user interface and command-line functionality for efficient workflow management of photography assets.

### Features
- Import and process photos from various source directories
- Apply consistent naming conventions to photo files
- Create organized output packages for clients
- Support for both GUI and CLI operation modes
- Robust error handling and logging

### Installation (macOS)
1. **Download** the `PhotoPackager.dmg.zip` file from the [GitHub Releases Page](https://github.com/seagpt/PhotoPackager/releases).
2. **Unzip** the file to reveal `PhotoPackager.dmg`.
3. **Double-click** the `.dmg` file to mount it.
4. **Drag** the `PhotoPackager.app` icon into your `/Applications` folder.
5. **Eject** the mounted disk image.
6. **Launch** `PhotoPackager` from your Applications folder.

**Note:**
- On first launch, macOS Gatekeeper may warn that the app is from an unidentified developer. Go to **System Settings > Privacy & Security**, scroll down, and click **Open Anyway** next to the PhotoPackager message. Alternatively, right-click the app and select **Open**.
- **Why is the DMG zipped?** Distributing the DMG inside a ZIP archive helps prevent macOS from marking the file as damaged or quarantined when downloading from browsers or GitHub. Always unzip before opening the DMG.

### System Requirements
- macOS 10.14 or higher
- 4GB RAM minimum (8GB recommended)
- 100MB available disk space

### Known Issues
- The application is not code-signed, so you may need to allow it in Security & Privacy settings
- First-time launch may take longer as macOS verifies the application

### Change Log
- Initial release with core functionality

### Future Plans
- Cross-platform support for Windows
- Additional image processing options
- Batch processing improvements
- Customizable output templates
