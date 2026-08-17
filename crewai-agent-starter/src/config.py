import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str = os.environ.get("ANTHROPIC_API_KEY", "")
    model_name: str = os.environ.get("MODEL_NAME", "anthropic/claude-sonnet-5")
    workspace_dir: str = os.environ.get("WORKSPACE_DIR", "workspace")


settings = Settings()


def get_llm():
    from crewai import LLM

    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return LLM(model=settings.model_name, api_key=settings.anthropic_api_key)
