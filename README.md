# New-projects
Coding

## API Keys

This repo uses the Gemini API to generate content (see `scripts/generate_blackhole.py`).

1. Copy `.env.example` to `.env`
2. Set `GEMINI_API_KEY` in `.env` to your Gemini API key (get one at https://aistudio.google.com/apikey)
3. `.env` is gitignored — never commit real keys

### Usage

```bash
pip install -r requirements.txt
python scripts/generate_blackhole.py
```

This calls the Gemini API to generate a three.js script for a 3D black hole and writes it to `output/blackhole.js`.

