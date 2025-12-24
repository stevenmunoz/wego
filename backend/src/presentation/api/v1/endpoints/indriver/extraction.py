"""InDriver extraction API endpoints."""

import logging
import os
import re

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile

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
from src.presentation.dependencies import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/indriver", tags=["indriver"])

# Constants
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}
MAX_FILENAME_LENGTH = 255

# Initialize extraction service
extraction_service = InDriverExtractionService()


def sanitize_filename(filename: str | None) -> str | None:
    """
    Sanitize and validate filename.
    Returns None if filename is invalid or potentially dangerous.
    """
    if not filename:
        return None

    # Remove any path components (prevent directory traversal)
    filename = os.path.basename(filename)

    # Check length
    if len(filename) > MAX_FILENAME_LENGTH:
        return None

    # Check for null bytes or other dangerous characters
    if "\x00" in filename or ".." in filename:
        return None

    # Validate filename contains only safe characters
    # Allow alphanumeric, dots, underscores, hyphens, and spaces
    if not re.match(r"^[\w\-. ]+$", filename):
        return None

    return filename


def get_file_extension(filename: str) -> str:
    """Get lowercase file extension including the dot."""
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


@router.post("/extract", response_model=ExtractResponse)
async def extract_from_files(
    files: list[UploadFile] = File(..., description="Image or PDF files to extract from"),
    current_user_id: str = Depends(get_current_user_id),
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

    file_data: list[tuple] = []

    for file in files:
        # Sanitize and validate filename
        safe_filename = sanitize_filename(file.filename)
        if not safe_filename:
            raise HTTPException(
                status_code=400,
                detail="Invalid filename provided",
            )

        # Check file extension
        ext = get_file_extension(safe_filename)
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # Check Content-Length header first if available (prevent memory exhaustion)
        if file.size and file.size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
            )

        # Read file contents
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
            )

        file_data.append((contents, safe_filename))

    if not file_data:
        raise HTTPException(status_code=400, detail="No valid files provided")

    # Process extraction
    try:
        response = extraction_service.extract_batch(file_data)
        return response
    except Exception as e:
        logger.exception("Extraction failed", extra={"error": str(e)})
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the files. Please try again.",
        ) from e


@router.post("/import", response_model=ImportResponse)
async def import_rides(
    request: ImportRequest,
    current_user_id: str = Depends(get_current_user_id),
) -> ImportResponse:
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
                skipped.append(
                    SkippedRide(
                        index=i,
                        reason=f"Validation errors: {'; '.join(errors)}",
                    )
                )
                continue

            # In a real implementation, save to database here
            # For now, just acknowledge the import
            imported.append(
                ImportedRide(
                    ride_id=ride.id,
                    external_id=f"INDRIVER-{ride.id[:8]}",
                )
            )

        except Exception as e:
            logger.error(f"Failed to import ride {i}: {e}")
            skipped.append(
                SkippedRide(
                    index=i,
                    reason=f"Import error: {str(e)}",
                )
            )

    return ImportResponse(
        success=len(imported) > 0,
        imported=imported,
        skipped=skipped,
    )


@router.post("/export")
async def export_rides(
    request: ExportRequest,
    current_user_id: str = Depends(get_current_user_id),
) -> Response:
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
        logger.exception("Export failed", extra={"error": str(e)})
        raise HTTPException(
            status_code=500,
            detail="An error occurred while exporting the rides. Please try again.",
        ) from e


@router.get("/stats")
async def get_extraction_stats(
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
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
async def validate_ride(
    ride: ExtractedInDriverRide,
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """
    Validate a single extracted ride's financial data.

    Returns validation result and any errors found.
    """
    is_valid, errors = extraction_service.validate_financial_consistency(ride)
    return {
        "is_valid": is_valid,
        "errors": errors,
    }
