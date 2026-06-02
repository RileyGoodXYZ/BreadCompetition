"""Create the SQLite database and apply schema.sql.

Run from the backend/ directory:
    python scripts/init_db.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import init_db


def main() -> None:
    path = init_db()
    print(f"initialized: {path}")


if __name__ == "__main__":
    main()
