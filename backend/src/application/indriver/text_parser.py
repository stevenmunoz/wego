"""Text parser for extracting structured data from InDriver OCR output."""

import re
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
import logging

from .schemas import (
    ExtractedInDriverRide,
    Duration,
    Distance,
    DurationUnit,
    DistanceUnit,
    RideStatus,
    PaymentMethod,
    FieldConfidences,
)

logger = logging.getLogger(__name__)


# Spanish month abbreviations to month numbers (1-indexed)
SPANISH_MONTHS: Dict[str, int] = {
    "ene": 1,
    "feb": 2,
    "mar": 3,
    "abr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "ago": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dic": 12,
}


class InDriverTextParser:
    """Parser for extracting structured data from InDriver OCR text."""

    # Regex patterns for extraction
    PATTERNS = {
        # Date: "mar, 2 dic 2025" or "2 dic 2025"
        "date": re.compile(
            r"(?:lun|mar|mi[eé]|jue|vie|s[aá]b|dom)[,.]?\s*"
            r"(\d{1,2})\s+"
            r"(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+"
            r"(\d{4})",
            re.IGNORECASE,
        ),
        # Time: "07:52 a.m." or "04:01 p.m."
        "time": re.compile(
            r"(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)",
            re.IGNORECASE,
        ),
        # Duration: "20 min." or "1 hr."
        "duration": re.compile(
            r"(?:Duraci[oó]n)?\s*(\d+)\s*(min|hr)\.?",
            re.IGNORECASE,
        ),
        # Distance: "6,4 km" or "715 metro" (Spanish uses comma as decimal)
        # Also handles OCR errors where comma becomes space: "6 4 km"
        "distance": re.compile(
            r"(?:Distancia)?\s*(\d+[,\.\s]?\d*)\s*(km|metro)",
            re.IGNORECASE,
        ),
        # Currency: "COP 15,000.00" or "COP 1,425.00"
        "currency": re.compile(
            r"COP\s*([\d,\.]+)",
            re.IGNORECASE,
        ),
        # Percentage: "9.5%" or "9,5%"
        "percentage": re.compile(
            r"([\d,\.]+)\s*%",
        ),
        # Cancelled by passenger
        "cancelled_passenger": re.compile(
            r"pasajero\s+cancel[oó]",
            re.IGNORECASE,
        ),
        # Payment methods
        "payment_cash": re.compile(
            r"pago\s+en\s+efectivo",
            re.IGNORECASE,
        ),
        "payment_nequi": re.compile(
            r"nequi",
            re.IGNORECASE,
        ),
        # Key section labels
        "mis_ingresos": re.compile(
            r"mis\s+ingresos",
            re.IGNORECASE,
        ),
        "tarifa": re.compile(
            r"\btarifa\b",
            re.IGNORECASE,
        ),
        "total_recibido": re.compile(
            r"total\s+recibido",
            re.IGNORECASE,
        ),
        "comision": re.compile(
            r"(pagos?\s+por\s+el\s+servicio|9[,.]5\s*%)",
            re.IGNORECASE,
        ),
        "iva": re.compile(
            r"iva\s+(del\s+)?pago",
            re.IGNORECASE,
        ),
        "total_pagado": re.compile(
            r"total\s+pagado",
            re.IGNORECASE,
        ),
        # Rating stars
        "rating": re.compile(
            r"[★⭐]{1,5}|calificaste",
            re.IGNORECASE,
        ),
    }

    def parse(self, ocr_text: str) -> ExtractedInDriverRide:
        """
        Parse OCR text and extract structured ride data.

        Args:
            ocr_text: Raw text from OCR engine

        Returns:
            ExtractedInDriverRide with extracted fields
        """
        ride = ExtractedInDriverRide(raw_ocr_text=ocr_text)
        confidences = FieldConfidences()

        # Clean the text
        text = self._clean_text(ocr_text)
        lines = text.split("\n")

        # Parse date and time
        date_result = self._parse_date(text)
        if date_result:
            ride.date = date_result[0]
            confidences.date = date_result[1]

        time_result = self._parse_time(text)
        if time_result:
            ride.time = time_result[0]
            confidences.time = time_result[1]

        # Parse duration
        duration_result = self._parse_duration(text)
        if duration_result:
            ride.duration = duration_result[0]
            confidences.duration = duration_result[1]

        # Parse distance
        distance_result = self._parse_distance(text)
        if distance_result:
            ride.distance = distance_result[0]
            confidences.distance = distance_result[1]

        # Parse status (cancelled or completed)
        status_result = self._parse_status(text)
        ride.status = status_result[0]
        if status_result[0] != RideStatus.COMPLETED:
            ride.cancellation_reason = "El pasajero canceló"

        # Parse payment method
        payment_result = self._parse_payment_method(text)
        ride.payment_method = payment_result[0]
        ride.payment_method_label = payment_result[1]
        confidences.payment_method = payment_result[2]

        # Parse financial data
        financial_data = self._parse_financial_data(text)
        ride.mis_ingresos = financial_data.get("mis_ingresos", 0.0)
        ride.tarifa = financial_data.get("tarifa", 0.0)
        ride.total_recibido = financial_data.get("total_recibido", 0.0)
        ride.comision_servicio = financial_data.get("comision_servicio", 0.0)
        ride.comision_porcentaje = financial_data.get("comision_porcentaje", 9.5)
        ride.iva_pago_servicio = financial_data.get("iva_pago_servicio", 0.0)
        ride.total_pagado = financial_data.get("total_pagado", 0.0)

        # Set financial confidences
        confidences.mis_ingresos = 0.9 if ride.mis_ingresos > 0 else 0.0
        confidences.tarifa = 0.9 if ride.tarifa > 0 else 0.0
        confidences.total_recibido = 0.9 if ride.total_recibido > 0 else 0.0
        confidences.comision_servicio = 0.9 if ride.comision_servicio > 0 else 0.0
        confidences.iva_pago_servicio = 0.9 if ride.iva_pago_servicio > 0 else 0.0
        confidences.total_pagado = 0.9 if ride.total_pagado > 0 else 0.0

        # Parse passenger name and destination
        passenger_result = self._parse_passenger_and_destination(lines)
        ride.passenger_name = passenger_result.get("passenger_name", "")
        ride.destination_address = passenger_result.get("destination_address", "")
        confidences.passenger_name = 0.8 if ride.passenger_name else 0.0
        confidences.destination_address = 0.7 if ride.destination_address else 0.0

        # Parse rating
        rating_result = self._parse_rating(text)
        if rating_result:
            ride.rating_given = rating_result

        # Calculate overall confidence
        ride.field_confidences = confidences
        ride.extraction_confidence = self._calculate_overall_confidence(confidences)

        return ride

    def _clean_text(self, text: str) -> str:
        """Clean OCR text for better parsing."""
        # Normalize multiple newlines to single newline
        text = re.sub(r"\n\s*\n+", "\n", text)
        # Normalize multiple spaces (but keep newlines)
        text = re.sub(r"[^\S\n]+", " ", text)
        # Fix common OCR errors
        text = text.replace("0,00", "0.00")
        return text.strip()

    def _parse_date(self, text: str) -> Optional[Tuple[datetime, float]]:
        """Extract date from text."""
        match = self.PATTERNS["date"].search(text)
        if match:
            try:
                day = int(match.group(1))
                month_abbr = match.group(2).lower()
                year = int(match.group(3))
                month = SPANISH_MONTHS.get(month_abbr, 1)
                return datetime(year, month, day), 0.95
            except (ValueError, KeyError) as e:
                logger.warning(f"Failed to parse date: {e}")
        return None

    def _parse_time(self, text: str) -> Optional[Tuple[str, float]]:
        """Extract time from text."""
        match = self.PATTERNS["time"].search(text)
        if match:
            hour = int(match.group(1))
            minute = match.group(2)
            period = match.group(3).lower().replace(".", "")

            # Convert to 24-hour format
            if period == "pm" and hour != 12:
                hour += 12
            elif period == "am" and hour == 12:
                hour = 0

            return f"{hour:02d}:{minute}", 0.95
        return None

    def _parse_duration(self, text: str) -> Optional[Tuple[Duration, float]]:
        """Extract duration from text."""
        match = self.PATTERNS["duration"].search(text)
        if match:
            value = int(match.group(1))
            unit_str = match.group(2).lower()
            unit = DurationUnit.HOURS if unit_str == "hr" else DurationUnit.MINUTES
            return Duration(value=value, unit=unit), 0.9
        return None

    def _parse_distance(self, text: str) -> Optional[Tuple[Distance, float]]:
        """Extract distance from text."""
        match = self.PATTERNS["distance"].search(text)
        if match:
            original_value_str = match.group(1)
            # Handle different decimal separators:
            # - Spanish uses comma as decimal (6,4 = 6.4)
            # - OCR might output space instead of comma (6 4 = 6.4)
            value_str = original_value_str.replace(",", ".").replace(" ", ".")
            try:
                value = float(value_str)
            except ValueError:
                return None

            unit_str = match.group(2).lower()
            unit = DistanceUnit.METERS if unit_str == "metro" else DistanceUnit.KILOMETERS

            # Debug logging
            logger.info(f"Distance parsing: original='{original_value_str}', value={value}, unit={unit_str}")

            # Heuristic for OCR decimal separator issues:
            # Spanish uses comma as decimal: "5,9 km" = 5.9 km
            # OCR errors can produce:
            #   - "59 km" (dropped comma) -> should be 5.9
            #   - "59.0 km" or "59,0 km" (misread as trailing zero) -> should be 5.9
            #   - "27.0 km" -> should be 2.7
            #
            # Strategy:
            # 1. If value >= 20 km, it's almost certainly wrong for urban rides - always divide
            # 2. If value >= 10 km and no decimal separator, likely missing decimal - divide
            if unit == DistanceUnit.KILOMETERS:
                has_decimal_sep = any(c in original_value_str for c in ",. ")

                # High values (>= 20) are almost always OCR errors for urban rides
                if value >= 20:
                    logger.info(f"Distance correction (high value): {value} -> {value / 10}")
                    value = value / 10
                # Medium values without decimal separator are likely missing decimal
                elif value >= 10 and not has_decimal_sep:
                    logger.info(f"Distance correction (no decimal): {value} -> {value / 10}")
                    value = value / 10

            return Distance(value=value, unit=unit), 0.9
        return None

    def _parse_status(self, text: str) -> Tuple[RideStatus, float]:
        """Determine ride status."""
        if self.PATTERNS["cancelled_passenger"].search(text):
            return RideStatus.CANCELLED_BY_PASSENGER, 0.95
        return RideStatus.COMPLETED, 0.9

    def _parse_payment_method(
        self, text: str
    ) -> Tuple[PaymentMethod, str, float]:
        """Extract payment method."""
        if self.PATTERNS["payment_nequi"].search(text):
            return PaymentMethod.NEQUI, "Nequi", 0.95
        if self.PATTERNS["payment_cash"].search(text):
            return PaymentMethod.CASH, "Pago en efectivo", 0.95
        return PaymentMethod.OTHER, "Otro", 0.5

    def _parse_financial_data(self, text: str) -> Dict[str, float]:
        """Extract all financial values from text."""
        result: Dict[str, float] = {}

        # Find all currency values
        currency_matches = list(self.PATTERNS["currency"].finditer(text))

        # Find section markers
        mis_ingresos_pos = -1
        tarifa_pos = -1
        total_recibido_pos = -1
        comision_pos = -1
        iva_pos = -1
        total_pagado_pos = -1

        mis_ingresos_match = self.PATTERNS["mis_ingresos"].search(text)
        if mis_ingresos_match:
            mis_ingresos_pos = mis_ingresos_match.start()

        tarifa_match = self.PATTERNS["tarifa"].search(text)
        if tarifa_match:
            tarifa_pos = tarifa_match.start()

        total_recibido_match = self.PATTERNS["total_recibido"].search(text)
        if total_recibido_match:
            total_recibido_pos = total_recibido_match.start()

        comision_match = self.PATTERNS["comision"].search(text)
        if comision_match:
            comision_pos = comision_match.start()

        iva_match = self.PATTERNS["iva"].search(text)
        if iva_match:
            iva_pos = iva_match.start()

        total_pagado_match = self.PATTERNS["total_pagado"].search(text)
        if total_pagado_match:
            total_pagado_pos = total_pagado_match.start()

        # Extract percentage for commission
        percentage_match = self.PATTERNS["percentage"].search(text)
        if percentage_match:
            pct_str = percentage_match.group(1).replace(",", ".")
            result["comision_porcentaje"] = float(pct_str)

        # Match currency values to their labels by position
        for match in currency_matches:
            value_str = match.group(1).replace(",", "").replace(".", "", 1)
            # Handle decimal separator
            if "." in match.group(1):
                parts = match.group(1).replace(",", "").split(".")
                if len(parts) == 2:
                    value_str = parts[0] + "." + parts[1]
            try:
                value = float(value_str.replace(",", ""))
            except ValueError:
                continue

            pos = match.start()

            # Assign to nearest label before this position
            if total_pagado_pos > 0 and pos > total_pagado_pos and "total_pagado" not in result:
                result["total_pagado"] = value
            elif iva_pos > 0 and pos > iva_pos and "iva_pago_servicio" not in result:
                result["iva_pago_servicio"] = value
            elif comision_pos > 0 and pos > comision_pos and "comision_servicio" not in result:
                result["comision_servicio"] = value
            elif total_recibido_pos > 0 and pos > total_recibido_pos and "total_recibido" not in result:
                result["total_recibido"] = value
            elif tarifa_pos > 0 and pos > tarifa_pos and "tarifa" not in result:
                result["tarifa"] = value
            elif mis_ingresos_pos > 0 and pos > mis_ingresos_pos and "mis_ingresos" not in result:
                result["mis_ingresos"] = value

        return result

    def _parse_passenger_and_destination(self, lines: list) -> Dict[str, str]:
        """Extract passenger name and destination address."""
        result: Dict[str, str] = {}

        # Look for patterns
        for i, line in enumerate(lines):
            line = line.strip()

            # Skip empty lines and known labels
            if not line or len(line) < 2:
                continue

            # Destination is usually near the top, looks like an address
            if not result.get("destination_address"):
                # Check if line looks like an address (has numbers and letters, or known place names)
                if re.match(r"^(Cl|Cra|Carrera|Calle|Av|Universidad|Edificio|Centro)", line, re.IGNORECASE):
                    result["destination_address"] = line
                elif re.search(r"#\s*\d+", line):  # Contains # followed by number
                    result["destination_address"] = line

            # Passenger name is usually a single capitalized word/name
            if not result.get("passenger_name"):
                # Skip known labels and patterns
                skip_patterns = [
                    "duración", "distancia", "recib", "pagu", "tarifa",
                    "total", "calific", "soporte", "ingresos", "COP",
                    "pago", "nequi", "efectivo", "iva", "servicio"
                ]
                if any(p in line.lower() for p in skip_patterns):
                    continue

                # Clean OCR artifacts like "E) " or "8)" prefixes
                cleaned_line = re.sub(r"^[A-Z0-9]\)\s*", "", line).strip()

                # Check if it looks like a name (single or two words, capitalized)
                if re.match(r"^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?$", cleaned_line):
                    # Exclude short common words
                    if len(cleaned_line) > 3 and cleaned_line.lower() not in ["recibo", "pagué"]:
                        result["passenger_name"] = cleaned_line

        return result

    def _parse_rating(self, text: str) -> Optional[int]:
        """Extract rating from text."""
        # Count stars
        star_count = text.count("★") + text.count("⭐")
        if star_count > 0:
            return min(star_count, 5)

        # Check for "Calificaste" which implies rated
        if "calificaste" in text.lower():
            return 5  # Default to 5 if rated but stars not visible

        return None

    def _calculate_overall_confidence(self, confidences: FieldConfidences) -> float:
        """Calculate overall extraction confidence."""
        values = [
            confidences.date,
            confidences.time,
            confidences.duration,
            confidences.distance,
            confidences.passenger_name,
            confidences.payment_method,
            confidences.mis_ingresos,
            confidences.tarifa,
            confidences.total_recibido,
        ]
        non_zero = [v for v in values if v > 0]
        if not non_zero:
            return 0.0
        return sum(non_zero) / len(non_zero)
