"""Pydantic schemas for InDriver extraction."""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
import uuid


class DurationUnit(str, Enum):
    """Duration unit types."""
    MINUTES = "min"
    HOURS = "hr"


class DistanceUnit(str, Enum):
    """Distance unit types."""
    KILOMETERS = "km"
    METERS = "metro"


class RideStatus(str, Enum):
    """Ride completion status."""
    COMPLETED = "completed"
    CANCELLED_BY_PASSENGER = "cancelled_by_passenger"
    CANCELLED_BY_DRIVER = "cancelled_by_driver"


class PaymentMethod(str, Enum):
    """Payment method types."""
    CASH = "cash"
    NEQUI = "nequi"
    OTHER = "other"


class Duration(BaseModel):
    """Duration extracted from ride details."""
    value: int
    unit: DurationUnit


class Distance(BaseModel):
    """Distance extracted from ride details."""
    value: float
    unit: DistanceUnit


class FieldConfidences(BaseModel):
    """Per-field confidence scores."""
    date: float = 0.0
    time: float = 0.0
    destination_address: float = 0.0
    duration: float = 0.0
    distance: float = 0.0
    passenger_name: float = 0.0
    payment_method: float = 0.0
    tarifa: float = 0.0
    total_recibido: float = 0.0
    comision_servicio: float = 0.0
    iva_pago_servicio: float = 0.0
    total_pagado: float = 0.0
    mis_ingresos: float = 0.0


class ExtractedInDriverRide(BaseModel):
    """Complete extracted ride data from InDriver screenshot/PDF."""

    # Identification
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_image_path: str = ""
    extraction_confidence: float = 0.0

    # Ride Details
    date: Optional[datetime] = None
    time: str = ""
    destination_address: str = ""
    duration: Optional[Duration] = None
    distance: Optional[Distance] = None

    # Passenger Info
    passenger_name: str = ""
    rating_given: Optional[int] = Field(default=None, ge=1, le=5)

    # Status
    status: RideStatus = RideStatus.COMPLETED
    cancellation_reason: Optional[str] = None

    # Payment
    payment_method: PaymentMethod = PaymentMethod.CASH
    payment_method_label: str = ""

    # Financial - Income (Recibí)
    tarifa: float = 0.0
    total_recibido: float = 0.0

    # Financial - Deductions (Pagué)
    comision_servicio: float = 0.0
    comision_porcentaje: float = 9.5
    iva_pago_servicio: float = 0.0
    total_pagado: float = 0.0

    # Financial - Net
    mis_ingresos: float = 0.0

    # Metadata
    extracted_at: datetime = Field(default_factory=datetime.now)
    raw_ocr_text: Optional[str] = None
    field_confidences: FieldConfidences = Field(default_factory=FieldConfidences)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ExtractionError(BaseModel):
    """Error during extraction."""
    file_name: str
    error: str


class ExtractionSummary(BaseModel):
    """Summary of extraction batch."""
    total_files: int
    successful_extractions: int
    failed_extractions: int
    average_confidence: float


class ExtractResponse(BaseModel):
    """Response from OCR extraction endpoint."""
    success: bool
    results: List[ExtractedInDriverRide]
    errors: List[ExtractionError]
    summary: ExtractionSummary


class ImportedRide(BaseModel):
    """Successfully imported ride reference."""
    ride_id: str
    external_id: str


class SkippedRide(BaseModel):
    """Skipped ride during import."""
    index: int
    reason: str


class ImportRequest(BaseModel):
    """Request to import extracted rides."""
    rides: List[ExtractedInDriverRide]
    driver_id: str


class ImportResponse(BaseModel):
    """Response from import endpoint."""
    success: bool
    imported: List[ImportedRide]
    skipped: List[SkippedRide]


class ExportFormat(str, Enum):
    """Export format options."""
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"


class ExportRequest(BaseModel):
    """Request to export extracted rides."""
    rides: List[ExtractedInDriverRide]
    format: ExportFormat = ExportFormat.CSV
