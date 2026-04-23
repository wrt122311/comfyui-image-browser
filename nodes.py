import os
import json
from pathlib import Path

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}

SORT_KEYS = {
    "name_asc": lambda f: f["name"],
    "name_desc": lambda f: f["name"],
    "date_asc": lambda f: f["created"],
    "date_desc": lambda f: f["created"],
    "size_asc": lambda f: f["size"],
    "size_desc": lambda f: f["size"],
    "type_asc": lambda f: f["type"],
    "type_desc": lambda f: f["type"],
    "dimensions_asc": lambda f: f["dimensions"][0] * f["dimensions"][1],
    "dimensions_desc": lambda f: f["dimensions"][0] * f["dimensions"][1],
    "modified_asc": lambda f: f["modified"],
    "modified_desc": lambda f: f["modified"],
}


def scan_directory(directory):
    path = Path(directory)
    if not path.exists() or not path.is_dir():
        return []
    files = []
    for entry in path.iterdir():
        if entry.is_file() and entry.suffix.lower() in SUPPORTED_EXTENSIONS:
            try:
                from PIL import Image as PILImage
                with PILImage.open(str(entry)) as img:
                    w, h = img.size
            except Exception:
                w, h = 0, 0
            stat = entry.stat()
            files.append({
                "path": str(entry),
                "name": entry.name,
                "size": stat.st_size,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "type": entry.suffix.lower().lstrip("."),
                "dimensions": (w, h),
            })
    return files


def sort_images(files, sort_by):
    if sort_by not in SORT_KEYS:
        sort_by = "name_asc"
    key = SORT_KEYS[sort_by]
    reverse = sort_by.endswith("_desc")
    return sorted(files, key=key, reverse=reverse)


class ImageBrowser:
    pass