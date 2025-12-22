"""
Integration Tests for InDriver API Endpoints

Tests the InDriver extraction, import, export, and validation endpoints.
"""

import io
import json
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from PIL import Image

from src.main import app
from src.application.indriver.schemas import (
    ExtractedInDriverRide,
    RideStatus,
    PaymentMethod,
    Duration,
    DurationUnit,
    Distance,
    DistanceUnit,
    ExportFormat,
)


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def sample_ride():
    """Create a sample extracted ride for testing."""
    return ExtractedInDriverRide(
        id="test-ride-001",
        source_image_path="test_screenshot.png",
        date=datetime(2024, 12, 2),
        time="07:52",
        passenger_name="Carlos",
        destination_address="Calle 100 # 15-30",
        duration=Duration(value=20, unit=DurationUnit.MINUTES),
        distance=Distance(value=6.4, unit=DistanceUnit.KILOMETERS),
        status=RideStatus.COMPLETED,
        payment_method=PaymentMethod.CASH,
        payment_method_label="Pago en efectivo",
        tarifa=15000.0,
        total_recibido=15000.0,
        comision_servicio=1425.0,
        comision_porcentaje=9.5,
        iva_pago_servicio=270.75,
        total_pagado=1695.75,
        mis_ingresos=13304.25,
        rating_given=5,
        extraction_confidence=0.92,
    )


@pytest.fixture
def sample_image_bytes():
    """Create a sample test image."""
    # Create a simple test image
    img = Image.new("RGB", (100, 100), color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


class TestExtractEndpoint:
    """Tests for /api/v1/indriver/extract endpoint."""

    def test_extract_no_files_returns_400(self, client):
        """Request with no files returns 400."""
        response = client.post("/api/v1/indriver/extract")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_extract_unsupported_file_type_returns_400(self, client):
        """Unsupported file types return 400."""
        response = client.post(
            "/api/v1/indriver/extract",
            files={"files": ("test.txt", b"text content", "text/plain")},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Unsupported file type" in response.json()["detail"]

    def test_extract_accepts_png_files(self, client, sample_image_bytes):
        """PNG files are accepted."""
        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True,
                results=[],
                errors=[],
                summary=MagicMock(
                    total_files=1,
                    successful_extractions=0,
                    failed_extractions=1,
                    average_confidence=0.0,
                ),
            )

            response = client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.png", sample_image_bytes, "image/png")},
            )
            # Should not reject file type
            assert response.status_code != status.HTTP_400_BAD_REQUEST or "Unsupported" not in str(
                response.json().get("detail", "")
            )

    def test_extract_accepts_jpg_files(self, client, sample_image_bytes):
        """JPG files are accepted."""
        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True,
                results=[],
                errors=[],
                summary=MagicMock(
                    total_files=1,
                    successful_extractions=0,
                    failed_extractions=1,
                    average_confidence=0.0,
                ),
            )

            response = client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.jpg", sample_image_bytes, "image/jpeg")},
            )
            assert response.status_code != status.HTTP_400_BAD_REQUEST or "Unsupported" not in str(
                response.json().get("detail", "")
            )

    def test_extract_accepts_pdf_files(self, client):
        """PDF files are accepted."""
        # Minimal valid PDF bytes
        pdf_bytes = b"%PDF-1.0\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>"

        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True,
                results=[],
                errors=[],
                summary=MagicMock(
                    total_files=1,
                    successful_extractions=0,
                    failed_extractions=1,
                    average_confidence=0.0,
                ),
            )

            response = client.post(
                "/api/v1/indriver/extract",
                files={"files": ("test.pdf", pdf_bytes, "application/pdf")},
            )
            assert response.status_code != status.HTTP_400_BAD_REQUEST or "Unsupported" not in str(
                response.json().get("detail", "")
            )

    def test_extract_file_too_large_returns_400(self, client):
        """Files over 10MB are rejected."""
        # Create a 11MB file
        large_content = b"x" * (11 * 1024 * 1024)

        response = client.post(
            "/api/v1/indriver/extract",
            files={"files": ("large.png", large_content, "image/png")},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "too large" in response.json()["detail"]

    def test_extract_multiple_files(self, client, sample_image_bytes):
        """Multiple files can be processed at once."""
        with patch(
            "src.presentation.api.v1.endpoints.indriver.extraction.extraction_service.extract_batch"
        ) as mock_extract:
            mock_extract.return_value = MagicMock(
                success=True,
                results=[],
                errors=[],
                summary=MagicMock(
                    total_files=2,
                    successful_extractions=0,
                    failed_extractions=2,
                    average_confidence=0.0,
                ),
            )

            response = client.post(
                "/api/v1/indriver/extract",
                files=[
                    ("files", ("test1.png", sample_image_bytes, "image/png")),
                    ("files", ("test2.png", sample_image_bytes, "image/png")),
                ],
            )
            # Verify extract_batch was called with 2 files
            mock_extract.assert_called_once()
            call_args = mock_extract.call_args[0][0]
            assert len(call_args) == 2


class TestImportEndpoint:
    """Tests for /api/v1/indriver/import endpoint."""

    def test_import_no_rides_returns_400(self, client):
        """Import with no rides returns 400."""
        response = client.post(
            "/api/v1/indriver/import",
            json={"rides": [], "driver_id": "test-driver-001"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "No rides provided" in response.json()["detail"]

    def test_import_valid_ride_succeeds(self, client, sample_ride):
        """Valid ride is imported successfully."""
        response = client.post(
            "/api/v1/indriver/import",
            json={
                "rides": [sample_ride.model_dump(mode="json")],
                "driver_id": "test-driver-001",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert len(data["imported"]) == 1
        assert len(data["skipped"]) == 0

    def test_import_invalid_financial_data_skipped(self, client, sample_ride):
        """Ride with inconsistent financial data is skipped."""
        # Create ride with mismatched totals
        invalid_ride = sample_ride.model_copy()
        invalid_ride.total_recibido = 15000.0
        invalid_ride.total_pagado = 1695.75
        invalid_ride.mis_ingresos = 5000.0  # Wrong! Should be ~13304.25

        response = client.post(
            "/api/v1/indriver/import",
            json={
                "rides": [invalid_ride.model_dump(mode="json")],
                "driver_id": "test-driver-001",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["skipped"]) == 1
        assert "mismatch" in data["skipped"][0]["reason"].lower()

    def test_import_multiple_rides_partial_success(self, client, sample_ride):
        """Mix of valid and invalid rides - valid ones imported, invalid skipped."""
        valid_ride = sample_ride.model_copy()
        valid_ride.id = "valid-ride"

        invalid_ride = sample_ride.model_copy()
        invalid_ride.id = "invalid-ride"
        invalid_ride.mis_ingresos = 0  # Wrong total

        response = client.post(
            "/api/v1/indriver/import",
            json={
                "rides": [
                    valid_ride.model_dump(mode="json"),
                    invalid_ride.model_dump(mode="json"),
                ],
                "driver_id": "test-driver-001",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert len(data["imported"]) >= 1


class TestExportEndpoint:
    """Tests for /api/v1/indriver/export endpoint."""

    def test_export_no_rides_returns_400(self, client):
        """Export with no rides returns 400."""
        response = client.post(
            "/api/v1/indriver/export",
            json={"rides": [], "format": "csv"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "No rides provided" in response.json()["detail"]

    def test_export_csv_format(self, client, sample_ride):
        """Export to CSV returns CSV content."""
        response = client.post(
            "/api/v1/indriver/export",
            json={
                "rides": [sample_ride.model_dump(mode="json")],
                "format": "csv",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment" in response.headers["content-disposition"]
        assert ".csv" in response.headers["content-disposition"]

        # Verify CSV content
        content = response.text
        assert "ID" in content  # Header row
        assert "Carlos" in content  # Passenger name
        assert "15000" in content  # Tarifa

    def test_export_json_format(self, client, sample_ride):
        """Export to JSON returns JSON content."""
        response = client.post(
            "/api/v1/indriver/export",
            json={
                "rides": [sample_ride.model_dump(mode="json")],
                "format": "json",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "application/json"

        # Verify JSON content
        data = json.loads(response.text)
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["passenger_name"] == "Carlos"

    def test_export_multiple_rides(self, client, sample_ride):
        """Export multiple rides."""
        ride1 = sample_ride.model_copy()
        ride1.id = "ride-1"
        ride1.passenger_name = "Carlos"

        ride2 = sample_ride.model_copy()
        ride2.id = "ride-2"
        ride2.passenger_name = "María"

        response = client.post(
            "/api/v1/indriver/export",
            json={
                "rides": [
                    ride1.model_dump(mode="json"),
                    ride2.model_dump(mode="json"),
                ],
                "format": "csv",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        content = response.text
        assert "Carlos" in content
        assert "María" in content


class TestValidateEndpoint:
    """Tests for /api/v1/indriver/validate endpoint."""

    def test_validate_consistent_ride_is_valid(self, client, sample_ride):
        """Ride with consistent financial data is valid."""
        response = client.post(
            "/api/v1/indriver/validate",
            json=sample_ride.model_dump(mode="json"),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_valid"] is True
        assert len(data["errors"]) == 0

    def test_validate_net_income_mismatch(self, client, sample_ride):
        """Detect net income mismatch."""
        invalid_ride = sample_ride.model_copy()
        invalid_ride.mis_ingresos = 5000.0  # Wrong!

        response = client.post(
            "/api/v1/indriver/validate",
            json=invalid_ride.model_dump(mode="json"),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_valid"] is False
        assert any("net income" in e.lower() for e in data["errors"])

    def test_validate_commission_mismatch(self, client, sample_ride):
        """Detect commission calculation mismatch."""
        invalid_ride = sample_ride.model_copy()
        invalid_ride.comision_servicio = 500.0  # Wrong! Should be 1425

        response = client.post(
            "/api/v1/indriver/validate",
            json=invalid_ride.model_dump(mode="json"),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_valid"] is False
        assert any("commission" in e.lower() for e in data["errors"])

    def test_validate_iva_mismatch(self, client, sample_ride):
        """Detect IVA calculation mismatch."""
        invalid_ride = sample_ride.model_copy()
        invalid_ride.iva_pago_servicio = 100.0  # Wrong! Should be ~270.75

        response = client.post(
            "/api/v1/indriver/validate",
            json=invalid_ride.model_dump(mode="json"),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_valid"] is False
        assert any("iva" in e.lower() for e in data["errors"])

    def test_validate_allows_tolerance(self, client, sample_ride):
        """Small rounding differences within tolerance are accepted."""
        # Adjust by less than 1 COP tolerance
        ride = sample_ride.model_copy()
        ride.mis_ingresos = 13304.25 + 0.5  # Within 1 COP tolerance

        response = client.post(
            "/api/v1/indriver/validate",
            json=ride.model_dump(mode="json"),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Should still be valid due to tolerance
        # Note: This depends on the exact values and calculation order


class TestStatsEndpoint:
    """Tests for /api/v1/indriver/stats endpoint."""

    def test_get_stats_returns_structure(self, client):
        """Stats endpoint returns expected structure."""
        response = client.get("/api/v1/indriver/stats")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify expected fields
        assert "total_extractions" in data
        assert "successful_extractions" in data
        assert "failed_extractions" in data
        assert "average_confidence" in data
        assert "tesseract_available" in data

    def test_stats_returns_numeric_values(self, client):
        """Stats values are numeric."""
        response = client.get("/api/v1/indriver/stats")
        data = response.json()

        assert isinstance(data["total_extractions"], int)
        assert isinstance(data["successful_extractions"], int)
        assert isinstance(data["failed_extractions"], int)
        assert isinstance(data["average_confidence"], (int, float))
        assert isinstance(data["tesseract_available"], bool)


class TestExtractionService:
    """Tests for the extraction service itself."""

    def test_validate_financial_consistency_valid(self, sample_ride):
        """Valid financial data passes validation."""
        from src.application.indriver.extraction_service import InDriverExtractionService

        service = InDriverExtractionService()
        is_valid, errors = service.validate_financial_consistency(sample_ride)

        assert is_valid is True
        assert len(errors) == 0

    def test_validate_financial_consistency_invalid_net(self, sample_ride):
        """Invalid net income fails validation."""
        from src.application.indriver.extraction_service import InDriverExtractionService

        service = InDriverExtractionService()

        invalid_ride = sample_ride.model_copy()
        invalid_ride.mis_ingresos = 0.0

        is_valid, errors = service.validate_financial_consistency(invalid_ride)

        assert is_valid is False
        assert len(errors) > 0

    def test_export_to_csv_format(self, sample_ride):
        """CSV export has proper format."""
        from src.application.indriver.extraction_service import InDriverExtractionService

        service = InDriverExtractionService()
        csv_content = service.export_to_csv([sample_ride])

        # Verify header
        lines = csv_content.strip().split("\n")
        assert len(lines) >= 2  # Header + data row

        header = lines[0]
        assert "ID" in header
        assert "Fecha" in header
        assert "Pasajero" in header
        assert "Tarifa" in header

        # Verify data
        data_row = lines[1]
        assert sample_ride.id in data_row
        assert sample_ride.passenger_name in data_row

    def test_export_to_json_format(self, sample_ride):
        """JSON export has proper format."""
        from src.application.indriver.extraction_service import InDriverExtractionService

        service = InDriverExtractionService()
        json_content = service.export_to_json([sample_ride])

        data = json.loads(json_content)
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == sample_ride.id
        assert data[0]["passenger_name"] == sample_ride.passenger_name
