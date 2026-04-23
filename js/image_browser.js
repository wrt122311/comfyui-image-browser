import { app } from "/scripts/app.js";

const SORT_OPTIONS = [
    { value: "name_asc", label: "名称 A-Z" },
    { value: "name_desc", label: "名称 Z-A" },
    { value: "date_asc", label: "创建时间 最早" },
    { value: "date_desc", label: "创建时间 最新" },
    { value: "size_asc", label: "文件大小 最小" },
    { value: "size_desc", label: "文件大小 最大" },
    { value: "type_asc", label: "类型 A-Z" },
    { value: "type_desc", label: "类型 Z-A" },
    { value: "dimensions_asc", label: "像素数 最小" },
    { value: "dimensions_desc", label: "像素数 最大" },
    { value: "modified_asc", label: "修改时间 最早" },
    { value: "modified_desc", label: "修改时间 最新" },
];

class ImageBrowserWidget {
    constructor(node) {
        this.node = node;
        this.selectedImages = [];
        this.selectionMode = "single";
        this.currentSort = "name_asc";
        this.currentDirectory = "";
        this.imageList = [];

        this.container = document.createElement("div");
        this.container.className = "image-browser-container";
        this.container.style.cssText = "width:100%;max-height:400px;overflow:auto;padding:8px;background:#1a1a2e;border-radius:4px;";

        this._buildUI();
    }

    _buildUI() {
        this._buildTopBar();
        this._buildGrid();
        this._buildBottomBar();
        this.container.appendChild(this.topBar);
        this.container.appendChild(this.gridContainer);
        this.container.appendChild(this.bottomBar);
    }

    _buildTopBar() {
        this.topBar = document.createElement("div");
        this.topBar.style.cssText = "display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap;";

        this.dirInput = document.createElement("input");
        this.dirInput.type = "text";
        this.dirInput.placeholder = "选择目录路径（服务器绝对路径）...";
        this.dirInput.style.cssText = "flex:1;min-width:200px;padding:4px 8px;background:#2a2a4a;color:#fff;border:1px solid #444;border-radius:3px;";
        this.dirInput.addEventListener("change", () => {
            this.currentDirectory = this.dirInput.value;
            this._updateNodeValue("directory", this.currentDirectory);
            this._loadImages();
        });

        this.browseBtn = document.createElement("button");
        this.browseBtn.textContent = "加载";
        this.browseBtn.style.cssText = "padding:4px 12px;background:#4a6fa5;color:#fff;border:none;border-radius:3px;cursor:pointer;";
        this.browseBtn.addEventListener("click", () => {
            this.currentDirectory = this.dirInput.value;
            this._updateNodeValue("directory", this.currentDirectory);
            this._loadImages();
        });

        this.sortSelect = document.createElement("select");
        this.sortSelect.style.cssText = "padding:4px;background:#2a2a4a;color:#fff;border:1px solid #444;border-radius:3px;";
        SORT_OPTIONS.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            this.sortSelect.appendChild(option);
        });
        this.sortSelect.value = this.currentSort;
        this.sortSelect.addEventListener("change", () => {
            this.currentSort = this.sortSelect.value;
            this._updateNodeValue("sort_by", this.currentSort);
        });

        this.modeBtn = document.createElement("button");
        this.modeBtn.textContent = "模式: 单选";
        this.modeBtn.style.cssText = "padding:4px 12px;background:#4a6fa5;color:#fff;border:none;border-radius:3px;cursor:pointer;";
        this.modeBtn.addEventListener("click", () => this._toggleSelectionMode());

        this.topBar.appendChild(this.dirInput);
        this.topBar.appendChild(this.browseBtn);
        this.topBar.appendChild(this.sortSelect);
        this.topBar.appendChild(this.modeBtn);
    }

    _buildGrid() {
        this.gridContainer = document.createElement("div");
        this.gridContainer.className = "image-browser-grid";
        this.gridContainer.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;";
    }

    _buildBottomBar() {
        this.bottomBar = document.createElement("div");
        this.bottomBar.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:#aaa;";

        this.counterLabel = document.createElement("span");
        this.counterLabel.textContent = "已选: 0";

        this.statusLabel = document.createElement("span");
        this.statusLabel.textContent = "";
        this.statusLabel.style.cssText = "color:#aaa;";

        this.bottomBar.appendChild(this.counterLabel);
        this.bottomBar.appendChild(this.statusLabel);
    }

    async _loadImages() {
        if (!this.currentDirectory) {
            this.imageList = [];
            this._renderGrid();
            this.statusLabel.textContent = "请输入目录路径";
            return;
        }
        this.statusLabel.textContent = "加载中...";
        try {
            const resp = await fetch(`/image_browser/list?dir=${encodeURIComponent(this.currentDirectory)}&sort=${this.currentSort}`);
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }
            const data = await resp.json();
            this.imageList = data.images || [];
            this._renderGrid();
            this.statusLabel.textContent = `共 ${this.imageList.length} 张图片`;
        } catch (e) {
            console.error("[ImageBrowser] 加载失败:", e);
            this.imageList = [];
            this._renderGrid();
            this.statusLabel.textContent = "加载失败，请检查目录路径是否正确";
        }
    }

    _renderGrid() {
        this.gridContainer.innerHTML = "";
        if (this.imageList.length === 0) {
            this.gridContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">无图片</div>';
            return;
        }

        this.imageList.forEach((imgInfo, idx) => {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = "position:relative;border-radius:4px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color 0.2s;";
            wrapper.dataset.index = idx;

            const img = document.createElement("img");
            const imgUrl = `/image_browser/view?path=${encodeURIComponent(imgInfo.path)}`;
            img.src = imgUrl;
            img.style.cssText = "width:100%;height:auto;display:block;min-height:60px;background:#2a2a4a;";
            img.loading = "lazy";
            img.onerror = () => { img.style.display = "none"; };

            const nameLabel = document.createElement("div");
            nameLabel.textContent = imgInfo.name;
            nameLabel.style.cssText = "font-size:10px;color:#ccc;padding:2px 4px;background:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
            nameLabel.title = imgInfo.path;

            wrapper.appendChild(img);
            wrapper.appendChild(nameLabel);
            wrapper.addEventListener("click", (e) => this._onImageClick(e, idx, imgInfo));
            this.gridContainer.appendChild(wrapper);
        });
    }

    _onImageClick(e, idx, imgInfo) {
        if (this.selectionMode === "multi" && (e.ctrlKey || e.metaKey)) {
            const existingIdx = this.selectedImages.findIndex(s => s.path === imgInfo.path);
            if (existingIdx >= 0) {
                this.selectedImages.splice(existingIdx, 1);
            } else {
                this.selectedImages.push(imgInfo);
            }
        } else {
            this.selectedImages = [imgInfo];
        }

        this._highlightSelected();
        this._updateNodeValue("selected_images", JSON.stringify(this.selectedImages.map(s => s.path)));
        this.counterLabel.textContent = `已选: ${this.selectedImages.length}`;
    }

    _highlightSelected() {
        const selectedPaths = new Set(this.selectedImages.map(s => s.path));
        this.gridContainer.querySelectorAll(":scope > div").forEach((el, idx) => {
            if (idx < this.imageList.length && selectedPaths.has(this.imageList[idx].path)) {
                el.style.borderColor = "#4a9eff";
            } else {
                el.style.borderColor = "transparent";
            }
        });
    }

    _toggleSelectionMode() {
        this.selectionMode = this.selectionMode === "single" ? "multi" : "single";
        this.modeBtn.textContent = `模式: ${this.selectionMode === "single" ? "单选" : "多选"}`;
        if (this.selectionMode === "single" && this.selectedImages.length > 1) {
            this.selectedImages = [this.selectedImages[0]];
            this._highlightSelected();
            this._updateNodeValue("selected_images", JSON.stringify(this.selectedImages.map(s => s.path)));
            this.counterLabel.textContent = `已选: ${this.selectedImages.length}`;
        }
    }

    _updateNodeValue(widgetName, value) {
        const widget = this.node.widgets?.find(w => w.name === widgetName);
        if (widget) {
            widget.value = value;
        }
        if (this.node.onPropertyChanged) {
            this.node.onPropertyChanged(widgetName, value);
        }
    }
}

app.registerExtension({
    name: "ComfyUI.ImageBrowser",
    async beforeRegisterNodeDef(nodeType, nodeData, appInstance) {
        if (nodeData.name !== "ImageBrowser") return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.apply(this, arguments);

            const browserWidget = new ImageBrowserWidget(this);

            const hiddenWidgets = ["directory", "sort_by", "selected_images"];
            hiddenWidgets.forEach(name => {
                const w = this.widgets?.find(w => w.name === name);
                if (w) {
                    w.type = "hidden";
                    w.computeSize = () => [0, -4];
                }
            });

            this.addDOMWidget("image_browser", "custom", browserWidget.container, {
                getValue: () => JSON.stringify({
                    directory: browserWidget.currentDirectory,
                    sort_by: browserWidget.currentSort,
                    selected_images: browserWidget.selectedImages.map(s => s.path),
                }),
                setValue: (v) => {
                    try {
                        const data = typeof v === "string" ? JSON.parse(v) : v;
                        browserWidget.currentDirectory = data.directory || "";
                        browserWidget.currentSort = data.sort_by || "name_asc";
                        browserWidget.selectedImages = [];
                        if (browserWidget.dirInput) browserWidget.dirInput.value = browserWidget.currentDirectory;
                        if (browserWidget.sortSelect) browserWidget.sortSelect.value = browserWidget.currentSort;
                        if (browserWidget.currentDirectory) {
                            browserWidget._loadImages();
                        }
                    } catch (e) {}
                },
            });

            const origOnConfigure = this.onConfigure;
            this.onConfigure = function (info) {
                origOnConfigure?.apply(this, arguments);
                if (info?.widgets_values) {
                    const dirWidget = this.widgets?.find(w => w.name === "directory");
                    const sortWidget = this.widgets?.find(w => w.name === "sort_by");
                    const selWidget = this.widgets?.find(w => w.name === "selected_images");
                    if (dirWidget?.value) {
                        browserWidget.currentDirectory = dirWidget.value;
                        if (browserWidget.dirInput) browserWidget.dirInput.value = dirWidget.value;
                    }
                    if (sortWidget?.value) {
                        browserWidget.currentSort = sortWidget.value;
                        if (browserWidget.sortSelect) browserWidget.sortSelect.value = sortWidget.value;
                    }
                }
            };
        };
    },
});