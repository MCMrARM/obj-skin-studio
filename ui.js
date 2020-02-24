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
        // this.draw();
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