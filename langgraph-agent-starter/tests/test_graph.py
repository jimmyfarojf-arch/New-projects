from langgraph.graph import END

from src.graph import _route_after_review


def test_route_after_review_approved():
    assert _route_after_review({"approved": True, "revision_count": 1}) == END


def test_route_after_review_max_revisions():
    assert _route_after_review({"approved": False, "revision_count": 2}) == END


def test_route_after_review_needs_revision():
    assert _route_after_review({"approved": False, "revision_count": 0}) == "writer"
