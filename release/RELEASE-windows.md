<div align="center">
  <img src="assets/PhotoPackager_Patch_Design.png" alt="PhotoPackager Logo" width="400" style="margin-bottom:10px;"/>
  <h1>PhotoPackager for Windows</h1>
  <p><strong>Version 1.0.0 (Initial Release)</strong></p>
  <p><strong>by <a href="https://www.dropshockdigital.com" target="_blank" rel="noopener noreferrer">Steven Seagondollar, DropShock Digital LLC</a></strong></p>
  <a href="https://www.dropshockdigital.com" target="_blank" rel="noopener noreferrer">
    <img src="assets/(White) DropShock Digital - Photography Watermark Version 2.png" alt="DropShock Digital - Creators for Creators" width="280" style="margin-top: 5px; margin-bottom: 15px;"/>
  </a>
</div>

---

**Release Date:** *(Insert Actual Release Date Here, e.g., November 5, 2023)*

## 🚀 Download PhotoPackager v1.0.0 for Windows

*   [**Download PhotoPackager_GUI_Installer.exe (Windows Installer)**](PhotoPackager_GUI_Installer.exe)
    *(This link assumes the `PhotoPackager_GUI_Installer.exe` file is part of the GitHub Release assets. Adjust if your link structure is different.)*

---

## 👋 Welcome to PhotoPackager for Windows!

This is the first official release of **PhotoPackager** for the Windows platform. PhotoPackager is a powerful desktop application designed to help photographers and creative professionals automate essential post-production tasks. It streamlines the process of organizing photo shoots, processing images into various formats, and packaging them for professional client delivery.

This Windows version provides the full functionality of PhotoPackager through an intuitive Graphical User Interface (GUI), making complex workflows accessible and easy to manage.

For a complete understanding of all PhotoPackager's capabilities, its full feature set, detailed usage instructions (including the GUI walkthrough and information on the Command-Line Interface if you choose to run from source), advanced configuration options, troubleshooting advice, and more, please consult the main project [**README.md file**](../../README.md). This release note focuses specifically on getting started with this Windows installer package.

---

## 🪟 Windows Installation & First Launch Instructions

Follow these steps to install and run PhotoPackager on your Windows PC:

1.  **Download the Installer:**
    *   Click the download link above to get the `PhotoPackager_GUI_Installer.exe` file. Save it to a convenient location on your computer, such as your `Downloads` folder.

2.  **Run the Installer:**
    *   Locate the downloaded `PhotoPackager_GUI_Installer.exe` file and double-click it to start the installation wizard.
    *   **Windows Defender SmartScreen Prompt (Important):** When you run the installer, Windows Defender SmartScreen may display a blue prompt stating "Windows protected your PC." This is a standard security measure for new applications from independent developers that haven't yet built up a widespread reputation with Microsoft, especially if the installer is not yet digitally signed with an expensive Extended Validation (EV) certificate.
        1.  In the SmartScreen dialog, click on the "**More info**" link (it's usually a small text link).
        2.  After clicking "More info," the dialog will often expand to show more details, including the application name (e.g., "PhotoPackager GUI").
        3.  A button labeled "**Run anyway**" should then appear. Click this button to allow the PhotoPackager installer to proceed.
    *   Follow the on-screen instructions provided by the installer wizard. This typically involves steps like:
        *   Accepting the software license agreement (MIT License).
        *   Choosing your preferred installation location on your hard drive (the default location is usually appropriate for most users).
        *   Deciding whether to create Desktop shortcuts or Start Menu entries for easy access to PhotoPackager after installation.

3.  **Launch PhotoPackager:**
    *   Once the installation process is complete, you can launch PhotoPackager. You can usually do this from your Windows Start Menu (it should be listed under recently installed programs or within its own "PhotoPackager" or "DropShock Digital" folder, depending on how the installer is configured) or by using the Desktop shortcut if one was created during installation.

4.  **Using PhotoPackager:**
    PhotoPackager is now installed and ready for use! Launch the application. For guidance on its features and how to use the interface effectively, please see the "GUI Walkthrough" section in the main [README.md](../../README.md).

    <div align="center" style="margin-top:20px; margin-bottom:15px;">
      <img src="../assets/windows_app.png" alt="PhotoPackager Windows Application Screenshot" width="550" style="border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 5px 10px rgba(0,0,0,0.12);"/>
      <p style="font-size:0.85em; color: #666; margin-top:8px;"><em>The PhotoPackager interface on Windows.</em></p>
    </div>

---

## ✨ Windows Version Highlights (v1.0.0)

This initial Windows release of PhotoPackager provides the core suite of tools designed to significantly improve your photo delivery workflow:

*   **Native Windows Application:** A self-contained `.exe` installer for straightforward setup and use on Windows systems.
*   **Full GUI Functionality:** Access all PhotoPackager features through its user-friendly graphical interface, including easy selection of source/output locations, comprehensive processing option configuration (originals handling, EXIF policies, image format generation, ZIP archive creation), and customizable client branding for generated `README.txt` files.
*   **Windows File Dialogs:** Utilizes standard Windows open/save file dialogs for a familiar and consistent user experience.
*   **Desktop Notifications (Optional):** (If the `win10toast-reborn` library is successfully bundled and your Windows notification settings allow) Attempts to use non-blocking "toast" notifications for job status updates, helping you stay informed without constant monitoring.

*(For a complete list of all application features and their detailed descriptions, please consult the "Key Features" section in the main [README.md](../../README.md).)*

---

## 🛠️ System Requirements for Windows

To ensure PhotoPackager runs effectively on your Windows PC, please make sure your system meets the following minimum requirements:

*   **Operating System:** Windows 10 (64-bit recommended) or Windows 11.
    *   *While it might run on older 32-bit systems or older Windows versions, 64-bit Windows 10/11 is the primary target for development and testing, offering better performance and memory management for image processing tasks.*
*   **Processor:** A 1 GHz or faster processor is required. A 2 GHz or faster multi-core processor is recommended for smoother performance, especially with large jobs.
*   **RAM (Memory):** A minimum of **8GB of RAM** is recommended for good performance. 4GB might work for very small, simple jobs but could lead to slow processing and unresponsiveness. For users regularly processing large numbers of high-resolution images, 16GB or more is advisable.
*   **Hard Disk Space:** At least **250-350MB** of free disk space is required for the application installation itself. Significant additional disk space will be needed for your source images and for the output packages generated by PhotoPackager (which can be 2-5 times the size of your originals, depending on the options you select). Using an SSD (Solid State Drive) for your operating system and for storing your working files is highly recommended for much better performance compared to traditional HDDs.
*   **Display:** A screen resolution of 1280x800 pixels or higher is recommended for optimal viewing and usability of the application interface.
*   **.NET Framework (Typically Not Required for User):** PhotoPackager is a Python application. While some Windows system components might rely on .NET, PhotoPackager itself should not require users to manually install specific .NET Framework versions, as its dependencies are primarily Python-based and handled by the application packaging.

---

## ⚠️ Known Considerations for This Windows Release (v1.0.0)

*   **Windows Defender SmartScreen Warning:** As this is an initial release, the PhotoPackager installer (`.exe`) may not yet be code-signed with a Microsoft-recognized Extended Validation (EV) certificate. Because of this, you will likely encounter the Windows Defender SmartScreen prompt during installation, warning that "Windows protected your PC." Please follow the instructions provided in the "Windows Installation & First Launch Instructions" section above (click "More info," then "Run anyway") to proceed with the installation. This is a common occurrence for new software from independent developers.
*   **Antivirus Software Flags (Potential):** Some aggressive antivirus programs might flag the PhotoPackager installer or the installed application executable as unknown or potentially suspicious, simply because it's a new application that their virus definition databases haven't widely encountered yet. This is usually a false positive. If your antivirus interferes with installation or execution, you may need to temporarily disable its real-time scanning or add an exception (whitelist) for the PhotoPackager installer and its installation directory. Remember to exercise caution and re-enable your antivirus afterward.
*   **WebP EXIF Metadata Support:** As noted in the main README, while PhotoPackager and the Pillow library aim to preserve EXIF metadata when converting images to WebP format, the support for *all* possible EXIF tags (especially highly specific or custom manufacturer tags) in WebP files can sometimes be less comprehensive than it is for more established formats like JPEG. If the precise retention of all original EXIF data in your WebP output is critical for your specific workflow, it is advisable to conduct your own tests with your image types and metadata requirements to verify the results.

---

## 🛟 Support & Feedback for Windows Version

We are committed to providing a robust and user-friendly experience with PhotoPackager on Windows. If you encounter any issues specific to this Windows version, or have feedback related to its performance, installation, or behavior on your Windows PC:

*   **Primary Support:** Please refer to the main contact methods detailed in the project's primary [README.md](../../README.md) (Email: `support@dropshockdigital.com`, GitHub Issues for the project).
*   When reporting Windows-specific issues, please include:
    *   Your **Windows version** (e.g., Windows 11 Pro, Version 23H2, OS Build 22631.xxxx).
    *   The **PhotoPackager version** (v1.0.0 for this release).
    *   Details about your PC hardware if relevant (e.g., CPU, RAM).
    *   Clear steps to reproduce the problem.
    *   Any relevant log file content from `photopackager_run.log`.

---

## 📜 License

PhotoPackager is licensed under the **MIT License**.
Copyright (c) 2024-2025 Steven Seagondollar, DropShock Digital LLC.

For the full license text, please see the [LICENSE.md](../../LICENSE.md) file in the main project repository.