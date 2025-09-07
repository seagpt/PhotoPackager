import pytest
from httpx import AsyncClient
import os
import json
from unittest.mock import patch

# Set an environment variable to indicate we are in a testing environment
# This can be used in the main app to alter behavior, e.g., use a test database.
os.environ['TESTING'] = 'True'

from photopackager.web_app.main import app

@pytest.mark.asyncio
async def test_read_root():
    """Test that the root endpoint successfully returns the static index.html file."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers['content-type']
    assert "<title>PhotoPackager</title>" in response.text

@pytest.mark.asyncio
@patch('photopackager.web_app.main.celery_app.send_task')
async def test_submit_job_success(mock_send_task):
    """Test successful job submission via the /api/jobs endpoint, mocking the Celery call."""
    # 1. Define test data
    dummy_file_content = b"this is a test image"
    dummy_file_name = "test_image.jpg"
    settings_data = {
        "shoot_name": "Test Shoot",
        "base_name": "test_job",
        "generate_optimized_jpg": True
    }
    settings_json = json.dumps(settings_data)

    # 2. Make the API request
    async with AsyncClient(app=app, base_url="http://test") as ac:
        files = {'files': (dummy_file_name, dummy_file_content, 'image/jpeg')}
        data = {'settings': settings_json}
        response = await ac.post("/api/jobs", files=files, data=data)

    # 3. Assert the HTTP response is correct
    assert response.status_code == 200
    response_json = response.json()
    assert "job_id" in response_json
    assert response_json["message"] == "Job accepted"

    # 4. Assert that the Celery task was called correctly
    mock_send_task.assert_called_once()
    call_args, call_kwargs = mock_send_task.call_args
    
    # Check the task name that was called
    assert call_args[0] == "photopackager.web_app.worker.run_packaging_job"
    
    # Check the arguments passed to the task
    task_args = call_args[1]
    assert task_args[0] == response_json["job_id"]  # job_id
    assert isinstance(task_args[1], str)          # job_dir is a string path
    assert task_args[2] == settings_data          # settings dict

    # Check the task_id keyword argument
    assert call_kwargs['task_id'] == response_json["job_id"]

@pytest.mark.asyncio
async def test_submit_job_no_files():
    """Test that job submission fails with a 400 error if no files are provided."""
    settings_json = json.dumps({"shoot_name": "Test Shoot", "base_name": "test_job"})

    async with AsyncClient(app=app, base_url="http://test") as ac:
        data = {'settings': settings_json}
        response = await ac.post("/api/jobs", data=data)

    assert response.status_code == 400
    assert response.json()["detail"] == "No files were uploaded."
