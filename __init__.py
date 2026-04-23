try:
    from .nodes import ImageBrowser, list_images
except ImportError:
    from nodes import ImageBrowser, list_images

import json

NODE_CLASS_MAPPINGS = {
    "ImageBrowser": ImageBrowser,
}

NODE_DISPLAY_MAPPINGS = {
    "ImageBrowser": "图片浏览器",
}

WEB_DIRECTORY = "./js"


def add_routes(server):
    @server.routes.get("/image_browser/list")
    async def list_images_route(request):
        directory = request.rel_url.query.get("dir", "")
        sort_by = request.rel_url.query.get("sort", "name_asc")
        result = list_images(directory, sort_by)
        from aiohttp import web
        data = json.loads(result) if isinstance(result, str) else result
        return web.json_response(data)


__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_MAPPINGS", "add_routes"]