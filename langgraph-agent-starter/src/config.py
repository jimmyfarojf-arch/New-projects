import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str = os.environ.get("ANTHROPIC_API_KEY", "")
    model_name: str = os.environ.get("MODEL_NAME", "claude-sonnet-5")
    max_revisions: int = int(os.environ.get("MAX_REVISIONS", "2"))
    workspace_dir: str = os.environ.get("WORKSPACE_DIR", "workspace")


settings = Settings()


def get_llm(temperature: float = 0.3):
    from langchain_anthropic import ChatAnthropic

    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return ChatAnthropic(
        model=settings.model_name,
        temperature=temperature,
        api_key=settings.anthropic_api_key,
    )
