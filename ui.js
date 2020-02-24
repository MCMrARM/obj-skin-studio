class UiHelper {

    static fileInput = null;

    static openFile(callback) {
        if (UiHelper.fileInput === null) {
            let el = document.createElement("input");
            el.type = "file";
            el.style.display = "none";
            document.body.appendChild(el);
            console.log(el);
            UiHelper.fileInput = el;
        }
        UiHelper.fileInput.onchange = (ev) => {
            if (ev.target.files.length !== 1)
                return;
            callback(ev.target.files[0]);
        };
        UiHelper.fileInput.click();
    }

    static loadImage(url, cb) {
        let image = new Image();
        image.onload = () => {
            cb(image);
        };
        image.src = url;
    }

}

class PrimaryCanvas {

    constructor() {
        this.canvas = document.getElementById("primaryCanvas");
        this.renderer = new Renderer(this.canvas);
        this.canvas.addEventListener("mousemove", (ev) => {
            if (ev.buttons & 1)
                this.rotateByMouseDelta(ev.movementX, ev.movementY);
        });

        window.addEventListener('resize', () => this.draw(), false);
    }

    setModel(model) {
        this.renderer.setModel(model);
        this.draw();
    }

    setTexture(image) {
        this.renderer.setTexture(image);
        this.draw();
    }

    setSelectedGroup(group) {
        if (group !== null) {
            this.renderer.highlightedVertexStart = group.start;
            this.renderer.highlightedVertexEnd = group.end;
        } else {
            this.renderer.highlightedVertexStart = -1;
            this.renderer.highlightedVertexEnd = -1;
        }
        this.draw();
    }

    rotateByMouseDelta(dx, dy) {
        this.renderer.rotationX += dx * 0.01;
        this.renderer.rotationY += dy * 0.01;
        this.draw();
    }

    draw() {
        this.renderer.draw();
    }

}

class GroupList {

    constructor(selectCallback) {
        this.container = document.getElementById("groupTree");
        this.selectedElement = null;
        this.selectCallback = selectCallback;
    }

    setObjects(objects) {
        // Clear old groups
        while (this.container.firstChild)
            this.container.removeChild(this.container.lastChild);
        this.selectedElement = null;

        for (let object of objects) {
            let objectName = object.name ? object.name : "<default>";
            for (let group of object.groups) {
                let groupName = group.name ? objectName + "/" + group.name : objectName;
                this.container.appendChild(this.createGroupDOM(group, groupName));
            }
        }
    }

    createGroupDOM(group, name) {
        let e = document.createElement("li");
        let text = document.createElement("span");
        text.textContent = name;
        e.addEventListener("click", () => {
            if (this.selectedElement !== null)
                this.selectedElement.classList.remove("selected");
            if (this.selectedElement !== e) {
                e.classList.add("selected");
                this.selectedElement = e;
                this.selectCallback(group);
            } else {
                this.selectedElement = null;
                this.selectCallback(null);
            }
        });
        e.appendChild(text);
        return e;
    }

}

class Skin {

    constructor() {
        this.image = null;
        this.imageUrl = null;
        this.model = null;
    }

}

class UiManager {

    constructor() {
        this.activeSkin = new Skin();
        this.primaryCanvas = new PrimaryCanvas();
        this.groupList = new GroupList((g) => this.primaryCanvas.setSelectedGroup(g));

        UiHelper.loadImage("steve.png", (img) => this.setDefaultImage(img));

        document.getElementById("upload-model").addEventListener("click", () => {
            UiHelper.openFile((file) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", () => {
                    if (reader.readyState === FileReader.DONE) {
                        this.activeSkin.model = ObjModel.parse(reader.result);
                        this.updateSkin();
                    }
                });
                reader.readAsText(file);
            });
        });
        document.getElementById("upload-texture").addEventListener("click", () => {
            UiHelper.openFile((file) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", () => {
                    if (reader.readyState === FileReader.DONE) {
                        let skin = this.activeSkin;
                        skin.imageUrl = reader.result;
                        UiHelper.loadImage(reader.result, (img) => {
                            if (skin.imageUrl === reader.result) {
                                skin.image = img;
                                this.updateSkin();
                            }
                        });
                    }
                });
                reader.readAsDataURL(file);
            });
        });
    }

    setDefaultImage(image) {
        this.defaultImage = image;
        if (this.activeSkin.image === null) {
            this.activeSkin.image = image;
            this.updateSkin();
        }
    }

    setSkin(skin) {
        this.primaryCanvas.setTexture(skin.image);
        this.primaryCanvas.setModel(skin.model);
        if (skin.model !== null)
            this.groupList.setObjects(skin.model.objects);
    }

    updateSkin() {
        this.setSkin(this.activeSkin);
    }

}