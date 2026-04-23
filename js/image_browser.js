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

        const styleId = "image-browser-scrollbar-style";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
.image-browser-scroll::-webkit-scrollbar { width: 10px; }
.image-browser-scroll::-webkit-scrollbar-track { background: #151525; border-radius: 5px; }
.image-browser-scroll::-webkit-scrollbar-thumb { background: #555; border-radius: 5px; }
.image-browser-scroll::-webkit-scrollbar-thumb:hover { background: #888; }
.image-browser-scroll { scrollbar-width: thin; scrollbar-color: #555 #151525; }
.dir-list::-webkit-scrollbar { width: 8px; }
.dir-list::-webkit-scrollbar-track { background: #1a1a2e; }
.dir-list::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
.dir-list { scrollbar-width: thin; scrollbar-color: #555 #1a1a2e; }
`;
            document.head.appendChild(style);
        }

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
        this.topBar.style.cssText = "display:flex;gap:6px;padding:6px 8px;align-items:center;flex-wrap:wrap;flex-shrink:0;border-bottom:1px solid #333;background:#22223a;z-index:10;";

        this.dirInput = document.createElement("input");
        this.dirInput.type = "text";
        this.dirInput.placeholder = "输入服务器目录路径...";
        this.dirInput.style.cssText = "flex:1;min-width:120px;padding:4px 8px;background:#2a2a4a;color:#fff;border:1px solid #444;border-radius:3px;font-size:12px;";
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
        this.folderBtn.addEventListener("click", () => this._showDirDialog("/"));

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
        this.gridWrapper.className = "image-browser-scroll";
        this.gridWrapper.style.cssText = "flex:1;overflow-y:auto;overflow-x:hidden;padding:4px;min-height:0;";

        this.gridContainer = document.createElement("div");
        this.gridContainer.className = "image-browser-grid";
        this.gridContainer.style.cssText = "position:relative;width:100%;";
        this.gridWrapper.appendChild(this.gridContainer);

        this._resizeObserver = new ResizeObserver(() => this._layoutMasonry());
        this._resizeObserver.observe(this.gridWrapper);
    }

    _buildBottomBar() {
        this.bottomBar = document.createElement("div");
        this.bottomBar.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:4px 8px;font-size:11px;color:#aaa;flex-shrink:0;border-top:1px solid #333;background:#22223a;z-index:10;";

        this.counterLabel = document.createElement("span");
        this.counterLabel.textContent = "已选: 0";

        this.statusLabel = document.createElement("span");
        this.statusLabel.textContent = "";
        this.statusLabel.style.cssText = "color:#aaa;";

        this.bottomBar.appendChild(this.counterLabel);
        this.bottomBar.appendChild(this.statusLabel);
    }

    _showDirDialog(currentPath) {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;";

        const dialog = document.createElement("div");
        dialog.style.cssText = "background:#1e1e2e;border:1px solid #555;border-radius:8px;width:680px;max-height:75vh;display:flex;flex-direction:column;";

        const header = document.createElement("div");
        header.style.cssText = "padding:10px 14px;border-bottom:1px solid #444;display:flex;align-items:center;gap:8px;flex-shrink:0;";

        const title = document.createElement("span");
        title.textContent = "选择目录";
        title.style.cssText = "color:#fff;font-weight:bold;font-size:14px;white-space:nowrap;";

        const pathDisplay = document.createElement("input");
        pathDisplay.type = "text";
        pathDisplay.value = currentPath;
        pathDisplay.style.cssText = "flex:1;padding:5px 8px;background:#2a2a4a;color:#fff;border:1px solid #555;border-radius:3px;font-size:12px;";

        const goBtn = document.createElement("button");
        goBtn.textContent = "前往";
        goBtn.style.cssText = "padding:5px 12px;background:#4a6fa5;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap;";
        goBtn.addEventListener("click", () => loadDirs(pathDisplay.value));

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.style.cssText = "padding:4px 8px;background:#c44;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;";
        closeBtn.addEventListener("click", () => overlay.remove());

        header.appendChild(title);
        header.appendChild(pathDisplay);
        header.appendChild(goBtn);
        header.appendChild(closeBtn);

        const bodyArea = document.createElement("div");
        bodyArea.style.cssText = "flex:1;display:flex;min-height:0;overflow:hidden;";

        const dirList = document.createElement("div");
        dirList.className = "dir-list";
        dirList.style.cssText = "width:220px;overflow-y:auto;padding:6px;border-right:1px solid #333;flex-shrink:0;";

        const previewArea = document.createElement("div");
        previewArea.style.cssText = "flex:1;overflow-y:auto;padding:6px;display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:3px;align-content:start;";

        bodyArea.appendChild(dirList);
        bodyArea.appendChild(previewArea);

        const footer = document.createElement("div");
        footer.style.cssText = "padding:8px 14px;border-top:1px solid #444;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;";

        const selectBtn = document.createElement("button");
        selectBtn.textContent = "选择此目录";
        selectBtn.style.cssText = "padding:6px 20px;background:#5a8f5a;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:13px;font-weight:bold;";
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
        dialog.appendChild(bodyArea);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });

        let currentDirPath = currentPath;

        async function loadDirs(path) {
            currentDirPath = path || "/";
            pathDisplay.value = currentDirPath;
            dirList.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">加载中...</div>';

            try {
                const resp = await fetch(`/image_browser/browse?path=${encodeURIComponent(currentDirPath)}`);
                const data = await resp.json();
                pathDisplay.value = data.path || currentDirPath;
                currentDirPath = data.path || currentDirPath;
                dirList.innerHTML = "";

                if (currentDirPath !== "/") {
                    const parentPath = currentDirPath.split("/").slice(0, -1).join("/") || "/";
                    const parentItem = document.createElement("div");
                    parentItem.textContent = "📁 ..";
                    parentItem.style.cssText = "padding:6px 8px;color:#ccc;cursor:pointer;border-radius:3px;font-size:12px;";
                    parentItem.addEventListener("mouseenter", () => parentItem.style.background = "#333");
                    parentItem.addEventListener("mouseleave", () => parentItem.style.background = "transparent");
                    parentItem.addEventListener("click", () => loadDirs(parentPath));
                    dirList.appendChild(parentItem);
                }

                if (!data.dirs || data.dirs.length === 0) {
                    const empty = document.createElement("div");
                    empty.textContent = "无子目录";
                    empty.style.cssText = "color:#888;text-align:center;padding:10px;font-size:11px;";
                    dirList.appendChild(empty);
                }

                (data.dirs || []).forEach(dir => {
                    const item = document.createElement("div");
                    item.textContent = `📁 ${dir.name}`;
                    item.style.cssText = "padding:6px 8px;color:#ccc;cursor:pointer;border-radius:3px;font-size:12px;";
                    item.addEventListener("mouseenter", () => item.style.background = "#333");
                    item.addEventListener("mouseleave", () => item.style.background = "transparent");
                    item.addEventListener("click", () => loadDirs(dir.path));
                    dirList.appendChild(item);
                });

                loadPreviews(currentDirPath);
            } catch (e) {
                dirList.innerHTML = '<div style="color:#f66;text-align:center;padding:20px;">加载失败</div>';
            }
        }

        async function loadPreviews(dirPath) {
            previewArea.innerHTML = '<div style="color:#888;grid-column:1/-1;text-align:center;padding:20px;font-size:11px;">加载预览...</div>';
            try {
                const resp = await fetch(`/image_browser/list?dir=${encodeURIComponent(dirPath)}&sort=name_asc`);
                if (!resp.ok) { throw new Error("failed"); }
                const data = await resp.json();
                const images = (data.images || []).slice(0, 50);
                previewArea.innerHTML = "";

                if (images.length === 0) {
                    previewArea.innerHTML = '<div style="color:#888;grid-column:1/-1;text-align:center;padding:20px;font-size:11px;">此目录无图片</div>';
                    return;
                }

                images.forEach(img => {
                    const thumb = document.createElement("div");
                    thumb.style.cssText = "overflow:hidden;border-radius:3px;line-height:0;background:#2a2a4a;aspect-ratio:1;";

                    const imgEl = document.createElement("img");
                    imgEl.src = `/image_browser/view?path=${encodeURIComponent(img.path)}`;
                    imgEl.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
                    imgEl.loading = "lazy";
                    imgEl.onerror = () => { thumb.style.display = "none"; };

                    thumb.appendChild(imgEl);
                    previewArea.appendChild(thumb);
                });

                if (data.images.length > 50) {
                    const more = document.createElement("div");
                    more.textContent = `+${data.images.length - 50} 更多`;
                    more.style.cssText = "grid-column:1/-1;text-align:center;padding:6px;color:#aaa;font-size:11px;";
                    previewArea.appendChild(more);
                }
            } catch (e) {
                previewArea.innerHTML = '<div style="color:#888;grid-column:1/-1;text-align:center;padding:20px;font-size:11px;">预览不可用</div>';
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
            this.gridContainer.innerHTML = '<div style="color:#888;text-align:center;padding:40px;position:absolute;left:50%;transform:translateX(-50%);">无图片</div>';
            this.gridContainer.style.height = "100px";
            return;
        }

        this._masonryItems = [];

        this.imageList.forEach((imgInfo, idx) => {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = "position:absolute;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color 0.15s;background:#2a2a4a;border-radius:3px;";
            wrapper.dataset.index = idx;

            const img = document.createElement("img");
            if (imgInfo._localUrl) {
                img.src = imgInfo.url;
            } else {
                img.src = `/image_browser/view?path=${encodeURIComponent(imgInfo.path)}`;
            }
            img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
            img.loading = "lazy";
            img.draggable = false;

            wrapper.appendChild(img);
            wrapper.addEventListener("click", (e) => this._onImageClick(e, idx, imgInfo));

            this._masonryItems.push({ el: wrapper, img: img, loaded: false, aspectRatio: 1 });
            this.gridContainer.appendChild(wrapper);

            img.addEventListener("load", () => {
                this._masonryItems[idx].loaded = true;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    this._masonryItems[idx].aspectRatio = img.naturalWidth / img.naturalHeight;
                }
                this._layoutMasonry();
            });
            img.addEventListener("error", () => {
                wrapper.style.display = "none";
                this._masonryItems[idx].loaded = false;
                this._layoutMasonry();
            });
        });

        requestAnimationFrame(() => this._layoutMasonry());
    }

    _layoutMasonry() {
        if (!this._masonryItems || this._masonryItems.length === 0) return;

        const containerWidth = this.gridWrapper.clientWidth - 8;
        if (containerWidth <= 0) return;

        const GAP = 3;
        const MIN_COL_WIDTH = 90;
        const numCols = Math.max(1, Math.floor((containerWidth + GAP) / (MIN_COL_WIDTH + GAP)));
        const colWidth = (containerWidth - (numCols - 1) * GAP) / numCols;
        const colHeights = new Array(numCols).fill(0);

        for (let i = 0; i < this._masonryItems.length; i++) {
            const item = this._masonryItems[i];
            if (item.el.style.display === "none") continue;

            const minCol = colHeights.indexOf(Math.min(...colHeights));
            const x = minCol * (colWidth + GAP);
            const y = colHeights[minCol];

            const itemHeight = colWidth / item.aspectRatio;

            item.el.style.left = x + "px";
            item.el.style.top = y + "px";
            item.el.style.width = colWidth + "px";
            item.el.style.height = itemHeight + "px";

            colHeights[minCol] = y + itemHeight + GAP;
        }

        const maxHeight = Math.max(...colHeights);
        this.gridContainer.style.height = (maxHeight > 0 ? maxHeight : 200) + "px";
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
        this._masonryItems?.forEach((item, idx) => {
            if (idx < this.imageList.length && selectedPaths.has(this.imageList[idx].path)) {
                item.el.style.borderColor = "#4a9eff";
            } else {
                item.el.style.borderColor = "transparent";
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

            browserWidget.container.style.marginTop = "-30px";

            const hiddenWidgets = ["directory", "sort_by", "selected_images"];
            hiddenWidgets.forEach(name => {
                const w = this.widgets?.find(w => w.name === name);
                if (w) {
                    w.type = "hidden";
                    w.computeSize = () => [0, 0];
                    if (w.el) {
                        w.el.style.display = "none";
                        w.el.style.height = "0";
                        w.el.style.margin = "0";
                        w.el.style.padding = "0";
                    }
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