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
        this.container.style.cssText = "width:100%;height:100%;display:flex;flex-direction:column;background:#1a1a2e;border-radius:4px;overflow:hidden;";

        this._buildUI();
    }

    _buildUI() {
        this._buildTopBar();
        this._buildGrid();
        this._buildBottomBar();
        this.container.appendChild(this.topBar);
        this.container.appendChild(this.gridWrapper);
        this.container.appendChild(this.bottomBar);
    }

    _buildTopBar() {
        this.topBar = document.createElement("div");
        this.topBar.style.cssText = "display:flex;gap:6px;padding:6px 8px;align-items:center;flex-wrap:wrap;flex-shrink:0;border-bottom:1px solid #333;background:#22223a;";

        this.dirInput = document.createElement("input");
        this.dirInput.type = "text";
        this.dirInput.placeholder = "输入服务器目录路径...";
        this.dirInput.style.cssText = "flex:1;min-width:150px;padding:4px 8px;background:#2a2a4a;color:#fff;border:1px solid #444;border-radius:3px;font-size:12px;";
        this.dirInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.currentDirectory = this.dirInput.value;
                this._updateNodeValue("directory", this.currentDirectory);
                this._loadImages();
            }
        });

        this.loadBtn = document.createElement("button");
        this.loadBtn.textContent = "加载";
        this.loadBtn.style.cssText = "padding:4px 10px;background:#4a6fa5;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap;";
        this.loadBtn.addEventListener("click", () => {
            this.currentDirectory = this.dirInput.value;
            this._updateNodeValue("directory", this.currentDirectory);
            this._loadImages();
        });

        this.folderBtn = document.createElement("button");
        this.folderBtn.textContent = "选择目录";
        this.folderBtn.style.cssText = "padding:4px 10px;background:#5a8f5a;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap;";
        this.folderBtn.addEventListener("click", () => this._openFolderPicker());

        this.sortSelect = document.createElement("select");
        this.sortSelect.style.cssText = "padding:3px 4px;background:#2a2a4a;color:#fff;border:1px solid #444;border-radius:3px;font-size:11px;max-width:120px;";
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
            this._loadImages();
        });

        this.modeBtn = document.createElement("button");
        this.modeBtn.textContent = "单选";
        this.modeBtn.style.cssText = "padding:4px 10px;background:#4a6fa5;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap;";
        this.modeBtn.addEventListener("click", () => this._toggleSelectionMode());

        this.topBar.appendChild(this.dirInput);
        this.topBar.appendChild(this.loadBtn);
        this.topBar.appendChild(this.folderBtn);
        this.topBar.appendChild(this.sortSelect);
        this.topBar.appendChild(this.modeBtn);
    }

    _buildGrid() {
        this.gridWrapper = document.createElement("div");
        this.gridWrapper.style.cssText = "flex:1;overflow-y:auto;overflow-x:hidden;padding:4px;";

        this.gridContainer = document.createElement("div");
        this.gridContainer.className = "image-browser-grid";
        this.gridContainer.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:2px;align-content:start;";
        this.gridWrapper.appendChild(this.gridContainer);
    }

    _buildBottomBar() {
        this.bottomBar = document.createElement("div");
        this.bottomBar.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:4px 8px;font-size:11px;color:#aaa;flex-shrink:0;border-top:1px solid #333;background:#22223a;";

        this.counterLabel = document.createElement("span");
        this.counterLabel.textContent = "已选: 0";

        this.statusLabel = document.createElement("span");
        this.statusLabel.textContent = "";
        this.statusLabel.style.cssText = "color:#aaa;";

        this.bottomBar.appendChild(this.counterLabel);
        this.bottomBar.appendChild(this.statusLabel);
    }

    _openFolderPicker() {
        this._showDirDialog("/");
    }

    _showDirDialog(currentPath) {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;";

        const dialog = document.createElement("div");
        dialog.style.cssText = "background:#1e1e2e;border:1px solid #555;border-radius:8px;width:500px;max-height:70vh;display:flex;flex-direction:column;";

        const header = document.createElement("div");
        header.style.cssText = "padding:10px 14px;border-bottom:1px solid #444;display:flex;justify-content:space-between;align-items:center;";

        const title = document.createElement("span");
        title.textContent = "选择目录";
        title.style.cssText = "color:#fff;font-weight:bold;font-size:14px;";

        const pathDisplay = document.createElement("input");
        pathDisplay.type = "text";
        pathDisplay.value = currentPath;
        pathDisplay.style.cssText = "flex:1;margin:0 10px;padding:4px 8px;background:#2a2a4a;color:#fff;border:1px solid #555;border-radius:3px;font-size:12px;";

        const goBtn = document.createElement("button");
        goBtn.textContent = "前往";
        goBtn.style.cssText = "padding:4px 10px;background:#4a6fa5;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;";
        goBtn.addEventListener("click", () => {
            loadDirs(pathDisplay.value);
        });

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.style.cssText = "padding:4px 8px;background:#c44;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;";
        closeBtn.addEventListener("click", () => overlay.remove());

        header.appendChild(title);
        header.appendChild(pathDisplay);
        header.appendChild(goBtn);
        header.appendChild(closeBtn);

        const listContainer = document.createElement("div");
        listContainer.style.cssText = "flex:1;overflow-y:auto;padding:6px 10px;";

        const footer = document.createElement("div");
        footer.style.cssText = "padding:8px 14px;border-top:1px solid #444;display:flex;justify-content:flex-end;gap:8px;";

        const selectBtn = document.createElement("button");
        selectBtn.textContent = "选择此目录";
        selectBtn.style.cssText = "padding:6px 16px;background:#5a8f5a;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:13px;font-weight:bold;";
        selectBtn.addEventListener("click", () => {
            const selectedPath = pathDisplay.value;
            this.currentDirectory = selectedPath;
            this.dirInput.value = selectedPath;
            this._updateNodeValue("directory", selectedPath);
            this._loadImages();
            overlay.remove();
        });

        footer.appendChild(selectBtn);

        dialog.appendChild(header);
        dialog.appendChild(listContainer);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });

        async function loadDirs(path) {
            listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">加载中...</div>';
            try {
                const resp = await fetch(`/image_browser/browse?path=${encodeURIComponent(path)}`);
                const data = await resp.json();
                pathDisplay.value = data.path || path;
                listContainer.innerHTML = "";

                const parentPath = data.path.split("/").slice(0, -1).join("/") || "/";
                if (data.path !== "/") {
                    const parentItem = document.createElement("div");
                    parentItem.textContent = "📁 ..";
                    parentItem.style.cssText = "padding:6px 10px;color:#ccc;cursor:pointer;border-radius:3px;";
                    parentItem.addEventListener("mouseenter", () => parentItem.style.background = "#333");
                    parentItem.addEventListener("mouseleave", () => parentItem.style.background = "transparent");
                    parentItem.addEventListener("dblclick", () => loadDirs(parentPath));
                    listContainer.appendChild(parentItem);
                }

                if (data.dirs && data.dirs.length === 0) {
                    const empty = document.createElement("div");
                    empty.textContent = "此目录无子目录";
                    empty.style.cssText = "color:#888;text-align:center;padding:20px;";
                    listContainer.appendChild(empty);
                }

                (data.dirs || []).forEach(dir => {
                    const item = document.createElement("div");
                    item.textContent = `📁 ${dir.name}`;
                    item.style.cssText = "padding:6px 10px;color:#ccc;cursor:pointer;border-radius:3px;";
                    item.addEventListener("mouseenter", () => item.style.background = "#333");
                    item.addEventListener("mouseleave", () => item.style.background = "transparent");
                    item.addEventListener("dblclick", () => loadDirs(dir.path));
                    listContainer.appendChild(item);
                });
            } catch (e) {
                listContainer.innerHTML = '<div style="color:#f66;text-align:center;padding:20px;">加载失败</div>';
            }
        }

        document.body.appendChild(overlay);
        loadDirs(currentPath);
        pathDisplay.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loadDirs(pathDisplay.value);
        });
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
            this.statusLabel.textContent = "加载失败，请检查目录路径";
        }
    }

    _renderGrid() {
        this.gridContainer.innerHTML = "";
        if (this.imageList.length === 0) {
            this.gridContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;grid-column:1/-1;">无图片</div>';
            return;
        }

        this.imageList.forEach((imgInfo, idx) => {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = "position:relative;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color 0.15s;line-height:0;";
            wrapper.dataset.index = idx;

            const img = document.createElement("img");
            const imgUrl = `/image_browser/view?path=${encodeURIComponent(imgInfo.path)}`;
            img.src = imgUrl;
            img.style.cssText = "width:100%;height:auto;display:block;background:#2a2a4a;";
            img.loading = "lazy";
            img.onerror = () => { wrapper.style.display = "none"; };

            const nameLabel = document.createElement("div");
            nameLabel.textContent = imgInfo.name;
            nameLabel.style.cssText = "font-size:9px;color:#bbb;padding:1px 3px;background:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;";

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
        this.gridContainer.querySelectorAll(":scope > div[data-index]").forEach((el) => {
            const idx = parseInt(el.dataset.index);
            if (idx < this.imageList.length && selectedPaths.has(this.imageList[idx].path)) {
                el.style.borderColor = "#4a9eff";
            } else {
                el.style.borderColor = "transparent";
            }
        });
    }

    _toggleSelectionMode() {
        this.selectionMode = this.selectionMode === "single" ? "multi" : "single";
        this.modeBtn.textContent = this.selectionMode === "single" ? "单选" : "多选";
        this.modeBtn.style.background = this.selectionMode === "single" ? "#4a6fa5" : "#8a5aaf";
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