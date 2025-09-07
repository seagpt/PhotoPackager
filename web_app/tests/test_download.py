import pytest
from httpx import AsyncClient
from unittest.mock import patch
from photopackager.web_app.main import app

@pytest.mark.asyncio
@patch('photopackager.web_app.main.os.path.isfile', return_value=True)
@patch('photopackager.web_app.main.open', create=True)
async def test_download_file_success(mock_open, mock_isfile):
    job_id = 'dummy-job-id'
    filename = 'output.zip'
    mock_open.return_value.__enter__.return_value.read.return_value = b'dummydata'
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get(f"/api/jobs/{job_id}/download/{filename}")
    assert resp.status_code == 200
    assert resp.headers["content-disposition"].startswith("attachment;")

@pytest.mark.asyncio
@patch('photopackager.web_app.main.os.path.isfile', return_value=False)
async def test_download_file_not_found(mock_isfile):
    job_id = 'dummy-job-id'
    filename = 'notfound.zip'
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get(f"/api/jobs/{job_id}/download/{filename}")
    assert resp.status_code == 404
