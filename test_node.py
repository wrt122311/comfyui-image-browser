import os
import sys
import json
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))


def _create_test_image(path, size=(64, 64), color=(255, 0, 0)):
    img = Image.new("RGB", size, color)
    img.save(path)
    return path


class MockTensor:
    def __init__(self, shape):
        self.shape = shape

    def __eq__(self, other):
        if isinstance(other, MockTensor):
            return self.shape == other.shape
        return NotImplemented


def _setup_torch_mock():
    mock_torch = MagicMock()
    mock_np = MagicMock()

    def make_tensor(shape):
        return MockTensor(shape)

    mock_torch.zeros = lambda shape: MockTensor(shape)
    mock_torch.from_numpy = lambda arr: MockTensor((1, 64, 64, 3))
    mock_torch.cat = lambda tensors, dim=0: MockTensor((len(tensors), 64, 64, 3))

    mock_np.array = lambda x: x

    sys.modules["torch"] = mock_torch
    sys.modules["numpy"] = mock_np


_setup_torch_mock()

from nodes import ImageBrowser


class TestImageBrowser(unittest.TestCase):

    def test_input_types_has_required_fields(self):
        inputs = ImageBrowser.INPUT_TYPES()
        required = inputs.get("required", {})
        self.assertIn("directory", required)
        self.assertIn("sort_by", required)

    def test_browse_empty_selection(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _create_test_image(os.path.join(tmpdir, "test.png"))
            node = ImageBrowser()
            result = node.browse(tmpdir, "name_asc", "[]")
            self.assertIsNotNone(result)

    def test_browse_with_selected_images(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            img_path = _create_test_image(os.path.join(tmpdir, "test.png"))
            node = ImageBrowser()
            result = node.browse(tmpdir, "name_asc", json.dumps([img_path]))
            self.assertIsNotNone(result)
            self.assertEqual(len(result), 2)

    def test_browse_nonexistent_image(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            node = ImageBrowser()
            result = node.browse(tmpdir, "name_asc", '["/nonexistent/image.png"]')
            self.assertIsNotNone(result)


if __name__ == "__main__":
    unittest.main()