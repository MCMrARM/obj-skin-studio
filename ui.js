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
        this.context = this.canvas.getContext("webgl");
        this.renderer = new Renderer(this.canvas, this.context);
        this.renderer.bgColor = [0x10 / 256, 0x1f / 256, 0x27 / 256, 1];
        this.renderer.draw();
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
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height  = this.canvas.offsetHeight;

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

    constructor(index) {
        this.index = index;
        this.image = null;
        this.imageUrl = null;
        this.model = null;
        this.modelStr = null;
        this.updateCb = new Set();
    }

    loadFromLS() {
        this.setImage(localStorage.getItem("skin." + this.index + ".image"));
        this.modelStr = localStorage.getItem("skin." + this.index + ".model");
        this.model = this.modelStr ? ObjModel.parse(this.modelStr) : null;
        this.onUpdated();
    }

    setImage(url) {
        this.imageUrl = url;
        if (url == null) {
            this.image = null;
            return;
        }
        UiHelper.loadImage(url, (img) => {
            if (this.imageUrl !== url)
                return;
            this.image = img;
            this.onUpdated();
        });
    }

    saveImageToLS() {
        localStorage.setItem("skin." + this.index + ".image", this.imageUrl);
    }

    saveModelToLS() {
        localStorage.setItem("skin." + this.index + ".model", this.modelStr);
    }

    onUpdated() {
        for (let cb of this.updateCb)
            cb(this);
    }

}

class SkinListUi {

    constructor(activeCallback) {
        this.skinList = [];
        this.skinDomList = [];
        this.selectedSkinDom = null;
        this.container = document.getElementById("skins");
        this.renderCanvas = document.createElement("canvas");
        this.renderCanvas.style.display = "none";
        this.renderCanvas.width = 64;
        this.renderCanvas.height = 64;
        this.renderContext = this.renderCanvas.getContext("webgl", {preserveDrawingBuffer: true});
        this.renderer = new Renderer(this.renderCanvas, this.renderContext);
        this.renderer.bgColor = [0, 0, 0, 0];
        this.skinUpdateCb = (skin) => this.redrawSkin(skin);
        this.activeCallback = activeCallback;
    }

    setSkinList(skinList) {
        let addSkinBtn = this.container.lastChild;
        while (this.container.firstChild)
            this.container.removeChild(this.container.lastChild);
        for (let skin of this.skinList)
            skin.updateCb.delete(this.skinUpdateCb);
        this.skinList = skinList;
        this.skinDomList = [];
        this.selectedSkinDom = null;
        for (let skin of skinList) {
            let dom = this.createEntryDOM(skin);
            this.skinDomList.push(dom);
            this.container.appendChild(dom);
            skin.updateCb.add(this.skinUpdateCb);
        }
        this.container.appendChild(addSkinBtn);
        for (let skin of skinList)
            this.redrawSkin(skin);
    }

    redrawSkin(skin) {
        if (skin.index >= this.skinList.length || this.skinList[skin.index] !== skin)
            return;
        this.renderer.setModel(skin.model);
        this.renderer.setTexture(skin.image);
        this.renderer.draw();
        console.log(this.renderCanvas.toDataURL());
        this.skinDomList[skin.index].img.src = this.renderCanvas.toDataURL();
    }

    setSelected(skin) {
        if (skin.index >= this.skinList.length || this.skinList[skin.index] !== skin)
            skin = null;
        if (this.selectedSkinDom !== null)
            this.selectedSkinDom.classList.remove("selected");
        this.selectedSkinDom = skin ? this.skinDomList[skin.index] : null;
        if (this.selectedSkinDom !== null)
            this.selectedSkinDom.classList.add("selected");
    }

    createEntryDOM(skin) {
        let el = document.createElement("li");
        el.img = document.createElement("img");
        el.appendChild(el.img);
        el.addEventListener("click", () => {
            this.activeCallback(skin);
        });
        return el;
    }

}

class UiManager {

    constructor() {
        this.skins = [];
        this.activeSkin = null;
        this.primaryCanvas = new PrimaryCanvas();
        this.groupList = new GroupList((g) => this.primaryCanvas.setSelectedGroup(g));
        this.skinListUi = new SkinListUi((skin) => this.setSkin(skin));
        this.defaultImage = null;

        UiHelper.loadImage("steve.png", (img) => this.setDefaultImage(img));

        document.getElementById("upload-model").addEventListener("click", () => {
            UiHelper.openFile((file) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", () => {
                    if (reader.readyState === FileReader.DONE && this.activeSkin !== null) {
                        this.activeSkin.modelStr = reader.result;
                        this.activeSkin.model = ObjModel.parse(reader.result);
                        this.activeSkin.saveModelToLS();
                        this.activeSkin.onUpdated();
                    }
                });
                reader.readAsText(file);
            });
        });
        document.getElementById("upload-texture").addEventListener("click", () => {
            UiHelper.openFile((file) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", () => {
                    if (reader.readyState === FileReader.DONE && this.activeSkin !== null) {
                        this.activeSkin.setImage(reader.result);
                        this.activeSkin.saveImageToLS();
                    }
                });
                reader.readAsDataURL(file);
            });
        });

        document.getElementById("addSkin").addEventListener("click",
            () => this.setSkin(this.addSkin()));

        this.loadCurrentSkins((skins) => this.setSkins(skins));
    }

    setDefaultImage(image) {
        this.defaultImage = image;
        if (this.activeSkin !== null && this.activeSkin.image === null)
            this.setSkin(this.activeSkin);
    }

    setSkin(skin) {
        this.activeSkin = skin;
        if (skin.image !== null)
            this.primaryCanvas.setTexture(skin.image);
        else
            this.primaryCanvas.setTexture(this.defaultImage);
        this.primaryCanvas.setModel(skin.model);
        if (skin.model !== null)
            this.groupList.setObjects(skin.model.objects);
        this.skinListUi.setSelected(skin);
    }

    createSkin(index) {
        let skin = new Skin(index);
        skin.updateCb.add(() => {
            if (skin === this.activeSkin)
                this.setSkin(this.activeSkin);
        });
        return skin;
    }

    addSkin() {
        let skin = this.createSkin(this.skins.length);
        this.skins.push(skin);
        localStorage.setItem("skin.count", this.skins.length);
        this.skinListUi.setSkinList(this.skins);
        return skin;
    }

    setSkins(skins) {
        this.skins = skins;
        if (this.skins.length === 0) {
            this.setSkin(this.addSkin());
        } else {
            this.skinListUi.setSkinList(this.skins);
            this.setSkin(this.skins[0]);
        }
    }

    loadCurrentSkins(callback) {
        let skinCount = localStorage.getItem("skin.count") || 0;
        let skins = [];
        for (let i = 0; i < skinCount; i++) {
            let skin = this.createSkin(i);
            skin.loadFromLS();
            skins.push(skin);
        }
        callback(skins);
    }

}