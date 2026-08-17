"""
Calls the Gemini API to generate a three.js script that renders a 3D black hole.

Setup:
    1. cp .env.example .env
    2. Put your real key in .env as GEMINI_API_KEY
    3. pip install -r requirements.txt
    4. python scripts/generate_blackhole.py

The generated three.js source is written to output/blackhole.js.
"""

import os
import sys

from dotenv import load_dotenv
from google import genai

load_dotenv()

PROMPT = "Write a three.js script that renders a realistic 3D black hole."
DEFAULT_MODEL = "gemini-2.5-flash"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "output", "blackhole.js")


def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit(
            "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key."
        )

    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(model=model, contents=PROMPT)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        f.write(response.text)

    print(f"Wrote generated script to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
