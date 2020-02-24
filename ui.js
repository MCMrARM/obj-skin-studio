class PrimaryCanvas {

    constructor() {
        this.canvas = document.getElementById("primaryCanvas");
        this.renderer = new Renderer(this.canvas);
        this.canvas.addEventListener("mousemove", (ev) => {
            if (ev.buttons & 1)
                this.rotateByMouseDelta(ev.movementX, ev.movementY);
        });
    }

    setModel(model) {
        this.renderer.setModel(model);
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