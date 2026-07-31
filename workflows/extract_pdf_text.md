# Workflow: Extract Text from a PDF

## Objective
Read a local PDF file and save its text content (per page) for downstream processing or analysis.

## Required Inputs
- `pdf_path` (required): path to the local PDF file.
- `pages` (optional): page range(s) to extract, e.g. `1-3`, `5`, or `1-3,5,8-9`. If omitted, all pages are extracted.
- `output` (optional): filename (without extension) to save results under in `.tmp/`. Defaults to a slugified version of the PDF's filename.

## Tool to Use
`tools/extract_pdf_text.py`

Run:
```
python tools/extract_pdf_text.py <pdf_path> [--pages "1-3,5"] [--output <name>]
```

Dependency (`pypdf`) is listed in `requirements.txt`. Install with:
```
pip install -r requirements.txt
```

## Expected Output
A JSON file written to `.tmp/<output>.json` containing:
- `source` (input path), `extracted_at` (ISO timestamp), `page_count` (total pages in the document), `pages_extracted` (how many were extracted)
- `pages`: a list of `{page, text}` objects, one per extracted page (1-indexed)

The tool also prints a one-line summary (pages extracted + output path) to stdout, so success can be confirmed without opening the file. If any extracted page returned no text, it prints a warning listing those page numbers.

## Edge Cases & Known Constraints
- **Password-protected / encrypted PDFs**: the tool exits with a clear error rather than guessing at a password. Decrypt the file first if this happens.
- **Scanned / image-only pages**: this tool does text extraction only, no OCR. Pages with no embedded text layer come back empty and are flagged in a stdout warning — if OCR is needed, that's a new tool to build (e.g. via `pytesseract`), not a silent failure of this one.
- **Corrupt or invalid PDF file**: the tool exits with a clear error rather than partial/garbled output.
- **Missing file**: the tool checks the path exists before attempting to parse, with a clear error if not.
- **Out-of-range page spec**: e.g. `--pages 5-10` on a 3-page document exits with a clear error instead of silently clamping.

## Update Log
- 2026-07-31: initial version.
