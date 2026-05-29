"""Backend package bootstrap for root-level uvicorn imports.

This keeps internal imports such as ``from app.database import ...`` working
when the app is started from the repository root with:

    uvicorn backend.app.main:app --reload
"""

import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
