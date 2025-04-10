/*-----------------------------------------------------------------------------

             -Z direction
             v4--------v3
             |  \    /  |
-X direction |    v0    | +X direction
             |  /    \  |
             v1--------v2
             +Z direction

-----------------------------------------------------------------------------*/

export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data
        this.vertices = new Float32Array([
            // +Z face (v0, v1, v2)
             0.0,  1.0,  0.0,
            -0.5,  0.0,  0.5,
             0.5,  0.0,  0.5,
            // +X face (v0, v2, v3)
             0.0,  1.0,  0.0,
             0.5,  0.0,  0.5,
             0.5,  0.0, -0.5,
            // -Z face (v0, v3, v4)
             0.0,  1.0,  0.0,
             0.5,  0.0, -0.5,
            -0.5,  0.0, -0.5,
            // -X face (v0, v4, v1)
             0.0,  1.0,  0.0,
            -0.5,  0.0, -0.5,
            -0.5,  0.0,  0.5,
            // bottom face (v1, v2, v3, v4)
            -0.5,  0.0,  0.5,
             0.5,  0.0,  0.5,
             0.5,  0.0, -0.5,
            -0.5,  0.0, -0.5
        ]);

        this.faceNormals = new Float32Array([
            // +Z face (v0, v1, v2)
            0, 1/Math.sqrt(5), 2/Math.sqrt(5),
            0, 1/Math.sqrt(5), 2/Math.sqrt(5),
            0, 1/Math.sqrt(5), 2/Math.sqrt(5),
            // +X face (v0, v2, v3)
            2/Math.sqrt(5), 1/Math.sqrt(5), 0,
            2/Math.sqrt(5), 1/Math.sqrt(5), 0,
            2/Math.sqrt(5), 1/Math.sqrt(5), 0,
            // -Z face (v0, v3, v4)
            0, 1/Math.sqrt(5), -2/Math.sqrt(5),
            0, 1/Math.sqrt(5), -2/Math.sqrt(5),
            0, 1/Math.sqrt(5), -2/Math.sqrt(5),
            // -X face (v0, v4, v1)
            -2/Math.sqrt(5), 1/Math.sqrt(5), 0,
            -2/Math.sqrt(5), 1/Math.sqrt(5), 0,
            -2/Math.sqrt(5), 1/Math.sqrt(5), 0,
            // bottom face (v1, v2, v3, v4)
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0
        ]);

        const NUM1 = Math.sqrt(17 - 4 * Math.sqrt(5));
        const NUM2 = 2 / NUM1;
        const NUM3 = (2 - Math.sqrt(5)) / NUM1;

        this.vertexNormals = new Float32Array([
            // +Z face (v0, v1, v2)
             0, 1, 0, // v0
            -NUM2,  NUM3,  NUM2, // +Z-X (v1)
             NUM2,  NUM3,  NUM2, // +Z+X (v2)
            // +X face (v0, v2, v3)
             0, 1, 0, // v0
             NUM2,  NUM3,  NUM2, // +Z+X (v2)
             NUM2,  NUM3, -NUM2, // -Z+X (v3)
            // -Z face (v0, v3, v4)
             0, 1, 0, // v0
             NUM2,  NUM3, -NUM2, // -Z+X (v3)
            -NUM2,  NUM3, -NUM2, // -Z-X (v4)
            // -X face (v0, v4, v1)
             0, 1, 0, // v0
             -NUM2,  NUM3, -NUM2, // -Z-X (v4)
             -NUM2,  NUM3,  NUM2, // +Z-X (v1)
            // bottom face (v1, v2, v3, v4)
            -NUM2,  NUM3,  NUM2, // +Z-X (v1)
             NUM2,  NUM3,  NUM2, // +Z+X (v2)
             NUM2,  NUM3, -NUM2, // -Z+X (v3)
            -NUM2,  NUM3, -NUM2  // -Z-X (v4)
        ]);

        this.normals = new Float32Array(48);
        this.normals.set(this.faceNormals);

        // if color is provided, set all vertices' color to the given color
        if (options.color) {
            for (let i = 0; i < 24 * 4; i += 4) {
                this.colors[i] = options.color[0];
                this.colors[i+1] = options.color[1];
                this.colors[i+2] = options.color[2];
                this.colors[i+3] = options.color[3];
            }
        }
        else {
            this.colors = new Float32Array([
                // +Z face (v0, v1, v2) - magenta - red
                1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,
                // +X face (v0, v2, v3) - cyan - yellow
                1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,
                // -Z face (v0, v3, v4) - red - magenta
                1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1,
                // -X face (v0, v4, v1) - yellow - cyan
                0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1,
                // bottom face (v1, v2, v3, v4) - blue
                0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1
            ]);
        }

        this.texCoords = new Float32Array([
            // +Z face (v0, v1, v2)
            0.5, 1,   0, 0,   1, 0,
            // +X face (v0, v2, v3)
            0.5, 1,   0, 0,   1, 0,
            // -Z face (v0, v3, v4)
            0.5, 1,   0, 0,   1, 0,
            // -X face (v0, v4, v1)
            0.5, 1,   0, 0,   1, 0,
            // bottom face (v1, v2, v3, v4)
            0, 0,   1, 0,   1, 1,   0, 1
        ]);

        this.indices = new Uint16Array([
            // +Z face (v0, v1, v2)
            0, 1, 2,
            // +X face (v0, v2, v3)
            3, 4, 5,
            // -Z face (v0, v3, v4)
            6, 7, 8,
            // -X face (v0, v4, v1)
            9, 10, 11,
            // bottom face (v1, v2, v3, v4)
            12, 13, 14,  14, 15, 12
        ]);

        this.initBuffers();
    }

    copyVertexNormalsToNormals() {
        this.normals.set(this.vertexNormals);
    }

    copyFaceNormalsToNormals() {
        this.normals.set(this.faceNormals);
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);  // texCoord

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        // normals 데이터만 업데이트
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {

        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 