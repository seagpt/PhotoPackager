# PhotoPackager - System Architecture Document

This document provides a comprehensive architectural overview of the PhotoPackager web application. It is intended for current and future developers to understand the system's design, components, data flow, and development practices.

---

## 1. High-Level Architecture

The application follows a modern, service-oriented architecture composed of three primary, containerized services:

1.  **Web Server (`web`):** A FastAPI application that serves the user-facing web interface, provides a RESTful API for job management, and hosts the MCP server for AI agent integration.
2.  **Background Worker (`worker`):** A Celery worker responsible for executing the long-running, CPU-intensive photo processing and packaging jobs asynchronously.
3.  **Message Broker (`redis`):** A Redis instance that acts as the communication backbone between the Web Server and the Worker, queuing tasks and storing results.

This decoupled design ensures the web interface remains responsive and available, even while large jobs are being processed in the background.

![Architecture Diagram](assets/architecture.png) *Note: A visual diagram should be added here to illustrate the flow.*

---

## 2. Service Breakdown

All services are defined and orchestrated by `docker-compose.yml`.

### a. Web Server (`web`)

*   **Framework:** FastAPI
*   **File:** `photopackager/web_app/main.py`
*   **Responsibilities:**
    *   **Static File Serving:** Serves the frontend (`index.html`, `script.js`, `style.css`) from the `/static` directory.
    *   **RESTful API:** Exposes endpoints under `/api` for job submission (`POST /jobs`), status polling (`GET /jobs/{job_id}/status`), and file downloads (`GET /jobs/{job_id}/download/{filename}`).
    *   **Task Dispatching:** When a job is submitted, the web server is responsible for receiving the files, saving them to a temporary shared volume, and dispatching a task to the Celery worker via Redis.
    *   **MCP Server:** Mounts the MCP server as a FastAPI sub-application at the `/mcp` path, making the application's capabilities available to AI agents.

### b. Background Worker (`worker`)

*   **Framework:** Celery
*   **File:** `photopackager/web_app/worker.py`
*   **Responsibilities:**
    *   **Task Consumption:** Listens for new tasks on the Redis message queue.
    *   **Job Execution:** Executes the `run_packaging_job` task, which invokes the core `PhotoPackagerJob` logic from `photopackager_core`.
    *   **Result Storage:** Upon completion (or failure), it stores the job's result or error state back into the Redis result backend.

### c. Message Broker (`redis`)

*   **Image:** `redis:alpine`
*   **Responsibilities:**
    *   **Task Queue (Broker):** Holds tasks sent by the `web` service until a `worker` is available to process them.
    *   **Result Backend:** Stores the state and return values of completed tasks, allowing the `web` service to poll for job status.

---

## 3. Data Flow: Lifecycle of a Job

1.  **Upload:** The user selects files and configures settings in the web UI. The frontend JavaScript (`script.js`) bundles the files and settings into a `multipart/form-data` payload.
2.  **Submission:** The frontend sends a `POST` request to the `/api/jobs` endpoint.
3.  **Acceptance & Dispatch:** `main.py` receives the request. It generates a unique `job_id`, saves the uploaded files to a shared volume (`./temp_uploads`), and calls `celery_app.send_task()` to place a new job on the Redis queue. It immediately returns the `job_id` to the client.
4.  **Processing:** A Celery `worker` instance picks up the task from the queue. It executes the core packaging logic, reading from `./temp_uploads` and writing the final packages to another shared volume (`./outputs`).
5.  **Polling:** The frontend periodically sends `GET` requests to `/api/jobs/{job_id}/status`. The `web` service checks the Celery result backend (Redis) for the task's current state (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILURE`) and returns it.
6.  **Completion & Download:** Once the status is `SUCCESS`, the frontend displays download links pointing to the `/api/jobs/{job_id}/download/...` endpoint, which securely serves the final ZIP files from the `./outputs` directory.

---

## 4. CI/CD Pipeline

The Continuous Integration/Continuous Deployment pipeline is managed by GitHub Actions and defined in `.github/workflows/ci.yml`. It acts as a critical quality gate.

**Jobs run in the following order:**

1.  **`lint`:** Runs first. It uses the **Ruff** linter to check all Python code for style violations and potential bugs. This ensures code quality and consistency.
2.  **`test`:** Runs only if `lint` succeeds. This job installs all production and development dependencies and runs the entire test suite using `pytest`. This ensures the application's logic is correct.
3.  **`build-and-push-image`:** Runs only if `test` succeeds. This job builds the final Docker image and pushes it to the GitHub Container Registry. This ensures that only high-quality, fully tested code is published as a deployable artifact.

This multi-stage process prevents regressions and ensures that the `main` branch always has a stable, working, and deployable version of the application.

---

## 5. Testing Strategy

Our testing strategy focuses on fast, reliable, and automated unit tests.

*   **Framework:** `pytest`
*   **Location:** `photopackager/web_app/tests/`
*   **Dependencies:** Managed in `requirements-dev.txt` to keep the production image lean.

### Running Tests Locally

1.  Install dependencies: `pip install -r requirements.txt -r requirements-dev.txt`
2.  Run the suite: `cd photopackager/web_app && pytest`

### **Critical Concept: Mocking**

To keep tests fast and isolated, we **mock** external services. In `tests/test_api.py`, you will see:

```python
@patch('photopackager.web_app.main.celery_app.send_task')
```

This decorator intercepts any call to `send_task` and replaces it with a mock object. This is **essential**. It allows us to test the entire API endpoint's logic (receiving data, validation, etc.) *without* actually sending a task to Celery or needing Redis/a worker to be running. We simply assert that `send_task` was *called correctly*, isolating the web server for its unit test.

---

## 6. Notes for Future Developers

*   **Shared Volumes are Key:** The `outputs` and `temp_uploads` directories are mounted as volumes in `docker-compose.yml`. This is how the `web` and `worker` containers share files. Ensure any file paths used in the code are relative to the `/app` working directory inside the containers.
*   **Configuration:** The Celery broker URL is hardcoded to `redis://redis:6379/0`. The service name `redis` is resolved by Docker's internal DNS. Do not change this unless you are also changing the service name in `docker-compose.yml`.
*   **MCP Server:** The MCP server is mounted with `allow_local_files=True`. This is a potential security risk if the application were exposed to the public internet, as it allows the agent to read from the container's filesystem. For its current purpose as a local tool, this is acceptable.
*   **Extending Tests:** When adding new API endpoints, create corresponding tests in `test_api.py`. When adding new core logic, create new test files (e.g., `test_job.py`) to test that logic in isolation.
