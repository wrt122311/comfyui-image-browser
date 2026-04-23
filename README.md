# ComfyUI 图片浏览器 (Image Browser)

一个 ComfyUI 自定义节点，提供可视化图片浏览器，支持目录浏览、瀑布流展示、多种排序和单张/批量图片选择输出。

## 功能

- **目录浏览** - 输入服务器上的绝对路径，点击"加载"浏览图片
- **瀑布流展示** - CSS Grid 自适应列数，图片按原始比例显示
- **12 种排序方式** - 按名称、创建时间、文件大小、文件类型、像素数、修改时间（各含升降序）
- **单选/多选模式** - 切换选择模式，多选模式支持 Ctrl/Cmd 多选
- **图片预览** - 通过服务端 API 提供图片缩略图预览
- **IMAGE 输出** - 选中的图片以 tensor 格式输出，可直接连接下游节点
- **IMAGE_PATH 输出** - 同时输出选中图片的路径信息

## 支持的图片格式

jpg, jpeg, png, webp, bmp, gif

## 排序选项

| 选项 | 说明 |
|------|------|
| name_asc | 文件名 A-Z |
| name_desc | 文件名 Z-A |
| date_asc | 创建时间 最早优先 |
| date_desc | 创建时间 最新优先 |
| size_asc | 文件大小 最小优先 |
| size_desc | 文件大小 最大优先 |
| type_asc | 扩展名 A-Z |
| type_desc | 扩展名 Z-A |
| dimensions_asc | 像素数 最小优先 |
| dimensions_desc | 像素数 最大优先 |
| modified_asc | 修改时间 最早优先 |
| modified_desc | 修改时间 最新优先 |

## 安装

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/wrt122311/comfyui-image-browser.git
```

重启 ComfyUI 即可。

## 使用方法

1. 在节点列表中搜索"图片浏览器"或 ImageBrowser
2. 在目录输入框中填入服务器上的图片目录绝对路径（如 `/home/user/images`）
3. 点击"加载"按钮加载图片列表
4. 选择排序方式
5. 点击图片选中（多选模式需先切换为"多选"，然后 Ctrl/Cmd+点击）
6. 选中图片后，`IMAGE` 输出可连接到任何接受图片输入的节点

## 输出

| 输出 | 类型 | 说明 |
|------|------|------|
| IMAGE | IMAGE | 选中图片的 tensor（单张或批量） |
| IMAGE_PATH | STRING | 选中图片的路径 |