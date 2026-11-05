#!/usr/bin/env python3
"""Stops render programs while Marcus's production lock is on.

Inside the Fourth Watch repo, a missing or unreadable lock file counts as locked. The package
still runs outside the repo, where there is no production folder.
"""
import json
import sys
from pathlib import Path

LOCK = Path(__file__).resolve().parents[2] / 'production/PRODUCTION_LOCK.json'


def locked():
    if not LOCK.parent.is_dir():
        return False
    try:
        return json.loads(LOCK.read_text()).get('locked') is not False
    except (OSError, ValueError, AttributeError):
        return True


def require_unlocked():
    if locked():
        sys.exit('BLOCKED by the production lock: Marcus has stopped all rendering. Ask him first.')
