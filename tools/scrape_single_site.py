#!/usr/bin/env python3
"""Fetch a single webpage and extract text/links, optionally scoped to a CSS selector.

Usage:
    python tools/scrape_single_site.py <url> [--selector "<css selector>"] [--output <name>]

See workflows/scrape_website.md for the full SOP.
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

DEFAULT_TIMEOUT = 15
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}
TMP_DIR = Path(__file__).resolve().parent.parent / ".tmp"


def slugify(url: str) -> str:
    parsed = urlparse(url)
    slug = f"{parsed.netloc}{parsed.path}".strip("/")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", slug).strip("-").lower()
    return slug or "scrape"


def fetch(url: str) -> requests.Response:
    response = requests.get(url, headers=DEFAULT_HEADERS, timeout=DEFAULT_TIMEOUT)
    response.raise_for_status()
    return response


def extract(html: str, url: str, selector: str | None) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else None

    if selector:
        elements = soup.select(selector)
        if not elements:
            raise ValueError(f"selector '{selector}' matched no elements on {url}")
        results = [
            {
                "text": el.get_text(strip=True, separator=" "),
                "href": urljoin(url, el["href"]) if el.get("href") else None,
            }
            for el in elements
        ]
    else:
        results = [
            {
                "text": soup.get_text(strip=True, separator=" "),
                "links": sorted({urljoin(url, a["href"]) for a in soup.find_all("a", href=True)}),
            }
        ]

    return {"title": title, "results": results}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Full URL of the page to scrape")
    parser.add_argument("--selector", help="CSS selector to scope extraction to specific elements")
    parser.add_argument("--output", help="Output filename (without extension), saved under .tmp/")
    args = parser.parse_args()

    try:
        response = fetch(args.url)
        data = extract(response.text, args.url, args.selector)
    except requests.RequestException as exc:
        print(f"ERROR: request failed for {args.url}: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    TMP_DIR.mkdir(parents=True, exist_ok=True)
    output_path = TMP_DIR / f"{args.output or slugify(args.url)}.json"

    payload = {
        "url": args.url,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "selector": args.selector,
        "title": data["title"],
        "results": data["results"],
    }
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))

    print(f"Scraped {args.url} -> {len(data['results'])} item(s) -> {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
