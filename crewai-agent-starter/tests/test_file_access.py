import pytest

from src.tools.file_access import _resolve_in_workspace


def test_resolve_in_workspace_allows_nested_path():
    path = _resolve_in_workspace("output/article.md")
    assert path.name == "article.md"


def test_resolve_in_workspace_blocks_traversal():
    with pytest.raises(ValueError):
        _resolve_in_workspace("../../etc/passwd")
