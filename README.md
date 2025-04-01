# PhotoPackager: Intelligent Photo Organization & Processing

**Version:** 1.0.0-refactor (March 2025)   
**Developed By:** Steven Seagondollar, DropShock Digital LLC   
**License:** [MIT License](LICENSE.md)

[![Build Status](about:sanitized)](https://github.com/Droptimal/PhotoPackager) [![Code Coverage](about:sanitized)](https://github.com/Droptimal/PhotoPackager) [![License: MIT](about:sanitized)](LICENSE.md)

-----

## ❗ CRITICAL: Disclaimer & Important Warnings ❗

**Please read carefully before using PhotoPackager:**

  * **AS IS Software:** This software is provided "AS IS", without warranty of any kind, express or implied. Use entirely at your own risk. See the [LICENSE.md](LICENSE.md) file for the full disclaimer.
  * **🛑 `--move` Option Risk:** The `--move` command-line argument (or corresponding interactive choice) **PERMANENTLY MOVES** original image files from your source directory to the output 'Export Originals' folder.
      * **THERE IS NO UNDO.**
      * **VERIFY BACKUPS:** Ensure you have reliable backups of your source images *before* using the `--move` option.
      * The developers assume **NO RESPONSIBILITY** for data loss resulting from the use or misuse of this feature.
  * **🧪 Test Thoroughly:** Use the `--dry-run` flag extensively to simulate operations and verify the expected outcome *before* running the tool on critical data or using destructive options like `--move`. Test with non-essential images first.
  * **Dependencies:** Correct operation depends on the Python environment and installed libraries (`Pillow`, `tqdm`, etc.). Ensure setup instructions are followed precisely. Compatibility with all image formats or corrupted files is not guaranteed.
  * **Liability:** In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of this software. Refer to [LICENSE.md](LICENSE.md).

-----

## Overview

**PhotoPackager** is a robust Python command-line application designed to streamline the post-shoot workflow for photographers, studios, and media teams. It automates the tedious tasks of organizing source images, creating optimized web/print versions, handling EXIF metadata, ensuring consistent file naming, and packaging everything into a standardized, professional delivery structure.

Originally developed by **Steven Seagondollar, DropShock Digital LLC**, PhotoPackager is built with efficiency, reliability, and user-friendliness in mind, reflecting the high standards of DropShock Digital development.

**End-User Configuration:** While the core tool is developed and maintained by the original author, PhotoPackager allows the end-user (e.g., your photography studio) to configure specific branding details (`USER_COMPANY_NAME`, `USER_WEBSITE`, `USER_SUPPORT_EMAIL` in `config.py`) which are then reflected in the application's introduction screen and the `README.txt` files generated *within* the client delivery packages.

**Original Author Attribution:** Please note that while user branding is supported, generated outputs (`README.txt`, log files) contain mandatory attribution acknowledging the original development of the PhotoPackager tool by DropShock Digital LLC. The software license (`LICENSE.md`) also retains the original copyright.

## Key Features

  * **Flexible Input Modes:** Process a single shoot folder (`--mode single`) or a directory containing multiple shoot subfolders (`--mode multi`).
  * **Standardized Output Structure:** Automatically generates a consistent folder hierarchy for each shoot (`RAW Files`, `Export Files`, `Optimized Files`, `Compressed Files`) making deliveries professional and easy to navigate.
  * **Multi-Format Image Generation:** Creates optimized (`~90%` quality) and compressed (`~2MP`, adaptive quality) versions in both `JPG` (universal) and `WebP` (modern, efficient) formats (configurable via `--no-jpg`/`--no-webp`).
  * **Configurable Original File Handling:** Choose to `copy` originals (safest), `move` originals (use `--move` with extreme caution\!), or `leave` originals untouched during processing. Use `--skip-export` to bypass this stage entirely.
  * **Granular EXIF Metadata Control:** Keep all EXIF, strip date/time tags, strip camera make/model tags, strip both, or strip all EXIF data using the `--exif` flag or interactive prompt.
  * **Sequential File Renaming:** Renames all processed files within output folders to a clean `###-ShootBaseName.ext` format for easy sorting and identification.
  * **User Branding Integration:** Allows studios using the tool to insert their company name, website, and support email into generated `README.txt` files via simple `config.py` settings.
  * **Mandatory Author Attribution:** Ensures credit to the original tool developer is maintained in generated outputs and licensing.
  * **Comprehensive Logging:** Creates a detailed `photopackager_run.log` file within each output shoot folder, recording all actions, settings, and errors for troubleshooting.
  * **Dry Run Simulation:** Includes a crucial `--dry-run` flag to simulate the entire process and log intended actions without making *any* changes to your files or folders. **Use this extensively for testing\!**
  * **Automated Environment Setup:** Includes `bootstrap.py` to check Python version, virtual environment status, and install missing dependencies (`Pillow`, `tqdm`, etc.) automatically on first run.
  * **Optional ZIP Archiving:** Can automatically create `.zip` archives of the main output folders (`Export`, `Optimized`, `Compressed`) for easier distribution (`--no-zip` to disable).
  * **Parallel Processing:** Utilizes multiple CPU cores (`--workers`) for faster image processing (where beneficial).
  * **Desktop Notifications:** Provides native desktop notifications upon completion of shoots/runs (platform permitting).

## Understanding the Output Structure

For each processed shoot, PhotoPackager creates a main folder named after the shoot (e.g., `ClientA_Wedding_Preview`). Inside, you will typically find:

```
<Shoot_Name>/
│
├── RAW Files/
│   └── README.txt          # Explains RAW file access policy (Folder often empty)
│
├── Export Files/
│   └── Export Originals/
│       ├── 001-<BaseName>.jpg  # Copied/Moved original files (renamed)
│       └── ...
│
├── Optimized Files/
│   ├── Optimized JPGs/
│   │   ├── 001-<BaseName>.jpg  # High-quality JPG (~90%)
│   │   └── ...
│   └── Optimized WebPs/        # High-quality WebP (~90%)
│       ├── 001-<BaseName>.webp
│       └── ...
│
├── Compressed Files/
│   ├── Compressed JPGs/
│   │   ├── 001-<BaseName>.jpg  # Resized (~2MP), compressed JPG
│   │   └── ...
│   └── Compressed WebPs/       # Resized (~2MP), compressed WebP
│       ├── 001-<BaseName>.webp
│       └── ...
│
├── photopackager_run.log     # Detailed log for THIS shoot's processing run
│
└── README.txt                # README explaining THIS specific package/delivery
                              # Includes YOUR (User) branding AND original tool attribution

# Optional ZIP files (if enabled via --no-zip=False or interactively)
# Zipped Export Files.zip
# Zipped Optimized Files.zip
# Zipped Compressed Files.zip
```

  * **`<Shoot_Name>`:** The name you provided for the shoot.
  * **`<BaseName>`:** The base name you provided for file renaming.
  * **Attribution Note:** The `README.txt` file inside this main `<Shoot_Name>` folder, intended for your client, will contain **your studio's branding** (from `config.py`) but also the **mandatory footer attributing PhotoPackager's development** to DropShock Digital LLC. The `photopackager_run.log` file will also contain attribution.

## Project Code Structure (For Developers)

PhotoPackager follows a modular structure for maintainability:

  * `main.py`: Main script orchestrating the workflow (formerly `main_photodelivery.py`).
  * `bootstrap.py`: Handles environment checks and dependency installation.
  * `config.py`: Central repository for **ALL** constants and configuration settings (including User Branding and Original Author details).
  * `ui.py`: Manages all console user interaction (intro, prompts, argument parsing setup).
  * `filesystem.py`: Handles all file/folder operations (creation, gathering, renaming, zipping, README generation, `--dry-run` simulation).
  * `image_processing.py`: Contains core image manipulation logic (resizing, compression, EXIF handling, `--dry-run` save skipping).
  * `utils.py`: Holds generic helper functions (validation, notifications, signal handling).
  * `requirements.txt`: Lists necessary Python libraries.
  * `README.md`: This file.
  * `LICENSE.md`: Full MIT License text with original copyright.
  * `.gitignore`: Specifies files/folders ignored by Git.
  * `venv/`: Standard virtual environment directory (created by user, ignored by Git).

## Prerequisites

  * **Python:** Version **3.8 or higher** is strictly required. Ensure Python is installed and added to your system's PATH. Download from [python.org](https://www.python.org/downloads/).
  * **pip:** Python's package installer (usually included with Python 3.4+).

## Setup & Installation Instructions

**Follow these steps precisely:**

1.  **Get the Code:**

      * Download all the project files (`.py`, `requirements.txt`, `README.md`, `LICENSE.md`, `.gitignore`) into a dedicated folder for PhotoPackager (e.g., `C:\Users\YourName\PhotoPackager`).
      * Alternatively, use Git to clone the repository (replace URL):
        ```bash
        git clone <repository_url> PhotoPackager
        cd PhotoPackager
        ```

2.  **Open Terminal in Project Folder:**

      * Navigate your terminal (Command Prompt, PowerShell, macOS Terminal, Linux Terminal) into the `PhotoPackager` folder you created/cloned. You **must** run subsequent commands from *within* this folder.

3.  **Create Virtual Environment (Mandatory Best Practice):**

      * Run the following command in your terminal (while inside the `PhotoPackager` folder):
        ```bash
        python -m venv venv
        ```
      * This creates an isolated Python environment named `venv` inside your project folder.

4.  **Activate Virtual Environment:**

      * This step is crucial\! You must activate the environment *each time* you want to run PhotoPackager in a new terminal session.
      * **Windows (PowerShell):**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
          * **PowerShell Execution Policy Note:** If you see a red error message about "running scripts is disabled", run this *once* in your PowerShell session:
            ```powershell
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
            ```
            Then try the `.\venv\Scripts\Activate.ps1` command again.
      * **Windows (Command Prompt - CMD):**
        ```cmd
        venv\Scripts\activate.bat
        ```
      * **macOS / Linux (Bash, Zsh, etc.):**
        ```bash
        source venv/bin/activate
        ```
      * **Verification:** Your terminal prompt should now start with `(venv)`, like `(venv) C:\Users\YourName\PhotoPackager>`.

5.  **Configure User Branding (Optional but Recommended):**

      * Open the `config.py` file in a text editor.
      * Locate the "User Configuration" section.
      * Change the placeholder values for `USER_COMPANY_NAME`, `USER_WEBSITE`, and `USER_SUPPORT_EMAIL` to match your studio's details.
      * Save the `config.py` file.

6.  **Install Dependencies (Automatic):**

      * With the virtual environment **active** (you see `(venv)`), simply run the main script for the first time:
        ```bash
        python main.py
        ```
      * The `bootstrap.py` script will run automatically. It will check your Python version and then check for missing dependencies listed in `requirements.txt` (like `Pillow`, `tqdm`).
      * If dependencies are missing, it will list them and ask for your permission (`[Y/n]`) to install them using `pip`. Press `Y` and Enter.
      * *(Manual Install Alternative: If preferred, you can manually install after activating the venv by running `pip install -r requirements.txt`, but running `main.py` handles checks more robustly).*

7.  **Ready to Use:** Once the bootstrap process completes without errors, PhotoPackager is ready to use\!

## Usage

**1. Interactive Mode (Recommended for First Use):**

  * Ensure your virtual environment is active (`(venv)` visible in prompt).
  * Run the script without arguments:
    ```bash
    python main.py
    ```
  * Follow the on-screen prompts carefully:
      * Enter the path to your source folder(s).
      * Specify if it's a single shoot or multiple shoots in subfolders.
      * Choose global options (formats, original handling, EXIF, ZIPs) - **Pay attention to the 'move' confirmation\!**
      * For each shoot, provide a shoot name, base name for files, and output parent directory.
  * The script will provide progress updates in the console.

**2. Command-Line Mode (For Automation & Specific Settings):**

  * Ensure your virtual environment is active.

  * Use `python main.py` followed by arguments. Get a full list with `python main.py --help`.

  * **Example 1: Process a single shoot, copy originals, keep EXIF, generate all formats + ZIPs (defaults):**

    ```bash
    python main.py --source "/path/to/MyShoot_Images"
    ```

    *(Will ask for shoot name, base name, output parent interactively if `--output` is omitted)*

  * **Example 2: Process multiple shoots, specify output parent, disable WebP and ZIPs:**

    ```bash
    python main.py --source "/path/to/All_Shoots" --mode multi --output "/path/to/Deliveries" --no-webp --no-zip
    ```

    *(Will ask for name/base name for each subfolder shoot found in `All_Shoots`)*

  * **Example 3: Process single shoot, MOVE originals, strip ALL EXIF, skip compressed versions:**

    ```bash
    # WARNING: --move PERMANENTLY MOVES FILES. ENSURE BACKUPS!
    python main.py --source "D:\Photos\ClientB_Event" --mode single --move --exif strip_all --skip-compressed
    ```

  * **Example 4: DRY RUN - Simulate processing multiple shoots without changing anything:**

    ```bash
    # Use --dry-run to test your settings and see planned actions
    python main.py --source "/path/to/All_Shoots" --mode multi --output "/path/to/Deliveries" --move --exif both --dry-run
    ```

    *(Review the console output carefully to see what *would* happen)*

  * **Example 5: Process single shoot using only 2 workers and enable verbose logging:**

    ```bash
    python main.py --source "/path/to/MyShoot_Images" --workers 2 --verbose
    ```

## Understanding Concepts

  * **JPG vs. WebP:**
      * `JPG`: Universally compatible, standard lossy compression. Good for general use.
      * `WebP`: Modern format developed by Google. Often provides better compression (smaller file size) than JPG at similar visual quality. Excellent for web use. May require newer software/browsers for viewing. PhotoPackager generates both (unless disabled) for flexibility.
  * **Optimized vs. Compressed:**
      * `Optimized`: High quality (\~90%), suitable for most uses including moderate prints. Slightly compressed to save space vs. original.
      * `Compressed`: Significantly smaller files. Resized to \~2 Megapixels *then* compressed more aggressively (adaptive quality). Ideal for web galleries, social media, previews, email, where loading speed and file size are primary concerns. Not recommended for large prints.
  * **EXIF Metadata:** Data embedded in image files by cameras/software, including camera settings (shutter speed, aperture, ISO), date/time, potentially GPS location, camera make/model, etc. You might remove it for privacy (location), to reduce file size slightly, or for specific client requirements.
  * **Virtual Environments (`venv`):** Isolated Python environments that prevent conflicts between dependencies required by different projects. Using `venv` is crucial for reliable Python development.

## Default Behaviors

  * If `--source` is omitted, you will be prompted.
  * If `--mode` is omitted, you will be prompted based on the source path.
  * If `--output` is omitted, output folders are created in the parent directory of the source shoot folder(s).
  * Original files are **copied** by default. Use `--move` to change this (with caution).
  * JPG and WebP formats are generated by default. Use `--no-jpg`/`--no-webp` to disable.
  * Optimized and Compressed versions are generated by default. Use `--skip-compressed`. Export versions depend on original handling choice (`--skip-export` disables).
  * All EXIF data is **kept** by default. Use `--exif <option>` to change.
  * ZIP archives are **created** by default. Use `--no-zip` to disable.
  * Parallel processing uses all available CPU cores by default (`os.cpu_count()`). Use `--workers <N>` to change.
  * Logging is at the `INFO` level by default. Use `--verbose` or `-v` for `DEBUG` level.
  * `--dry-run` is **disabled** by default.

## Troubleshooting

  * **Permission Denied Errors:** Ensure you have write permissions in the target output directory. Run your terminal as administrator (Windows, use with caution) or use `sudo` (macOS/Linux, use with caution) if necessary, although it's better to fix folder permissions.
  * **`ModuleNotFoundError`:** Make sure your `venv` is **active** before running `python main.py`. Ensure dependencies were installed correctly (run `pip list` inside the active venv).
  * **Image Processing Errors (Pillow):** Check the `photopackager_run.log` file inside the affected shoot's output folder. Errors might indicate corrupt/unsupported image files or memory issues.
  * **Memory Issues/Crashes:** Processing very large images or using many `--workers` can consume significant RAM. Try reducing the number of workers (e.g., `--workers 2` or `--workers 1`).
  * **PowerShell Activation Errors:** See the `Set-ExecutionPolicy` command in the Setup Instructions (Step 4).
  * **File Not Found (During Processing):** If using `--move`, ensure the source files weren't deleted or moved elsewhere between steps. Check logs for details.

## Support & Contact

  * **For issues with the PhotoPackager tool itself** (bugs, errors, feature requests):
      * Contact the original developer: **Steven Seagondollar, DropShock Digital LLC**
      * Support Email: **support@dropshockdigital.com**
      * GitHub Issues (if available): `<link_to_issues_page>` \* **For questions about the PHOTOS DELIVERED** using this tool (e.g., content, usage rights, specific edits):
      * Contact the **studio/photographer who provided you the delivery package**:
      * Company: **`[Your Studio Name Here - As set in config.py]`**
      * Website: **`[Your Studio Website Here - As set in config.py]`**
      * Support: **`[Your Studio Support Email Here - As set in config.py]`**

## License

Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC

This project is licensed under the **MIT License**. See the [LICENSE.md](LICENSE.md) file for full details.