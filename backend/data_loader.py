import json
from pathlib import Path

from backend.models import Profile


def load_profiles(path=None) -> list[Profile]:
    path = Path(path) if path else Path(__file__).parent / "data" / "profiles.json"
    with open(path, encoding="utf-8-sig") as f:
        return [Profile(**item) for item in json.load(f)]
