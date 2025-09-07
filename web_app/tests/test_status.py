import pytest
from httpx import AsyncClient
from unittest.mock import patch
from photopackager.web_app.main import app

@pytest.mark.asyncio
@patch('photopackager.web_app.main.celery_app.AsyncResult')
async def test_job_status_success(mock_async_result):
    job_id = 'dummy-job-id'
    # Setup mock
    mock_result = mock_async_result.return_value
    mock_result.status = 'SUCCESS'
    mock_result.info = {'output_files': ['output.zip']}
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get(f"/api/jobs/{job_id}/status")
    assert resp.status_code == 200
    assert resp.json()['status'] == 'SUCCESS'
    assert 'output_files' in resp.json()

@pytest.mark.asyncio
@patch('photopackager.web_app.main.celery_app.AsyncResult')
async def test_job_status_pending(mock_async_result):
    job_id = 'dummy-job-id'
    mock_result = mock_async_result.return_value
    mock_result.status = 'PENDING'
    mock_result.info = None
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get(f"/api/jobs/{job_id}/status")
    assert resp.status_code == 200
    assert resp.json()['status'] == 'PENDING'
