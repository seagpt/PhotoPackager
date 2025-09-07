<div align="center">
  <img src="assets/PhotoPackager_Patch_Design.png" alt="PhotoPackager Logo" width="400" style="margin-bottom:10px;"/>
  <h1>PhotoPackager</h1>
  <h3 align="center" style="font-weight: normal; margin-top: -10px; margin-bottom: 10px;">A Professional Web-Based Photoshoot Packaging & Delivery Pipeline</h3>
  <p><strong>A Creative Photoshoot Pipeline Tool By <a href="https://www.dropshockdigital.com" target="_blank" rel="noopener noreferrer">Steven Seagondollar, DropShock Digital LLC</a></strong></p>
  <br>
  <p>
    <a href="https://hub.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/></a>
    <a href="https://docs.celeryq.dev/en/stable/"><img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery"/></a>
    <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/></a>
    <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"/></a>
  </p>
</div>

---

## 🎯 Overview: The Modern Photographer's Delivery Pipeline, Reimagined

PhotoPackager has evolved. Originally a desktop application, it is now a powerful, professional-grade, containerized web application designed to solve the modern photographer's delivery dilemma. It provides a robust, scalable, and automated pipeline for processing, packaging, and preparing photoshoot deliveries for clients.

Built with a modern tech stack including **FastAPI**, **Celery**, and **Docker**, PhotoPackager offers a seamless web interface for manual job configuration and a **RESTful API** for programmatic control. Furthermore, its integrated **MCP (Model-Context-Protocol) Server** allows AI agents to intelligently interact with and control the packaging workflow, opening up new possibilities for automation.

Whether you're a solo photographer needing to streamline your workflow or a studio looking for a scalable delivery solution, PhotoPackager provides the tools to save time, reduce manual labor, and elevate the professionalism of your client deliveries.

---

## ✨ Key Features

PhotoPackager is loaded with features designed to conquer the challenges of the modern photographic workflow:

*   **🌐 Modern Web Interface:** A clean, intuitive single-page application for uploading photos, configuring job settings, and monitoring progress in real-time.
*   **🚀 Asynchronous Job Processing:** Powered by Celery and Redis, long-running packaging jobs are executed in the background without tying up the user interface. Handle large batches of photos efficiently.
*   **🤖 Powerful Processing Engine:**
    *   **Multi-Format Generation:** Automatically create optimized JPEGs, compressed JPEGs, and modern WebP formats from your source files (RAW or JPG).
    *   **Granular Quality Control:** Set specific quality levels for both optimized and compressed image sets.
    *   **Intelligent Renaming:** Standardize filenames based on shoot and base names for professional organization.
    *   **Flexible EXIF Handling:** Keep all metadata, strip it completely, or retain only essential date and camera information.
    *   **Automated ZIP Packaging:** Consolidate your deliverables into clean, compressed ZIP archives, ready for download.
*   **🔌 RESTful API:** A complete API for programmatic control. Submit jobs, poll for status, and retrieve download links, enabling integration with other systems and scripts.
*   **🧠 AI-Agent Ready with MCP Server:** An integrated MCP server exposes the packaging capabilities as a tool for AI agents. This allows for advanced automation scenarios where an agent can manage the entire delivery process.
*   **📦 Dockerized for Easy Deployment:** The entire application stack (web server, worker, and message broker) is containerized with Docker, ensuring a consistent, cross-platform environment that runs with a single command.

---

## 🚀 Getting Started: Running with Docker

Get PhotoPackager up and running in minutes. The entire application is containerized, so you don't need to worry about Python versions or dependencies.

### Prerequisites

*   [**Docker**](https://docs.docker.com/get-docker/)
*   [**Docker Compose**](https://docs.docker.com/compose/install/)

### Installation & Launch

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/seagpt/PhotoPackager.git
    cd PhotoPackager/photopackager
    ```

2.  **Build and Run with Docker Compose:**
    From within the `photopackager` directory, run the following command:
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for the web server and the Celery worker, pull the Redis image, and start all three services.

3.  **Access the Application:**
    *   **Web Interface:** Open your browser and navigate to [**http://localhost:8000**](http://localhost:8000).
    *   **API Documentation:** The FastAPI interactive docs are available at [**http://localhost:8000/docs**](http://localhost:8000/docs).
    *   **MCP Server:** The MCP server is mounted at the `/mcp` sub-path.

---

## 🛠️ Usage

### 1. Web Interface

The web UI is the most straightforward way to use PhotoPackager:
1.  **Upload Photos:** Drag and drop your source images (RAWs, JPGs) into the upload area.
2.  **Configure Settings:** Fill out the form to define the shoot name, file naming conventions, image processing options, and branding details.
3.  **Start Job:** Click "Start Packaging Job".
4.  **Monitor Progress:** Watch the progress bar and status messages update in real-time.
5.  **Download:** Once the job is complete, download links for your ZIP packages will appear.

### 2. RESTful API

You can control PhotoPackager programmatically via its FastAPI backend. Here is a basic example using `curl`:

**Submit a Job:**
```bash
curl -X 'POST' \
  'http://localhost:8000/api/jobs' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'files=@/path/to/your/image1.jpg' \
  -F 'files=@/path/to/your/image2.cr3' \
  -F 'settings={"shoot_name": "API Test", "base_name": "api_shoot", "quality_optimized": 92, "generate_optimized_jpg": true}'
```

This will return a `job_id`. You can then use it to check the status.

**Check Job Status:**
```bash
curl -X 'GET' 'http://localhost:8000/api/jobs/YOUR_JOB_ID/status'
```

### 3. MCP Server (for AI Agents)

The integrated MCP server allows AI agents to use PhotoPackager as a tool. An agent can discover and execute the `package_photos` tool, providing a list of local file paths and the desired job settings.

This enables advanced automation, where an LLM could, for example, watch a folder for new photos, intelligently group them into shoots, and automatically run PhotoPackager to create client-ready packages.

---

## 🏗️ Project Structure

The application is organized into a web-centric structure within the `photopackager/web_app` directory:

```
.
├── photopackager_core/ # Core, non-web-specific logic
│   ├── image_processing.py
│   └── job.py
├── static/             # Frontend assets
│   ├── index.html
│   ├── script.js
│   └── style.css
├── Dockerfile          # Defines the Python application container
├── docker-compose.yml  # Orchestrates all services (web, worker, redis)
├── main.py             # FastAPI application: API endpoints, MCP server mount
├── mcp_tools.py        # Defines the `package_photos` tool for the MCP server
├── requirements.txt    # Python dependencies
├── schemas.py          # Pydantic models for data validation (API/MCP)
└── worker.py           # Celery worker definition and background task logic
```

---

## 🔧 CI/CD Pipeline

This project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automates two key processes:

1.  **Linting:** Automatically checks all Python code for quality and style issues using Ruff on every push and pull request to the `main` branch.
2.  **Docker Build & Push:** On a push to `main`, it builds the application's Docker image and pushes it to the GitHub Container Registry (ghcr.io), ensuring a fresh, deployable artifact is always available.

---

## 📜 License

This project is licensed under the terms of the **MIT License**. See the `LICENSE.md` file for the full text.
Copyright (c) 2024-2025 Steven Seagondollar, DropShock Digital LLC.
