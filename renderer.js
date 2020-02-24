let mat4 = glMatrix.mat4;

class Renderer {

    static VERTEX_SHADER_CODE =
        "uniform mat4 uProjectionMatrix;\n" +
        "attribute vec3 aPosition;\n" +
        "attribute vec2 aUV;\n" +
        "varying highp vec2 vUV;\n" +
        "void main(void) {\n" +
        "  gl_Position = uProjectionMatrix * vec4(aPosition, 1.0);\n" +
        "  vUV = aUV;\n" +
        "}";

    static FRAGMENT_SHADER_CODE =
        "uniform lowp vec4 uColor;\n" +
        "uniform sampler2D uSampler;\n" +
        "varying highp vec2 vUV;\n" +
        "void main(void) {\n" +
        "  gl_FragColor = texture2D(uSampler, vUV) * uColor;\n" +
        "}";

    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('experimental-webgl');
        this.rotationX = this.rotationY = 0;
        this.highlightedVertexStart = this.highlightedVertexEnd = -1;
        this.hasModel = this.hasTexture = false;

        let gl = this.context;

        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this.vertexShader, Renderer.VERTEX_SHADER_CODE);
        gl.compileShader(this.vertexShader);
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS))
            console.error("Failed to link vertex shader", gl.getShaderInfoLog(this.vertexShader));

        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, Renderer.FRAGMENT_SHADER_CODE);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS))
            console.error("Failed to link fragment shader", gl.getShaderInfoLog(this.fragmentShader));

        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("Failed to link shader", gl.getProgramInfoLog(this.program));
        }
        gl.useProgram(this.program);
        this.colorLocation = gl.getUniformLocation(this.program, 'uColor');
        this.samplerLocation = gl.getUniformLocation(this.program, 'uSampler');
        this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.positionLocation = gl.getAttribLocation(this.program, 'aPosition');
        this.uvLocation = gl.getAttribLocation(this.program, 'aUV');

        this.vertexBuffer = gl.createBuffer();
        this.uvBuffer = gl.createBuffer();

        this.texture = gl.createTexture();
    }

    setModel(model) {
        if (model === null) {
            this.hasModel = false;
            return;
        }
        this.vertexCount = model.getVertexCount();

        let gl = this.context;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.createVertexArray()), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.createUVArray()), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.hasModel = true;
        this.highlightedVertexStart = this.highlightedVertexEnd = -1;
    }

    setTexture(image) {
        if (image === null) {
            this.hasTexture = false;
            return;
        }
        let gl = this.context;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.hasTexture = true;
    }

    draw() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height  = this.canvas.offsetHeight;

        let gl = this.context;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0x10 / 256, 0x1f / 256, 0x27 / 256, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (!this.hasModel || !this.hasTexture)
            return;

        let scale = 1 / 16;
        let mat = mat4.create();
        mat4.perspective(mat, 0.5, this.canvas.width / this.canvas.height, 0.1, 100);
        let lookMat = mat4.create();
        mat4.lookAt(lookMat, [-10, 0, 0], [0, 1, 0], [0, 1, 0]);
        mat4.mul(mat, mat, lookMat);
        mat4.rotateZ(mat, mat, this.rotationY);
        mat4.rotateY(mat, mat, this.rotationX);
        mat4.scale(mat, mat, [scale, scale, scale]);
        gl.uniformMatrix4fv(this.projectionMatrixLocation, false, mat);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(this.uvLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.uvLocation);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.samplerLocation, 0);
        gl.uniform4f(this.colorLocation, 1.0, 1.0, 1.0, 1.0);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

        if (this.highlightedVertexStart !== this.highlightedVertexEnd) {
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.uniform4f(this.colorLocation, 0.5, 0.5, 1.0, 0.75);
            gl.drawArrays(gl.TRIANGLES, (this.highlightedVertexStart) * 3, (this.highlightedVertexEnd - this.highlightedVertexStart) * 3);
        }
    }

}