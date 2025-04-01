### Overview

**PhotoPackager is a command-line utility designed to automate the organization, processing, and packaging of digital photo shoots.**

This application streamlines the often tedious post-production workflow for photographers and studios. Developed by **Steven Seagondollar, DropShock Digital LLC**, PhotoPackager addresses the pain points of manually sorting images, creating multiple delivery formats (for print, web, previews), managing EXIF metadata consistently, renaming files sequentially, and assembling professional, client-ready packages. It achieves this through a configurable, automated process emphasizing efficiency, reliability, operational safety, and producing outputs that reflect the high-quality standards synonymous with the **DropShock Digital** brand. The tool is designed to be flexible, allowing configuration via command-line arguments or a central `config.py` file, ensuring it fits diverse studio workflows.

**End-User Configuration & Studio Branding:**

PhotoPackager is designed to be integrated into your studio's workflow. While the core software is developed and maintained by DropShock Digital LLC, you can (and should) customize key aspects via the `config.py` file:

1.  **Studio Branding (`USER_...` variables):** Modify `USER_COMPANY_NAME`, `USER_WEBSITE`, and `USER_SUPPORT_EMAIL` in `config.py`. These values will be automatically incorporated into:
    * The application's introductory screen (`print_intro`).
    * The client-facing `README.txt` file generated inside each output package, ensuring deliveries reflect your brand identity and provide correct contact points for content-related queries.
2.  **Interactive Prompt Defaults (`DEFAULT_...` variables):** Customize the default answers suggested when running the tool interactively (without command-line flags). This allows you to tailor the default interactive behavior (e.g., default EXIF handling, default original action) to your studio's standard practices. See the detailed comments within `config.py` for available options.

**Mandatory Original Author Attribution:**

It is a requirement of the software's license and usage terms that attribution to the original developer, **Steven Seagondollar, DropShock Digital LLC**, is maintained. This attribution **must** remain present in:
* The `LICENSE.md` file (immutable copyright line).
* The footer of the generated `README.txt` file placed within each output package (alongside your studio's branding).
* The detailed `photopackager_run.log` files generated for each processing run.
This ensures proper credit for the tool's creation while allowing you to brand the *content delivery*.

**Key Features:** ✨

* **✨ Flexible Input Handling:** Process a single source folder containing images for one shoot (`--mode single`), or efficiently process a batch of shoots by pointing to a source folder containing multiple appropriately named subfolders, each representing a shoot (`--mode multi`). Auto-detection is attempted if `--mode` is omitted during interactive use.
* **✨ Standardized, Professional Output Structure:** Automatically generates a meticulously organized and consistent folder hierarchy for each processed shoot (using names defined in `config.FOLDER_NAMES`, e.g., `RAW Files`, `Export Files`, `Optimized Files`, `Compressed Files`). This enhances client perception and simplifies file management.
* **✨ Multi-Format Image Generation (JPG & WebP):** Creates multiple tiers of image outputs tailored for different use cases:
    * **Optimized:** High-quality versions (JPEG quality typically ~`{config.OPTIMIZED_QUALITY}`, configurable) suitable for print and general digital use.
    * **Compressed:** Significantly smaller, resized versions (target pixel count ~`{config.COMPRESSED_TARGET_PIXELS/1e6:.1f}MP`, configurable) using adaptive quality settings, ideal for web galleries, social media, and fast previews.
    * Outputs generated in universally compatible **JPG** and modern, efficient **WebP** formats (generation of each format can be toggled via `--no-jpg`/`--no-webp` flags or interactive choices).
* **✨ Configurable & Safe Original File Handling:** Provides explicit control over how original source files are managed:
    * `copy`: (Default & Safest) Duplicates originals into the `Export Originals` folder.
    * `move`: (**HIGH RISK**) Permanently moves originals. Requires explicit secondary confirmation. **USE ONLY AFTER VERIFYING BACKUPS.**
    * `leave`: Leaves originals untouched in the source directory.
    * `none` (`--skip-export`): Skips the entire `Export Files` creation process.
* **✨ Granular EXIF Control:** Offers precise control over image metadata embedded in *generated* files (Optimized/Compressed):
    * `keep`: (Default) Retains all original EXIF data.
    * `date`: Removes only date/time-related tags (requires optional `piexif` library).
    * `camera`: Removes only camera make/model/software tags (requires optional `piexif` library).
    * `both`: Removes both date/time and camera-related tags (requires optional `piexif` library).
    * `strip_all`: Removes all EXIF data entirely.
    * Configurable via `--exif` flag or interactive selection.
* **✨ Consistent Sequential File Renaming:** Automatically renames all processed images within their respective output subfolders to a clear, sortable `###-<BaseName>.ext` format (e.g., `001-ClientA_Wedding.jpg`, `002-ClientA_Wedding.jpg`).
* **✨ Studio Branding Integration:** Seamlessly incorporates your studio's name, website, and support email (configured in `config.py`) into the client-facing `README.txt` generated within each delivery package.
* **✨ Configurable Interactive Defaults:** Allows pre-setting default answers for interactive prompts (`config.DEFAULT_...` variables) to match your preferred workflow.
* **✨ Mandatory Author Attribution:** Respects intellectual property by ensuring required attribution to DropShock Digital LLC is maintained in generated outputs and licensing.
* **✨ Comprehensive Per-Shoot Logging:** Generates a detailed, timestamped `photopackager_run.log` file within each output shoot folder. This log meticulously records the configuration used, files found, actions performed (or simulated in dry run), errors encountered (with tracebacks where relevant), and processing times, crucial for diagnostics and auditing. Includes original author attribution.
* **✨ Indispensable `--dry-run` Simulation:** A critical safety feature! The `--dry-run` flag performs a complete simulation of the entire workflow—folder creation, file gathering, image processing steps (resizing, quality calculation), renaming, README/log generation, ZIP creation—logging every intended action with a `[DRYRUN]` prefix **without modifying a single file or folder on your disk.** Essential for verifying configuration and predicting outcomes safely.
* **✨ Automated Environment Setup (`bootstrap.py`):** On first execution (or if dependencies change), automatically checks for the correct Python version, verifies virtual environment activation (guiding the user if needed), checks `pip` status, and installs required runtime libraries (`Pillow`, `tqdm`, `colorama` on Windows) from `requirements.txt`, simplifying initial setup.
* **✨ Optional ZIP Archiving:** Provides the convenience of automatically creating compressed `.zip` archives for the primary output folders (`Export Files`, `Optimized Files`, `Compressed Files`), making downloads easier for clients (can be disabled via `--no-zip` or interactive choice).
* **✨ Parallel Processing (`--workers`):** Leverages multi-core processors by running image processing tasks in parallel, potentially significantly reducing overall execution time for large batches of images (configurable, defaults to system CPU count).
* **✨ Desktop Notifications:** Attempts to provide native OS desktop notifications upon successful completion of processing runs or on critical failure, offering convenient background status updates (requires optional libraries like `win10toast-reborn` on Windows or system tools like `notify-send` on Linux; falls back to console/message box).

---

### ❗ Warnings

**Mandatory Reading: Understand these points before use.**

* **🛑 Critical Risk with `--move` Option:** Using `--move` **PERMANENTLY MOVES** original files. **This is IRREVERSIBLE.** **You MUST verify reliable backups** before using this option. DropShock Digital LLC assumes **NO LIABILITY** for data loss.
* **🧪 Mandatory Testing with `--dry-run`:** **ALWAYS** use `--dry-run` first to simulate the process without changing files. This is essential to verify settings and prevent accidental data loss or incorrect processing, especially when using `--move`. Test with non-critical images initially.
* **System Requirements:** Requires **Python 3.8 or higher**. Depends critically on `Pillow` and `tqdm` libraries (installed by `bootstrap.py`). Partial EXIF stripping requires manual installation of `piexif`.
* **Known Limitations:**
    * *WebP EXIF Preservation:* Standard `Pillow` library may not reliably preserve EXIF metadata when saving WebP files. If EXIF in WebP is critical, alternative tools might be needed.
    * *File Formats:* While aiming for broad compatibility via `Pillow`, successful processing of *every* possible image format variant or severely corrupted file is not guaranteed.
    * *Notifications:* Desktop notification reliability depends on the OS, installed helper tools (e.g., `win10toast-reborn`, `notify-send`), and system configuration. Fallbacks are provided.
* **Security:** While the script validates input formats to some extent, ensure source paths provided interactively or via CLI point to trusted locations.
* **AS IS Software & Liability:** This software is provided "AS IS" without warranty. Use at your own risk. See [LICENSE.md](LICENSE.md) for the full disclaimer and limitation of liability.

---

### 🔧 Instructions for Typical Users

Follow these steps to get PhotoPackager running:

**⚙️ Prerequisites:**

* **Python (Version 3.8+):** Verify with `python --version` or `python3 --version`. Install from [python.org](https://www.python.org/downloads/) if needed (ensure it's added to PATH).
* **pip:** Included with modern Python.
* **(Optional) Git:** Only needed if cloning the repository via Git. Download from [git-scm.com](https://git-scm.com/downloads).
* **(Optional) piexif:** Only needed for partial EXIF stripping (`--exif date/camera/both`). Install later (Step 7).

**🔧 Simple Installation Steps:**

1.  **Get the Code:**
    * **Git:** `git clone <repository_url> PhotoPackager` then `cd PhotoPackager`
    * **Download:** Download ZIP, extract all files (`.py`, `.txt`, `.md`, `.gitignore`) to a `PhotoPackager` folder, `cd PhotoPackager` in terminal.
2.  **Create Virtual Environment:** (In the `PhotoPackager` folder)
    ```bash
    python -m venv venv
    ```
3.  **Activate Virtual Environment:** (**Do this every time!**)
    * **PowerShell:**
        ```powershell
        .\venv\Scripts\Activate.ps1
        # If error, maybe run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
        ```
    * **CMD:**
        ```cmd
        venv\Scripts\activate.bat
        ```
    * **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    * **Verify:** Your prompt should start with `(venv)`.
4.  **Configure `config.py`:**
    * Open `config.py` in a text editor.
    * **Mandatory:** Set `USER_COMPANY_NAME`, `USER_WEBSITE`, `USER_SUPPORT_EMAIL`.
    * **Optional:** Adjust `DEFAULT_...` values for interactive prompts.
    * Save the file.
5.  **Run Bootstrap / Install Dependencies:** (With `venv` active)
    ```bash
    python main.py --help
    ```
    * If prompted `Install missing dependencies? [Y/n]:`, type `Y` and press Enter.
6.  **(Optional) Install `piexif`:** If needed for partial EXIF stripping:
    ```bash
    pip install piexif
    ```
7.  **Ready:** PhotoPackager is set up!

**Basic Usage (Interactive):**

1.  Activate the virtual environment: `source venv/bin/activate` (or Windows equivalent).
2.  Run the script:
    ```bash
    python main.py
    ```
3.  Follow the on-screen prompts to provide the source folder path, choose processing options (press Enter for defaults), and configure shoot details. Pay close attention to any warnings, especially the confirmation for the `move` action.

**[Link to Latest Release/Downloads Placeholder]** *(Developer: Add link here if distributing releases)*

---

### Instructions and Information for Advanced Users

**Advanced Installation:**

* Cloning via Git (`git clone ...`) is recommended for easier updates (`git pull`).
* Docker support may be added in the future for containerized execution.

**Full Configuration:**

* **`config.py`:** Review this file for all configurable constants (image quality, folder names, UI defaults, ANSI colors, etc.). Comments provide detailed explanations.
* **Command-Line Flags:** Use `python main.py --help` for a complete, up-to-date list. Key flags include:
    * `--source <path>`: Path to source folder(s). **Mandatory if not interactive.**
    * `--mode [single|multi]`: Force processing mode.
    * `--output <path>`: Specify output parent directory.
    * `--move`: **(HIGH RISK)** Move originals instead of copying. Requires backup verification.
    * `--skip-export`: Completely skip handling originals and the 'Export Files' structure.
    * `--exif [keep|date|camera|both|strip_all]`: Set EXIF handling policy (default `keep`).
    * `--no-jpg` / `--no-webp`: Disable specific output formats.
    * `--skip-compressed`: Don't generate smaller, compressed versions.
    * `--no-zip`: Don't create final ZIP archives.
    * `--workers <N>`: Set number of parallel processes (default: CPU cores).
    * `--verbose` / `-v`: Enable detailed DEBUG logging.
    * `--dry-run`: **(ESSENTIAL FOR TESTING)** Simulate actions without modifying files.

**Usage Examples:**

* Process multiple shoots, custom output, no WebP/ZIPs:
    ```bash
    python main.py --source "/path/to/All_Shoots" --mode multi --output "/path/to/Deliveries" --no-webp --no-zip
    ```
* Single shoot, MOVE originals (CAUTION!), strip camera EXIF only, skip compressed:
    ```bash
    # 🛑 WARNING: --move PERMANENTLY MOVES FILES! ENSURE BACKUPS EXIST! 🛑
    python main.py --source "D:\Photos\ClientB" --mode single --move --exif camera --skip-compressed
    ```
* DRY RUN simulation for a multi-shoot scenario:
    ```bash
    # 🧪 Essential testing step 🧪
    python main.py --source "/path/to/all_my_shoots" --mode multi --output "/path/to/test_output" --dry-run --verbose
    ```
* Use 4 workers, enable verbose logging:
    ```bash
    python main.py --source "/path/to/MyShoot" --workers 4 --verbose
    ```

**Optional Dependencies:**

* **`piexif`:** Enables `--exif date`, `--exif camera`, `--exif both`. Install via `pip install piexif`. Without it, these options fall back to `--exif strip_all`.
* **`win10toast-reborn`:** Enables non-blocking "toast" notifications on Windows 10/11. Install via `pip install win10toast-reborn`. Without it, Windows notifications use a blocking message box.
* **System Notification Tools:** `utils.py` attempts to use `notify-send` (Linux) or `osascript` / `terminal-notifier` (macOS) if available. These are typically installed via system package managers, not pip.

**Performance Tuning:**

* Adjust `--workers` based on your CPU cores, RAM, and disk speed. More workers isn't always faster, especially with slow I/O. Start with the default (CPU cores) and experiment. Use `--workers 1` for serial processing.

**Advanced Workflows:**

* The comprehensive CLI flags allow integration into larger automation scripts or batch processing workflows. Monitor exit codes for success (0) or failure (non-zero).

---

### Technical Information

**Project/File Structure:**

* `main.py`: Orchestrator, entry point, multiprocessing setup.
* `bootstrap.py`: Environment setup/validation, dependency installation (run via subprocess).
* `config.py`: Central configuration constants (paths, quality, defaults, UI styles).
* `ui.py`: Console interaction, `argparse` setup, user prompts, validation loops.
* `filesystem.py`: All disk I/O (folder creation, file gathering, copy/move/rename, README/log writing, zipping, dry-run simulation).
* `image_processing.py`: Core image manipulation (Pillow usage: load, orient, resize, compress, save, EXIF handling, dry-run simulation).
* `utils.py`: Generic helpers (name validation, notifications, signal handling).
* `requirements.txt`: Runtime Python dependencies.
* `README.md`: This documentation file.
* `LICENSE.md`: MIT License text.
* `.gitignore`: Specifies files/folders for Git to ignore.
* `venv/`: (User-created) Virtual environment directory.
* `.bootstrap_cache`: (Generated) Cache file for bootstrap script efficiency.
* `tests/`: (Planned) Directory for automated tests.

**Architecture Overview:**

The application follows a modular design separating concerns: UI interaction (`ui.py`), filesystem operations (`filesystem.py`), image processing (`image_processing.py`), configuration (`config.py`), environment setup (`bootstrap.py`), and utilities (`utils.py`). `main.py` acts as the orchestrator, parsing arguments or running interactive prompts, then iterating through identified shoots. For each shoot, it delegates tasks to the appropriate modules. Image processing is parallelized using Python's `concurrent.futures.ProcessPoolExecutor` for potential speed gains. `--dry-run` capability is implemented within the `filesystem.py` and `image_processing.py` modules to simulate actions without execution.

**Development Workflow:**

1.  Set up `venv` and run `bootstrap` (`python main.py --help`).
2.  Install dev dependencies (e.g., `pip install pytest black flake8 ruff`).
3.  Code Formatting: Use `black .`
4.  Linting: Use `ruff check .` or `flake8 .`
5.  Testing: Run tests using `pytest` (tests to be added).
6.  Git: Use feature branches, follow Conventional Commits ([https://www.conventionalcommits.org/](https://www.conventionalcommits.org/)) for commit messages, create Pull Requests for review against `main`.

**Dependency Rationale:**

* `Pillow`: The de facto standard library for image manipulation in Python.
* `tqdm`: Provides excellent, easy-to-use progress bars for console applications.
* `piexif` (Optional): Pure Python library specifically for detailed EXIF manipulation, required for partial stripping.
* `win10toast-reborn` (Optional, Windows): Provides non-blocking toast notifications on Windows.
* `colorama` (Optional, Windows): Ensures ANSI color codes work correctly on older Windows terminals.

**API/Hooks/Extension Points:**

* None currently defined. The primary extension mechanism is modifying `config.py` or potentially contributing code via Pull Requests.

---

### ❓ FAQ / Troubleshooting

**Common Issues & Solutions:**

1.  **Error: `ModuleNotFoundError: No module named 'PIL'` (or `tqdm`, etc.)**
    * **Cause:** Virtual environment (`venv`) is likely not active, or dependencies weren't installed.
    * **Solution:**
        * Ensure you are in the `PhotoPackager` directory in your terminal.
        * Activate the `venv` using the correct command for your OS/shell (see Setup Step 3). Verify `(venv)` appears in your prompt.
        * Rerun `python main.py --help` to trigger the bootstrap dependency check and installation.
2.  **Error: Permission Denied**
    * **Cause:** Your user account lacks read access to the source folder/files or write access to the output parent directory.
    * **Solution:** Check and adjust folder permissions using your operating system's tools. Avoid running as Administrator/root if possible.
3.  **PowerShell Activation Error (`...cannot be loaded because running scripts is disabled...`)**
    * **Cause:** PowerShell's execution policy prevents running the activation script.
    * **Solution:** Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` in the *same PowerShell session*, then retry activation.
4.  **Image Processing Fails for Some Files:**
    * **Cause:** File might be corrupted, not a supported image format, or have unusual/broken metadata. Memory limits might be exceeded for huge images.
    * **Solution:** Check the `photopackager_run.log` file in the output folder for specific error messages related to the problematic file(s). Try opening the file in other software. If memory is an issue, reduce worker count using `--workers`.
5.  **Output Files End Up in an Unexpected Location:**
    * **Cause:** You likely provided a relative path for `--output`, which was resolved relative to the `PhotoPackager` script directory, not necessarily relative to your source directory.
    * **Solution:** Verify the "Output Parent Directory" path reported in the console summary. Use absolute paths for `--source` and `--output` for clarity and predictability.
6.  **Windows Notifications Are Blocking Popups:**
    * **Cause:** The optional `win10toast-reborn` library is not installed.
    * **Solution:** Activate `venv` and run `pip install win10toast-reborn` for non-blocking toast notifications. Otherwise, the blocking MessageBox is the intended fallback.
7.  **How to Test Safely?**
    * **Solution:** **ALWAYS** use the `--dry-run` flag! Combine it with `--verbose` (`python main.py --source ... --dry-run --verbose`) and carefully review the console output and the generated log file to see exactly what *would* happen before running without `--dry-run`.
8.  **`--move` Didn't Move Files?**
    * **Solution:** Did you explicitly confirm 'y' at the mandatory safety prompt? Pressing Enter or 'n' cancels the move and reverts to 'copy'. Check the log file for confirmation messages.

**If problems persist, consult the `photopackager_run.log` file first, then refer to the Support & Contact section.**

---

### Acknowledgements

* [Pillow (PIL Fork)](https://python-pillow.org/) - Core image processing.
* [tqdm](https://github.com/tqdm/tqdm) - Console progress bars.
* [piexif](https://github.com/hMatoba/Piexif) - Optional EXIF manipulation.
* [win10toast-reborn](https://github.com/DatGuyFab/win10toast-reborn) - Optional Windows notifications.
* [colorama](https://github.com/tartley/colorama) - Cross-platform ANSI color support.

---

### License

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC

This project is licensed under the terms of the **MIT License**. See the [LICENSE.md](LICENSE.md) file for full details.