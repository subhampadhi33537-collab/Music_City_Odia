"""Shared helpers for Flask routes and JSON responses."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from flask import jsonify, request


def serialize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: serialize_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, tuple):
        return [serialize_value(item) for item in value]
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def json_response(payload: Any, status_code: int = 200):
    return jsonify(serialize_value(payload)), status_code


def get_json_body() -> dict[str, Any]:
    payload = request.get_json(silent=True)
    return payload or {}