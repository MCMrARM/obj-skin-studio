class ObjModel {

    constructor(vertexData, normalData, uvData, indices) {
        this.vertexData = vertexData;
        this.normalData = normalData;
        this.uvData = uvData;
        this.indices = indices;
    }

    static parse(data) {
        let model = new ObjModel([], [], [], []);
        let lines = data.split("\n");
        for (let line of lines) {
            if (line.startsWith("#"))
                continue;
            let p = line.split(" ");
            let t = p[0];
            if (t === "v") {
                model.vertexData.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
            } else if (t === "vn") {
                model.normalData.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
            } else if (t === "vt") {
                model.uvData.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
            } else if (t === "f") {
                let arr = [];
                for (let i = 1; i < p.length; i++) {
                    let v = p[i].split("/");
                    if (v.length === 3)
                        arr.push([parseInt(v[0]) - 1, parseInt(v[2]) - 1, parseInt(v[1]) - 1]);
                    else
                        console.log("Unsupported f format: " + line);
                }
                model.indices.push(arr);
            } else {
                console.log("Unexpected command: " + t);
            }
        }
        return model;
    }

    createVertexArray() {
        let array = [];
        for (let v of this.vertexData)
            array.push(v[0], v[1], v[2]);
        return array;
    }

    createIndexArray() {
        let array = [];
        for (let i of this.indices) {
            for (let j = 0; j < i.length - 2; i++)
                array.push(i[j][0], i[j + 1][0], i[j + 2][0]);
        }
        console.log(array);
        return array;
    }

}