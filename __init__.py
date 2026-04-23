from .nodes import ImageBrowser

NODE_CLASS_MAPPINGS = {
    "ImageBrowser": ImageBrowser,
}

NODE_DISPLAY_MAPPINGS = {
    "ImageBrowser": "图片浏览器",
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_MAPPINGS"]