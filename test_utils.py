import os
import tempfile
import time
from nodes import scan_directory, sort_images

def test_scan_directory_finds_images():
    with tempfile.TemporaryDirectory() as tmpdir:
        for name in ["a.jpg", "b.png", "c.webp"]:
            open(os.path.join(tmpdir, name), "w").close()
        open(os.path.join(tmpdir, "d.txt"), "w").close()
        result = scan_directory(tmpdir)
        filenames = [os.path.basename(f["path"]) for f in result]
        assert "a.jpg" in filenames
        assert "b.png" in filenames
        assert "c.webp" in filenames
        assert "d.txt" not in filenames

def test_scan_directory_returns_empty_for_nonexistent():
    result = scan_directory("/nonexistent/path/abc123")
    assert result == []

def test_sort_by_name_asc():
    files = [
        {"path": "/b.jpg", "name": "b.jpg", "size": 100, "created": 1.0, "modified": 1.0, "type": "jpg", "dimensions": (100, 100)},
        {"path": "/a.jpg", "name": "a.jpg", "size": 200, "created": 2.0, "modified": 2.0, "type": "jpg", "dimensions": (200, 200)},
    ]
    result = sort_images(files, "name_asc")
    assert result[0]["name"] == "a.jpg"
    assert result[1]["name"] == "b.jpg"

def test_sort_by_name_desc():
    files = [
        {"path": "/a.jpg", "name": "a.jpg", "size": 100, "created": 1.0, "modified": 1.0, "type": "jpg", "dimensions": (100, 100)},
        {"path": "/b.jpg", "name": "b.jpg", "size": 200, "created": 2.0, "modified": 2.0, "type": "jpg", "dimensions": (200, 200)},
    ]
    result = sort_images(files, "name_desc")
    assert result[0]["name"] == "b.jpg"

def test_sort_by_size_desc():
    files = [
        {"path": "/a.jpg", "name": "a.jpg", "size": 100, "created": 1.0, "modified": 1.0, "type": "jpg", "dimensions": (100, 100)},
        {"path": "/b.jpg", "name": "b.jpg", "size": 200, "created": 2.0, "modified": 2.0, "type": "jpg", "dimensions": (200, 200)},
    ]
    result = sort_images(files, "size_desc")
    assert result[0]["size"] == 200

def test_sort_by_modified_desc():
    files = [
        {"path": "/a.jpg", "name": "a.jpg", "size": 100, "created": 1.0, "modified": 100.0, "type": "jpg", "dimensions": (100, 100)},
        {"path": "/b.jpg", "name": "b.jpg", "size": 200, "created": 2.0, "modified": 200.0, "type": "jpg", "dimensions": (200, 200)},
    ]
    result = sort_images(files, "modified_desc")
    assert result[0]["modified"] == 200.0

def test_sort_default_fallback():
    files = [
        {"path": "/b.jpg", "name": "b.jpg", "size": 100, "created": 1.0, "modified": 1.0, "type": "jpg", "dimensions": (100, 100)},
        {"path": "/a.jpg", "name": "a.jpg", "size": 200, "created": 2.0, "modified": 2.0, "type": "jpg", "dimensions": (200, 200)},
    ]
    result = sort_images(files, "invalid_sort")
    assert result[0]["name"] == "a.jpg"