import os
import sys
import json
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image


def _create_test_image(path, size=(64, 64), color=(255, 0, 0)):
    img = Image.new("RGB", size, color)
    img.save(path)
    return path


class TestListImages(unittest.TestCase):

    def test_list_images_from_directory(self):
        from nodes import list_images
        with tempfile.TemporaryDirectory() as tmpdir:
            _create_test_image(os.path.join(tmpdir, "a.png"))
            _create_test_image(os.path.join(tmpdir, "b.jpg"))
            open(os.path.join(tmpdir, "c.txt"), "w").close()
            result = list_images(tmpdir, "name_asc")
            data = json.loads(result)
            self.assertIn("images", data)
            names = [img["name"] for img in data["images"]]
            self.assertIn("a.png", names)
            self.assertIn("b.jpg", names)
            self.assertNotIn("c.txt", names)

    def test_list_images_nonexistent_directory(self):
        from nodes import list_images
        result = list_images("/nonexistent/path/abc123", "name_asc")
        data = json.loads(result)
        self.assertEqual(data["images"], [])

    def test_list_images_with_sort(self):
        from nodes import list_images
        with tempfile.TemporaryDirectory() as tmpdir:
            _create_test_image(os.path.join(tmpdir, "a.png"))
            _create_test_image(os.path.join(tmpdir, "b.png"))
            result = list_images(tmpdir, "name_desc")
            data = json.loads(result)
            names = [img["name"] for img in data["images"]]
            self.assertEqual(names[0], "b.png")


if __name__ == "__main__":
    unittest.main()