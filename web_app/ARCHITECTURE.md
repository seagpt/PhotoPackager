# PhotoPackager Web App: Architecture & Technical Documentation

This document provides a detailed overview of the technical architecture, design decisions, and implementation strategy for the PhotoPackager web application.

## 1. Core Architecture

The application is a containerized web service composed of three primary components orchestrated by Docker Compose:

1.  **Web Server (`web`)**: A FastAPI application that serves the user-facing frontend, handles API requests for job submission, status checks, and downloads.
2.  **Background Worker (`worker`)**: A Celery worker that consumes tasks from a queue and executes the long-running, CPU-intensive photo processing jobs.
3.  **Message Broker (`redis`)**: A Redis instance that acts as the message broker for Celery, managing the queue of jobs between the web server and the worker. It also serves as the result backend.

### Technology Stack

-   **Backend**: Python 3.11, FastAPI
-   **Background Processing**: Celery
-   **Message Broker / Cache**: Redis
-   **Containerization**: Docker & Docker Compose
-   **Frontend**: Vanilla HTML, CSS, and JavaScript (Single Page Application)

## 2. Deep Dive: MCP Server Integration

To fulfill the requirement of allowing programmatic access by AI agents, the application will also function as a Model Context Protocol (MCP) server.

### What is MCP?

MCP is a standardized protocol that allows AI agents (like Cascade) to discover and interact with local or remote tools and services. By exposing PhotoPackager as an MCP tool, we enable an agent to programmatically use its functionality (e.g., "Package these 10 photos with the 'web_optimized' preset") without needing to interact with the web UI.

### Implementation Strategy

We will use the official `mcp-sdk-python` library to integrate the server directly into our FastAPI application.

1.  **Mounting the MCP App**: The MCP server will be mounted as a sub-application within our main FastAPI instance. This is an efficient approach that allows both the web API and the MCP server to run in the same process.

    ```python
    # In main.py
    from mcp.server import create_mcp_server
    from .mcp_tools import get_tools

    app = FastAPI()
    mcp_app = create_mcp_server(tools=get_tools())

    app.mount("/mcp", mcp_app)
    ```

2.  **Defining the Tool**: We will create a new file, `mcp_tools.py`, to define the `PhotoPackager` tool. This involves:
    *   Creating a Pydantic model for the tool's input arguments, which will mirror our `JobSettings` model.
    *   Writing the function that the MCP server will execute. This function will essentially call our existing Celery task and return a job ID, just like our web API.

3.  **Authentication & Security**: For local use, we can run the MCP server without authentication. For a production environment, the MCP SDK supports various authentication schemes, such as API keys, which we can easily add if needed.

## 3. CI/CD Pipeline with GitHub Actions

To ensure code quality and automate our build process, we will implement a simple but effective CI/CD pipeline using GitHub Actions.

### Why GitHub Actions?

It is tightly integrated with our repository, has a generous free tier suitable for portfolio projects, and is highly configurable.

### Workflow (`.github/workflows/ci.yml`)

The pipeline will be triggered on every push to the `main` branch and will consist of the following jobs:

1.  **Lint & Test**:
    *   Check out the code.
    *   Set up Python.
    *   Install dependencies.
    *   Run a linter (e.g., `flake8` or `ruff`) to enforce code style.
    *   (Optional but Recommended) Run unit tests using `pytest`.

2.  **Build Docker Image**:
    *   If the linting/testing job succeeds, this job will run.
    *   Log in to a container registry (e.g., Docker Hub or GitHub Container Registry).
    *   Build the Docker image for the web app using the existing `Dockerfile`.
    *   Tag the image with the commit SHA and `latest`.
    *   Push the image to the registry.

This setup provides a professional workflow that automatically validates our code and prepares it for deployment, making it a perfect showcase for potential employers.
