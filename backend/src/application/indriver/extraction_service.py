"""InDriver OCR extraction service."""

import io
import logging
import tempfile
import uuid
from pathlib import Path
from typing import List, Tuple, Optional
from datetime import datetime

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from .schemas import (
    ExtractedInDriverRide,
    ExtractResponse,
    ExtractionError,
    ExtractionSummary,
    ExportFormat,
)
from .text_parser import InDriverTextParser

logger = logging.getLogger(__name__)


class InDriverExtractionService:
    """Service for extracting ride data from InDriver screenshots and PDFs."""

    def __init__(self):
        """Initialize the extraction service."""
        self.parser = InDriverTextParser()
        self._tesseract_available = self._check_tesseract()

    def _check_tesseract(self) -> bool:
        """Check if Tesseract is available."""
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            return True
        except Exception as e:
            logger.warning(f"Tesseract not available: {e}")
            return False

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy.
        Optimized for InDriver dark-theme screenshots (white text on black).

        Args:
            image: PIL Image object

        Returns:
            Preprocessed PIL Image
        """
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize if too large (maintain aspect ratio)
        max_size = 2000
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        # Convert to grayscale
        image = image.convert("L")

        # INVERT: InDriver has white text on dark background
        # OCR works better with dark text on light background
        image = ImageOps.invert(image)

        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.8)

        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)

        return image

    def extract_text_from_image(self, image: Image.Image) -> Tuple[str, float]:
        """
        Extract text from preprocessed image using OCR.

        Args:
            image: Preprocessed PIL Image

        Returns:
            Tuple of (extracted_text, confidence_score)
        """
        if not self._tesseract_available:
            logger.warning("Tesseract not available, using fallback")
            return self._fallback_ocr(image)

        try:
            import pytesseract

            # Configure Tesseract for Spanish
            custom_config = r"--oem 3 --psm 6 -l spa"

            # Get text with confidence data
            data = pytesseract.image_to_data(
                image,
                config=custom_config,
                output_type=pytesseract.Output.DICT,
            )

            # Extract text and calculate average confidence
            text_parts = []
            confidences = []

            for i, word in enumerate(data["text"]):
                if word.strip():
                    text_parts.append(word)
                    conf = data["conf"][i]
                    if conf > 0:  # -1 means no confidence
                        confidences.append(conf)

            text = " ".join(text_parts)
            avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.5

            # Also get full text for better structure
            full_text = pytesseract.image_to_string(image, config=custom_config)

            return full_text, avg_confidence

        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return "", 0.0

    def _fallback_ocr(self, image: Image.Image) -> Tuple[str, float]:
        """Fallback when Tesseract is not available."""
        # Return empty - in production would use cloud OCR
        logger.warning("Using fallback OCR (returns empty)")
        return "", 0.0

    def extract_from_bytes(
        self,
        file_bytes: bytes,
        file_name: str,
    ) -> List[Tuple[Optional[ExtractedInDriverRide], Optional[str]]]:
        """
        Extract ride data from image or PDF bytes.

        Args:
            file_bytes: Raw file bytes
            file_name: Original file name

        Returns:
            List of (extracted_ride or None, error_message or None) tuples.
            PDFs return one tuple per page, images return a single tuple.
        """
        try:
            # Determine file type
            if file_name.lower().endswith(".pdf"):
                return self._extract_from_pdf(file_bytes, file_name)
            else:
                # Wrap single image result in a list
                ride, error = self._extract_from_image(file_bytes, file_name)
                return [(ride, error)]

        except Exception as e:
            logger.exception(f"Extraction failed for {file_name}")
            return [(None, str(e))]

    def _extract_from_image(
        self,
        file_bytes: bytes,
        file_name: str,
    ) -> Tuple[Optional[ExtractedInDriverRide], Optional[str]]:
        """Extract from image file."""
        try:
            # Load image
            image = Image.open(io.BytesIO(file_bytes))

            # Preprocess
            processed = self.preprocess_image(image)

            # OCR
            text, confidence = self.extract_text_from_image(processed)

            if not text.strip():
                return None, "No text detected in image"

            # Parse
            ride = self.parser.parse(text)
            ride.source_image_path = file_name
            ride.id = str(uuid.uuid4())

            # Validate minimum required fields
            if ride.mis_ingresos == 0 and ride.tarifa == 0 and not ride.passenger_name:
                return None, "Could not extract required fields from image"

            return ride, None

        except Exception as e:
            logger.exception(f"Image extraction failed for {file_name}")
            return None, f"Image processing error: {str(e)}"

    def _extract_from_pdf(
        self,
        file_bytes: bytes,
        file_name: str,
    ) -> List[Tuple[Optional[ExtractedInDriverRide], Optional[str]]]:
        """
        Extract from PDF file - handles multi-page PDFs.

        Returns a list of (ride, error) tuples, one per page.
        """
        try:
            from pdf2image import convert_from_bytes

            # Convert PDF to images (one per page)
            images = convert_from_bytes(file_bytes, dpi=200)

            if not images:
                return [(None, "No pages found in PDF")]

            results = []

            # Process each page as a separate ride
            for page_num, image in enumerate(images, start=1):
                try:
                    # Process as image
                    processed = self.preprocess_image(image)
                    text, confidence = self.extract_text_from_image(processed)

                    # Debug: log first 500 chars of OCR text
                    logger.info(f"Page {page_num} OCR text (first 500 chars): {text[:500] if text else 'EMPTY'}")

                    if not text.strip():
                        results.append((None, f"No text detected in PDF page {page_num}"))
                        continue

                    ride = self.parser.parse(text)
                    ride.source_image_path = f"{file_name} (page {page_num})"
                    ride.id = str(uuid.uuid4())

                    # Debug: log parsed values
                    logger.info(f"Page {page_num} parsed: tarifa={ride.tarifa}, total_recibido={ride.total_recibido}, mis_ingresos={ride.mis_ingresos}, passenger={ride.passenger_name}, status={ride.status}")

                    # Validate: need at least one meaningful field
                    # Cancelled rides may have 0 values, so also accept if we have date, passenger, or cancelled status
                    has_financial = ride.mis_ingresos > 0 or ride.tarifa > 0
                    has_identity = bool(ride.passenger_name) or ride.date is not None
                    is_cancelled = ride.status != "completed"

                    if not has_financial and not has_identity and not is_cancelled:
                        results.append((None, f"Could not extract required fields from page {page_num}"))
                        continue

                    results.append((ride, None))

                except Exception as e:
                    logger.error(f"Failed to extract from page {page_num}: {e}")
                    results.append((None, f"Page {page_num} error: {str(e)}"))

            return results

        except ImportError:
            return [(None, "PDF processing not available. Install: brew install poppler")]
        except Exception as e:
            logger.exception(f"PDF extraction failed for {file_name}")
            return [(None, f"PDF processing error: {str(e)}")]

    def extract_batch(
        self,
        files: List[Tuple[bytes, str]],
    ) -> ExtractResponse:
        """
        Extract ride data from multiple files.

        Args:
            files: List of (file_bytes, file_name) tuples

        Returns:
            ExtractResponse with results and errors
        """
        results: List[ExtractedInDriverRide] = []
        errors: List[ExtractionError] = []
        total_pages = 0

        for file_bytes, file_name in files:
            # Each file can return multiple results (for multi-page PDFs)
            extraction_results = self.extract_from_bytes(file_bytes, file_name)
            total_pages += len(extraction_results)

            for ride, error in extraction_results:
                if ride:
                    results.append(ride)
                elif error:
                    errors.append(ExtractionError(file_name=file_name, error=error))

        # Calculate summary
        successful = len(results)
        failed = len(errors)
        avg_confidence = (
            sum(r.extraction_confidence for r in results) / successful
            if successful > 0
            else 0.0
        )

        summary = ExtractionSummary(
            total_files=len(files),
            successful_extractions=successful,
            failed_extractions=failed,
            average_confidence=round(avg_confidence, 2),
        )

        return ExtractResponse(
            success=successful > 0,
            results=results,
            errors=errors,
            summary=summary,
        )

    def export_to_csv(self, rides: List[ExtractedInDriverRide]) -> str:
        """Export rides to CSV format."""
        import csv
        from io import StringIO

        output = StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "ID",
            "Fecha",
            "Hora",
            "Pasajero",
            "Destino",
            "Duración (min)",
            "Distancia (km)",
            "Estado",
            "Método de Pago",
            "Tarifa (COP)",
            "Total Recibido (COP)",
            "Comisión (COP)",
            "IVA (COP)",
            "Total Pagado (COP)",
            "Mis Ingresos (COP)",
            "Calificación",
        ])

        # Data rows
        for ride in rides:
            duration_value = ride.duration.value if ride.duration else 0
            distance_value = ride.distance.value if ride.distance else 0

            writer.writerow([
                ride.id,
                ride.date.strftime("%Y-%m-%d") if ride.date else "",
                ride.time,
                ride.passenger_name,
                ride.destination_address,
                duration_value,
                distance_value,
                ride.status.value,
                ride.payment_method_label,
                ride.tarifa,
                ride.total_recibido,
                ride.comision_servicio,
                ride.iva_pago_servicio,
                ride.total_pagado,
                ride.mis_ingresos,
                ride.rating_given or "",
            ])

        return output.getvalue()

    def export_to_json(self, rides: List[ExtractedInDriverRide]) -> str:
        """Export rides to JSON format."""
        import json

        data = [ride.model_dump(mode="json") for ride in rides]
        return json.dumps(data, indent=2, ensure_ascii=False)

    def validate_financial_consistency(
        self,
        ride: ExtractedInDriverRide,
    ) -> Tuple[bool, List[str]]:
        """
        Validate financial data consistency.

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors: List[str] = []
        tolerance = 1.0  # Allow 1 COP rounding difference

        # Check net income calculation
        if ride.total_recibido > 0 and ride.total_pagado > 0:
            expected_net = ride.total_recibido - ride.total_pagado
            if abs(ride.mis_ingresos - expected_net) > tolerance:
                errors.append(
                    f"Net income mismatch: expected {expected_net}, got {ride.mis_ingresos}"
                )

        # Check commission calculation
        if ride.tarifa > 0 and ride.comision_porcentaje > 0:
            expected_commission = ride.tarifa * (ride.comision_porcentaje / 100)
            if abs(ride.comision_servicio - expected_commission) > tolerance:
                errors.append(
                    f"Commission mismatch: expected {expected_commission:.2f}, got {ride.comision_servicio}"
                )

        # Check IVA calculation (19% of commission)
        if ride.comision_servicio > 0:
            expected_iva = ride.comision_servicio * 0.19
            if abs(ride.iva_pago_servicio - expected_iva) > tolerance:
                errors.append(
                    f"IVA mismatch: expected {expected_iva:.2f}, got {ride.iva_pago_servicio}"
                )

        # Check total paid consistency
        if ride.comision_servicio > 0 or ride.iva_pago_servicio > 0:
            expected_total = ride.comision_servicio + ride.iva_pago_servicio
            if abs(ride.total_pagado - expected_total) > tolerance:
                errors.append(
                    f"Total paid mismatch: expected {expected_total:.2f}, got {ride.total_pagado}"
                )

        return len(errors) == 0, errors
