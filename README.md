<div align="center">
  <img src="assets/PhotoPackager_Patch_Design.png" alt="PhotoPackager Logo" width="400" style="margin-bottom:10px;"/>
  <h1>PhotoPackager</h1>
  <h3 align="center" style="font-weight: normal; margin-top: -10px; margin-bottom: 10px;">Make Photoshoots Client Accessible</h3>
  <p><strong>A Creative Photoshoot Pipeline Tool By <a href="https://www.dropshockdigital.com" target="_blank" rel="noopener noreferrer">Steven Seagondollar, DropShock Digital LLC</a></strong></p>
  <br>
  <a href="https://www.dropshockdigital.com" target="_blank" rel="noopener noreferrer">
    <img src="assets/(White) DropShock Digital - Photography Watermark Version 2.png" alt="DropShock Digital - Creators for Creators" width="350" style="margin-top: 5px; margin-bottom: 20px;"/>
  </a>
  <p>
  <br>
    <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
    <a href="https://www.python.org/downloads/release/python-31210/"><img src="https://img.shields.io/badge/python-3.12.10-blue.svg" alt="Python 3.12.10+"/></a>
    <a href="https://github.com/seagpt/PhotoPackager/releases/latest"><img src="https://img.shields.io/github/v/release/seagpt/PhotoPackager?label=latest%20version&sort=semver&color=blueviolet" alt="Latest Release"/></a>
    <a href="https://github.com/seagpt/PhotoPackager/releases"><img src="https://img.shields.io/github/downloads/seagpt/PhotoPackager/total?label=downloads&color=brightgreen" alt="Total Downloads"/></a>
  </p>
</div>

---

## 🌟 Choose Your PhotoPackager Experience

### 🖥️ **Desktop Edition** (This Repository Root)
Full-featured desktop application with system-wide file access and unlimited processing power.

### 🌐 **Web Edition** ([`/web-edition/`](web-edition/) Directory)
Browser-based version with client-side processing - perfect for sharing and mobile access.  
**[📖 Web Edition Documentation](WEB-EDITION-README.md)** | **🚀 [Live Demo - Coming Soon]**

---

## 🚀 Quick Download Links (v1.0.0 - First Release)

Download the first official version of PhotoPackager for your operating system:

*   🪟 **Windows:**
    *   [**PhotoPackager Installer (v1.0.0) (.exe)**](https://github.com/seagpt/PhotoPackager/releases/download/v1.0.0/PhotoPackager_GUI_Installer.exe) <!-- Ensure this link points to your actual v1.0.0 EXE asset -->
*   🍎 **macOS:**
    *   [**PhotoPackager Universal (v1.0.0) (.dmg.zip)**](https://github.com/seagpt/PhotoPackager/releases/download/v1.0.0/PhotoPackager_GUI.dmg.zip) <!-- Ensure this link points to your actual v1.0.0 ZIPPED DMG asset -->
        *(The macOS Disk Image (`.dmg`) is provided within a `.zip` archive. This is to help ensure smoother downloads and prevent potential security blocks by web browsers or macOS Gatekeeper that can sometimes occur with direct `.dmg` downloads from sources like GitHub.)*

<div align="center" style="margin-top:10px; font-size:0.9em;">
  <em>For all versions, including future updates, pre-releases, or older builds, please visit the <a href="https://github.com/seagpt/PhotoPackager/releases" target="_blank" rel="noopener noreferrer"><strong>Official PhotoPackager Releases Page</strong></a>.</em>
</div>

---

<div align="center">
  <table style="border: none; margin-left: auto; margin-right: auto; margin-top: 25px; margin-bottom: 25px;">
    <tr>
      <td style="padding: 15px; border: none; vertical-align: top; text-align: center;">
        <figure style="margin: 0 auto;">
          <img src="assets/mac_app.png" alt="PhotoPackager macOS Screenshot" width="480" style="border: 2px solid #6c757d; border-radius: 10px; box-shadow: 0 8px 16px rgba(0,0,0,0.2);"/>
          <br>
          <figcaption style="font-size: 0.95em; color: #555; margin-top: 12px;"><em>PhotoPackager efficiently managing photo deliveries on macOS.</em></figcaption>
        </figure>
      </td>
      <td style="padding: 15px; border: none; vertical-align: top; text-align: center;">
        <figure style="margin: 0 auto;">
          <img src="assets/windows_app.png" alt="PhotoPackager Windows Screenshot" width="480" style="border: 2px solid #6c757d; border-radius: 10px; box-shadow: 0 8px 16px rgba(0,0,0,0.2);"/>
          <br>
          <figcaption style="font-size: 0.95em; color: #555; margin-top: 12px;"><em>A streamlined packaging workflow with PhotoPackager on Windows.</em></figcaption>
        </figure>
      </td>
    </tr>
  </table>
</div>

---

## 🎯 Overview: Solving the Modern Photographer's Delivery Dilemma

**PhotoPackager** is a professional-quality desktop application, developed by **Steven Seagondollar** at **DropShock Digital LLC**. It is specifically created to automate and significantly improve the often complicated, lengthy, and mistake-prone workflow that photographers, creative studios, marketing agencies, and anyone handling large collections of digital images typically face after a photo shoot is complete. The core mission is to **Make Photoshoots Client Accessible** by transforming raw, bulky image sets into perfectly organized, multi-format, and easily usable packages.

Modern digital cameras capture an incredible amount of visual detail, which is fantastic for quality. However, this often results in very large original image files, such as camera RAW files or full-quality JPEGs. A single photograph can easily be 20 megabytes (MB), 50MB, or even more than 100MB. While these original, high-fidelity files are absolutely necessary for professional archiving, producing high-quality prints, detailed photo retouching, and any intensive re-editing work, they also introduce considerable practical difficulties when it comes to delivering these images to clients and for those clients' everyday use:

*   🤯 **Client Overwhelm and Storage Difficulties:** The sheer size of these high-resolution files can be a significant burden for most clients. Whether they are large commercial businesses or individual customers, they frequently do not have the extensive local computer storage capacity, consistently fast internet connections, or the specific technical skills needed to comfortably download, store, and manage hundreds or even thousands of such massive image files. Trying to handle many gigabytes (or potentially terabytes!) of photos can quickly use up all the space on their personal devices (like smartphones, tablets, and laptops), fill their cloud storage accounts, and ultimately lead to a feeling of frustration rather than excitement about their new images.
*   🐌 **Usability Barriers and a Less-Than-Ideal Experience:** Beyond just the storage problems, large image files inherently create issues with how easily they can be used. They take a long time to download, especially for clients with average or slower internet connections. They can be cumbersome or impossible to share effectively on popular social media platforms, which often have strict file size limits or apply their own aggressive (and sometimes quality-reducing) recompression. Attaching numerous large images to standard emails is frequently not practical due to email provider attachment size limitations. Furthermore, using full-resolution images directly in website photo galleries can make those galleries load very slowly, resulting in a poor and frustrating user experience for anyone visiting the website who simply wants to view the photos quickly and easily.
*   🧩 **The Time-Consuming Challenge of Creating Multiple Versions:** Different situations and platforms where images are used require them to have different characteristics. A large-format print for a gallery wall demands the utmost resolution and image quality available. A company website or a blog post, on the other hand, needs images that are much smaller in file size for fast loading times, without sacrificing too much visual quality. Social media platforms (like Instagram, Facebook, X/Twitter) each have their own preferred image dimensions, aspect ratios, and compression levels for optimal display within their feeds. Clients often need smaller, easily viewable preview images for quick selection from a large set, or for sharing with friends and family who don't need the full-resolution files. Manually creating all these different versions – which involves repetitive tasks like resizing, reformatting to different file types (such as JPEG or WebP), recompressing to different quality levels, renaming files logically, and organizing them into separate, clearly labeled folders – for every single photo shoot is a monumental, highly repetitive, and creatively draining task. It consumes a huge amount of a photographer's or a studio's valuable time and resources that could be better spent on shooting, editing, or client relations.

**PhotoPackager is the thoughtfully designed, automated, and robust software solution created to directly address these critical modern photo delivery challenges.** It empowers photographers and other creative professionals to reclaim precious time, enhance their operational efficiency, improve their professional image through consistent deliverables, and provide a superior, more user-friendly experience for their clients. It achieves this by:

1.  **🗂️ Organizing Intelligently and Consistently, Every Time:** Automatically arranging all the images from an entire photo shoot into a standardized, professional-looking, and easily configurable folder structure. This brings consistent order and much-needed clarity to the often chaotic state of post-production files, making them easy for both the photographer to manage and the client to understand and navigate.
2.  **⚙️ Processing with Unmatched Versatility and Granular Control:** Generating multiple, purpose-driven delivery formats from your original source images in a single, automated, and highly configurable processing run. This typically includes the creation of several distinct sets of images tailored for different uses:
    *   **Originals:** Providing clear and safe options to either copy your original, full-resolution files (this is the recommended default setting for data safety) or (only with extreme caution and after verifying multiple, independent backups) move them for secure archival, for preparing for high-quality printing, or for retaining as master files for any future, intensive editing needs.
    *   **Optimized Versions (in JPEG and/or WebP format):** Creating beautifully balanced images that retain exceptional visual fidelity, sharpness, and color detail, but at significantly reduced file sizes (often achieving 50% to 80% file size reduction compared to the original full-resolution files). These "Optimized" files are perfect for high-quality digital delivery directly to clients, for use in professional online client proofing galleries, and for general professional applications where top visual quality is important but the original massive file sizes would be impractical or unwieldy for clients to handle.
    *   **Compressed Versions (in JPEG and/or WebP format):** Generating images that are further resized to smaller, more manageable dimensions (e.g., to specific pixel dimensions like 2048 pixels on the longest edge, or to a target total megapixel count like 2MP or 3MP) and then more aggressively compressed (again, with user-configurable quality settings for both JPEG and WebP). These versions are ideal for use in website galleries that require lightning-fast loading times, for easy attachment to emails without exceeding common file size limits, for optimal sharing on various social media platforms (which often have their own size and compression constraints), and for providing clients with quick, easily downloadable preview image sets where small file size and rapid accessibility are the primary concerns (often resulting in file sizes that are 90% to 98% smaller than the original source files), making them incredibly portable and convenient.
3.  **🏷️ Managing Metadata Consistently, Powerfully, and with Precision Across All Outputs:** Ensuring that EXIF (Exchangeable Image File Format) metadata – which typically includes important information such as camera settings (aperture, shutter speed, ISO), date and time of capture, GPS location data (if embedded by the camera), copyright information, and other camera or user-embedded details – is handled intentionally, consistently, and uniformly across all the generated image files. PhotoPackager offers users flexible options to preserve all original metadata fully, to strip it completely for privacy or file size reduction, or to selectively retain or remove specific categories of tags, such as date/time information or camera/lens details.
4.  **🔢 Renaming Files with Unparalleled Clarity and Logical Organization:** Implementing a consistent and sequential file renaming system for all output files. This means that Optimized versions, Compressed versions, and any original files that are copied or moved into the `Export Originals` folder are all renamed to a clear, predictable format like `###-<ShootBaseName>.ext`. Here, `###` represents a zero-padded sequential number (e.g., `001`, `002`, `003`, and so on), and `<ShootBaseName>` is the custom, descriptive project name that you define for each individual job (e.g., `Johnson_Family_Portraits_2025`). The `.ext` simply represents the file extension (e.g., `.jpg`, `.webp`, `.dng`). This systematic renaming provides unparalleled clarity, ensures that images are effortlessly sorted in the correct order when viewed by clients in most file browsers or image viewing software, and adds a distinct touch of professionalism and meticulous organization to all your final deliverables.
5.  **🎁 Packaging Deliverables with Your Professional Branding and Clear Client Guidance:** Assembling all the processed image files and their organized folder structures into polished, client-ready packages. A key and valuable part of this packaging process is the automatic generation of a customizable plain text `README.txt` file that is included in the root directory of each delivery package. This `README.txt` file prominently features *your* studio's name, your professional website address, and your client support email contact. This not only significantly reinforces your unique brand identity with every client delivery but also provides clients with essential information about the contents of their package and an easy way to contact you if they have questions.

PhotoPackager is built from the ground up with a strong emphasis on **operational efficiency (saving you time), processing reliability (getting it right every time), data safety (especially concerning your irreplaceable original files), and producing final outputs that consistently reflect the high-quality standards and professional image associated with quality photographic services.** Users can configure the application once through its central configuration files (e.g., `config/config.json` for application defaults, and `config/user_config.json` for persistent user preferences) to match their studio's specific default settings. After this initial setup, processing subsequent photo shoots becomes a quick, consistent, and highly confident operation. The ultimate goal of PhotoPackager is to help you deliver results that not only beautifully showcase the premium quality of your photographic work but also provide your clients with conveniently sized, perfectly organized, and easily usable files, thereby upholding high professional standards and significantly enhancing overall client satisfaction and your professional reputation.

---

## ✨ Key Features: Your All-in-One Delivery Powerhouse

PhotoPackager comes loaded with a comprehensive set of features, all meticulously designed to effectively address and conquer the common challenges of the modern photographic workflow. These features aim to save you significant amounts of valuable time, drastically reduce tedious manual labor, and elevate the professionalism and client-friendliness of your final image deliveries:

*   **🖥️ Intuitive Graphical User Interface (GUI) – Simplicity Meets Power:**
    PhotoPackager boasts a sleek, modern, and exceptionally easy-to-use desktop application interface. This GUI is expertly built using **PySide6**, which provides Python bindings for the powerful and mature **Qt 6.x framework**. The design allows for straightforward visual configuration of complex image processing jobs, with most operations executable with just a few intuitive clicks. It is ideally suited for daily studio use by photographers, photo editors, and studio managers, regardless of their technical skill level, as it requires a minimal learning curve to master its wide range of capabilities. Helpful placeholder text is included in all main input fields to guide users, and the branding information fields conveniently pre-fill with your configurable defaults (which can be easily updated and saved persistently using the dedicated "Save as Defaults" button in the interface, typically writing to a user-specific configuration file like `config/user_config.json`).

*   **⌨️ Powerful Command-Line Interface (CLI) – For Automation and Advanced Users:**
    For users who prefer working in a terminal, require automation for repetitive tasks, or need to integrate PhotoPackager into larger scripted workflows, the application offers a comprehensive non-interactive Command-Line Interface (CLI). The CLI is invoked by running the main application entry point (typically `app.py` if running from source, or the packaged executable like `PhotoPackager_GUI.exe` on Windows) with the `cli` subcommand, followed by various options and arguments (e.g., `python3 app.py cli [options...]`). It is ideal for power users, technical teams, and for integration into broader automated systems, such as server-side image processing pipelines or continuous integration/continuous delivery (CI/CD) systems for digital asset management and delivery.
    When using the CLI, core job settings and processing parameters are primarily loaded from the application's configuration files (e.g., `config/config.json` for application-wide defaults and `config/user_config.json` for user-specific overrides). However, crucial parameters that vary per job, such as the `--source` image folder and the `--output` parent directory (along with many other processing options), are provided as command-line arguments, and these will override any corresponding settings found in the configuration files for that specific run.
    To see a detailed list of all available CLI options and how to use them, you can run:
    ```bash
    # If running PhotoPackager from its source code (ensure venv is active):
    python3 app.py cli --help
    
    # If using a pre-built packaged executable (example for Windows, adapt for macOS/Linux):
    # PhotoPackager_GUI.exe cli --help 
    # (or YourExecutableName cli --help)
    ```

*   **📂 Standardized & Highly Configurable Output Structure – Professional Organization by Default:**
    The application automatically generates a consistent, professional-looking, and client-friendly folder hierarchy for every processed photo shoot. A typical default output structure might include clearly named main folders such as: `Export Originals` (for the original full-resolution files), `Optimized Files` (which itself contains subfolders like `Optimized JPGs` and `Optimized WebPs`), and `Compressed Files` (which also contains subfolders like `Compressed JPGs` and `Compressed WebPs`). A significant advantage of PhotoPackager is that **all these folder names are fully customizable** by the user. You can change them via settings in your user configuration file (e.g., `config/user_config.json` for persistent changes) or, for more fundamental application-wide defaults that developers might set, potentially in the main application configuration (`config.py` if it handles such constants, or `config/config.json`). This allows studios to tailor the output structure precisely to match their specific branding guidelines, existing internal organizational systems, or particular client preferences, ensuring every delivery is perfectly structured according to their needs.

*   **🖼️ Multi-Format Image Generation Engine – The Versatile Heart of PhotoPackager:**
    The core strength and primary function of PhotoPackager lie in its sophisticated and highly configurable image processing engine. This engine is capable of creating multiple, purpose-driven versions of your images from your original source files, all in a single, efficient, and automated operation:
    *   **Optimized Versions (Designed for High-Quality Digital Use):** PhotoPackager can produce high-quality JPEG and/or WebP image files. These "Optimized" versions are carefully balanced using user-configurable quality settings (for example, a JPEG quality setting of 85 to 95 on a standard 0-100 scale) to retain excellent visual detail, accurate color representation, and good sharpness, while at the same time significantly reducing the file sizes compared to the original full-resolution images (often achieving a 50% to 80% file size reduction). These Optimized files are perfect for primary digital delivery to clients, for use in high-resolution online client proofing galleries, for inclusion in digital portfolios, and for general professional applications where top visual quality is essential but the original massive file sizes would be impractical or unwieldy for clients to handle.
    *   **Compressed Versions (Ideal for Web, Previews, and Easy Sharing):** The application can also generate images that are further resized to smaller, more manageable dimensions. This resizing can be based on a configurable target pixel count for the longest edge of the image (e.g., 2048 pixels), or a total target megapixel count (e.g., 2 or 3 megapixels). After resizing, these images are then more aggressively compressed (again, with user-configurable quality settings for both JPEG and WebP formats). These versions are ideal for use in website galleries that require lightning-fast loading times, for easy attachment to emails without exceeding common file size limits, for optimal sharing on various social media platforms (which often have their own size and compression constraints), and for providing clients with quick, easily downloadable preview image sets where small file size and rapid accessibility are the most important considerations (often resulting in file sizes that are 90% to 98% smaller than the original source files), making them incredibly portable and convenient.
    *   *Granular Control Over Formats and Processing Parameters:* PhotoPackager provides users with fine-grained control over these generation processes. You can easily toggle JPEG and/or WebP format generation independently for both the "Optimized" and "Compressed" categories, based on your specific needs for each delivery. There's also a simple option to entirely skip the creation of the "Compressed" versions if they are not required for a particular job. All the associated image processing parameters, including JPEG quality levels, WebP quality levels, WebP compression effort/speed settings (which affects encoding time versus compression efficiency), and the specific resizing targets (such as long edge pixel dimensions or total megapixel counts), are fully configurable through the Graphical User Interface and can be set as persistent defaults in your configuration files.

*   **🛡️ Configurable & Safe Originals Handling – Prioritizing the Integrity of Your Master Files:**
    PhotoPackager provides several flexible options for managing your precious original source image files during the packaging process, with a strong emphasis on safety and preventing accidental data loss:
    *   `Copy`: (This is the Default setting and is **Strongly Recommended** for maximum safety). When this option is selected, PhotoPackager will safely create duplicates of all your original image files and place these copies into the `Export Originals` folder (or your customized name for it), which is created within the final output package. Your master source images on your computer will remain completely untouched, secure, and unmodified in their original location. This is the preferred method for most workflows to ensure data integrity.
    *   `Move`: (**EXTREMELY HIGH RISK – USE WITH UTMOST CAUTION AND ONLY IF YOU HAVE MULTIPLE, INDEPENDENT, AND RECENTLY VERIFIED BACKUPS OF YOUR SOURCE FILES**). If you select the "Move" option, PhotoPackager will permanently move your original files from their source location on your computer to the `Export Originals` folder in the output package. This means that after the move is successful, the original files will be *deleted* from their starting source path. This is a destructive operation on your source files and carries significant risk if anything goes wrong during the process or if your backups are not sound. This option should only be considered by advanced users who fully understand these risks and have an impeccable, verified backup strategy in place.
    *   `Leave`: With the "Leave" setting, your original image files will remain completely untouched and unaltered in their original source folder. No copies or moves of these original files will be made into the `Export Originals` folder as part of the PhotoPackager output package. This can be useful if your originals are already securely archived or managed through a separate digital asset management (DAM) system, and you only need PhotoPackager to generate processed versions for delivery purposes.
    *   `Skip Export`: If you choose "Skip Export," PhotoPackager will ignore your original files entirely during its processing for this particular job. Consequently, no `Export Originals` folder (or your custom equivalent name for it) will be created in the output package. This option is useful if you only need to generate and deliver the "Optimized" and/or "Compressed" versions for a specific purpose (e.g., for a web-only delivery or for creating a set of proofs) and do not need or want to include the full-resolution originals in that particular delivery package.

*   **🏷️ Granular EXIF Metadata Control – Manage Embedded Image Information with Precision and Intent:**
    PhotoPackager offers users precise and configurable control over how EXIF (Exchangeable Image File Format) metadata is handled in the *generated* image files (i.e., the "Optimized" and "Compressed" versions created by PhotoPackager; this does not affect original files if they are merely copied or left untouched). This allows you to tailor the information embedded within your delivered images according to your needs, client requirements, or privacy considerations:
    *   `Keep`: (This is typically the Default setting). When selected, all original EXIF metadata from the source image file is preserved and embedded into the processed (Optimized and Compressed) versions.
    *   `Strip All`: If this option is chosen, all EXIF data will be completely removed from the generated Optimized and Compressed images. This can be useful for several reasons, such as maximizing client privacy (e.g., by removing GPS location data, detailed camera settings, or photographer notes from the files), achieving the absolute smallest possible output file sizes (as EXIF data can sometimes add a few kilobytes or more to each file), or for specific publishing platforms that require images with no embedded metadata. (If the `piexif` library is not available when running from source and this fallback is implemented, other selective removal options below might default to this "Strip All" behavior).
    *   `Date Only`: This option allows for more selective metadata management. It specifically removes only date and time-related EXIF tags from the generated images, while potentially keeping other information such as copyright details or camera model information. (This more granular feature requires the optional `piexif` Python library to be available to PhotoPackager; pre-built packaged versions should include this library if this feature is advertised as active and enabled for that release).
    *   `Camera Only`: Similar to the above, this option selectively removes only EXIF tags related to the camera make/model and lens information, while other metadata might be preserved. (Also typically requires `piexif`).
    *   `Date & Camera`: This option combines the previous two, removing both date/time related tags and camera/lens related EXIF tags from the generated images. (Requires `piexif`).
    The original source files are *never* modified by these EXIF policies; these changes only apply to the images PhotoPackager generates.

*   **🔢 Consistent Sequential File Renaming – Bringing Clarity and Order to Your Client Deliverables:**
    PhotoPackager automatically and systematically renames all the output files it creates – this includes all Optimized versions, all Compressed versions, and any original files that are copied or moved into the `Export Originals` folder. The files are renamed to a clear, consistent, and easily sortable `###-<ShootBaseName>.ext` format.
    *   `###`: Represents a zero-padded sequential number (e.g., `001`, `002`, `003`, ..., up to `999` or more if needed). This ensures that images are listed in their correct processing order.
    *   `<ShootBaseName>`: This is the custom, descriptive project name that you provide for each individual job (e.g., `Johnson_Family_Portraits_2025`).
    *   `.ext`: This is the original file extension of the image (e.g., `.jpg`, `.webp`, `.cr2`, `.nef`, `.dng`).
    *   Example: An original file `DSC_1234.NEF` might become `001-Johnson_Family_Portraits_2025.NEF` in the `Export Originals` folder, while its optimized JPEG version becomes `001-Johnson_Family_Portraits_2025.jpg` in the `Optimized JPGs` folder.
    This systematic renaming provides unparalleled clarity for your clients, ensures that images naturally sort in the correct order when viewed in most file browsers or image viewing software, and adds a distinct touch of professionalism and meticulous organization to all your final deliverables.

*   **🏢 Customizable Delivery Branding for *Your* Studio – Professionally Reinforce Your Brand Identity:**
    PhotoPackager empowers you to prominently feature your own studio's branding with every client delivery, which enhances your professional image, builds brand recognition, and provides clients with easy ways to reconnect with you:
    *   You can set **your own** `Company Name`, `Website URL`, and `Support Email Address`. This can be done globally as a default in your user configuration files (e.g., `config/user_config.json`, often with a "Save as Defaults" button in the GUI's branding section to update this file) for all jobs, or you can override these defaults on a per-job basis directly through the GUI's branding input fields or via specific CLI arguments if using the command line.
    *   This custom branding information is then automatically and prominently embedded into the client-facing `README.txt` file. This plain text file is generated by PhotoPackager and included in the root directory of every final delivery package.
    *   This allows for highly personalized client deliveries that clearly showcase *your* studio's brand, your contact information, and a link to your website. This not only looks professional but also builds client trust and can encourage repeat business or referrals. (As per standard open-source practice and the MIT license terms, a respectful developer attribution to Steven Seagondollar and DropShock Digital LLC typically remains in the footer of such generated files).

*   **💬 Share Feedback & Help Us Improve (User-Initiated Reporting Feature):**
    Your insights and experiences using PhotoPackager are invaluable for its continued improvement! PhotoPackager includes a "Feedback & Support" option, typically found in the "Help" menu of the GUI, designed to make it easy for you to share your thoughts, suggest new features, or report any issues you might encounter directly to DropShock Digital.
    *   **How it Works:** When you select this option from the menu, a dialog window will appear, allowing you to type your feedback message.
    *   **Optional Job Summary Inclusion for Better Context:** Crucially, within this feedback dialog, you will have the **clear choice** (e.g., via a checkbox) to include a detailed summary of your most recently completed PhotoPackager job along with your message. This job summary can include helpful, non-sensitive diagnostic information such as the processing options you selected for that job, the number of files processed, and any anonymized error messages or warnings that might have been encountered. *It is important to note that no image data, personal files, or sensitive file path information is ever included in this job summary.* Error details are anonymized to protect your privacy.
    *   **Sending Your Feedback to DropShock Digital:**
        *   On **macOS**, if you have a default email client configured (like Apple Mail, Outlook, etc.), the PhotoPackager application will attempt to open a new email message in your client, pre-filled with DropShock Digital's support email address, a suggested subject line, your typed feedback, and, if you chose to include it, the anonymized job summary. You can then review and send this email.
        *   On **Windows** (and as a fallback mechanism on macOS if a default email client isn't properly configured or accessible), the PhotoPackager application will display all the necessary information (the recipient email address for DropShock Digital support, a suggested subject line for your email, your typed feedback, and the job summary if you chose to include it) in a way that you can easily copy and paste all of this information into your preferred email client or webmail interface to send it manually.
    *   **Why This Feedback System Helps Us (and Ultimately, You!):** By choosing to share your feedback, and optionally your anonymized job summary, you are directly contributing to the ongoing improvement and refinement of PhotoPackager. This information allows DropShock Digital to:
        *   Understand how the application is being used in diverse real-world scenarios by different photographers and studios.
        *   Identify which features are most popular or most helpful, and which areas might need more attention or enhancement in future versions.
        *   Troubleshoot any reported issues much more effectively by having concrete (yet privacy-respecting) data about the job settings and application state when an issue occurred.
        *   Gather valuable insights on the application's overall usage patterns, performance, and user satisfaction, which directly guides future development priorities and helps make PhotoPackager better for everyone.
    This feedback system is entirely user-initiated, and you are always in complete control of whether or not you choose to share information, and specifically whether to include the job summary.

*   **📦 Automatic Multi-ZIP Archiving – Simplify Client Downloads and File Transfers:**
    To make the process of delivering files to your clients even more convenient and streamlined, PhotoPackager offers an option to automatically create up to three distinct `.zip` archives in the main output folder of each job: `Export Originals.zip` (if originals are included and processed), `Optimized Files.zip`, and `Compressed Files.zip`. Each of these ZIP files contains the complete contents (including any subfolder structure) of its corresponding output category.
    *   This feature greatly streamlines the preparation of files for client delivery. Instead of clients having to download many individual files or entire complex folder structures (which can sometimes be problematic over slower connections or lead to incomplete downloads), they can download a few neatly organized, compressed ZIP archives. This is ideal when you are providing download links to clients via services like WeTransfer, Dropbox, or Google Drive, when sharing files through a client gallery system that supports ZIP downloads, or even when delivering files to clients on physical media like a USB drive. Clients receive neatly organized, compressed archives, simplifying their download process and ensuring they get all the files correctly.
    *   This ZIP creation feature can be easily enabled or disabled via a checkbox in the GUI or a corresponding flag in the CLI, allowing you to choose whether or not to create these archives based on your preference or the specific needs of each particular job.

*   **⚡ Efficient Multi-Core Processing (Primarily via Command-Line Interface for Now):**
    For users who leverage the Command-Line Interface (CLI) for processing, particularly for large batches of images, PhotoPackager is designed to take advantage of modern multi-core CPUs by performing image processing tasks in parallel. This capability is typically configurable via a CLI argument like `--workers N`, where `N` is the number of processor cores you wish PhotoPackager to utilize (setting `N` to `0` often means "use all available cores," while `N=1` means single-threaded).
    *   Parallel processing can significantly speed up the overall time it takes to process large photo shoots, especially those containing hundreds or thousands of high-resolution images, thereby saving you valuable production time in your workflow.
    *   The Graphical User Interface (GUI) mode, for its initial release, typically defaults to stable single-threaded processing for the core image operations. This approach is often chosen for new applications to ensure a consistently responsive and predictable user interface, especially when running on a wider range of computer hardware. Future enhancements to PhotoPackager may explore options for implementing safe and effective multi-threading for image processing within the GUI as well, where appropriate.

*   **🔔 Desktop Notifications (Optional Convenience Feature for Status Updates):**
    PhotoPackager attempts to provide native operating system desktop notifications to alert you upon the successful completion of a processing job or if a critical error is encountered that halts the process.
    *   This feature allows you to stay informed of the status of your PhotoPackager jobs without needing to constantly keep the application window in focus or monitor its progress bar. This can help you multitask more effectively while long jobs are running in the background.
    *   The availability and appearance of these notifications are optional and may depend on your operating system and whether specific third-party libraries or tools are present and correctly configured (e.g., the `win10toast-reborn` library on Windows is often used for creating non-blocking "toast" notifications that appear in the Action Center; macOS has its own native notification system that PhotoPackager might be able to leverage if properly implemented).

*   **📝 Comprehensive & Actionable Logging – Full Transparency and Detailed Diagnostics:**
    For every single processing job that PhotoPackager runs, it generates a detailed plain text log file named `photopackager_run.log`. This log file is automatically saved within that job's specific output folder (usually in the root of the folder named after your "Shoot Base Name").
    *   This log meticulously captures a wealth of information, including:
        *   All the operational parameters and settings that were used for that specific job (e.g., source/output paths, originals action, EXIF policy, formats generated, quality settings, etc.).
        *   Timestamps for various key stages of the process, which can help in understanding processing times.
        *   Counts of files found in the source, files processed, and any files that were skipped.
        *   Any warnings that were encountered during processing (e.g., files that were skipped due to being unsupported formats, or minor issues with reading EXIF data from certain files, etc.).
        *   Detailed error messages, including full Python tracebacks if a critical unhandled exception occurred that caused the job to fail.
    *   This `photopackager_run.log` file is an invaluable resource for:
        *   **Troubleshooting:** It's the very first place you should look if a job fails or produces unexpected results, as it often contains the precise error message or other clues needed to diagnose the root cause of the problem.
        *   **Record-Keeping:** It serves as a permanent and precise record of how each particular photo shoot was processed and which settings were applied. This can be very useful for future reference, for ensuring consistency if you need to re-process a shoot, or if a client has questions later about their delivery.
        *   **Understanding Processing Details:** It allows you to gain insight into exact file counts, processing timings for different stages (which can help identify bottlenecks if jobs are slow), and the specific actions taken by the application for each image.

---

## 💾 Installation: Get Up & Running Smoothly

PhotoPackager is designed for a straightforward setup process on both Windows and macOS. Using the pre-built packaged applications is the recommended method for most users, as it does not require any prior technical knowledge of Python or command-line tools.

### Method 1: Installing the Packaged Application (Recommended for All Users)

This method avoids the need for Python installation or manual dependency management.

#### 🪟 Windows Installation (.exe Installer)

PhotoPackager for Windows is provided as an `.exe` installer file, which will guide you through a standard software installation process.

1.  **Download the Installer:**
    *   Navigate to the [Official PhotoPackager Releases Page on GitHub](https://github.com/seagpt/PhotoPackager/releases/latest).
    *   Download the `PhotoPackager_GUI_Installer.exe` file for the latest version (or the specific version v1.0.0 for this initial launch). Save it to a convenient location on your computer, such as your `Downloads` folder.
2.  **Run the Installer Program:**
    *   Locate the downloaded `PhotoPackager_GUI_Installer.exe` file and double-click it to start the installation wizard.
    *   **Windows Defender SmartScreen Prompt (Important - Please Read):** It is common for new applications from independent developers (especially for an initial release like PhotoPackager, if it has not yet been digitally signed with an expensive Extended Validation (EV) certificate that builds widespread reputation with Microsoft) to trigger a "Windows protected your PC" SmartScreen prompt when you try to run the installer. This is a standard Windows security measure designed to protect users from potentially unrecognized software.
        *   When this blue SmartScreen prompt appears, do not immediately click the "Don't run" button. Instead, look for a small text link within the dialog that says "**More info**" and click on it.
        *   After clicking "More info," the dialog will typically expand to show more details about the application, including the application name (which should be "PhotoPackager GUI" or similar) and sometimes the publisher (if available from a standard code signing certificate, it might show "Unknown publisher" if not signed or if using a self-signed certificate for development).
        *   You should then see a new button appear, usually labeled "**Run anyway**". Click this "Run anyway" button to allow the PhotoPackager installer to proceed.
    *   Follow the on-screen instructions provided by the PhotoPackager installer wizard. This process typically involves steps like:
        *   Accepting the software license agreement (MIT License for PhotoPackager).
        *   Choosing your preferred installation location on your hard drive (the default location is usually appropriate for most users).
        *   Deciding whether to create Desktop shortcuts or Start Menu entries for easy access to the application after installation.
3.  **Launch PhotoPackager:**
    *   Once the installation process is complete, you can launch PhotoPackager. You can usually do this from your Windows Start Menu (it should be listed under recently installed programs or within its own "PhotoPackager" or "DropShock Digital" folder, depending on how the installer is configured) or by using the Desktop shortcut if one was created during the installation.

#### 🍎 macOS Installation (.dmg.zip Archive)

PhotoPackager for macOS is distributed as an Apple Disk Image (`.dmg`) file. To ensure smoother downloads from platforms like GitHub and to help prevent potential security blocks by web browsers or macOS's Gatekeeper feature that can sometimes occur with direct `.dmg` downloads, the `.dmg` file itself is packaged within a `.zip` archive.

1.  **Download and Unzip the Archive:**
    *   Go to the [Official PhotoPackager Releases Page on GitHub](https://github.com/seagpt/PhotoPackager/releases/latest).
    *   Download the `PhotoPackager_GUI.dmg.zip` file for the latest version (or version v1.0.0 for this initial launch). Save it to your `Downloads` folder or another preferred location.
    *   Once the download is complete, locate the `PhotoPackager_GUI.dmg.zip` file and double-click it. Your Mac's built-in Archive Utility (or another unzipping tool you might have, like The Unarchiver) should automatically extract its contents. This will result in a file named `PhotoPackager_GUI.dmg` appearing in the same folder.
2.  **Mount the Disk Image & Install the Application:**
    *   Double-click the extracted `PhotoPackager_GUI.dmg` file. This action will "mount" the disk image on your system, and a new Finder window should automatically open, displaying the contents of this mounted virtual disk.
    *   Inside this opened Finder window for the mounted disk image, you will typically see the `PhotoPackager_GUI.app` icon. Often, to make installation easier for users, there will also be a shortcut (an alias) to your Mac's main `/Applications` folder.
    *   To install PhotoPackager, simply **drag the `PhotoPackager_GUI.app` icon** from this window and **drop it directly into your `/Applications` folder**. (Your `/Applications` folder is usually accessible from the Finder sidebar, or you can navigate to it by selecting "Go > Applications" from the Finder menu bar at the top of your screen). This action copies the PhotoPackager application to your Mac's hard drive, which completes the installation process.
    *   After successfully copying the application to your Applications folder, you can "eject" the mounted "PhotoPackager" disk image to remove it from your Desktop and sidebar. You can do this by:
        *   Dragging its icon (which might appear on your Desktop or in the Finder sidebar) to the Trash icon in your Dock (the Trash icon will temporarily change to an Eject icon when you drag the disk image over it).
        *   Alternatively, you can find the mounted volume in the Finder sidebar, Ctrl-click (or right-click) on it, and select "Eject [Volume Name]" (e.g., "Eject PhotoPackager") from the context menu.

3.  **First Launch (Important macOS Security Step – Gatekeeper):**
    macOS includes a security feature called Gatekeeper, which is designed to help protect your Mac from malware by controlling which applications are allowed to run. When you download an application from the internet that isn't from the Mac App Store or from an Apple-notarized developer (which is common for new independent software like PhotoPackager, especially in its initial releases), Gatekeeper may prevent it from opening directly on the first attempt with a standard double-click. You will likely need to perform a one-time override to explicitly allow PhotoPackager to run:
    *   Navigate to your `/Applications` folder in Finder.
    *   Locate the `PhotoPackager_GUI.app` that you just copied there.
    *   **Right-click** (or hold the `Control` key on your keyboard and click once) on the `PhotoPackager_GUI.app` icon.
    *   A contextual menu will appear. From this menu, select the "**Open**" option. (It's important to use this "Open" option from the context menu for the very first launch, rather than just double-clicking the app icon, as this specific action often signals to Gatekeeper that you are making a conscious decision to open an app it doesn't fully recognize, and it may present you with a more permissive dialog).
    *   A dialog box may then appear with a warning message similar to: *"macOS cannot verify the developer of 'PhotoPackager_GUI.app'. Are you sure you want to open it?"* or *"PhotoPackager_GUI.app is an app downloaded from the Internet. Are you sure you want to open it?"* or even *"PhotoPackager_GUI.app cannot be opened because it is from an unidentified developer."* This type of warning is expected behavior for applications that haven't yet been notarized by Apple (a process that involves submitting the app to Apple for security scanning and receiving an electronic "notary ticket").
    *   In this warning dialog box, you should see an "**Open**" button (alongside a "Cancel" button or perhaps a button to move it to Trash). Click the "**Open**" button. This action tells macOS that you trust this specific application and wish to allow it to run on your Mac.
    *   ***Alternative Method if the "Open" button is missing or the app is still blocked by Gatekeeper:*** In some cases, especially if your Mac's Gatekeeper settings are configured to be very restrictive (e.g., "Allow apps downloaded from: App Store" only, instead of "App Store and identified developers"), the right-click > "Open" method might not directly give you an "Open" button in the warning. If this happens, or if the app is still blocked, you may need to go to your Mac's **System Settings** to grant permission:
        1.  Open **System Settings** (you can do this from the Apple menu in the top-left corner of your screen, or by clicking its icon in your Dock).
        2.  In the System Settings window, navigate to the **Privacy & Security** section (you might need to scroll down the sidebar on the left to find it).
        3.  In the Privacy & Security settings, scroll down the main panel on the right until you find the "Security" subsection (it's usually near the bottom, under headings like "Allow applications downloaded from:").
        4.  You should see a message in this area stating something like: *"PhotoPackager_GUI.app was blocked from use because it is not from an identified developer."* There should be a button next to this message labeled "**Open Anyway**". Click this "Open Anyway" button.
        5.  You will likely be prompted to enter your Mac administrator password to confirm this action and allow the application to run.
    *   This security override procedure (whether you use the right-click > "Open" method or the System Settings > "Open Anyway" method) is typically only necessary for the very *first* time you launch PhotoPackager after installing it. For all subsequent launches, you should be able to open the application by simply double-clicking its icon in your Applications folder or from an alias you might have placed in your Dock, just like any other application on your Mac.

*(Optional First-Time Studio Setup for Packaged Applications): For users of the packaged (downloaded and installed) versions of PhotoPackager, if you wish to set persistent default studio branding information (your company name, website, and email that will pre-fill the relevant fields in the GUI for the client `README.txt`), you can often do so by editing the application's user configuration file. This is typically `config/user_config.json`. On Windows, this file is usually created in a user-specific application data folder (e.g., `%APPDATA%\PhotoPackager\config\`). On macOS, it's often in `~/Library/Application Support/PhotoPackager/config/`. If `config.py` is used for some core defaults in packaged builds (less common for user-modifiable settings), it might be found alongside the main executable on Windows, or inside the `.app` bundle on macOS (to access: find `PhotoPackager_GUI.app` in Applications, right-click on it, select "Show Package Contents," then navigate to a path like `Contents/Resources/`). Modifying these configuration files sets the global defaults that appear in the GUI's branding section, though you can still override these defaults on a per-job basis directly in the GUI if needed for specific clients or projects. Using the GUI's "Save as Defaults" button (if available in the branding section) is the preferred way to manage your `user_config.json`.)*

### Method 2: Running from Source (For Developers, Advanced Users & Contributors)

If you are a developer, wish to contribute to the PhotoPackager project, want to make custom modifications beyond the standard features, or simply prefer running applications directly from their source code to have more control or see the latest unreleased changes, follow these detailed instructions:

1.  **Prerequisites (Essential Software to Install First):**
    *   **Python Interpreter:** You must have Python installed on your system. PhotoPackager is developed and tested against a specific version, which for this release is **Python 3.12.10** (or a compatible release within the 3.12.x series). If you don't have it, you can download the appropriate Python installer for your operating system from the official Python website: [python.org/downloads/](https://www.python.org/downloads/).
        *   **Important during Python Installation (especially on Windows):** Ensure that the option to "Add Python to PATH" (or similar wording like "Add Python 3.12 to PATH") is selected during the installation process. This makes it much easier to run Python and `pip` commands directly from your terminal or command prompt without needing to specify their full installation paths.
        *   After installation, verify your Python version by opening your terminal/command prompt and typing `python --version` (this often works on Windows if PATH was set correctly) or, more reliably across platforms, `python3 --version` (this is standard on macOS/Linux and often works on Windows too if Python 3 is the primary version in your PATH). The output should confirm a 3.12.x version.
    *   **`pip` (Python Package Installer):** `pip` is Python's standard package management system and is almost always included with Python installations (versions 3.4 and later). You will use `pip` to download and install PhotoPackager's external library dependencies.
        *   You can check if `pip` is available and correctly associated with your Python 3.12 installation by typing `pip --version` or `pip3 --version` (or, more explicitly, `python -m pip --version` / `python3 -m pip --version`).
        *   **Crucial Note for macOS Users:** On macOS systems, it's very important to consistently use the commands `python3` (to execute Python 3 scripts) and `pip3` (or preferably the more explicit `python3 -m pip` for installing packages) to interact with your Python 3.x installation. This is because the simpler command `python` might still refer to an older, pre-installed version of system Python 2.x (which is now deprecated and will not work with PhotoPackager). Using `python3` and `python3 -m pip` avoids these potential version conflicts.
    *   **Git (Version Control System):** You will need Git installed on your system to clone (which means to download a copy of) the PhotoPackager source code repository from its hosting location on GitHub. If you don't have Git installed, you can download it from the official Git website: [git-scm.com/downloads](https://git-scm.com/downloads). Learning basic Git commands will also be helpful if you plan to contribute or keep your local source code updated with changes from the main repository.

2.  **Get the PhotoPackager Source Code from GitHub:**
    Open your system's terminal or command prompt application. Navigate (using the `cd` command, which stands for "change directory") to the parent directory on your computer where you would like to store the PhotoPackager project files (e.g., a `Projects` or `Development` folder in your user directory). Once you are in your desired parent directory, clone the PhotoPackager repository from GitHub using the following `git clone` command:
    ```bash
    git clone https://github.com/seagpt/PhotoPackager.git
    ```
    This command will connect to GitHub, download all the project's source code files, history, and branches, and create a new folder in your current location named `PhotoPackager`. After the cloning process is complete (it might take a few moments depending on your internet speed and repository size), navigate into this newly created project directory:
    ```bash
    cd PhotoPackager
    ```
    You are now in the root directory of the PhotoPackager project, where you'll find files like `app.py`, `requirements.txt`, etc.

3.  **Set Up a Python Virtual Environment (Highly Recommended Best Practice for All Python Projects):**
    It is strongly recommended as a best practice in Python development to create an isolated Python virtual environment for each project you work on. A virtual environment allows you to manage a project's specific dependencies (the external libraries it needs, like PySide6 and Pillow for PhotoPackager, and their specific versions) without causing conflicts with other Python projects on your system or with your global Python installation. This ensures that PhotoPackager runs with the exact library versions it was tested with.
    *   From within the root `PhotoPackager` directory in your terminal (where you just `cd`'d into), run the following command to create a new virtual environment. You can name your virtual environment folder something descriptive, like `venv_photopackager`, `venv_pp_dev`, or simply `venv` (which is a very common convention):
        *   **For macOS / Linux:**
            ```bash
            python3 -m venv venv_photopackager 
            ```
        *   **For Windows (using either Command Prompt or PowerShell):**
            ```bash
            python -m venv venv_photopackager
            ```
    *   Once the virtual environment has been created (you'll see a new folder with the name you chose, e.g., `venv_photopackager`, appear in your project directory), you need to **activate** it. The activation command differs slightly depending on your operating system and the shell you are using:
        *   **macOS / Linux (if you are using the Bash or Zsh shell, which are common defaults):**
            ```bash
            source venv_photopackager/bin/activate
            ```
        *   **Windows (if you are using the standard Command Prompt - `cmd.exe`):**
            ```bash
            venv_photopackager\Scripts\activate.bat
            ```
        *   **Windows (if you are using PowerShell):**
            ```bash
            .\venv_photopackager\Scripts\Activate.ps1
            ```
            *(Note for PowerShell users: If you encounter an error message about script execution being disabled on your system when trying to run the `Activate.ps1` script, you might need to run the following command in that same PowerShell window first. This command changes the execution policy for the current process only, allowing the activation script to run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`)*
    *   After successful activation, your terminal prompt should change. It will typically be prefixed with the name of your virtual environment in parentheses, for example: `(venv_photopackager) YourUser@YourComputer:~/Projects/PhotoPackager$`. This visual cue indicates that the virtual environment is now active. From this point on, any Python packages you install using `pip` will be installed into this isolated environment (inside the `venv_photopackager` folder), and when you run Python scripts from this terminal session, they will use the Python interpreter and packages from this environment, not your global Python installation.

4.  **Install Required Python Dependencies into the Virtual Environment:**
    With your virtual environment now active, you need to install all the external Python libraries that PhotoPackager depends on to run correctly. These dependencies (and their specific versions) are listed in a file named `requirements.txt`, which is located in the root directory of the PhotoPackager project.
    *   Use the following command to install these dependencies using `pip`. It's good practice, especially on macOS and Linux, to use the `python3 -m pip` form to ensure you are using the `pip` that corresponds to your active Python 3 interpreter within the virtual environment:
        ```bash
        python3 -m pip install -r requirements.txt
        ```
    *   On Windows, if `python3` is not directly mapped as your Python 3.12 command, and the virtual environment's `python` command is preferred (which it usually is once the venv is active), you might use:
        ```bash
        python -m pip install -r requirements.txt
        ```
        *(Alternatively, if `pip` is correctly aliased by your active virtual environment (which it usually should be), you might simply be able to use the shorter command: `pip install -r requirements.txt`)*
    This command will read the `requirements.txt` file line by line and instruct `pip` to download and install each listed package (such as PySide6 for the GUI, Pillow for image processing, and any others) and their own sub-dependencies into your currently active virtual environment. This process might take a few minutes to complete, depending on the number of dependencies and your internet connection speed. You should see output in your terminal indicating the progress of downloads and installations.
    *   **Regarding Optional Dependencies:** Some specialized features of PhotoPackager might rely on "optional" dependencies – libraries that are not included in the main `requirements.txt` file in order to keep the core installation leaner for users who don't need those specific features. If such features exist (for example, certain advanced EXIF metadata manipulation options might require the `piexif` library, or non-blocking desktop notifications on Windows might use `win10toast-reborn`), they would typically be documented alongside the feature description in this README or other project documentation. If you intend to use such a feature when running from source, you would need to install that optional library separately into your virtual environment using a command like:
        ```bash
        # Example: Installing piexif, if it's used for certain EXIF policies and managed as an optional dependency
        python3 -m pip install piexif
        # Example: Installing win10toast-reborn for Windows toast notifications, if optional for source runs
        # python3 -m pip install win10toast-reborn
        ```
        (Always check the "Key Features" section or specific feature documentation within this README to see if any functionalities you plan to use mention such optional dependencies that you might need to install manually when running from source. Pre-built packaged versions should already include all necessary libraries for their advertised features.)

5.  **Configure PhotoPackager (Optional but Recommended for Setting Your Default Preferences):**
    Before running the application for the first time from the source code, it's a good idea to review and potentially edit the application's configuration files. As detailed in the "Configuration & Advanced Branding" section (later in this README), PhotoPackager likely uses a layered system for its settings, possibly involving:
    *   `config/config.json`: This file (likely located in a `config/` subdirectory within the project when running from source) would contain application-shipped default settings. You generally shouldn't edit this directly if you are just a user running from source, but developers might modify it for core changes.
    *   `config/user_config.json`: This is where your personal, persistent overrides would ideally be stored. When running from source for the first time, this file might not exist yet in its user-specific application data directory (see the Configuration section for typical paths). PhotoPackager might create it in that standard user location upon first run or when you first use a feature in the GUI that explicitly saves defaults (like a "Save as Defaults" button in the Delivery Branding section). If you want to pre-configure defaults by editing a file before the very first run from source, you might need to check if a template for a `user_config.json` is provided in the source's `config/` directory that you could copy to the user data location, or you'd need to understand its expected JSON structure to create one manually there.
    *   `config.py`: This file, if present in the project root or a core module when running from source, might still define some fundamental application constants, developer information, or serve as an ultimate fallback if JSON configurations are missing or corrupted.
    Editing these configuration mechanisms (primarily by ensuring your `user_config.json` in the appropriate user data directory contains your preferences, or by modifying parts of `config.py` if it's intended for user defaults when running from source) allows you to customize various default settings. This includes your default studio branding information (company name, website, support email) that will pre-fill in the GUI and be used for the client `README.txt` files, default image processing parameters (e.g., JPEG/WebP quality levels, default resizing targets for compressed images), default choices for operational options like "Originals Handling" and "EXIF Policy," and whether to create ZIP archives by default. You can also often customize the default names for the output folders via these configuration files. Setting up your common preferences in the configuration will save you time when using the GUI or CLI for each job, as these will be your pre-filled or default settings.

6.  **Run the PhotoPackager GUI Application from Source Code:**
    Once your virtual environment is active and all dependencies are installed (and you've optionally configured your defaults), you are ready to run the PhotoPackager application. Ensure you are still in the PhotoPackager project's root directory in your terminal. The main entry point script for launching the Graphical User Interface (GUI) application is typically `app.py`.
    *   **For macOS / Linux (or Windows if `python3` is your specific command for your Python 3.12 environment):**
        ```bash
        python3 app.py
        ```
    *   **For Windows (if `python` is your command for your Python 3.12 environment, which is especially common when a virtual environment is active and has correctly set up the `python` alias):**
        ```bash
        python app.py
        ```
    *   **For GUI Development or Debugging (Optional Flag):** If PhotoPackager has been implemented to support it, running the `app.py` script with a Qt debugging flag can provide more verbose output related to the Qt framework and its operations. This can be very helpful if you are actively working on the GUI components or trying to troubleshoot UI-related issues. The flag might be something like `--debug_qt`:
        ```bash
        # Example:
        python3 app.py --debug_qt
        ```
        (You would need to check if this `--debug_qt` flag or a similar one is actually implemented in `app.py` by looking at its argument parsing or by trying `python3 app.py --help` to see if such general options are listed).

7.  **Run the PhotoPackager CLI (Command-Line Interface) from Source Code:**
    Similarly, to use the Command-Line Interface, ensure your virtual environment is active and that you are in the PhotoPackager project's root directory. The entry point for the CLI is also typically handled through the main `app.py` script, usually by passing it a specific `cli` subcommand.
    *   **For macOS / Linux:**
        ```bash
        python3 app.py cli --source /path/to/your/shoot/images --output /path/to/deliveries_parent_folder [additional_options...]
        ```
    *   **For Windows:**
        ```bash
        python app.py cli --source C:\Path\To\Your\Shoot\Images --output D:\Path\To\Deliveries_Parent_Folder [additional_options...]
        ```
    *   To see a full list of all available CLI options and arguments for the `cli` subcommand, along with their detailed descriptions and how to use them, run the help command:
        ```bash
        python3 app.py cli --help
        ```
        This is an essential command to run to familiarize yourself with all the capabilities and arguments of the PhotoPackager CLI before attempting to use it for actual processing jobs.

### Quick Start for Developers (macOS/Linux Example)

For experienced Python developers who want to quickly get the PhotoPackager source code up and running on a macOS or Linux system:

1.  Clone the repository from GitHub and navigate into the project directory:
    ```bash
    git clone https://github.com/seagpt/PhotoPackager.git && cd PhotoPackager
    ```
2.  Create and activate a Python 3.12.x virtual environment (you can choose your preferred venv name):
    ```bash
    python3 -m venv venv_pp_dev  # Or your preferred venv name, e.g., venv_photopackager
    source venv_pp_dev/bin/activate
    ```
3.  Install all required Python dependencies from the `requirements.txt` file:
    ```bash
    python3 -m pip install -r requirements.txt
    ```
4.  (Optional but Recommended) Review and edit the application's configuration files (e.g., `config/user_config.json` for user preferences, or relevant sections in `config.py` if it handles some core defaults) to customize your default settings and branding.
5.  Run the GUI application:
    ```bash
    python3 app.py
    ```
    Or, for GUI development, if a Qt debug flag is supported by `app.py` (check `app.py --help` or its code):
    ```bash
    # python3 app.py --debug_qt
    ```
6.  Explore Command-Line Interface (CLI) options and functionality:
    ```bash
    python3 app.py cli --help
    ```
    Then, try a dry run with some test images to see it in action without modifying any files:
    ```bash
    python3 app.py cli --source path/to/your/test_images --output path/to/your/test_output --dry-run --verbose
    ```

---

## 🖱️ Usage: GUI Walkthrough – Effortless Photo Packaging

The PhotoPackager Graphical User Interface (GUI) is designed for an intuitive and straightforward user experience. It guides you through a logical step-by-step process to configure and execute your photo packaging jobs effectively, even with its powerful underlying capabilities.

1.  **Launch Application:**
    Start PhotoPackager using the method appropriate for your installation:
    *   If you installed a pre-built packaged version, launch it from your Applications folder (macOS) or your Windows Start Menu/Desktop shortcut.
    *   If you are running from the source code, ensure your Python virtual environment is active and then run `python3 app.py` (or `python app.py` for Windows if `python` maps to your Python 3.12 environment) from the project's root directory in your terminal.

2.  **📁 Step 1: Select Source Images Folder**
    *   In the GUI, you will find an input field or section clearly labeled "Source Images Folder" (or a similar descriptive term).
    *   Click the corresponding **"Browse..."** button.
    *   A system file dialog window will open. Use this dialog to navigate your computer's file system (your hard drives, external drives, etc.) and select the single main folder that contains all the original image files for the *one specific photo shoot* you intend to process in this particular job.
    *   **Purpose:** This selected folder serves as the root directory from which PhotoPackager will read all your source image files for the current processing job. The application will typically scan this folder (and its subfolders, if subfolder scanning is a supported feature and enabled in your settings) to find all the images to be included in the packaging process.

3.  **📂 Step 2: Select Output Parent Folder**
    *   Next, find the input field or section in the GUI labeled "Output Parent Folder" (or similar, like "Main Output Location").
    *   Click the corresponding **"Browse..."** button.
    *   Again, a system file dialog will appear. Use this to choose the main directory on your computer where PhotoPackager should create a *new, uniquely named subfolder*. This subfolder will be the container for all the final packaged output for this specific shoot.
    *   **Purpose:** This is the primary destination for all the processed files, the organized folder structures, any generated log files, and the client `README.txt` that PhotoPackager creates for this particular job. PhotoPackager will automatically create a new subfolder within this selected parent folder, and that subfolder will be named based on the "Shoot Base Name" that you will provide in the next step.

4.  **🏷️ Step 3: Enter Shoot Base Name**
    *   Locate the text input field in the GUI clearly labeled "Shoot Base Name" (or a similar term like "Project Name" or "Shoot Identifier").
    *   In this field, carefully type a descriptive and unique name for this specific photo shoot. This name should be meaningful to you and easily identifiable by your client if they see it.
    *   **Good Examples of Shoot Base Names:** `Johnson_Family_Fall_Portraits_2025`, `AcmeCorp_Annual_Gala_Event_May2025`, `Wildlife_Safari_Kenya_Selection_Day03`, `Studio_Corporate_Headshots_Q2_2025_Batch1`.
    *   **Purpose:** This "Shoot Base Name" is a very important piece of information that PhotoPackager uses in two key ways:
        1.  It will form the name of the main output folder that PhotoPackager creates for this job (e.g., if your selected "Output Parent Folder" is `/Client_Deliveries/` and your "Shoot Base Name" is `ClientX_Event_Photos`, then the final output for this job will be placed into a new folder located at `/Client_Deliveries/ClientX_Event_Photos/`).
        2.  It will serve as the core part (the descriptive middle section) of the filename for all the sequentially renamed image files that PhotoPackager generates (e.g., `001-ClientX_Event_Photos.jpg`, `002-ClientX_Event_Photos.webp`, etc.).
    *   **Tip for Naming:** Use clear, descriptive names that will help you and your clients easily identify different shoots or projects. It's generally best practice to stick to alphanumeric characters (letters A-Z, a-z, and numbers 0-9), underscores (`_`), and hyphens (`-`) in your Shoot Base Name. Avoid using spaces or special characters (such as `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) as these can sometimes cause issues with file and folder naming across different operating systems or when transferring files over networks or to different file systems.

5.  **🛠️ Step 4: Configure Processing Options (Main Settings Panel / Tabs)**
    This is where you define exactly *how* your images will be processed and packaged by PhotoPackager. These options are typically found in a main settings panel in the GUI, possibly organized into logical sections or tabs for clarity. Review each option carefully for every job to ensure it matches your specific requirements for that delivery.
    *   **Originals Handling (Dropdown Menu):**
        From the dropdown menu provided for this option, choose how PhotoPackager should manage your original source image files during this job:
        *   `Copy` (This is usually the Default setting and is always the Safest Choice for your data): PhotoPackager will make exact duplicates (copies) of your original files and place these copies into an `Export Originals` folder (or your customized name for it, as set in your configuration) within the final output package. Your original source files on your computer will remain completely untouched and secure in their original location. This is the highly recommended option for most workflows to ensure data integrity.
        *   `Move` (**HIGH RISK! This option is destructive to your source files. Use with extreme caution and only if you have multiple, verified, independent backups of your source files!**): If you select the "Move" option, PhotoPackager will physically move your original files from their source location on your computer to the `Export Originals` folder in the output package. This means that after the move is successful for each file, the original file will be *deleted* from their starting source path. This is a destructive operation and carries significant risk if anything goes wrong during the process or if your backups are not sound or up-to-date.
        *   `Leave`: If you choose the "Leave" option, your original image files will be left completely untouched and unaltered in their original source folder. No copies or moves of these original files will be made into the `Export Originals` folder as part of the PhotoPackager output package. This option can be useful if your originals are already securely archived or managed through a separate digital asset management (DAM) system, and you only need PhotoPackager to generate the processed (Optimized/Compressed) versions for delivery purposes.
        *   `Skip Export`: If you select "Skip Export," PhotoPackager will ignore your original files entirely during its processing for this particular job. Consequently, no `Export Originals` folder (or your custom equivalent name for it) will be created in the output package. This option is useful if you only need to generate and deliver the "Optimized" and/or "Compressed" versions for a specific purpose (e.g., for a web-only delivery or for creating a set of proofs) and do not need or want to include the full-resolution originals in that particular delivery package.
    *   **EXIF Policy (Dropdown Menu):**
        From the dropdown menu for EXIF Policy, select how EXIF (Exchangeable Image File Format) metadata should be handled for the *generated* image files (i.e., this applies to the "Optimized" and "Compressed" versions that PhotoPackager creates; this setting does not affect your original files if they are merely being copied or left untouched).
        *   `Keep` (This is usually the Default setting): All EXIF metadata from the original image file will be preserved and embedded in the processed (Optimized and Compressed) versions.
        *   `Strip All`: If this option is chosen, all EXIF data will be completely removed from the generated Optimized and Compressed images. This can be useful for several reasons, such as maximizing client privacy (e.g., by removing GPS location data, detailed camera settings, or photographer notes from the files), achieving the absolute smallest possible output file sizes (as EXIF data, while usually small, can sometimes add a few kilobytes or more to each file), or for specific publishing platforms that require images with no embedded metadata. (If the optional `piexif` library is not available when running from source and this fallback is implemented, other selective removal options below might default to this "Strip All" behavior).
        *   Specific Stripping Options (e.g., `Date Only`, `Camera Only`, `Date & Camera`): PhotoPackager may offer more granular options to selectively remove only certain categories of EXIF tags. For example, `Date Only` might remove just date and time-related EXIF tags, while `Camera Only` might remove tags related to the camera make/model and lens information, while other metadata (like copyright or image description) might be preserved. (Note: These more granular EXIF manipulation features often depend on the optional `piexif` Python library to be available. If you are running PhotoPackager from its source code and these specific options are greyed out, not available, or cause errors, you may need to install `piexif` into your Python virtual environment. Pre-built packaged versions of PhotoPackager should already include this library if these features are advertised as active and enabled for that release).
    *   **Output Formats (Checkboxes, typically organized in sections for "Optimized Files" & "Compressed Files"):**
        You can choose which image formats (commonly JPEG and/or WebP) you want PhotoPackager to generate for each processing category:
        *   For the "Optimized Files" category: Check the box ✅ `Generate JPGs` if you want PhotoPackager to create high-quality JPEG files. Check the box ✅ `Generate WebPs` if you want PhotoPackager to create high-quality WebP files. You can typically select both formats, just one, or neither if you don't need optimized files in a particular format for this job.
        *   For the "Compressed Files" category: Similarly, check the box ✅ `Generate JPGs` and/or ✅ `Generate WebPs` if you need smaller, web-friendly previews or email attachments in these formats. Uncheck if a particular format is not needed in the Compressed category for this job.
    *   **Processing Controls (Checkboxes):**
        *   ✅ `Skip Compressed Versions`: If this box is checked, PhotoPackager will *not* generate the "Compressed Files" category at all, regardless of whether you have selected JPG or WebP for compressed files above. Uncheck this box if you *do* want PhotoPackager to create those smaller, resized preview images for this delivery.
        *   ✅ `Create ZIP Archives`: If this box is checked, PhotoPackager will automatically create separate `.zip` files for each main output category that actually contains files (e.g., `Export Originals.zip`, `Optimized Files.zip`, `Compressed Files.zip`). These ZIP files will be placed in the root of your final output folder for this job and are very convenient for preparing your files for client delivery via download or transfer.
    *   **🧠 Dry Run Mode (Checkbox – This is a VERY IMPORTANT feature for testing and ensuring operational safety):**
        *   ✅ `Perform Dry Run (Simulate, No Changes)`: **It is STRONGLY and REPEATEDLY recommended that you check this box** for your first few runs with PhotoPackager, any time you are testing new configurations or settings, or especially before processing irreplaceable client work, and *most definitely* before ever considering the use of the `Move` originals option.
        *   When Dry Run mode is active, PhotoPackager will go through all the motions of a normal processing job – it will scan your source files, determine how they would be renamed based on your "Shoot Base Name," simulate the image processing steps (but without actually manipulating any image data or writing any new image files to disk), and simulate the packaging process. It will output detailed logs of all these *planned* actions to the Log Area within the GUI and also to the `photopackager_run.log` file that it creates (even on a dry run, the log file is usually generated). **However, absolutely NO actual files will be created, moved, modified, or deleted on your computer's file system during a Dry Run.**
        *   After a Dry Run completes, carefully review the log output (both in the GUI and in the `photopackager_run.log` file) to ensure that the planned actions, the number of files that would be processed, the proposed renaming scheme, and the intended output folder structure are exactly what you want and expect *before* you uncheck this Dry Run box and run a live, productive job that actually modifies your file system. This Dry Run feature is your most important safety net for preventing accidental mistakes and for building confidence in your settings.

6.  **🏢 Step 5: Set Delivery Branding (Client README Customization Panel / Section):**
    This section of the GUI allows you to customize the information that will appear in the `README.txt` file. This `README.txt` is automatically generated by PhotoPackager and included in your client's final delivery package. This is your prime opportunity to reinforce your brand and provide helpful contact information directly to your client.
    *   **Your Company Name:** Enter the name of your photography studio, your creative agency, or your professional name if you operate as an individual photographer.
    *   **Your Website:** Enter your primary professional website URL (e.g., `https://www.yourstudioname.com`). It's best to include the full URL (e.g., with `http://` or `https://`).
    *   **Your Support Email:** Enter the email address that your clients should use if they have questions about their photos or need to contact you for support or future bookings.
    *   **Note on Defaults & Saving:** These input fields in the GUI will typically pre-fill with the default values that you have set in your PhotoPackager user configuration file (e.g., `config/user_config.json`). If a "Save as Defaults" button is provided in this section of the GUI (as it often is), clicking it after you've entered your desired branding information will update your `user_config.json` file, so these new values become your persistent defaults for future jobs. Even if defaults are set, the GUI always allows you to easily override these pre-filled values here on a per-job basis. This is very useful if you are working for different clients who require specific branding, if you operate under multiple brand names, or if you need to provide different contact details for a particular project.

7.  **▶️ Step 6: Start Processing – Initiate the Actual Job:**
    *   Once you have meticulously reviewed all your settings in the GUI, are completely confident with your choices, and (ideally) have performed one or more successful Dry Runs to verify the intended actions and outputs, you are ready to start the actual processing job.
    *   Click the prominent **"Start Processing"** button (or a similarly labeled button like "Run Job," "Execute Process," etc. – the exact wording might vary slightly depending on the UI design).

8.  **📊 Step 7: Monitor Progress – See PhotoPackager at Work in Real-Time:**
    Once you click "Start Processing," the PhotoPackager application will begin its work and will provide you with real-time feedback on its progress so you know what's happening:
    *   **Status Label (Usually located at the bottom or sometimes the top of the main application window):** This text label will update dynamically throughout the entire processing job. It will show messages indicating the current stage, such as: "Idle" (before starting), "Validating Inputs...", "Scanning Source Files (Found X images)...", "Processing Images (Image Y of X)...", "Creating Optimized JPGs...", "Resizing for Compressed WebPs...", "Archiving Optimized Files into ZIP...", and finally, a clear message like "Done! Processing complete." or, if a problem occurs that forces the job to stop, "Error! See log for details."
    *   **Progress Bar (Typically displayed alongside or near the Status Label):** This visual bar will provide an indication of the overall job completion percentage. For very large jobs that might take some time, the progress bar gives you a useful idea of how much longer the process is likely to take. It might show overall progress for the entire job, or it could update to show progress for specific major stages like image processing or ZIP archive creation.
    *   **Log Area (The main scrollable text box within the GUI window):** This is your most detailed, real-time window into exactly what PhotoPackager is doing at every moment. It displays a continuous stream of log messages about each step of the process, including:
        *   Information about files being scanned and identified from your source folder.
        *   Messages indicating which specific images are currently being processed (e.g., "Processing: DSC_0123.JPG...").
        *   Confirmation of successful operations (e.g., "Successfully SAVED Optimized file: 001_MyShootName.jpg").
        *   Any warnings that PhotoPackager encounters during the job (e.g., "Skipping unsupported file type: Thumbs.db", "Warning: EXIF data not found for image [filename], cannot preserve.").
        *   Any critical errors that occur, often with technical details or Python tracebacks that can help diagnose the problem if the job fails.
        This detailed log output in the GUI is invaluable for understanding the entire process from start to finish and for diagnosing any issues or unexpected behavior if they arise during the job.

9.  **🏁 Step 8: Review Your Professionally Packaged Output – The Final Product:**
    *   Once the Status Label in the PhotoPackager GUI clearly indicates "Done! Processing complete." (or a similar success message), the packaging job is finished.
    *   Now, navigate to the "Output Parent Folder" that you selected back in Step 2 of the GUI setup. You can do this using your computer's standard file explorer application (Finder on macOS, or File Explorer on Windows).
    *   Inside this parent output folder, you will find a **new folder**. This new folder will be named exactly after the "Shoot Base Name" that you provided in Step 3. This newly created folder is your complete, professionally packaged photo shoot, ready for your review and then delivery to your client.
    *   Open this shoot-specific folder. Inside, you'll typically find the following neatly organized output structure (the exact contents and folder names will depend on the specific options you selected in Step 4, and any customizations you've made to folder names in your `config` files):
        *   An `Export Originals` folder (this will be present if you did not choose to skip exporting originals, and if you selected either "Copy" or "Move" for the originals handling option). This folder contains your full-resolution original files.
        *   An `Optimized Files` folder (this folder will contain subfolders such as `Optimized JPGs` and/or `Optimized WebPs`, if you chose to generate these formats in the "Optimized" category). This contains your high-quality, moderately sized images.
        *   A `Compressed Files` folder (this folder will contain subfolders such as `Compressed JPGs` and/or `Compressed WebPs`, if you chose to generate these formats and did *not* check the "Skip Compressed Versions" option). This contains your smaller, web-ready preview images.
        *   The client-facing `README.txt` file, personalized with your delivery branding information. This file usually provides an overview of the package contents for your client and includes your contact details.
        *   A detailed `photopackager_run.log` file. This is a plain text log file containing a comprehensive record of the entire processing job that just completed, including all the settings that were used, a list of files processed, processing timings, any warnings that occurred, and any errors. Keep this for your records and for troubleshooting if needed.
        *   The `.zip` archives (e.g., `Optimized Files.zip`, `Compressed Files.zip`, `Export Originals.zip`), if you had enabled the "Create ZIP Archives" option in the GUI. These are ready for easy uploading or transfer.
    *   **Final Step Before Delivery:** It is highly recommended that you thoroughly inspect the contents of all these folders and the `README.txt` file yourself before delivering the package to your client. Open some sample images from each category to ensure the quality meets your standards, check that files are correctly named and organized as you expected, and read through the `README.txt` to make sure your branding is correct. Once you are satisfied, your package is ready for delivery to your client.

---

## ⌨️ Usage: CLI Reference – Automation & Power User Control

For advanced users, scripting, and integrating PhotoPackager into automated workflows, the Command-Line Interface (CLI) offers full control over all processing parameters. The CLI is accessed as a subcommand of the main application entry point (e.g., `app.py` if running from source, or the name of your packaged executable).

**Accessing the CLI:**
Open your terminal (macOS/Linux) or command prompt/PowerShell (Windows). Navigate to the PhotoPackager project's root directory if running from source, ensuring your Python virtual environment is active. If using a packaged version, you might need to navigate to its installation directory or ensure it's in your system's PATH to call it directly by name.

**Basic Syntax:**
```bash
# If running from source (macOS/Linux example):
python3 app.py cli --source <full_path_to_source_folder> --output <full_path_to_output_parent> [OPTIONS...]

# If running a packaged executable (example for Windows, actual name may vary):
# PhotoPackager_GUI.exe cli --source C:\Path\To\Source --output D:\Path\To\Parent [OPTIONS...]
```

**Required Arguments for the `cli` subcommand:**

*   `--source SOURCE_PATH`, `-s SOURCE_PATH`
    *(Required)* Full path to the folder containing the source images for the shoot.
*   `--output OUTPUT_PARENT_PATH`, `-o OUTPUT_PARENT_PATH`
    *(Required)* Full path to the parent directory where the packaged output folder (named by `--base-name`) will be created.

**Key Options & Arguments for the `cli` subcommand (Always run `python3 app.py cli --help` or `YourExecutableName cli --help` for the complete and most current list for your version):**

*   `--base-name SHOOT_BASE_NAME`, `-bn SHOOT_BASE_NAME`: Sets the name for the main output folder and the prefix for renamed files. If omitted, PhotoPackager usually defaults to using the name of the source folder.
*   `--originals-action {copy,move,leave,skip_export}`: Defines how original source files are handled. The default is typically `copy` (as set in your configuration files). **🛑 REMINDER: The `--originals-action move` option is a DESTRUCTIVE operation that will delete source files after they are successfully moved. Use this option with EXTREME CAUTION and only after verifying that you have reliable, independent backups of your source files. Always test this thoroughly with the `--dry-run` flag first, using non-critical data.**
*   `--exif-policy {keep,strip_all,date,camera,both}`: Specifies EXIF metadata handling for *generated* (Optimized and Compressed) images. The default is typically `keep` (as set in your configuration files).
*   **Image Format Toggles:** A series of flags to enable or disable JPEG and/or WebP generation for the "Optimized" and "Compressed" categories (e.g., `--no-jpgs-optimized`, `--create-webp-compressed`). These command-line flags will override any default settings from your configuration files for the current job. Please consult the output of `cli --help` for the exact flag names available in your version.
*   `--skip-compressed-versions` (or a similar flag name): If this flag is used in your command, PhotoPackager will entirely skip the generation of all "Compressed" image versions for this particular job.
*   `--no-skip-compressed-versions` (or a similar positive action flag): Use this flag if you want to explicitly ensure that compressed versions *are* generated for this job, which can override a default configuration setting that might be set to skip them.
*   `--create-zip-archives` (or a similar flag name): This flag forces PhotoPackager to create `.zip` archives for the main output categories (`Export Originals`, `Optimized Files`, `Compressed Files`) that contain files after processing.
*   `--no-zip-archives` (or a similar flag name): This flag explicitly disables the creation of all `.zip` archives for this particular run, even if your configuration files are set to create ZIPs by default.
*   `--workers N`, `-w N`: This option specifies the number of parallel worker processes (which usually corresponds to CPU cores) that PhotoPackager should attempt to use for its image processing tasks when running via the CLI. `N` should be an integer. Using `N=0` (which is often the default setting from the configuration) typically instructs PhotoPackager to attempt to use all available system CPU cores, which can significantly speed up processing on multi-core machines, especially for large jobs. To run PhotoPackager in a strictly sequential (single-threaded) mode (which is similar to how the GUI currently processes images, often chosen for maximum stability or easier debugging), use `--workers 1`. This can also be useful in resource-constrained environments.
*   `--dry-run`, `-dr`: **THIS IS A CRUCIAL FLAG FOR TESTING AND SAFETY!** When the `--dry-run` flag is included in your command, PhotoPackager will simulate its entire processing workflow (it will scan files, determine renaming, log "processing" steps, and log "packaging") *without actually modifying, creating, or moving any files on your computer's file system*. It will output a detailed log to your console (terminal window) and also to the `photopackager_run.log` file, indicating exactly what actions *would* have been taken. **It is STRONGLY recommended that you use the `--dry-run` flag to test ALL your CLI commands and configurations thoroughly, especially complex ones or any command involving potentially destructive actions like `--originals-action move`, before you ever execute them on live, valuable production data.**
*   `--verbose`, `-v`: This flag increases the verbosity level of the log output that PhotoPackager produces, both to the console during CLI execution and to the `photopackager_run.log` file. When `--verbose` mode is active, PhotoPackager will provide much more detailed step-by-step information during its processing stages. This can be very helpful for debugging issues, for understanding exactly what the application is doing at each stage of a complex job, or for very precise monitoring of long-running processes.

**Delivery Branding Arguments (for customizing the client `README.txt` via CLI):**
These allow you to override default branding from configuration files for a specific job:
*   `--delivery-company "Your Photography Business Name"`
*   `--delivery-website "https://www.yourbusinesswebsite.com"`
*   `--delivery-email "contact@yourbusinesswebsite.com"`

**Getting Comprehensive CLI Help:**
To display the full list of all available arguments for the `cli` subcommand, their detailed descriptions, current default values (which are influenced by your configuration files), and expected argument types, run:
```bash
# If running from source:
python3 app.py cli --help

# If using a packaged executable (example for Windows, adapt for your OS/executable name):
# PhotoPackager_GUI.exe cli --help
```
Review this help output carefully to understand all available controls for your specific version of PhotoPackager.

**Example CLI Usage Scenarios:**

1.  **Critical First Step: Thorough Dry Run Test with Verbose Output:**
    Before any live processing, *always* test your intended command with `--dry-run` and `--verbose`.
    ```bash
    python3 app.py cli \
      --source "./My_Photo_Shoots/Johnson_Family_Reunion_2025/Final_Picks_RAW" \
      --output "./Client_Outputs/Johnson_Family_Reunion" \
      --base-name "Johnson_Family_Reunion_2025_Digital_Package" \
      --originals-action copy \
      --create-jpgs-optimized --create-webp-optimized \
      --create-jpgs-compressed --target-pixels-compressed 3000000 \
      --create-zip-archives \
      --workers 0 \
      --delivery-company "Timeless Images Photography" \
      --delivery-website "https://timelessimages.example.com" \
      --delivery-email "bookings@timelessimages.example.com" \
      --dry-run \
      --verbose
    ```
    *After running this, carefully review the console output and the `photopackager_run.log` (found in the target output location, even on a dry run) to ensure all planned actions are as expected.*

2.  **Standard Production Processing Job (to be run *after* a successful and verified dry run):**
    To perform the actual processing, remove the `--dry-run` flag from the command you thoroughly tested above. All other arguments should remain the same.
    ```bash
    python3 app.py cli \
      --source "./My_Photo_Shoots/Johnson_Family_Reunion_2025/Final_Picks_RAW" \
      --output "./Client_Outputs/Johnson_Family_Reunion" \
      --base-name "Johnson_Family_Reunion_2025_Digital_Package" \
      --originals-action copy \
      --create-jpgs-optimized --create-webp-optimized \
      --create-jpgs-compressed --target-pixels-compressed 3000000 \
      --create-zip-archives \
      --workers 0 \
      --delivery-company "Timeless Images Photography" \
      --delivery-website "https://timelessimages.example.com" \
      --delivery-email "bookings@timelessimages.example.com" \
      --verbose
    ```

3.  **Example of a High-Risk Operation: Using `move` for Originals (🛑 Ensure Backups! Test Exhaustively with Dry Run First!):**
    **WARNING: The `--originals-action move` flag IS DESTRUCTIVE and will PERMANENTLY move files from your source. VERIFY YOUR BACKUPS ARE COMPLETE AND RESTORABLE BEFORE EVEN TESTING THIS WITH DRY RUN on non-critical data.**
    ```bash
    # ALWAYS START WITH --dry-run --verbose FOR SUCH OPERATIONS:
    python3 app.py cli \
      --source "/Volumes/ScratchDisk/Old_Shoots_For_Archive/Project_XYZ_Source" \
      --output "/Volumes/MainArchive/Archived_Client_Work/Project_XYZ" \
      --base-name "Project_XYZ_Archival_Package_Moved" \
      --originals-action move \
      --exif-policy keep \ # Keep EXIF for archive in this example
      --skip-compressed-versions \ # No compressed needed for archive
      --no-zip-archives \ # Archiving system handles zipping later
      --delivery-company "Archive Master Inc." \
      --dry-run \
      --verbose
    #
    # Remove the --dry-run flag from the command above ONLY when you are 1000% certain of its effects,
    # have reviewed the dry run log, and have confirmed your source file backups are absolutely sound.
    #
    ```

This detailed CLI reference, coupled with a strong emphasis on safe practices like always using `--dry-run` for testing, should provide users with the necessary confidence and knowledge to effectively harness the full automation power of PhotoPackager for their specific needs.

---

## ⚙️ Configuration & Advanced Branding: Tailor PhotoPackager to Your Studio

PhotoPackager uses a flexible configuration system to allow users to set persistent default preferences for how the application behaves and to fine-tune many aspects of its operation. This system primarily relies on JSON (JavaScript Object Notation) configuration files, ensuring consistency across all jobs and saving significant time on repetitive setup tasks. Some core application constants or ultimate fallbacks might also be defined in a `config.py` file within the application's internal code, but user-facing defaults are typically managed via JSON for ease of modification and persistence.

### Understanding the Configuration File System:

PhotoPackager generally employs a layered or hierarchical approach to loading its configurations. This provides a balance between sensible defaults shipped with the application, user customizations that persist across sessions, and per-job overrides for maximum flexibility:

1.  **`config/config.json` (Application-Shipped Defaults):**
    *   This file is usually bundled directly with the PhotoPackager application itself (whether it's a packaged executable or when running from source, it would likely be found in a `config/` subdirectory relative to the main application code).
    *   It contains the baseline, "factory default" settings for all processing parameters (like image quality, resizing targets), the default names for output folders, default choices for operational options (such as originals handling or ZIP creation), and default branding information.
    *   **General Users should typically NOT edit this `config/config.json` file directly.** This is because it might be overwritten or replaced during future application updates, and any custom changes made directly to this file would likely be lost. It serves as the foundational set of defaults provided by the developers.

2.  **`config/user_config.json` (User-Specific Overrides & Persistent Preferences):**
    *   This is the primary file where *your* personal, persistent preferences and default settings are stored.
    *   PhotoPackager will typically create this file automatically in a standard user-specific application data directory on your computer when you first run the application or, more specifically, when you first use a feature in the GUI that explicitly saves your defaults (such as a "Save as Defaults" button often found in the Delivery Branding section or a general application settings dialog).
    *   The exact storage location of this `user_config.json` file varies by operating system to follow platform conventions for application data:
        *   **Linux:** Often in a path like `~/.config/PhotoPackager/config/user_config.json` (where `~` represents your user's home directory).
        *   **macOS:** Often in a path like `~/Library/Application Support/PhotoPackager/config/user_config.json`.
        *   **Windows:** Often in a path like `%APPDATA%\PhotoPackager\PhotoPackager\config\user_config.json` (where `%APPDATA%` is an environment variable that typically points to your user's `AppData\Roaming` folder, e.g., `C:\Users\YourUserName\AppData\Roaming\PhotoPackager\PhotoPackager\config\user_config.json`).
        *   *(The precise path might vary slightly based on the application's specific implementation, which often uses a library like `appdirs` to determine these standard locations. If you need to find this file manually for some reason, PhotoPackager's logs or specific documentation for your version might provide the exact path it uses on your system).*
    *   When you use features in the GUI like a "Save as Defaults" button (for example, after entering your studio's branding information in the designated panel), your chosen preferences for those settings are saved into this `user_config.json` file.
    *   Settings that are defined in your `user_config.json` file will **override** any corresponding default settings that were loaded from the main application's `config/config.json` file.
    *   This `user_config.json` file is what allows your preferred settings to persist across different sessions of using PhotoPackager, so you don't have to reconfigure your common settings every time you launch the application.

3.  **`config.py` (Core Application Constants / Ultimate Fallback - If Still Utilized for Certain Non-User-Facing Settings):**
    *   While most user-configurable defaults are increasingly managed through external JSON files (for ease of modification by users and to prevent user changes from being overwritten by application updates), a `config.py` file might still exist within the application's core codebase. (This would be most apparent if you are running PhotoPackager from its source code, where it might be located in the project root or within a core module).
    *   This `config.py` file, if present and used for configuration aspects, might be used to define fundamental application constants that are not intended to be user-configurable (e.g., internal application version numbers used for display, fixed paths to resources bundled directly with the application if not handled by PyInstaller data additions, developer contact information for error reporting if hardcoded as a last resort).
    *   It could also potentially serve as an ultimate fallback mechanism for certain critical default settings if the JSON configuration files (`config.json` or `user_config.json`) are somehow missing, corrupted, or cannot be read by the application at startup. However, for settings that users are intended to customize (like default image quality, preferred output formats, or their studio branding), the JSON files (and specifically `user_config.json` for user preferences) are typically the primary and prioritized mechanism.

**Key Configurable Parameters (Examples – the actual names of the keys and the precise structure within the JSON configuration files may vary, so it's always a good idea to inspect a sample `config.json` or a generated `user_config.json` if you plan to edit it manually, though configuring through the GUI's "Save as Defaults" feature is generally preferred and safer for users):**

*   **User Branding Defaults (these populate the `README.txt` file generated for clients):**
    *   `USER_COMPANY_NAME`: Your default company or studio name (e.g., "My Awesome Photography").
    *   `USER_WEBSITE`: Your default professional website URL (e.g., "https://www.myawesomephotography.com").
    *   `USER_SUPPORT_EMAIL`: Your default support or client contact email address (e.g., "contact@myawesomephotography.com").
*   **Operational Defaults (these influence the pre-selected options in the GUI and the default behavior of CLI commands if those options are not explicitly overridden in the command itself):**
    *   `DEFAULT_ORIGINALS_ACTION`: A string value specifying the default action for original files, e.g., `"copy"`, `"move"`, `"leave"`, or `"skip_export"`.
    *   `DEFAULT_EXIF_POLICY`: A string value for the default EXIF handling, e.g., `"keep"`, `"strip_all"`, `"date"`, `"camera"`, or `"both"`.
    *   Boolean flags (which can be `true` or `false` in JSON notation) for controlling the default creation of JPEGs and/or WebPs for both Optimized and Compressed categories (e.g., a key like `DEFAULT_CREATE_JPGS_OPTIMIZED` might be set to `true` by default, while `DEFAULT_CREATE_WEBP_COMPRESSED` might be `false`).
    *   `DEFAULT_SKIP_COMPRESSED_VERSIONS`: A boolean value, e.g., `false` would mean that compressed versions are generated by default unless explicitly skipped for a job.
    *   `DEFAULT_CREATE_ZIP_ARCHIVES`: A boolean value, e.g., `true` would mean that ZIP archives are created by default unless explicitly disabled for a job.
    *   `DEFAULT_CLI_WORKERS`: An integer value. For example, `0` often means that PhotoPackager will attempt to use all available system CPU cores for CLI processing by default. You could set this to a specific positive integer like `1` (for single-threaded processing), `4` (to use four cores), etc., to fix the number of worker processes used by the CLI by default.
*   **Image Processing Parameters (for fine-tuning the default quality and dimensions of your output images):**
    *   Default quality settings for Optimized JPEGs (e.g., a key like `OPTIMIZED_JPG_QUALITY` with a numeric value like `90`).
    *   Default quality settings and the encoding method (which controls effort/speed trade-off) for Optimized WebPs (e.g., `OPTIMIZED_WEBP_QUALITY: 85`, `OPTIMIZED_WEBP_METHOD: 4`).
    *   The default resizing target for Compressed images (e.g., a key like `COMPRESSED_TARGET_PIXELS` with a numeric value like `2000000` for an approximate 2-megapixel target, or perhaps a key like `COMPRESSED_LONG_EDGE_PIXELS` with a value like `2048` to resize based on the longest dimension).
    *   Default quality settings for Compressed JPEGs and WebPs (e.g., `COMPRESSED_JPG_QUALITY: 75`, `COMPRESSED_WEBP_QUALITY: 70`).
    *   A default fallback quality setting for compressed JPEGs (e.g., `COMPRESSED_FALLBACK_QUALITY: 65`), which might be used by adaptive quality algorithms (if such are implemented) if they might otherwise drop the visual quality too low in an attempt to meet a very small target file size.
*   **Folder Names (for customizing the names of the output directory structure created by PhotoPackager):**
    *   This is typically managed via a dictionary (in Python terms) or a nested JSON object structure where you can define the string names that PhotoPackager will use for each of its standard output folders. Examples of keys within this structure might include `originals_folder_name` (with a default value like `"Export Originals"`), `optimized_parent_folder_name` (default `"Optimized Files"`), `optimized_jpg_subfolder_name` (default `"Optimized JPGs"`), and so on for all the different output categories and their respective subfolders for different image formats. You can change these string values to match your studio's preferred naming conventions.

**How Configuration Settings Are Typically Loaded and Prioritized by PhotoPackager:**
PhotoPackager usually loads its various configuration settings in a specific hierarchical order. This system is designed to provide a balance: it offers sensible, ready-to-use defaults when the application is first installed; it allows users to easily and persistently customize their most common settings to suit their preferred workflow; and it still gives users the complete flexibility to tailor every individual job precisely to its unique requirements on a case-by-case basis without altering their saved defaults. The typical loading order is:
1.  **Application-Shipped Defaults First:** When PhotoPackager starts, it first reads the settings from the main `config/config.json` file (which is bundled with the application itself). These are considered the baseline "factory defaults."
2.  **User-Specific Preferences Override Defaults:** Next, PhotoPackager attempts to read settings from your personal `config/user_config.json` file (located in your user-specific application data directory). Any settings found in this file will override the corresponding default settings that were loaded from the main application `config/config.json`.
3.  **GUI Selections or CLI Arguments for a Specific Job Take Highest Precedence:** Finally, when you configure and run a specific job, any settings you explicitly choose in the GUI for that job, or any arguments you provide on the CLI for that command, will take the highest precedence. These per-job settings will override any defaults from the configuration files for that particular processing run *only*.

This layered approach provides a robust and flexible system, catering to users who want simple defaults as well as those who need highly customized or automated workflows.

### Per-Job Delivery Branding Overrides (Maximum Flexibility via GUI / CLI)

While your configuration files (`config/user_config.json` or other base configs) allow you to set your *default* studio branding information for the client `README.txt` files, PhotoPackager provides the crucial flexibility to override this branding information on a **per-job basis**. This is extremely useful for studios that might manage multiple distinct brand identities, need to cater to specific co-branding requests from their clients, or are providing white-labeled deliveries where their own studio branding should be minimized or completely replaced for a particular project.

As detailed in the "Usage: GUI Walkthrough" and "Usage: CLI Reference" sections earlier in this document:
*   **Using the GUI:** The dedicated "Delivery Branding" panel (which might be labeled something like "Client README Customization" or "Branding for README.txt") within the PhotoPackager main window allows you to directly type in a specific `Company Name`, `Website URL`, and `Support Email Address` for the current job you are about to process. These values will be used for this job only, unless you explicitly save them as new defaults using a "Save as Defaults" button if such a feature is provided in that panel (which would then update your `config/user_config.json`).
*   **Using the CLI:** The `--delivery-company "Your Custom Company Name"`, `--delivery-website "https://yourcustomwebsite.com"`, and `--delivery-email "customsupport@example.com"` arguments serve the exact same purpose for command-line operations. When you include these arguments in your CLI command, they allow you to specify this custom branding for that individual CLI run, and these values will be used for the `README.txt` generated for that job.

This per-job branding information, when provided either through the GUI or CLI, will be used to populate the client-facing `README.txt` file that is included in that specific delivery package. It takes precedence over and effectively overrides the global default branding settings from your configuration files for that particular processing run only. This system offers maximum flexibility to tailor each client delivery perfectly to the specific situation or client.

### Mandatory Attribution Notice – A Note on Open Source Integrity and Respect

PhotoPackager is proudly developed by Steven Seagondollar at DropShock Digital LLC and is shared with the wider community under the permissive terms of the MIT License. We are strong believers in the power, innovation, and collaborative spirit of open source software! The MIT License, while being very liberal in what it allows users to do with the software, does have a simple and common condition regarding attribution to the original authors.

Therefore, please note that the license requires that the original copyright notice and this permission notice (which refers to the full MIT license text) be included in all copies or substantial portions of the Software that are distributed. In the context of PhotoPackager, this is typically handled by including a respectful developer attribution (to Steven Seagondollar, DropShock Digital LLC) in the footer section of the generated client-facing `README.txt` files and often within the internal `photopackager_run.log` files as well.

Your custom Delivery Branding information (which you can set globally in your `config/user_config.json` or other configuration files, or override on a per-job basis via the GUI or CLI) is, of course, featured prominently in the main body of the client `README.txt`. This ensures that *your* unique brand is front-and-center for your clients, helping to build your studio's recognition and trust, while simultaneously and respectfully acknowledging the open-source origins and the core development efforts behind the valuable tool you are using. We appreciate your understanding and adherence to this standard open-source practice.

---

## ❗ Warnings & Important Considerations: Use PhotoPackager Safely & Effectively

Please read these notes very carefully to ensure a smooth, safe, and effective experience while using PhotoPackager. Understanding these points can help prevent accidental data loss, avoid common frustrations, and allow you to get the most out of the application's powerful features. Your data is important, and responsible usage is key.

*   **🛑 `MOVE` ORIGINALS OPTION: PERMANENT & DESTRUCTIVE – EXTREME CAUTION ADVISED!**
    The "Move Originals" option will **PERMANENTLY DELETE** image files from their original source location after they are successfully moved. **THERE IS NO UNDO FEATURE WITHIN PHOTOPACKAGER.**
    *   **BEFORE EVER USING `move`:**
        1.  **Verify you have RELIABLE, INDEPENDENT, and RECENTLY TESTED backups of ALL source images.**
        2.  Understand that process interruption during a `move` can leave files in a split state.
        3.  **Always perform extensive `--dry-run` (CLI) or "Perform Dry Run" (GUI) tests on non-critical data first.**
    *   **DropShock Digital LLC and its developers are NOT liable for any data loss resulting from the use or misuse of this feature.** Use `move` entirely at your own risk. The `copy` option is the strongly recommended default.

*   **🧪 ALWAYS USE `Dry Run` FOR TESTING CONFIGURATIONS:**
    Before processing critical client jobs, or when unsure about settings, **always** use the Dry Run feature.
    *   **GUI:** Check "Perform Dry Run (Simulate, No Changes)".
    *   **CLI:** Include `--dry-run`.
    A Dry Run simulates all actions and logs what *would* have occurred, without making any actual file changes. Review this log carefully.

*   **💾 Significant Disk Space Requirements Can Occur:**
    Generating multiple versions and ZIPs can consume **2 to 5 times the original shoot folder's size.** Ensure adequate free disk space on your output drive *before* starting large jobs.

*   **☁️ Cloud Drive Syncing & Potential Conflicts – Proceed with Caution:**
    Processing files directly in actively synced cloud folders (OneDrive, Dropbox, Google Drive, etc.) can lead to file access conflicts, performance degradation, or unexpected behavior.
    *   **Recommendation:** **Pause cloud sync services** during processing, or **work with local, non-synced copies** and manually move the final package to your cloud folder afterward.

*   **⚙️ System Requirements & Performance Considerations for Smooth Operation:**
    *   **OS:** Windows 10/11 (64-bit recommended); macOS (Big Sur 11.0+ recommended).
    *   **Python (from source):** Version **3.12.10** or compatible 3.12.x.
    *   **Libraries:** `Pillow` (e.g., 11.x), `PySide6` (Qt 6.x). See `requirements.txt`.
    *   **CPU & RAM:** Faster multi-core CPU and more RAM (8GB min, 16GB+ for heavy use) improve performance, especially for large images/batches.
    *   **Hard Drive:** SSDs for source and output significantly improve I/O speed.

*   **🖼️ WebP EXIF Metadata Nuances:**
    While Pillow aims to preserve EXIF in WebP, support for *all* tags (especially obscure or proprietary maker notes) might be less comprehensive than with JPEGs. If critical, test with your specific metadata requirements.

*   **🚫 Corrupted or Unsupported Source Files:**
    PhotoPackager attempts to skip corrupted/unreadable files and log warnings. However, severely damaged or unsupported exotic formats could cause unexpected behavior in underlying libraries. Ensure source images are generally sound.

*   **⚖️ "AS IS" Software Disclaimer & Limitation of Liability:**
    PhotoPackager is provided "AS IS", without warranty of any kind. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, including data loss. See the full [LICENSE.md](LICENSE.md) for details. **Use at your own risk and always prioritize data backups.**

---

## ❓ Troubleshooting / Frequently Asked Questions (FAQ)

If you encounter issues, this section provides solutions to common problems. Always check the `photopackager_run.log` in the job's output folder for detailed error messages first.

1.  **Error: `ModuleNotFoundError: No module named 'PySide6'` (or `'Pillow'`, etc.) when running from source.**
    *   **Cause:** Python dependencies are not installed, or your Python virtual environment (e.g., `venv_photopackager`) is not active.
    *   **Solution:** Ensure your virtual environment is active. Then, run `python3 -m pip install -r requirements.txt` from the project root. If a specific module is still reported missing, try installing it directly, e.g., `python3 -m pip install PySide6`.

2.  **Error (macOS): `Command not found: python` or `pip` when trying to run from source.**
    *   **Cause:** On macOS, `python` may refer to an older system Python 2. PhotoPackager requires Python 3 (specifically 3.12.x).
    *   **Solution:** Consistently use `python3` for executing Python scripts (e.g., `python3 app.py`). For installing packages with pip, use `python3 -m pip` (e.g., `python3 -m pip install -r requirements.txt`).

3.  **Error: "Permission Denied" or "OSError: [Errno 13] Permission denied" during file operations.**
    *   **Cause:** Your user account lacks necessary read permissions for the source folder or write permissions for the output directory. Cloud sync services or antivirus software might also interfere.
    *   **Solution:**
        *   Verify and adjust folder permissions using your OS's tools (Finder "Get Info" on macOS, File Explorer "Properties > Security" on Windows).
        *   Try processing to a simple local folder (e.g., on your Desktop) to rule out complex path or cloud sync issues.
        *   Temporarily pause cloud sync services or antivirus software (remember to re-enable afterward).
        *   Avoid running PhotoPackager as Administrator/root unless absolutely necessary, as it can create permission issues for regular user access later.

4.  **GUI launches, but clicking "Start Processing" does nothing, the application hangs, or crashes.**
    *   **Cause:** This could be due to an unhandled error in the processing logic, invalid input/output paths, a system resource issue (e.g., out of memory for very large files), or a software bug.
    *   **Solution:**
        1.  **Check the GUI Log Area:** Look for any immediate error messages or Python tracebacks.
        2.  **Examine `photopackager_run.log`:** This is crucial. Navigate to the output location; this log file (even if the job failed early) usually contains the most detailed error information.
        3.  **Validate Paths:** Ensure your Source and Output paths are correct, exist, and are accessible.
        4.  **Simplify Test:** Try with a very small set of common image files (e.g., 2-3 JPEGs) to a simple local output folder. If this works, the issue might be with your original data or paths.
        5.  **Check System Resources:** Ensure sufficient free disk space and RAM.
        6.  **Restart PhotoPackager:** A simple restart can sometimes clear temporary glitches.
        7.  **Check for Updates:** Ensure you're using the latest version of PhotoPackager from the Releases page.

5.  **Output Folders (e.g., `Optimized Files`) are empty or missing expected files after a job reports "Done!".**
    *   **Cause:** Most commonly, **Dry Run mode was active**. Other causes include incorrect processing options selected (e.g., specific formats like JPG/WebP were unchecked for a category, or "Skip Compressed Versions" was checked), or no source files matched processing criteria or were readable.
    *   **Solution:**
        *   **Verify Dry Run mode is OFF** for a live run that creates files.
        *   Double-check all your selected processing options in the GUI or your CLI command.
        *   Inspect the `photopackager_run.log` carefully. Look for messages about how many files were found, which files were processed successfully (e.g., "Successfully SAVED Optimized JPG: ..."), and any messages about skipped files or errors.

6.  **ZIP Files (`.zip`) are missing, empty, or incomplete, even if "Create ZIP Archives" was enabled.**
    *   **Cause:** "Create ZIP Archives" option was disabled; Dry Run mode was active; the corresponding content folders (e.g., `Optimized Files`) were empty *before* zipping (so there was nothing to zip); insufficient disk space (on system temp drive or output drive); or an error during the zipping process itself.
    *   **Solution:**
        *   Ensure "Create ZIP Archives" is enabled and Dry Run is disabled.
        *   **First, verify that the content folders themselves (e.g., `Optimized Files/Optimized JPGs`) were correctly populated with image files.** If these folders are empty, address that issue first (see FAQ #5).
        *   Check `photopackager_run.log` for any specific errors logged during the ZIP creation stage.
        *   Ensure ample free disk space.
        *   Try to keep Shoot Base Names and custom folder names reasonably concise to avoid potential issues with very long file paths inside ZIP archives on some older systems.

7.  **(Windows Specific) Desktop Notifications from PhotoPackager appear as standard pop-up message boxes, not as non-blocking "toast" notifications.**
    *   **Cause:** The optional `win10toast-reborn` Python library might not be installed in the Python environment PhotoPackager is using (if you're running from source), or it might not have been successfully bundled with the packaged application for that specific release. Windows notification settings (like Focus Assist) could also be interfering.
    *   **Solution:**
        *   If running from source, ensure your virtual environment is active and try installing/reinstalling the library: `python3 -m pip install win10toast-reborn`.
        *   If using a packaged version, this library should ideally be bundled. If toast notifications aren't working, check your Windows "Settings > System > Notifications" and "Focus Assist" settings to ensure notifications are allowed for PhotoPackager. Standard pop-up message boxes are the functional fallback.

**For persistent issues, provide this information when seeking support:**
*   OS & exact version.
*   PhotoPackager version.
*   Step-by-step reproduction steps.
*   **Full `photopackager_run.log` content.**
*   Screenshots of GUI settings / exact CLI command.
*   Screenshots of error messages.
*   Expected vs. actual behavior.

---

## ⚙️ Development Setup (For Contributors & Advanced Modification)

If you are a Python developer and plan to contribute to PhotoPackager's ongoing development, debug issues at the source code level, run the automated test suite, or wish to make custom modifications to the application beyond the standard configuration options, this section outlines the typical steps for setting up a local development environment.

1.  **Prerequisites & Cloning the Repository:**
    *   Ensure you have **Python 3.12.10** (or a compatible 3.12.x release for current development) and **Git** installed on your system. (Refer to the "Method 2: Running from Source" part of the main "Installation" section above for more details on obtaining these if you haven't already).
    *   Clone the PhotoPackager source code repository from GitHub to your local machine:
        ```bash
        git clone https://github.com/seagpt/PhotoPackager.git
        cd PhotoPackager  # Navigate into the newly cloned project directory
        ```

2.  **Creating and Activating a Python Virtual Environment (Essential Best Practice):**
    To keep project dependencies isolated and avoid conflicts with your global Python installation or other Python projects, always use a Python virtual environment for development.
    *   From the root directory of the cloned `PhotoPackager` project, create a new virtual environment. It's good practice to include the project name or a clear identifier in the virtual environment's folder name (e.g., `venv_photopackager` or `venv_pp_dev` are common choices):
        *   **On macOS / Linux:**
            ```bash
            python3 -m venv venv_photopackager 
            source venv_photopackager/bin/activate
            ```
        *   **On Windows (using PowerShell):**
            ```bash
            python -m venv venv_photopackager
            .\venv_photopackager\Scripts\Activate.ps1
            ```
            (Remember, if PowerShell script execution is blocked, you might first need to run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`)
        Your terminal prompt should now be prefixed with `(venv_photopackager)` (or your chosen name), indicating the virtual environment is active.

3.  **Installing Core Runtime & Development Dependencies:**
    PhotoPackager will have a `requirements.txt` file in its root directory, listing all its core runtime dependencies (the libraries needed to simply run the application). For development purposes, there might also be a separate file, often named `requirements-dev.txt` or similar, which lists additional tools used specifically for development, such as testing frameworks, linters, type checkers, and build tools.
    *   With your virtual environment active, install these dependencies using `pip`:
        ```bash
        # Install core runtime dependencies needed to run the application
        python3 -m pip install -r requirements.txt

        # If a development-specific requirements file exists (e.g., requirements-dev.txt)
        # and you need tools like pytest, pylint, mypy for development, install those too:
        # python3 -m pip install -r requirements-dev.txt 
        ```

4.  **Understanding the Project Structure (Key Files & Directories for Development):**
    A good understanding of how the PhotoPackager project's source code is organized is crucial for effective development, debugging, and contributing. The structure typically includes several key components (this is based on the detailed information provided previously about the project's architecture; the exact structure might evolve over time, so always refer to the current state of the repository for the most accurate layout):
    *   `PhotoPackager/` (This is the Project Root directory)
        *   `app.py`: This is the **main application entry point script for launching both the Graphical User Interface (GUI) and handling Command-Line Interface (CLI) commands.** It usually initializes the Qt application environment (via PySide6) for the GUI mode and parses command-line arguments to dispatch to either GUI mode or CLI mode with its specific subcommands and options. **This is the script you should run to start PhotoPackager when working from source.**
        *   `config/` (Directory): This folder likely contains configuration files that define default settings and allow for user customization.
            *   `config.json`: This file probably holds application-shipped default settings for various parameters. Developers would modify this for core default changes.
            *   `user_config.json`: Stores user-specific overrides and persistent preferences (typically created in a user data directory, not directly in the project for distribution, but a template might be here in the source).
        *   `config.py`: Might still exist for core application constants, or as a fallback if JSON configs are missing, or if some configuration aspects are better managed in Python code.
        *   `core/` (Directory): This directory typically houses the core, non-GUI-specific application logic – the "brains" of PhotoPackager.
            *   `__init__.py`: An (often empty) file that makes the `core` directory a Python package, allowing its modules to be imported.
            *   `job_worker.py` (or a similarly named module like `processing_engine.py`): This module likely contains the class or set of functions responsible for handling the actual background processing of photo packaging jobs. This would include orchestrating the sequence of operations: reading images, applying transformations (resizing, format conversion, quality adjustments via Pillow), handling EXIF metadata, performing file operations (copying, moving, renaming), and potentially communicating progress updates or status messages back to the GUI (e.g., via Qt signals and slots if using PySide6 for threading).
            *   `utils.py` (or a similar utility module): This module usually contains common utility functions, helper classes, or constants that are used across different parts of the PhotoPackager application. Examples could include helper functions for setting up and using the logging system, functions for validating or manipulating file paths, string formatting utilities, custom error handling classes or functions, or other reusable pieces of code that don't belong to a more specific module.
            *   Other Python modules within `core/` would encapsulate specific pieces of business logic or distinct functionalities that are part of PhotoPackager's core operations.
        *   `gui/` (Directory): This directory contains all the PySide6 (Qt) related Python modules and potentially UI definition files (like `.ui` files if Qt Designer is used, though often UIs are built in code) that make up the Graphical User Interface that the user interacts with.
            *   `__init__.py`: Makes the `gui` directory a Python package.
            *   `main_window.py` (or a similarly named module like `app_window.py`): This module typically defines the main application window class (often a subclass of PySide6's `QMainWindow` or `QWidget`). It's responsible for setting up the main window's layout, instantiating all the UI widgets (like buttons, text input fields, dropdown menus, progress bars, log display areas), and connecting user interactions (such as button clicks, text changes, or menu selections) to the appropriate event handling logic (slots or methods).
            *   Other Python files for specific dialog windows used by the application (e.g., `about_dialog.py` for the "About PhotoPackager" window, `settings_dialog.py` if there's a separate settings configuration window, `log_viewer_dialog.py` if there's a dedicated window to show detailed logs, `update_checker.py` if the application has an update checking feature that presents a dialog).
        *   `assets/` (Directory): This directory contains static application assets that are not Python code but are needed by the application. These might include:
            *   Application logos and branding images (like `PhotoPackager_Patch_Design.png`, `(White) DropShock Digital - Photography Watermark Version 2.png`).
            *   Icons used within the GUI for buttons or other elements, or for the application executable/bundle itself (e.g., `.ico` files for Windows, `.icns` files for macOS).
            *   UI elements like custom background images (e.g., an image named `dmg_background.png` might be used if creating a custom-styled macOS DMG installer).
            *   A subfolder, often named `assets/test_images/`, for storing a collection of small, representative sample images. These are crucial for running the automated test suite to ensure that image processing functions work correctly with real-world file types and data.
        *   Specific modules for core functionalities if they are substantial enough to be separate top-level files (rather than within `core/`). Examples from previous discussions that might exist if their logic is extensive and not fully encapsulated within `core/job_worker.py` could include:
            *   `filesystem.py`: This module might be dedicated to encapsulating more complex or specialized file system operations, such as advanced directory scanning algorithms, robust file copying and moving routines that include detailed error handling and progress reporting, and the logic for creating and managing ZIP archives.
            *   `image_processing.py`: This module could be specifically designed to house all the core image manipulation functions that directly use the Pillow library. This would include functions for resizing images according to various criteria, converting images between different formats (JPEG, WebP, PNG, etc.), adjusting image quality and compression settings, and handling the reading, writing, and stripping of EXIF metadata.
            *   `job.py`: This module might define data structures (like Python classes or dataclasses) that are used to represent and manage processing jobs, store their various parameters (source/output paths, selected options like EXIF policy or formats to generate), and track their current status or progress.
        *   `tests/` (Directory): This directory contains the automated test suite for PhotoPackager, likely using a framework like `pytest`. It might be further organized into subdirectories for unit tests, integration tests, etc.
        *   `venv_photopackager/` (or `venv_mac/`, or your chosen virtual environment name): The Python virtual environment directory itself. This directory should always be listed in your project's `.gitignore` file so that its contents are not committed to version control (as it's specific to each developer's machine and can be recreated from `requirements.txt`).
        *   `LICENSE.md`: The file containing the full text of the MIT License under which PhotoPackager is distributed.
        *   `README.md`: This project documentation file that you are currently reading.
        *   `.gitignore`: A text file that specifies intentionally untracked files and directories that Git (the version control system) should ignore (e.g., it should list `venv_*/`, `__pycache__/` directories, `*.pyc` compiled Python files, `build/`, `dist/` directories created by PyInstaller, etc.).
        *   Build-related configuration files (the specific files can vary depending on the tools and practices used in the project):
            *   `pyproject.toml`: This file is increasingly common in modern Python projects. It's used by build systems (like Poetry, Flit, or even Setuptools when using PEP 517/518 build backends) and also often serves as a central place for configuring various development tools like `pytest` (for testing), `MyPy` (for static type checking), `Black` or `Ruff` (for code formatting), and `Pylint` or `Flake8` (for code linting).
            *   `setup.py`: This is a more traditional script used for package configuration if the project uses Setuptools directly (it's becoming less common as the primary configuration file for new projects but might still be present for compatibility reasons or for specific PyInstaller build needs).
            *   Specific configuration files for PyInstaller (e.g., a `.spec` file, which defines how PyInstaller should bundle the application). While PyInstaller can be run with many command-line options, for complex applications, using a `.spec` file is usually preferred for reproducibility and managing detailed settings. The project might have custom build scripts (like `macos_package.py` or `windows_package.py` if mentioned) that generate or use these `.spec` files.

5.  **Running the Application in Development Mode (from the project root directory, with your virtual environment active):**
    *   **To Run the GUI Application:**
        The main entry point for the GUI is `app.py`.
        ```bash
        python3 app.py
        ```
        If the application has been set up to accept a flag for enabling enhanced Qt debugging output (which can be very helpful if you are working on or debugging GUI components, as it might print more information from the Qt framework to the console), it might be invoked like this (you would need to check `app.py` itself or run `python3 app.py --help` to see if such a general flag exists for the GUI mode, or if it's specific to a development-only subcommand):
        ```bash
        # Example, if a --debug_qt flag is implemented in app.py:
        # python3 app.py --debug_qt 
        ```
    *   **To Run or Test the CLI Application:**
        The CLI is also accessed via `app.py`, by specifying the `cli` subcommand.
        ```bash
        # First, it's always a good idea to see all available CLI options and subcommands
        python3 app.py cli --help 
        
        # Then, you can run a test command. Always use --dry-run and --verbose initially for testing:
        python3 app.py cli --source path/to/your/test_images --output path/to/your/test_output --base-name MyTestShoot --dry-run --verbose
        ```

6.  **Running Automated Tests (Example using `pytest`):**
    If PhotoPackager uses `pytest` for its automated test suite (which is a common and robust choice in modern Python projects, and was indicated by the test command `pytest --maxfail=3 --disable-warnings -v` provided in earlier information):
    *   Ensure that `pytest` and any related test dependencies (such as `pytest-cov` for code coverage reporting) are installed in your development virtual environment (they should be if they are listed in `requirements.txt` or, more likely, a `requirements-dev.txt` file that you've installed).
    *   From the project's root directory, with your virtual environment active, you can typically run the tests using a command like:
        ```bash
        python3 -m pytest tests/ --maxfail=3 --disable-warnings -v
        ```
        *   `tests/`: Specifies the directory containing the test files.
        *   `--maxfail=3`: Instructs pytest to stop after 3 test failures, which can be useful to avoid long test runs if many early tests are failing.
        *   `--disable-warnings`: Suppresses common Python warnings during the test run, for cleaner output.
        *   `-v`: Enables verbose output, showing the name of each test as it runs.
    *   **For Test Coverage Reporting** (if `pytest-cov` is installed and configured):
        ```bash
        # This command often shows a coverage summary in the terminal and might generate an HTML report
        python3 -m pytest tests/ --cov=src --cov-report=html  # Assumes 'src' is your main source code directory
        # The HTML report (usually found in an 'htmlcov/' directory) can be opened in a web browser for detailed exploration of code coverage.
        # To show lines of code not covered by tests directly in the terminal:
        # python3 -m pytest tests/ --cov=src --cov-report=term-missing 
        ```
    *   **Important Note on Test Assets:** As mentioned in the Troubleshooting section, tests that involve image processing (e.g., testing functions in `image_processing.py` or workflows in `job_worker.py`) almost always require actual image files to operate on. These test images should be small, representative samples of various formats and characteristics and should be placed in a dedicated location within the project, typically in the `assets/` directory (e.g., in a subfolder like `assets/test_images/`). Using real image files for tests is generally more reliable than trying to generate test images dynamically using Pillow during the test run, as dynamic generation might not fully exercise Pillow's file format plugin loading mechanisms or catch issues related to specific file encodings or embedded metadata.

7.  **Using Linters and Static Type Checkers (Optional but Highly Recommended for Code Quality):**
    To maintain high code quality, ensure consistency in coding style, and catch potential errors early in the development process, PhotoPackager development might involve the use of linters (such as `Pylint` or `Flake8`) and static type checkers (such as `MyPy`).
    *   If these tools are used in the project, ensure they are installed in your development virtual environment (they would typically be listed in a `requirements-dev.txt` file).
    *   You would usually run them from the project root directory, targeting the relevant source code files and directories:
        ```bash
        # Example command for running Pylint (its configuration is often in a .pylintrc file):
        # python3 -m pylint src/ gui/ core/ app.py 
        # (Adjust the list of files/directories to match what you want to lint for the project)

        # Example command for running MyPy (its configuration is often in pyproject.toml or mypy.ini):
        # python3 -m mypy src/ gui/ core/ app.py 
        # (Adjust target paths as needed)
        ```

8.  **Building Standalone Executables and Installers (Using PyInstaller and other tools):**
    If you need to build a standalone executable version of PhotoPackager (e.g., for distribution to end-users who don't have Python installed, or for testing the fully packaged application yourself):
    *   The project uses **PyInstaller** for creating these executables.
    *   For consistency and to manage the complexities of bundling (like including assets, icons, and handling platform-specific options), PhotoPackager often utilizes dedicated packaging scripts (e.g., `macos_package.py` for macOS, and potentially a `windows_package.py` for Windows, or a more general build script).
    *   **Refer to these specific packaging scripts within the repository for the exact commands and steps to build the application.** These scripts will typically:
        *   Generate or use a `.spec` file (PyInstaller's build specification file) tailored for each platform.
        *   Run PyInstaller with the correct options to create the executable bundle (e.g., `.app` for macOS, `.exe` for Windows). This includes using PyInstaller's `--add-data` flag to correctly bundle the `assets/` directory (containing logos, icons, etc.) and the `config/` directory (containing `config.json`) into the distributable.
        *   For macOS, the `macos_package.py` script might also invoke the `create-dmg` tool (if installed) to package the generated `.app` bundle into a professional-looking `.dmg` disk image installer.
    *   The final distributable files (e.g., `PhotoPackager_GUI.app` and `PhotoPackager_GUI.dmg` for macOS, or `PhotoPackager_GUI_Installer.exe` for Windows) will typically be found in a `dist/` subdirectory within your project after the build process completes successfully.

This detailed development setup guide should provide a solid starting point and a useful reference for anyone looking to work on, understand the internals of, or contribute to the PhotoPackager codebase. Always consult any project-specific build scripts or additional developer notes that might exist within the repository for the most current and precise instructions for your version.

---

## 🌟 Steven Seagondollar & DropShock Digital LLC: Professional Overview

This section provides insight into the developer and the company behind PhotoPackager, offering context about the expertise and vision driving the project.

### Steven Seagondollar

Steven Seagondollar, the founder and driving force behind DropShock Digital LLC, is a multifaceted professional operating at the dynamic intersection of advanced technology, digital creativity, and strategic business development. His work is characterized by a commitment to innovation and a practical approach to solving complex challenges.

*   **Technological Proficiencies & Engineering Acumen:** Steven possesses a strong and continually evolving expertise in cutting-edge computational methods and software engineering. His skills encompass the full lifecycle of software development, including the architectural design, robust development, rigorous testing, and effective application of intelligent systems and complex software solutions. He has a deep and practical understanding of computer architecture, network infrastructure, data structures, and algorithms, which informs his approach to building scalable and efficient applications.
*   **Digital Development & Platform Architecture:** Steven is actively engaged in expanding his capabilities in building sophisticated online applications, backend systems, and integrated digital platforms. His technical skillset is broad, including proficiency in various programming languages (with a strong focus on Python for projects like PhotoPackager), modern web development technologies (front-end and back-end frameworks), database design and management (SQL and NoSQL), API development (RESTful, GraphQL), and cloud computing platforms.
*   **Creative Production & Digital Media Expertise:** Beyond pure technology, Steven demonstrates a significant mastery in a range of digital creative fields. This includes hands-on experience and a keen eye for visual content creation (photography, videography, graphic design), digital media production workflows, user interface (UI) and user experience (UX) design principles, and the strategic design and effective management of compelling online presences for businesses and individuals.
*   **Business & Leadership Acumen – From Vision to Execution:** Steven brings to the table a proven track record in several key business and leadership domains:
    *   **Project & Program Management:** Successfully managing complex technical projects from conception through to delivery, ensuring they meet objectives, timelines, and budget constraints.
    *   **Operational Framework Design:** Designing and implementing efficient operational frameworks, workflows, and standard operating procedures to streamline processes and enhance productivity.
    *   **Team Leadership & Mentorship:** Leading, motivating, and mentoring technical and creative teams, fostering a collaborative and high-performance environment.
    *   **Revenue Strategy & Business Development:** Developing and executing effective revenue generation strategies, identifying new business opportunities, and driving entrepreneurial ventures from idea to market viability.
    *   **Strategic Business Guidance:** Providing insightful strategic business consulting and guidance to help organizations leverage digital tools, advanced technologies, and innovative strategies to achieve their goals.
    *   **Client Relationship Management & Communication:** Building and maintaining strong client relationships through clear, proactive communication, understanding client needs, and ensuring high levels of satisfaction.
*   **Exceptional Communication & Interpersonal Skills:** Steven exhibits strong and versatile abilities in professional communication:
    *   Clearly and effectively articulating complex technical information and strategic concepts to diverse audiences, both technical and non-technical.
    *   Adapting his communication style and approach to suit different contexts, individuals, and objectives.
    *   Facilitating learning, knowledge transfer, and training within teams and for clients.
    *   Collaborating effectively and constructively with team members, partners, and stakeholders in a professional and results-oriented setting.

### DropShock Digital LLC

DropShock Digital LLC, founded by Steven Seagondollar, is a dynamic company that provides a comprehensive suite of cutting-edge digital solutions and strategic services. The company's philosophy emphasizes the practical and innovative application of advanced technologies to solve real-world problems and create tangible value for its clients.

*   **Intelligent Systems & AI-Powered Solutions:** A core focus of DropShock Digital is the development and implementation of intelligent systems, leveraging artificial intelligence (AI), machine learning (ML), and data analytics to automate processes, enhance digital user interactions, derive actionable insights from data, and create smarter software products.
*   **Digital Media Creation & Production:** DropShock Digital offers deep expertise in the creation, production, and management of high-quality digital media and visual content. This includes professional photography, videography, motion graphics, animation, graphic design, and content strategy tailored for various digital platforms.
*   **Digital Platform Design & Development:** The company specializes in designing and building robust, scalable, and user-centric digital platforms and online infrastructures. This encompasses custom web application development, mobile app development, e-commerce solutions, content management systems (CMS), and API integrations.
*   **Strategic Digital Consulting & Guidance:** DropShock Digital provides expert strategic consulting to help businesses and organizations effectively navigate the digital landscape. This includes advising on digital transformation initiatives, technology adoption, online marketing strategies, data utilization, and how to best leverage digital tools and innovative strategies to achieve specific business objectives and gain a competitive edge.

DropShock Digital LLC is passionately committed to delivering innovative, effective, and high-impact digital solutions by seamlessly integrating deep technical expertise with a strong focus on understanding and addressing the unique needs and goals of each client. The aim is always to provide solutions that are not just technologically advanced, but also practical, sustainable, and drive measurable results.

---

## 🙏 Acknowledgements & Gratitude: Built with the Best of Open Source

PhotoPackager, like many modern software applications, stands on the shoulders of giants. Its development has been made possible and greatly accelerated by leveraging a wealth of excellent open-source libraries, frameworks, and tools. We extend our sincere thanks and deep appreciation to the talented developers, dedicated contributors, and vibrant communities behind these projects for their incredible work and their commitment to sharing:

*   **[Python Programming Language](https://www.python.org/)**: The powerful, versatile, and elegant high-level programming language (specifically **Python 3.12.10** for current development) that forms the backbone of PhotoPackager.
*   **[Pillow (The Friendly PIL Fork)](https://python-pillow.org/)**: (Version e.g., **11.x.x** or as specified in `requirements.txt`). The indispensable Python Imaging Library, providing robust and extensive image processing capabilities for everything from reading diverse image formats (including common ones like JPG, PNG, WebP, AVIF, TIFF, HEIC, PSD, and many camera RAW formats) to performing operations like resizing, format conversion, image quality adjustments, and detailed EXIF metadata handling.
*   **[PySide6 (Qt for Python)](https://www.qt.io/qt-for-python)**: From The Qt Company, enabling the creation of PhotoPackager's rich, responsive, and cross-platform Graphical User Interface with the comprehensive **Qt 6.x framework**, which is renowned for its mature and powerful UI development tools.
*   **[argparse (Python Standard Library Module)](https://docs.python.org/3/library/argparse.html)**: This module, part of Python's standard library, is used for straightforward and powerful command-line argument parsing. It is instrumental in making PhotoPackager's Command-Line Interface (CLI) robust, user-friendly, and easy to extend with new options.
*   **[Piexif](https://github.com/hMatoba/Piexif)**: (This is often an Optional Dependency for specific advanced features, but may be bundled or listed as core if those features are central). Piexif is an excellent pure-Python library for more granular and detailed EXIF metadata manipulation, beyond what Pillow might offer directly. It's likely used in PhotoPackager for implementing specific EXIF stripping policies like "Date Only" or "Camera Only."
*   **[win10toast-reborn](https://github.com/DatGuyFab/win10toast-reborn)**: (This is an Optional Dependency specifically for the Windows platform, usually bundled in pre-built Windows applications if the feature is enabled). This library is used for providing user-friendly, non-blocking desktop ("toast") notifications on Windows 10 and 11, enhancing the user experience by providing clear status updates.
*   **[PyInstaller](https://pyinstaller.org/)**: This is the powerful and widely-used tool that is utilized for bundling the PhotoPackager Python application and all its dependencies into standalone executables for Windows (`.exe`) and macOS (`.app` bundles). This makes PhotoPackager easily accessible to end-users who may not have a Python environment installed on their computers.
*   **[create-dmg](https://github.com/create-dmg/create-dmg)**: (This is a development tool specifically for macOS developers). `create-dmg` is a command-line utility that simplifies the process of creating professional-looking and well-structured macOS Disk Images (`.dmg` files) for distributing the `.app` bundle generated by PyInstaller.

And a broader, heartfelt thank you to the vast and vibrant **Python open-source community** as a whole. The incredible array of high-quality libraries, the collaborative spirit, and the wealth of shared knowledge make it possible for projects like PhotoPackager to be developed efficiently and effectively, benefiting users worldwide.

---

## 🛟 Support & Community Contact: We're Here to Help!

Your experience with PhotoPackager is very important to us at DropShock Digital LLC. Whether you're encountering issues while using the application, believe you've discovered a potential bug, have brilliant ideas for new features or improvements, or simply want to share your general feedback, please don't hesitate to reach out. We value your input!

**Primary Channels for Support & Interaction:**

*   **📧 Email Support (Preferred for direct technical assistance, detailed bug reports with log files, and private feedback):**
    For technical support inquiries, reporting bugs (especially those where you can provide the `photopackager_run.log` file for detailed diagnosis), or if you have private feedback or questions, please email us directly at:
    [support@dropshockdigital.com](mailto:support@dropshockdigital.com?subject=PhotoPackager%20Support%20Request%20(Version%201.0.0))
    *(Please replace `Version 1.0.0` with the specific PhotoPackager version you are using, if different in the future).*

*   **🐙 GitHub Issues (The official platform for public bug tracking, feature requests & community discussion):**
    The project's GitHub Issues page is the official and preferred place to report bugs that other users might also encounter, to request new features or enhancements you'd like to see, and to engage in discussions about technical aspects or potential improvements for PhotoPackager:
    [https://github.com/seagpt/PhotoPackager/issues](https://github.com/seagpt/PhotoPackager/issues)
    *   ***Before submitting a new issue:*** Please take a moment to search through the existing open and closed issues on the GitHub page. It's possible that your problem or suggestion has already been discussed, reported, or even resolved. This helps avoid duplicate efforts and keeps the issue tracker organized.
    *   ***When reporting a bug:*** Please provide as much detail as possible. Refer to the checklist at the end of the "Troubleshooting / FAQ" section for a list of helpful information to include in your bug report (such as OS version, PhotoPackager version, steps to reproduce, log files, screenshots, etc.).

*   **🌐 Company Website & General Business Inquiries:**
    For more information about DropShock Digital LLC, our other software projects, digital media services, or for general business-related inquiries, please visit our official website:
    [https://www.dropshockdigital.com](https://www.dropshockdigital.com)

*   **📞 Direct Contact (Phone - primarily for business inquiries or urgent matters):**
    +1 (760) 209-5480 (USA). *For general technical support with PhotoPackager, using email or the GitHub Issues page is typically more efficient, as these channels allow for easier tracking of issues and the exchange of detailed information like log files and screenshots.*

**Privacy & Security of Your Support Requests:**
All support requests made directly to DropShock Digital LLC via email or phone are handled with strict confidentiality. We are committed to helping you use PhotoPackager effectively and aim to respond to all inquiries as promptly and thoroughly as possible.

Your feedback, bug reports, and feature ideas are invaluable in making PhotoPackager an even better and more reliable tool for photographers and creative professionals worldwide. Thank you for being a part of the PhotoPackager community!

---

## 📜 License Information

**PhotoPackager Application Software**
Copyright (c) 2024-2025 Steven Seagondollar, DropShock Digital LLC.
All Rights Reserved by DropShock Digital LLC and Steven Seagondollar as applicable under copyright law.

This PhotoPackager project is licensed to you, the user, under the terms of the **MIT License**.
A complete copy of the full license text is included in the file named `LICENSE.md`, which should be located in the root directory of this project's source code repository. If you downloaded a packaged version, the license file may also be included with the application or accessible via an "About" dialog.

**Key Permissions & Conditions of the MIT License (Summary for General Understanding):**

The MIT License is a permissive free software license, meaning it has minimal restrictions on reuse. In essence, it grants you broad freedoms:

*   **Freedom to Use:** You are completely free to use the PhotoPackager software for any purpose you see fit. This includes using it for commercial (business) ventures, private personal projects, and educational activities, without any royalty payments or usage fees.
*   **Freedom to Modify:** You have the right to modify the PhotoPackager software's source code to suit your specific needs, to fix bugs you might find, or to add new features and improvements.
*   **Freedom to Distribute:** You are permitted to redistribute copies of the PhotoPackager software to others, either in its original, unmodified form or as modified by you.
*   **Freedom to Sublicense:** You can grant sublicenses to others, allowing them to also use, modify, and distribute the software under the same terms of the MIT license.

**The primary conditions and obligations under the MIT License are simple and straightforward:**

1.  **Copyright Notice Preservation:** The original copyright notice (as stated above, typically "Copyright (c) YEAR Author Name") and the permission notice (which is the full text of the MIT License itself, as found in `LICENSE.md`) must be included in all copies or substantial portions of the Software that you distribute. This is why PhotoPackager, in compliance with this common open-source licensing practice, includes an attribution in generated files like the client `README.txt` and in its internal log files – it's a standard part of respecting and complying with the open-source license under which it is shared.
2.  **"AS IS" Warranty Disclaimer & No Liability:** The software is provided "AS IS", WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED. This means there is no guarantee that the software is perfect, error-free, or will meet your specific requirements. This disclaimer includes, but is not limited to, the implied warranties of MERCHANTABILITY (i.e., that the software is of a certain quality or fit for general sale) and FITNESS FOR A PARTICULAR PURPOSE (i.e., that it will successfully do what you specifically want it to do), and NON-INFRINGEMENT (i.e., that it doesn't violate someone else's patents, copyrights, or other intellectual property).
    Furthermore, IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS (Steven Seagondollar, DropShock Digital LLC) BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE ITSELF OR FROM YOUR USE OR INABILITY TO USE THE SOFTWARE. This limitation of liability includes (but is not limited to) any loss of data, loss of profits, business interruption, or any other direct, indirect, incidental, special, exemplary, or consequential damages.

Please take the time to review the full `LICENSE.md` text for the complete, official, and legally binding terms and conditions. Your decision to download, install, use, modify, or distribute PhotoPackager signifies your understanding and acceptance of these MIT License terms.
