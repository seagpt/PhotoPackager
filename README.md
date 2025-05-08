<div align="center">

<img src="assets/PhotoPackager_Patch_Design.png" alt="PhotoPackager Logo" width="150"/>

# PhotoPackager by DropShock Digital LLC

**Your Automated Photo Shoot Delivery Assistant: Organize, Process, Package.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)

</div>

---

<div align="center">

<img src="assets/mac_app.png" alt="PhotoPackager macOS Screenshot" width="600" style="margin:20px;"/>
<img src="assets/windows_app.png" alt="PhotoPackager Windows Screenshot" width="600" style="margin:20px;"/>

</div>

---

## 🚀 Overview

**PhotoPackager** is a professional-grade desktop application meticulously crafted to automate and streamline the often complex post-production workflow for photographers and creative studios. Developed by **Steven Seagondollar** at **DropShock Digital LLC**, this tool tackles the common pain points of digital asset management after a shoot.

Say goodbye to tedious manual sorting, inconsistent file naming, complex multi-format exporting, and cumbersome packaging. PhotoPackager provides a robust, configurable, and efficient solution for:

*   **Organizing** shoots into a standardized, professional folder structure.
*   **Processing** images to generate multiple delivery formats (e.g., high-res for print, web-optimized, low-res previews).
*   **Managing EXIF Metadata** consistently across generated files.
*   **Renaming** files sequentially for clarity and order.
*   **Packaging** everything into client-ready deliverables, complete with customizable branding and essential documentation.

PhotoPackager emphasizes **efficiency, reliability, operational safety**, and producing outputs that reflect the high-quality standards synonymous with the DropShock Digital brand. It offers flexibility through a modern **Graphical User Interface (GUI)** for ease of use, backed by a powerful non-interactive **Command-Line Interface (CLI)** for scripting and automation. Configure it once via the `config.py` file to match your studio's defaults, then process shoots quickly and consistently, delivering results that reflect the premium quality of your work and the DropShock Digital standard.

---

## ✨ Key Features

PhotoPackager comes packed with features designed for the modern photographic workflow:

*   **🖥️ Intuitive Graphical User Interface (GUI):** A modern, easy-to-use desktop application (built with PySide6) allowing configuration and execution of jobs with just a few clicks. Ideal for everyday use.
*   **⌨️ Powerful Command-Line Interface (CLI):** A non-interactive CLI (`main.py` with `argparse`) enabling scripting, automation, and batch processing for advanced workflows.
*   **📂 Standardized Output Structure:** Automatically generates a consistent, professional folder hierarchy for each shoot (e.g., `Export Originals`, `Optimized Files/Optimized JPGs`, `Optimized Files/Optimized WebPs`, `Compressed Files/Compressed JPGs`, `Compressed Files/Compressed WebPs`). Folder names are configurable in `config.py`.
*   **🖼️ Multi-Format Image Generation:** Creates multiple versions from your source files:
    *   **Optimized:** High-quality JPGs and/or WebPs for print and general use.
    *   **Compressed:** Significantly smaller, resized JPGs and/or WebPs for web/previews.
    *   *Control:* Toggle JPG/WebP generation and skipping compressed versions via GUI/CLI. Quality and resize parameters are configurable in `config.py`.
*   **🛡️ Configurable & Safe Originals Handling:** Choose how source files are managed:
    *   `Copy`: (Default) Safely duplicates originals into `Export Originals`.
    *   `Move`: (**HIGH RISK**) Permanently moves originals. Use with extreme caution after verifying backups.
    *   `Leave`: Originals remain untouched in the source folder.
    *   `Skip Export`: Ignores originals entirely; no `Export Originals` folder created.
*   **🏷️ Granular EXIF Control:** Manage metadata in *generated* images:
    *   `Keep`: (Default) Retains all original EXIF.
    *   `Strip All`: Removes all EXIF data entirely.
    *   `Date Only`: Removes only date/time tags (requires optional `piexif`).
    *   `Camera Only`: Removes only camera/make/model tags (requires optional `piexif`).
    *   `Date & Camera`: Removes both date and camera tags (requires optional `piexif`).
*   **🔢 Consistent Sequential File Renaming:** Renames all output files (Optimized, Compressed, and copied/moved Originals) to `###-<BaseName>.ext` (e.g., `001-Smith_Wedding.jpg`), using the Shoot Base Name provided.
*   **🏢 Customizable Delivery Branding:**
    *   Set your **own** Company Name, Website, and Support Email via the GUI or CLI for each job.
    *   This information is automatically embedded in the client-facing `README.txt` included in the package.
    *   Allows personalized client deliveries reflecting *your* brand.
*   **📦 Automatic Multi-ZIP Archiving:** Optionally creates three separate `.zip` archives (`Export Originals.zip`, `Optimized Files.zip`, `Compressed Files.zip`) in the main output folder for convenient delivery. Can be disabled via GUI/CLI.
*   **⚡ Efficient Processing:** Utilizes multi-core CPUs for parallel image processing in CLI mode (configurable via `--workers`). GUI mode defaults to stable single-threaded processing.
*   **🔔 Desktop Notifications:** (Optional) Attempts to provide native OS notifications on job completion or failure (requires optional libraries/tools).

---

## 💾 Installation

Get started with PhotoPackager quickly using our pre-built applications.

### Installing the Packaged Application (Recommended)

No Python needed! Just download and run.

1.  **Download:** Go to the [**PhotoPackager Releases Page**](https://github.com/seagpt/PhotoPackager/releases) on GitHub.
    *   Download the `.exe` file for **Windows**.
    *   Download the `.dmg` file for **macOS**.
2.  **Install/Run:**
    *   **Windows (`.exe`):**
        *   Double-click the downloaded `PhotoPackager_GUI.exe`.
        *   Windows Defender SmartScreen might show a warning ("Windows protected your PC"). This is expected for new applications. Click "**More info**", then click "**Run anyway**".
        *   Follow any installer prompts (if applicable, though typically it runs directly).
    *   **macOS (`.dmg`):**
        *   Double-click the downloaded `.dmg` file to mount it.
        *   Drag the `PhotoPackager_GUI.app` icon into your `/Applications` folder.
        *   Eject the mounted disk image.
        *   Launch `PhotoPackager_GUI` from your Applications folder.
        *   On the first launch, macOS Gatekeeper might show a security warning ("...cannot be opened because the developer cannot be verified."). Open **System Settings > Privacy & Security**, scroll down, and click "**Open Anyway**" next to the PhotoPackager message. You might also be able to **Right-click** (or Ctrl-click) the app icon and select "**Open**" from the context menu, then confirm in the dialog.
3.  **Ready to Use!** Launch the application and start packaging your photos.

*(Optional First-Time Setup): You can edit the `config.py` file (located near the `.exe` or inside the `.app` bundle - Right-click -> Show Package Contents -> Contents/Resources) to permanently change the default studio name/website/email used for Delivery Branding defaults.*

### Running from Source (For Developers)

If you prefer to run from the source code:

1.  **Prerequisites:** Python 3.8+ and pip.
2.  **Get Code:** Clone the repository or download and extract the ZIP. Example using Git:
    ```bash
    git clone https://github.com/seagpt/PhotoPackager.git
    cd PhotoPackager
    ```
3.  **Setup Environment:** Navigate to the project root (`PhotoPackager` directory) in your terminal.
    Create venv:
    ```bash
    python -m venv venv
    ```
    Activate the environment:
    *Windows (CMD):*
    ```cmd
    venv\Scripts\activate.bat
    ```
    *Windows (PowerShell):*
    ```powershell
    .\venv\Scripts\Activate.ps1
    # If PowerShell gives an error, try this in the same window first:
    # Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
    ```
    *macOS/Linux (Bash/Zsh):*
    ```bash
    source venv/bin/activate
    ```
    Install dependencies (ensure `venv` is active):
    ```bash
    pip install -r requirements.txt
    ```
    Install optional dependencies if needed:
    ```bash
    # For partial EXIF stripping:
    pip install piexif
    # For non-blocking Windows notifications:
    pip install win10toast-reborn
    ```
4.  **Configure:** Edit `config.py` as needed (especially `USER_...` variables).
5.  **Run GUI:** Ensure `venv` is active and run:
    ```bash
    python gui/main_window.py
    ```
6.  **Run CLI:** Ensure `venv` is active and run (replace placeholders):
    ```bash
    python main.py --source path/to/images --output path/to/parent [options...]
    ```

---

## 🖱️ Usage: GUI Walkthrough

Using the PhotoPackager GUI is straightforward:

1.  **Launch Application:** Start PhotoPackager (`.exe` / `.app`).
2.  **Select Source Folder:** Click the first "Browse..." button and navigate to the folder containing the images for the single shoot you want to process.
3.  **Select Output Parent Folder:** Click the second "Browse..." button and choose the main directory where you want PhotoPackager to create the final packaged folder for this shoot.
4.  **Enter Shoot Base Name:** Type a descriptive name for this shoot (e.g., `Johnson_Wedding_2025-05`). This name determines the output folder name and the prefix for renamed files.
5.  **Configure Processing Options:**
    *   **Originals:** Select how to handle the source files (usually `Copy`). Use `Move` with extreme caution!
    *   **EXIF:** Choose the metadata policy for generated images (usually `Keep`).
    *   **Formats:** Check `JPG` and/or `WebP` for the desired output types.
    *   **Processing:**
        *   Uncheck `Skip Compressed` to generate smaller preview images.
        *   Check `Create ZIP Archives` to get the final `.zip` files for easy delivery.
    *   *(Workers setting is primarily for CLI and defaults to 1 in GUI for stability).*
    *   **Dry Run:** **Check this box** for your first run or when testing new settings! It simulates everything without changing files.
6.  **Set Delivery Branding:**
    *   Enter the **Company Name**, **Website**, and **Support Email** you want your *client* to see in the `README.txt` file included with their photos. Defaults are loaded from `config.py`.
7.  **Start Processing:** Click the "Start Processing" button.
8.  **Monitor Progress:**
    *   The Status label will update (Idle -> Processing... -> Done! / Error!).
    *   The Progress Bar shows the percentage complete.
    *   The Log Area displays detailed steps, warnings, or errors in real-time.
9.  **Find Results:** Once the status shows "Done!", navigate to your chosen Output Parent Folder. Inside, you'll find a new folder named after your Shoot Base Name, containing the organized output (`Export Originals`, `Optimized Files`, `Compressed Files`), the `README.txt`, the `photopackager_run.log`, and the `.zip` archives (if enabled).

---

## ⌨️ Usage: CLI Reference (Non-Interactive)

For automation and scripting, use the command line. Run commands from the project root directory (activate `venv` if running from source).

**Basic Syntax:**

```bash
python main.py --source <path_to_images> --output <path_to_output_parent> [OPTIONS]
```

**Required Arguments:**

*   `--source SOURCE_PATH`: Path to the folder containing the shoot's images.
*   `--output OUTPUT_PARENT`: Path to the directory where the final shoot folder will be created.

**Common Options:**

*   `--base-name BASE_NAME`: Set the name for the output folder and file prefixes (default: source folder name).
*   `--originals-action {copy,move,leave,skip_export}`: How to handle originals (default: `copy`). **WARNING: `--move` is destructive!**
*   `--exif-policy {keep,strip_all,date,camera,both}`: EXIF handling (default: `keep`).
*   `--no-jpg`: Disable JPG generation.
*   `--no-webp`: Disable WebP generation.
*   `--skip-compressed`: Don't generate compressed images.
*   `--create-zip`: Force creation of ZIP archives (default is often True, check `--help`).
*   `--no-zip`: Disable creation of all ZIP archives.
*   `--workers N`: Number of parallel processes for image processing (default: System CPU count). Use `--workers 1` for sequential processing.
*   `--dry-run`: Simulate the process without writing/moving files. **Highly recommended for testing commands.**
*   `--verbose`: Show more detailed log output on the console/log file.

**Delivery Branding Arguments:**

*   `--delivery-company "Your Company Name"`
*   `--delivery-website "https://yourwebsite.com"`
*   `--delivery-email "support@yourwebsite.com"`

**Getting Help:**

*   `python main.py -h` or `python main.py --help`: Displays the full list of all available arguments and their descriptions.

**Example CLI Usage:**

```bash
# Dry run simulation with verbose output
python main.py --source "./MyShoot" --output "./Deliveries" --dry-run --verbose

# Process a shoot, copy originals, create JPGs only, create ZIPs, use 4 workers
python main.py --source "D:\Photos\ClientX" --output "E:\Client_Deliveries" --originals-action copy --no-webp --create-zip --workers 4 --verbose

# Process shoot, MOVE originals (DANGER!), strip EXIF, custom branding, no ZIPs
# ENSURE YOU HAVE BACKUPS BEFORE USING --move !
python main.py --source "/path/to/source_shoot" --output "/path/to/output_location" --move --exif-policy strip_all --no-zip --delivery-company "Awesome Pics Inc." --delivery-website "https://awesomepics.com" --delivery-email "hello@awesomepics.com"
```

---

## ⚙️ Configuration & Branding

PhotoPackager offers several ways to configure its behavior and appearance.

### `config.py` File

This central file (in the project root) allows you to set **application-wide defaults** and **developer/studio branding**. Edit this file *before* running the application for persistent changes.

*   **`USER_...` Variables:**
    *   `USER_COMPANY_NAME`: Your studio/company name. Used as the default for Delivery Branding and potentially other places.
    *   `USER_WEBSITE`: Your website URL.
    *   `USER_SUPPORT_EMAIL`: Your support email address.
*   **`DEFAULT_...` Variables:**
    *   Control the default selections in the GUI and default behavior in the CLI if flags are omitted (e.g., `DEFAULT_ORIGINALS_ACTION`, `DEFAULT_EXIF_POLICY`, `DEFAULT_CREATE_ZIP`).
*   **Processing Parameters:**
    *   `OPTIMIZED_QUALITY`: Default JPEG quality for optimized images.
    *   `COMPRESSED_TARGET_PIXELS`: Target total megapixels for compressed images.
    *   `COMPRESSED_FALLBACK_QUALITY`: Minimum quality for compressed JPEGs if adaptive quality struggles.
*   **Folder Names (`FOLDER_NAMES`):** Customize the names of the output subdirectories (e.g., change "Optimized Files" to "High Res"). **Caution:** Changing these requires careful testing.
*   **UI Colors (`ANSI_COLORS`, etc.):** Customize console output colors (primarily relevant for CLI/logging).

### Delivery Branding (GUI / CLI)

As described in Usage, you can set the Company Name, Website, and Support Email that appear in the client-facing `README.txt` file on a **per-job basis** using the dedicated fields in the GUI or the `--delivery-...` CLI arguments. This overrides the defaults from `config.py` for that specific delivery package.

### Mandatory Attribution

Remember, the software license requires that the original developer attribution (Steven Seagondollar, DropShock Digital LLC) remains in the footer of the generated `README.txt` files and in the internal `photopackager_run.log` files. Your custom Delivery Branding appears separately in the main body of the client README.

---

## ❗ Warnings & Important Notes

*   **🛑 `MOVE` IS PERMANENT:** Using the "Move Originals" option (GUI or CLI `--move`) **permanently deletes** files from your source location after moving them. **There is no undo.** Always ensure you have reliable backups before using this option. DropShock Digital LLC is not liable for data loss.
*   **🧪 Use `Dry Run`:** Always perform a "Dry Run" (GUI checkbox or CLI `--dry-run`) when trying new settings or processing important jobs for the first time. Review the logs carefully to ensure the planned actions are correct before running a live job.
*   **💾 Disk Space:** Processing and zipping can require significant temporary and final disk space, potentially 3-4 times the size of your original shoot folder depending on options. Ensure adequate free space on your output drive.
*   **☁️ Cloud Drive Syncing:** Processing shoots located in actively syncing cloud folders (OneDrive, Dropbox, Google Drive, etc.) may sometimes cause file access conflicts or performance issues. For best results, consider pausing sync during processing or working with local copies.
*   **⚙️ System Requirements:** Python 3.8+ (for source), Windows 10/11 or macOS (Big Sur+ recommended). Requires `Pillow` and `PySide6` libraries. See `requirements.txt`.
*   **WebP EXIF:** `Pillow`'s support for preserving all EXIF data in WebP files can be inconsistent. Verify if critical metadata is retained.
*   **Corrupted Files:** The application attempts to gracefully skip corrupted or unreadable image files and log a warning, but severely damaged files could potentially cause unexpected behavior in underlying libraries.
*   **AS IS Software:** PhotoPackager is provided "AS IS", without warranty of any kind, express or implied. Use at your own risk. See the [LICENSE.md](LICENSE.md) file for the full MIT License disclaimer and limitation of liability.

---

## ❓ Troubleshooting / FAQ

*(Refer to the full [Installation](#💾-installation) and [Usage](#🖱️-usage-gui-walkthrough) sections first)*

1.  **Error: `ModuleNotFoundError: No module named 'PySide6'` (or `'PIL'`, `'job'`, etc.)**
    *   **Cause:** Dependencies not installed or virtual environment (`venv`) not active.
    *   **Solution:**
        *   Ensure you are in the project root directory in your terminal.
        *   Activate the `venv` (`source venv/bin/activate` or `.\venv\Scripts\activate`). Verify `(venv)` appears in prompt.
        *   Run `pip install -r requirements.txt`.
        *   If running `gui/main_window.py` directly causes `ModuleNotFoundError: No module named 'job'`, ensure the `sys.path` modification at the top of `gui/main_window.py` is present and correct.

2.  **Error: Permission Denied (during file operations)**
    *   **Cause:** Your user account lacks read access to the source folder or write access to the output directory/subdirectories. Cloud sync folders (like OneDrive, Dropbox, Google Drive) can sometimes interfere with permissions or cause locking issues.
    *   **Solution:** Check and adjust folder permissions using your OS tools. Try running a job with output directed to a simple local folder (e.g., `C:\Temp\PhotoPackagerOutput`) to rule out cloud sync issues. Avoid running as Administrator/root if possible.

3.  **GUI Launches, but "Start Processing" Does Nothing or Hangs:**
    *   **Cause:** Could be a bug in the backend job logic or an uncaught exception. GUI mode uses single-threading for stability.
    *   **Solution:** Check the GUI log area AND the `photopackager_run.log` file in the output directory for specific error messages or tracebacks. Ensure your source/output paths are valid.

4.  **Output Folders (Optimized/Compressed/Originals) Are Empty After Successful Run:**
    *   **Cause:** Double-check "Dry Run" is **unchecked** (GUI) or `--dry-run` flag is **not used** (CLI). Verify the relevant "Generate JPG/WebP" or "Skip Compressed" options are set correctly. Check `photopackager_run.log` for errors logged during `img.save()` or `shutil.copy2`/`move` (using the enhanced logging recently added). File permissions on the output directories could also be a factor.
    *   **Solution:** Review logs carefully for specific errors or missing "Successfully SAVED/Copied/Moved" messages. Ensure output directories are writable.

5.  **ZIP Files Missing or Empty:**
    *   **Cause:** ZIP creation depends on the source folders (`Export Originals`, `Optimized Files`, `Compressed Files`) existing *and containing files*. Ensure the preceding steps completed successfully. Check "Create ZIP Archives" is enabled and "Dry Run" is disabled.
    *   **Solution:** Verify that the corresponding content folders were correctly populated first. Check logs for any errors during the ZIP creation phase itself (it logs start/stop for each required ZIP).

6.  **Windows Notifications Are Blocking Popups:**
    *   **Cause:** The optional `win10toast-reborn` library is not installed or failed to load.
    *   **Solution:** Install `win10toast-reborn` (`pip install win10toast-reborn` in `venv`) for non-blocking toasts. Otherwise, standard Windows message boxes are the default fallback.

**For persistent issues, please consult the detailed `photopackager_run.log` file located within the generated output folder for the specific job.**

---

## 🛟 Support & Contact

Encountering issues, bugs, or have suggestions? Please reach out!

*   **Email:** [support@dropshockdigital.com](mailto:support@dropshockdigital.com)
*   **GitHub Issues:** [https://github.com/seagpt/PhotoPackager/issues](https://github.com/seagpt/PhotoPackager/issues)

When reporting issues, please include your OS version, PhotoPackager version (if known), steps to reproduce, and any relevant log file content (`photopackager_run.log`).

---

## 🙏 Acknowledgements

PhotoPackager utilizes these excellent open-source libraries:

*   [PySide6](https://www.qt.io/qt-for-python) (GUI Framework)
*   [Pillow](https://python-pillow.org/) (Image Processing)
*   [piexif](https://github.com/hMatoba/Piexif) (Optional EXIF Handling)
*   [win10toast-reborn](https://github.com/DatGuyFab/win10toast-reborn) (Optional Windows Notifications)

---

## 📜 License

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC

This project is licensed under the terms of the **MIT License**. See the [LICENSE.md](LICENSE.md) file for the full text.

**Note:** The license requires that the original copyright notice and attribution to Steven Seagondollar, DropShock Digital LLC be included in all copies or substantial portions of the software, including generated documentation like the output `README.txt`.