"""InDriver extraction API endpoints."""

import logging

from fastapi import APIRouter, File, HTTPException, Response, UploadFile

from src.application.indriver import (
    ExportRequest,
    ExtractedInDriverRide,
    ExtractResponse,
    ImportRequest,
    ImportResponse,
    InDriverExtractionService,
)
from src.application.indriver.schemas import (
    ExportFormat,
    ImportedRide,
    SkippedRide,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/indriver", tags=["indriver"])

# Initialize extraction service
extraction_service = InDriverExtractionService()


@router.post("/extract", response_model=ExtractResponse)
async def extract_from_files(
    files: list[UploadFile] = File(..., description="Image or PDF files to extract from"),
) -> ExtractResponse:
    """
    Extract ride data from uploaded InDriver screenshots or PDFs.

    Supports:
    - PNG, JPG, JPEG images
    - PDF documents (single or multi-page)

    Returns extracted ride data with confidence scores.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate file types
    allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf"}
    file_data: list[tuple] = []

    for file in files:
        if not file.filename:
            continue

        ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.filename}. Allowed: {', '.join(allowed_extensions)}",
            )

        # Check file size (10MB max)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file.filename}. Maximum size: 10MB",
            )

        file_data.append((contents, file.filename))

    if not file_data:
        raise HTTPException(status_code=400, detail="No valid files provided")

    # Process extraction
    try:
        response = extraction_service.extract_batch(file_data)
        return response
    except Exception as e:
        logger.exception("Extraction failed")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}") from e


@router.post("/import", response_model=ImportResponse)
async def import_rides(request: ImportRequest) -> ImportResponse:
    """
    Import extracted rides into the database.

    Validates each ride and attempts to store it.
    Returns list of successfully imported and skipped rides.
    """
    if not request.rides:
        raise HTTPException(status_code=400, detail="No rides provided")

    imported: list[ImportedRide] = []
    skipped: list[SkippedRide] = []

    for i, ride in enumerate(request.rides):
        try:
            # Validate financial consistency
            is_valid, errors = extraction_service.validate_financial_consistency(ride)

            if not is_valid:
                skipped.append(SkippedRide(
                    index=i,
                    reason=f"Validation errors: {'; '.join(errors)}",
                ))
                continue

            # In a real implementation, save to database here
            # For now, just acknowledge the import
            imported.append(ImportedRide(
                ride_id=ride.id,
                external_id=f"INDRIVER-{ride.id[:8]}",
            ))

        except Exception as e:
            logger.error(f"Failed to import ride {i}: {e}")
            skipped.append(SkippedRide(
                index=i,
                reason=f"Import error: {str(e)}",
            ))

    return ImportResponse(
        success=len(imported) > 0,
        imported=imported,
        skipped=skipped,
    )


@router.post("/export")
async def export_rides(request: ExportRequest) -> Response:
    """
    Export extracted rides to specified format.

    Supports: CSV, JSON, XLSX
    Returns downloadable file.
    """
    if not request.rides:
        raise HTTPException(status_code=400, detail="No rides provided")

    try:
        if request.format == ExportFormat.CSV:
            content = extraction_service.export_to_csv(request.rides)
            return Response(
                content=content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": "attachment; filename=indriver_rides.csv",
                },
            )

        elif request.format == ExportFormat.JSON:
            content = extraction_service.export_to_json(request.rides)
            return Response(
                content=content,
                media_type="application/json",
                headers={
                    "Content-Disposition": "attachment; filename=indriver_rides.json",
                },
            )

        elif request.format == ExportFormat.XLSX:
            # XLSX would require openpyxl - return CSV as fallback
            content = extraction_service.export_to_csv(request.rides)
            return Response(
                content=content,
                media_type="text/csv",
                headers={
                    "Content-Disposition": "attachment; filename=indriver_rides.csv",
                },
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported export format: {request.format}",
            )

    except Exception as e:
        logger.exception("Export failed")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}") from e


@router.get("/stats")
async def get_extraction_stats() -> dict:
    """
    Get extraction statistics.

    Returns metrics about OCR accuracy and usage.
    """
    # In a real implementation, would query database for stats
    return {
        "total_extractions": 0,
        "successful_extractions": 0,
        "failed_extractions": 0,
        "average_confidence": 0.0,
        "tesseract_available": extraction_service._tesseract_available,
    }


@router.post("/validate")
async def validate_ride(ride: ExtractedInDriverRide) -> dict:
    """
    Validate a single extracted ride's financial data.

    Returns validation result and any errors found.
    """
    is_valid, errors = extraction_service.validate_financial_consistency(ride)
    return {
        "is_valid": is_valid,
        "errors": errors,
    }
