class ObjModel {

    static INDEX_VERTEX = 0;
    static INDEX_NORMAL = 1;
    static INDEX_UV = 2;

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
                console.log(arr);
                model.indices.push(arr);
            } else {
                console.log("Unexpected command: " + t);
            }
        }
        return model;
    }

    getVertexCount() {
        let ret = 0;
        for (let i of this.indices)
            ret += i.length - 2;
        return ret * 3;
    }

    createTriangles(layer) {
        let array = [];
        for (let i of this.indices) {
            for (let j = 0; j < i.length - 2; i++)
                array.push(i[0][layer], i[j + 1][layer], i[j + 2][layer]);
        }
        return array;
    }

    createVertexArray() {
        let array = [];
        for (let index of this.createTriangles(ObjModel.INDEX_VERTEX)) {
            let vertex = this.vertexData[index];
            array.push(vertex[0], vertex[1], vertex[2]);
        }
        console.log(array);
        return array;
    }

    createUVArray() {
        let array = [];
        for (let index of this.createTriangles(ObjModel.INDEX_UV)) {
            let vertex = this.uvData[index];
            array.push(vertex[0], 1 - vertex[1]);
        }
        return array;
    }

}