# Workflow: Scrape a Website

## Objective
Pull structured data (page title, text, and links — or specific elements) from a single webpage for downstream processing or analysis.

## Required Inputs
- `url` (required): the full URL of the page to scrape.
- `selector` (optional): a CSS selector to narrow extraction to specific elements (e.g. `article`, `.price`, `#main-content`). If omitted, the tool extracts the page title, full visible text, and all links.
- `output` (optional): filename (without extension) to save results under in `.tmp/`. Defaults to a slugified version of the URL.

## Tool to Use
`tools/scrape_single_site.py`

Run:
```
python tools/scrape_single_site.py <url> [--selector "<css selector>"] [--output <name>]
```

Dependencies (`requests`, `beautifulsoup4`) are listed in `requirements.txt`. Install with:
```
pip install -r requirements.txt
```

## Expected Output
A JSON file written to `.tmp/<output>.json` containing:
- `url`, `scraped_at` (ISO timestamp), `selector` used (if any), `title`
- `results`: a list of extracted items
  - with `--selector`: one `{text, href}` object per matched element
  - without `--selector`: a single `{text, links}` object with all page text and all discovered links

The tool also prints a one-line summary (item count + output path) to stdout, so success can be confirmed without opening the file.

## Edge Cases & Known Constraints
- **403 / bot-blocking**: some sites reject default `requests` headers. The tool sends a browser-like User-Agent by default; if a site still blocks it, note the site here and escalate rather than attempting to bypass bot protection.
- **JavaScript-rendered content**: this tool only fetches static HTML. If a site relies on client-side rendering and returns near-empty content, that's a known limitation — flag it rather than guessing at rendered content.
- **Selector matches nothing**: the tool exits with a non-zero code and a clear error rather than silently returning empty results.
- **Rate limits / repeated scraping of the same domain**: no built-in delay or retry logic yet. If this becomes a recurring problem, add backoff to the tool and document the fix here.
- **Timeouts**: default request timeout is 15s; slow sites fail with a clear timeout error rather than hanging.

## Update Log
- 2026-07-31: initial version.
