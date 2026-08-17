import logging
from pathlib import Path

from src.config import settings

logger = logging.getLogger("agent.tools.file_access")


def _resolve_in_workspace(relative_path: str) -> Path:
    workspace = Path(settings.workspace_dir).resolve()
    workspace.mkdir(parents=True, exist_ok=True)
    target = (workspace / relative_path).resolve()
    if target != workspace and workspace not in target.parents:
        raise ValueError(f"Path {relative_path!r} escapes the workspace directory")
    return target


def read_file(relative_path: str) -> str:
    return _resolve_in_workspace(relative_path).read_text(encoding="utf-8")


def write_file(relative_path: str, content: str) -> Path:
    target = _resolve_in_workspace(relative_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    logger.info("Wrote %d chars to %s", len(content), target)
    return target
