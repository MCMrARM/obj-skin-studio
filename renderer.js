let mat4 = glMatrix.mat4;

class Renderer {

    static VERTEX_SHADER_CODE =
        "uniform mat4 uProjectionMatrix;\n" +
        "attribute vec3 aPosition;\n" +
        "void main(void) {\n" +
        "  gl_Position = uProjectionMatrix * vec4(aPosition, 1.0);\n" +
        "}";

    static FRAGMENT_SHADER_CODE =
        "void main(void) {\n" +
        "  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n" +
        "}";

    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('experimental-webgl');
        this.active = false;
        this.model = null;

        let gl = this.context;

        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this.vertexShader, Renderer.VERTEX_SHADER_CODE);
        gl.compileShader(this.vertexShader);

        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, Renderer.FRAGMENT_SHADER_CODE);
        gl.compileShader(this.fragmentShader);

        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("Failed to link shader", gl.getProgramInfoLog(this.program));
        }
        gl.useProgram(this.program);
        this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.positionLocation = gl.getAttribLocation(this.program, 'aPosition');

        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
    }

    setActive(active) {
        if (this.active === active)
            return;
        this.active = active;
        if (this.active)
            this.draw();
    }

    setModel(model) {
        this.model = model;
        let indexArray = model.createIndexArray();
        this.vertexCount = indexArray.length / 3;

        let gl = this.context;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.createVertexArray()), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    draw() {
        let gl = this.context;
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        let mat = mat4.create();
        mat4.perspective(mat, 0.5, this.canvas.width / this.canvas.height, 0.1, 100);
        gl.uniformMatrix4fv(this.projectionMatrixLocation, false, mat);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.positionLocation);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(() => this.draw());
    }

}