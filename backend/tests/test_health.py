from fastapi.testclient import TestClient
import pytest
from smart_helpdesk.main import app, create_app


@pytest.fixture
def client() -> TestClient:
    """Fixture providing a FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_check_returns_200_and_healthy(client: TestClient) -> None:
    """GET /api/v1/health should return HTTP 200 with status 'healthy'."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_docs_endpoints(client: TestClient) -> None:
    """OpenAPI and Swagger docs should be accessible."""
    docs_response = client.get("/docs")
    assert docs_response.status_code == 200

    openapi_response = client.get("/openapi.json")
    assert openapi_response.status_code == 200
    data = openapi_response.json()
    assert data["info"]["title"] == "Smart-HelpDesk"
    assert "/api/v1/health" in data["paths"]


def test_unhandled_exception_returns_safe_500() -> None:
    """Unhandled exceptions must return a safe 500 without leaking stack traces."""
    test_app = create_app()
    test_app.debug = False

    @test_app.get("/trigger-unhandled-error")
    async def trigger_error() -> None:
        raise RuntimeError("Sensitive internal database connection error")

    with TestClient(test_app, raise_server_exceptions=False) as test_client:
        response = test_client.get("/trigger-unhandled-error")
        assert response.status_code == 500
        assert response.json() == {"detail": "Internal server error"}


def test_not_found_route(client: TestClient) -> None:
    """Non-existent routes should return standard FastAPI 404."""
    response = client.get("/api/v1/non-existent-path")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}


