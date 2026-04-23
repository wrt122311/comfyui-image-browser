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


def list_images(directory, sort_by):
    files = scan_directory(directory)
    sorted_files = sort_images(files, sort_by)
    return json.dumps({"images": sorted_files})


def get_image(image_path):
    if not image_path or not Path(image_path).is_file():
        return None
    return str(image_path)


def load_image_as_tensor(image_path):
    import torch
    import numpy as np
    from PIL import Image as PILImage
    img = PILImage.open(image_path)
    img = img.convert("RGB")
    img_array = np.array(img).astype(np.float32) / 255.0
    tensor = torch.from_numpy(img_array)
    return tensor.unsqueeze(0)


class ImageBrowser:
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("IMAGE", "IMAGE_PATH")
    FUNCTION = "browse"
    CATEGORY = "image"
    OUTPUT_NODE = True

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "directory": ("STRING", {"default": ""}),
                "sort_by": (
                    [
                        "name_asc", "name_desc",
                        "date_asc", "date_desc",
                        "size_asc", "size_desc",
                        "type_asc", "type_desc",
                        "dimensions_asc", "dimensions_desc",
                        "modified_asc", "modified_desc",
                    ],
                    {"default": "name_asc"},
                ),
                "selected_images": ("STRING", {"default": "[]"}),
            }
        }

    def browse(self, directory, sort_by, selected_images):
        import torch
        import logging
        logger = logging.getLogger("ImageBrowser")

        if not selected_images or selected_images == "[]":
            logger.warning("No images selected, returning empty tensor")
            empty_tensor = torch.zeros((1, 64, 64, 3))
            return (empty_tensor, "")

        try:
            selected_list = json.loads(selected_images)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error("Failed to parse selected_images: %s, raw value: %r", e, selected_images)
            empty_tensor = torch.zeros((1, 64, 64, 3))
            return (empty_tensor, "")

        if not selected_list:
            logger.warning("selected_list is empty after parsing")
            empty_tensor = torch.zeros((1, 64, 64, 3))
            return (empty_tensor, "")

        tensors = []
        valid_paths = []
        for img_path in selected_list:
            if os.path.isfile(img_path):
                try:
                    t = load_image_as_tensor(img_path)
                    tensors.append(t)
                    valid_paths.append(img_path)
                except Exception as e:
                    logger.warning("Failed to load image %s: %s", img_path, e)
                    continue
            else:
                logger.warning("Image file not found: %s", img_path)

        if not tensors:
            logger.warning("No valid images loaded from %d paths", len(selected_list))
            empty_tensor = torch.zeros((1, 64, 64, 3))
            return (empty_tensor, "")

        batch = torch.cat(tensors, dim=0)
        paths_str = json.dumps(valid_paths) if len(valid_paths) > 1 else valid_paths[0]
        logger.info("Loaded %d images successfully", len(valid_paths))
        return (batch, paths_str)