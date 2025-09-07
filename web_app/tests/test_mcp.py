import pytest
from httpx import AsyncClient
from unittest.mock import patch
from photopackager.web_app.main import app

@pytest.mark.asyncio
@patch('photopackager.web_app.mcp_tools.package_photos')
async def test_mcp_package_photos_tool(mock_package_photos):
    # Simulate MCP tool call
    mock_package_photos.return_value = {'job_id': 'test-id', 'message': 'Job accepted'}
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.post("/mcp/tools/package_photos/invoke", json={
            "input": {
                "files": ["dummy.jpg"],
                "settings": {"shoot_name": "Test", "base_name": "Test", "generate_optimized_jpg": True}
            }
        })
    assert resp.status_code in (200, 201)
    assert resp.json()['job_id'] == 'test-id'
