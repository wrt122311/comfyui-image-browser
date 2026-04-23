try:
    from .nodes import ImageBrowser, list_images, get_image
except ImportError:
    from nodes import ImageBrowser, list_images, get_image

import json
import os

NODE_CLASS_MAPPINGS = {
    "ImageBrowser": ImageBrowser,
}

NODE_DISPLAY_MAPPINGS = {
    "ImageBrowser": "图片浏览器",
}

WEB_DIRECTORY = "./js"

try:
    from server import PromptServer
    from aiohttp import web

    routes = PromptServer.instance.routes

    @routes.get("/image_browser/list")
    async def list_images_route(request):
        directory = request.rel_url.query.get("dir", "")
        sort_by = request.rel_url.query.get("sort", "name_asc")
        result = list_images(directory, sort_by)
        data = json.loads(result) if isinstance(result, str) else result
        return web.json_response(data)

    @routes.get("/image_browser/view")
    async def view_image_route(request):
        image_path = request.rel_url.query.get("path", "")
        if not image_path or not os.path.isfile(image_path):
            return web.Response(status=404, text="Image not found")
        try:
            import mimetypes
            mime_type, _ = mimetypes.guess_type(image_path)
            if not mime_type:
                mime_type = "application/octet-stream"
            with open(image_path, "rb") as f:
                return web.Response(body=f.read(), content_type=mime_type)
        except Exception as e:
            return web.Response(status=500, text=str(e))

    @routes.get("/image_browser/browse")
    async def browse_dirs_route(request):
        path = request.rel_url.query.get("path", "/")
        try:
            if not path:
                path = "/"
            entries = []
            for entry in sorted(os.listdir(path)):
                full = os.path.join(path, entry)
                if os.path.isdir(full):
                    entries.append({"name": entry, "path": full, "type": "directory"})
            return web.json_response({"path": path, "dirs": entries})
        except Exception as e:
            return web.json_response({"path": path, "dirs": [], "error": str(e)})
except Exception:
    pass

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_MAPPINGS"]