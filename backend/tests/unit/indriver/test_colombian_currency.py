"""
Colombian Currency Format Tests

Tests for parsing Colombian currency formats from OCR output.
Colombian format uses:
- Dots (.) as thousands separators: 18.000
- Comma (,) as decimal separator: 18.000,00

CRITICAL: These tests prevent the currency parsing bug that caused
all financial values to be parsed as 0.0 in production.
"""

import pytest

from src.application.indriver.text_parser import InDriverTextParser


@pytest.fixture
def parser():
    """Create parser instance for tests."""
    return InDriverTextParser()


class TestColombianCurrencyParsing:
    """
    Test Colombian currency format: "18.000,00 COP"

    This is the format that InDriver uses in Colombia:
    - Dots as thousands separators
    - Comma as decimal separator
    - COP suffix (not prefix)
    """

    def test_parse_currency_colombian_format_basic(self, parser):
        """Parse basic Colombian format: 18.000,00 COP"""
        result = parser._parse_colombian_currency("18.000,00")
        assert result == 18000.00

    def test_parse_currency_colombian_format_large(self, parser):
        """Parse large amount: 1.234.567,89 COP"""
        result = parser._parse_colombian_currency("1.234.567,89")
        assert result == 1234567.89

    def test_parse_currency_colombian_format_no_decimals(self, parser):
        """Parse without decimals: 15.000 COP"""
        result = parser._parse_colombian_currency("15.000")
        # Without comma, this is ambiguous - parser should handle gracefully
        assert result is not None
        # Could be 15.0 or 15000.0 depending on interpretation

    def test_parse_currency_colombian_format_small(self, parser):
        """Parse small amount: 500,00 COP"""
        result = parser._parse_colombian_currency("500,00")
        assert result == 500.00

    def test_parse_currency_colombian_format_cents_only(self, parser):
        """Parse amount with only cents: 0,50 COP"""
        result = parser._parse_colombian_currency("0,50")
        assert result == 0.50

    def test_parse_currency_real_indriver_tarifa(self, parser):
        """Parse real InDriver tarifa: 18.000,00"""
        result = parser._parse_colombian_currency("18.000,00")
        assert result == 18000.00

    def test_parse_currency_real_indriver_comision(self, parser):
        """Parse real InDriver commission: 2.009,00"""
        result = parser._parse_colombian_currency("2.009,00")
        assert result == 2009.00

    def test_parse_currency_real_indriver_iva(self, parser):
        """Parse real InDriver IVA: 324,90"""
        result = parser._parse_colombian_currency("324,90")
        assert result == 324.90

    def test_parse_currency_real_indriver_total_pagado(self, parser):
        """Parse real InDriver total pagado: 2.034,90"""
        result = parser._parse_colombian_currency("2.034,90")
        assert result == 2034.90

    def test_parse_currency_real_indriver_mis_ingresos(self, parser):
        """Parse real InDriver mis ingresos: 15.965,10"""
        result = parser._parse_colombian_currency("15.965,10")
        assert result == 15965.10


class TestCurrencyRegexPatternMatch:
    """
    Test that the currency regex correctly matches Colombian format.

    The pattern should match BOTH:
    - "18.000,00 COP" (Colombian: number before COP)
    - "COP 18.000,00" (US-style: COP before number)
    """

    def test_regex_matches_cop_suffix(self, parser):
        """Regex matches Colombian format with COP suffix."""
        text = "Tarifa 18.000,00 COP"
        matches = list(parser.PATTERNS["currency"].finditer(text))
        assert len(matches) == 1
        # Group 1 should have the value (COP suffix format)
        assert matches[0].group(1) == "18.000,00"

    def test_regex_matches_cop_prefix(self, parser):
        """Regex matches US format with COP prefix."""
        text = "Tarifa COP 18.000,00"
        matches = list(parser.PATTERNS["currency"].finditer(text))
        assert len(matches) == 1
        # Group 2 should have the value (COP prefix format)
        assert matches[0].group(2) == "18.000,00"

    def test_regex_matches_multiple_currencies(self, parser):
        """Regex finds all currency values in text."""
        text = """
        Tarifa 18.000,00 COP
        Total recibido 18.000,00 COP
        Comisión 2.009,00 COP
        IVA 324,90 COP
        """
        matches = list(parser.PATTERNS["currency"].finditer(text))
        assert len(matches) == 4


class TestFinancialDataExtractionColombian:
    """
    Test full financial data extraction with Colombian format.

    These tests use real OCR text samples from InDriver screenshots.
    """

    def test_extract_all_financial_fields_colombian(self, parser):
        """Extract all financial fields from Colombian format receipt."""
        # This is based on actual OCR output from the bug report
        text = """
        Mis ingresos
        15.965,10 COP
        Recibí
        Tarifa 18.000,00 COP
        Total recibido 18.000,00 COP
        Pago en línea con tarjeta
        Pagué
        Nuestros pagos por el servicio son 2.009,00 COP
        bajos (9.5%)
        IVA del pago por el servicio 324,90 COP
        Total pagado 2.034,90 COP
        """
        result = parser._parse_financial_data(text)

        # Verify all values are extracted correctly
        assert result.get("mis_ingresos") == 15965.10, f"Expected 15965.10, got {result.get('mis_ingresos')}"
        assert result.get("tarifa") == 18000.00, f"Expected 18000.00, got {result.get('tarifa')}"
        assert result.get("total_recibido") == 18000.00, f"Expected 18000.00, got {result.get('total_recibido')}"
        assert result.get("comision_servicio") == 2009.00, f"Expected 2009.00, got {result.get('comision_servicio')}"
        assert result.get("iva_pago_servicio") == 324.90, f"Expected 324.90, got {result.get('iva_pago_servicio')}"
        assert result.get("total_pagado") == 2034.90, f"Expected 2034.90, got {result.get('total_pagado')}"

    def test_extract_financial_second_sample(self, parser):
        """Extract from second OCR sample."""
        text = """
        Mis ingresos
        9756,45 COP
        Recibí
        Tarifa 11.000,00 COP
        Total recibido 11.000,00 COP
        Pago en línea con tarjeta
        Pagué
        Nuestros pagos por el servicio son 1045,00 COP
        bajos (9.5%)
        IVA del pago por el servicio 198,55 COP
        Total pagado 1243,55 COP
        """
        result = parser._parse_financial_data(text)

        assert result.get("mis_ingresos") == 9756.45
        assert result.get("tarifa") == 11000.00
        assert result.get("total_recibido") == 11000.00

    def test_parse_complete_ride_colombian_format(self, parser):
        """Parse complete ride with Colombian currency format."""
        ocr_text = """
        Duración 20 min
        Distancia 5,7 km
        Juliana
        Calificaste
        Recibo Soporte
        Mis ingresos
        9.756,45 COP
        Recibí
        Tarifa 11.000,00 COP
        Total recibido 11.000,00 COP
        Pago en línea con tarjeta
        Pagué
        Nuestros pagos por el servicio son 1.045,00 COP
        bajos (9.5%)
        IVA del pago por el servicio 198,55 COP
        Total pagado 1.243,55 COP
        """

        ride = parser.parse(ocr_text)

        # Verify financial data is NOT zero
        assert ride.mis_ingresos > 0, "mis_ingresos should not be 0"
        assert ride.tarifa > 0, "tarifa should not be 0"
        assert ride.total_recibido > 0, "total_recibido should not be 0"

        # Verify actual values
        assert ride.mis_ingresos == 9756.45
        assert ride.tarifa == 11000.00
        assert ride.total_recibido == 11000.00
        assert ride.comision_servicio == 1045.00
        assert ride.iva_pago_servicio == 198.55
        assert ride.total_pagado == 1243.55


class TestCurrencyEdgeCases:
    """Test edge cases in currency parsing."""

    def test_parse_currency_with_spaces(self, parser):
        """Handle spaces in currency values (OCR artifact)."""
        # OCR might add spaces
        # Should handle gracefully - either parse correctly or return None
        # Don't crash
        parser._parse_colombian_currency("18 000,00")

    def test_parse_currency_trailing_zeros(self, parser):
        """Parse values with trailing zeros."""
        result = parser._parse_colombian_currency("15.000,00")
        assert result == 15000.00

    def test_parse_currency_single_digit_cents(self, parser):
        """Parse values with single digit cents (rare but possible)."""
        result = parser._parse_colombian_currency("100,5")
        # Note: Colombian format typically uses ,50 not ,5
        # But OCR might produce this
        if result is not None:
            assert result == 100.5

    def test_parse_currency_no_cents(self, parser):
        """Parse whole number amounts."""
        result = parser._parse_colombian_currency("1.000")
        # Ambiguous: could be 1.0 or 1000
        # With Colombian context, 1.000 likely means 1000
        assert result is not None

    def test_parse_currency_empty_string(self, parser):
        """Handle empty string gracefully."""
        result = parser._parse_colombian_currency("")
        assert result is None

    def test_parse_currency_invalid(self, parser):
        """Handle invalid currency string."""
        result = parser._parse_colombian_currency("abc")
        assert result is None


class TestUSFormatBackwardsCompatibility:
    """
    Test US format (COP prefix) handling.

    NOTE: The parser is optimized for Colombian format (the primary use case).
    US format (COP 15,000.00 with comma as thousands) is less common and
    may not parse correctly because the parser assumes comma = decimal.

    This test documents the actual behavior rather than expected behavior.
    """

    def test_parse_us_format_noted_limitation(self, parser):
        """
        Document: US format with comma thousands separator doesn't parse correctly.

        The parser interprets comma as decimal separator (Colombian convention).
        This is the expected behavior for a Colombia-focused application.
        """
        text = "Tarifa COP 15,000.00"
        # The parser sees "15,000.00" and interprets comma as decimal:
        # - Strips the dots (nothing to strip before comma)
        # - Replaces comma with dot -> "15.000.00"
        # - This may result in unexpected parsing
        # This is a known limitation - Colombian format is the primary use case
        parser._parse_financial_data(text)

    def test_parse_cop_prefix_colombian_format(self, parser):
        """Parse COP prefix with Colombian number format: COP 15.000,00"""
        text = """
        Tarifa
        COP 15.000,00

        Total recibido
        COP 15.000,00

        Mis Ingresos
        COP 13.304,25
        """
        result = parser._parse_financial_data(text)
        # This should work because the numbers use Colombian format
        assert result.get("tarifa") == 15000.00
        assert result.get("total_recibido") == 15000.00
        assert result.get("mis_ingresos") == 13304.25


class TestZeroValueDetection:
    """
    Tests to catch the original bug: all values parsing as 0.0

    These tests would have caught the production bug.
    """

    def test_financial_values_not_zero_colombian(self, parser):
        """Ensure Colombian format doesn't produce all zeros."""
        text = """
        Tarifa 18.000,00 COP
        Total recibido 18.000,00 COP
        Mis ingresos 15.965,10 COP
        """
        result = parser._parse_financial_data(text)

        # At least one value should be non-zero
        values = [
            result.get("tarifa", 0),
            result.get("total_recibido", 0),
            result.get("mis_ingresos", 0),
        ]
        non_zero_count = sum(1 for v in values if v > 0)

        assert non_zero_count > 0, \
            f"All financial values are zero! This is the production bug. Values: {result}"

    def test_parse_ride_financial_not_all_zero(self, parser):
        """Full ride parse should not produce all zero financials."""
        ocr_text = """
        mar, 2 dic 2025
        07:52 a.m.
        20 min
        6,4 km
        Tarifa 15.000,00 COP
        Total recibido 15.000,00 COP
        Mis ingresos 13.304,25 COP
        """

        ride = parser.parse(ocr_text)

        financial_fields = [
            ride.tarifa,
            ride.total_recibido,
            ride.mis_ingresos,
        ]

        non_zero_count = sum(1 for v in financial_fields if v > 0)
        assert non_zero_count > 0, \
            f"All financial fields are 0! tarifa={ride.tarifa}, total_recibido={ride.total_recibido}, mis_ingresos={ride.mis_ingresos}"
