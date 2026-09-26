#!/usr/bin/env python3
"""Build the public quiz catalog from data/quizzes/*.json.

Quiz JSON files are the source of truth. This script validates their required
metadata and generates data/quizzes-index.json for the static website.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUIZ_DIR = ROOT / "data" / "quizzes"
OUTPUT = ROOT / "data" / "quizzes-index.json"

CATEGORY_ORDER = {
    "IT Professional Knowledge": 10,
    "English": 20,
    "Quant & Reasoning": 30,
    "Banking Awareness": 40,
}

REQUIRED = [
    "quizId",
    "title",
    "subtitle",
    "description",
    "category",
    "topic",
    "questionCount",
    "questions",
]


def fail(message: str) -> None:
    raise SystemExit(f"Quiz index validation failed: {message}")


def main() -> None:
    quizzes = []
    seen_ids = set()

    for path in sorted(QUIZ_DIR.glob("*.json")):
        if path.name == OUTPUT.name:
            continue

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            fail(f"{path.name}: invalid JSON ({exc})")

        for key in REQUIRED:
            if not data.get(key):
                fail(f"{path.name}: missing required field '{key}'")

        quiz_id = data["quizId"]
        if quiz_id in seen_ids:
            fail(f"duplicate quizId '{quiz_id}'")
        seen_ids.add(quiz_id)

        questions = data["questions"]
        if not isinstance(questions, list) or not questions:
            fail(f"{path.name}: questions must be a non-empty array")
        if data["questionCount"] != len(questions):
            fail(
                f"{path.name}: questionCount={data['questionCount']} "
                f"but questions contains {len(questions)} items"
            )

        part = data.get("part")
        if part is not None and (not isinstance(part, int) or part < 1):
            fail(f"{path.name}: part must be a positive integer when supplied")

        quizzes.append(
            {
                "id": quiz_id,
                "title": data["title"],
                "category": data["category"],
                "topic": data["topic"],
                **({"subtopic": data["subtopic"]} if data.get("subtopic") else {}),
                **({"part": part} if part is not None else {}),
                "description": data["description"],
                "difficulty": data.get("difficulty", "Exam Practice"),
                "questionCount": len(questions),
                "file": f"data/quizzes/{path.name}",
            }
        )

    quizzes.sort(
        key=lambda q: (
            CATEGORY_ORDER.get(q["category"], 999),
            q["category"].lower(),
            q["topic"].lower(),
            q.get("part", 0),
            q["title"].lower(),
        )
    )

    payload = {"version": 1, "quizzes": quizzes}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {OUTPUT} with {len(quizzes)} quiz(es).")


if __name__ == "__main__":
    main()
