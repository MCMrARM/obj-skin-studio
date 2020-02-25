class ObjModel {

    static INDEX_VERTEX = 0;
    static INDEX_NORMAL = 1;
    static INDEX_UV = 2;

    constructor(vertexData, normalData, uvData, indices) {
        this.vertexData = vertexData;
        this.normalData = normalData;
        this.uvData = uvData;
        this.indices = indices;
        this.objects = [];
    }

    static parse(data) {
        let model = new ObjModel([], [], [], []);
        let lines = data.split("\n");
        let vertexNum = 0;
        let objectName = "<default>";
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#"))
                continue;
            let p = line.split(" ");
            let t = p[0];
            if (t === "v") {
                model.vertexData.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
            } else if (t === "vn") {
                model.normalData.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
            } else if (t === "vt") {
                model.uvData.push([parseFloat(p[1]), parseFloat(p[2])]);
            } else if (t === "o") {
                objectName = line.substr(2);
                model.objects.push({
                    "name": objectName,
                    "start": model.indices.length,
                    "vertexStart": vertexNum,
                    "groups": []
                });
            } else if (t === "g" && currObject != null) {
                let groupName = line.substr(2);
                currObject["groups"].push({
                    "name": groupName,
                    "displayName": objectName + "/" + groupName,
                    "start": model.indices.length,
                    "vertexStart": vertexNum,
                });
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
                vertexNum += arr.length - 2;
            } else {
                console.log("Unexpected command: " + t);
            }
        }
        model.fixObjects();
        return model;
    }

    fixObjects() {
        let end = this.indices.length;
        let vend = this.getVertexCount() / 3;
        for (let i = this.objects.length - 1; i >= 0; --i) {
            let gend = end, vgend = vend;
            for (let j = this.objects[i].groups.length - 1; j >= 0; --j) {
                this.objects[i].groups[j]["end"] = gend;
                this.objects[i].groups[j]["vertexEnd"] = vgend;
                gend = this.objects[i].groups[j]["start"];
                vgend = this.objects[i].groups[j]["vertexStart"];
            }
            if (gend > 0) {
                this.objects[i].groups.push({
                    "name": null,
                    "displayName": this.objects[i].name,
                    "start": this.objects[i]["start"],
                    "end": gend,
                    "vertexStart": this.objects[i]["vertexStart"],
                    "vertexEnd": vgend
                });
            }
            this.objects[i]["end"] = end;
            this.objects[i]["vertexEnd"] = vend;
            end = this.objects[i]["start"];
            vend = this.objects[i]["vertexStart"];
        }
        if (end > 0) {
            this.objects.push({
                "name": null,
                "start": 0,
                "end": end,
                "vertexStart": 0,
                "vertexEnd": vend,
                "groups": {
                    "name": null,
                    "displayName": "<default>",
                    "start": 0,
                    "end": end,
                    "vertexStart": 0,
                    "vertexEnd": vend
                }
            });
        }
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
            for (let j = 0; j < i.length - 2; j++)
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

    getMinecraftIndices(array, start, end) {
        // There's a bug where Minecraft in fact only supports 4-sized indices, let's workaround it (it doesn't support 3-sided ones properly even)
        for (let ix = start; ix < end; ix++) {
            let i = this.indices[ix];
            for (let j = 0; j < i.length - 2; j += 2) {
                if (j !== i.length - 3) { // If we have >=4 it's easy
                    array.push([i[0], i[j + 1], i[j + 2], i[j + 3]]);
                } else { // otherwise duplicate one of the vertexes
                    array.push([i[0], i[j + 1], i[j + 2], i[j + 2]]);
                }
            }
        }
    }

    exportPolyMesh(indices) {
        if (indices.length === 0)
            return null;
        return  {
            "normalized_uvs": true,
            "normals": this.normalData,
            "positions": this.vertexData,
            "uvs": this.uvData,
            "polys": indices
        };
    }

}