#!/usr/bin/env python3
"""Extract text from a local PDF file, page by page, and save it as JSON.

Usage:
    python tools/extract_pdf_text.py <pdf_path> [--pages "1-3,5"] [--output <name>]

See workflows/extract_pdf_text.md for the full SOP.
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

TMP_DIR = Path(__file__).resolve().parent.parent / ".tmp"


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return slug or "pdf"


def parse_page_ranges(spec: str, page_count: int) -> list[int]:
    """Parse '1-3,5,8-9' into a sorted list of 0-based page indices."""
    indices = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_s, end_s = part.split("-", 1)
            start_i, end_i = int(start_s), int(end_s)
        else:
            start_i = end_i = int(part)
        if start_i < 1 or end_i > page_count or start_i > end_i:
            raise ValueError(f"page range '{part}' is out of bounds for a {page_count}-page document")
        indices.update(range(start_i - 1, end_i))
    return sorted(indices)


def extract(pdf_path: Path, pages_spec: str | None) -> dict:
    try:
        reader = PdfReader(str(pdf_path))
    except PdfReadError as exc:
        raise ValueError(f"could not read '{pdf_path}': {exc}") from exc

    if reader.is_encrypted:
        raise ValueError(f"'{pdf_path}' is password-protected; decrypt it before extracting")

    page_count = len(reader.pages)
    indices = parse_page_ranges(pages_spec, page_count) if pages_spec else range(page_count)

    pages = [{"page": i + 1, "text": (reader.pages[i].extract_text() or "").strip()} for i in indices]
    return {"page_count": page_count, "pages": pages}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf_path", help="Path to the local PDF file")
    parser.add_argument("--pages", help="Page range(s) to extract, e.g. '1-3,5' (default: all pages)")
    parser.add_argument("--output", help="Output filename (without extension), saved under .tmp/")
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.is_file():
        print(f"ERROR: file not found: {pdf_path}", file=sys.stderr)
        return 1

    try:
        data = extract(pdf_path, args.pages)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    TMP_DIR.mkdir(parents=True, exist_ok=True)
    output_path = TMP_DIR / f"{args.output or slugify(pdf_path.stem)}.json"

    payload = {
        "source": str(pdf_path),
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "page_count": data["page_count"],
        "pages_extracted": len(data["pages"]),
        "pages": data["pages"],
    }
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))

    print(f"Extracted {len(data['pages'])}/{data['page_count']} page(s) from {pdf_path} -> {output_path}")

    empty_pages = [p["page"] for p in data["pages"] if not p["text"]]
    if empty_pages:
        print(
            f"WARNING: {len(empty_pages)} page(s) returned no text (likely scanned/image-only): {empty_pages}",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
