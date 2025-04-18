/*-----------------------------------------------------------------------------

                 -Z direction
                      v3
                       |
-X direction    v4----v0----v2    +X direction
                       |
                      v1
                 +Z direction

-----------------------------------------------------------------------------*/

export class Octahedron {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();


        const L2 = 1 / Math.sqrt(2);
        const L3 = 1 / Math.sqrt(3);

        this.vertices = new Float32Array([
            /* +Y+X+Z face (v0, v1, v2) */   0, L2,  0,    0,  0, L2,   L2,  0,  0,
            /* +Y+X-Z face (v0, v2, v3) */   0, L2,  0,   L2,  0,  0,    0,  0,-L2,
            /* +Y-X-Z face (v0, v3, v4) */   0, L2,  0,    0,  0,-L2,  -L2,  0,  0,
            /* +Y-X+Z face (v0, v4, v1) */   0, L2,  0,  -L2,  0,  0,    0,  0, L2,
            /* -Y+X+Z face (v1, v2, v5) */   0,  0, L2,   L2,  0,  0,    0,-L2,  0,
            /* -Y+X-Z face (v2, v3, v5) */  L2,  0,  0,    0,  0,-L2,    0,-L2,  0,
            /* -Y-X-Z face (v3, v4, v5) */   0,  0,-L2,  -L2,  0,  0,    0,-L2,  0,
            /* -Y-X+Z face (v4, v1, v5) */ -L2,  0,  0,    0,  0, L2,    0,-L2,  0
        ]);

        this.indices = new Uint16Array([
            0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11,
           12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
        ]);
        
        this.faceNormals = new Float32Array([
            /* +Y+X+Z face (v0, v1, v2) */  L3, L3, L3,   L3, L3, L3,   L3, L3, L3,
            /* +Y+X-Z face (v0, v2, v3) */  L3, L3,-L3,   L3, L3,-L3,   L3, L3,-L3,
            /* +Y-X-Z face (v0, v3, v4) */ -L3, L3,-L3,  -L3, L3,-L3,  -L3, L3,-L3,
            /* +Y-X+Z face (v0, v4, v1) */ -L3, L3, L3,  -L3, L3, L3,  -L3, L3, L3,
            /* -Y+X+Z face (v1, v2, v5) */  L3,-L3, L3,   L3,-L3, L3,   L3,-L3, L3,
            /* -Y+X-Z face (v2, v3, v5) */  L3,-L3,-L3,   L3,-L3,-L3,   L3,-L3,-L3,
            /* -Y-X-Z face (v3, v4, v5) */ -L3,-L3,-L3,  -L3,-L3,-L3,  -L3,-L3,-L3,
            /* -Y-X+Z face (v4, v1, v5) */ -L3,-L3, L3,  -L3,-L3, L3,  -L3,-L3, L3
        ]);

        this.vertexNormals = new Float32Array([
            /* +Y+X+Z face (v0, v1, v2) */   0,  1,  0,    0,  0,  1,    1,  0,  0,
            /* +Y+X-Z face (v0, v2, v3) */   0,  1,  0,    1,  0,  0,    0,  0, -1,
            /* +Y-X-Z face (v0, v3, v4) */   0,  1,  0,    0,  0, -1,   -1,  0,  0,
            /* +Y-X+Z face (v0, v4, v1) */   0,  1,  0,   -1,  0,  0,    0,  0,  1,
            /* -Y+X+Z face (v1, v2, v5) */   0,  0,  1,    1,  0,  0,    0, -1,  0,
            /* -Y+X-Z face (v2, v3, v5) */   1,  0,  0,    0,  0, -1,    0, -1,  0,
            /* -Y-X-Z face (v3, v4, v5) */   0,  0, -1,   -1,  0,  0,    0, -1,  0,
            /* -Y-X+Z face (v4, v1, v5) */  -1,  0,  0,    0,  0,  1,    0, -1,  0
        ]);

        this.normals = new Float32Array(this.vertices.length);

        // if color is provided, set all vertices' color to the given color
        if (options.color) {
            for (let i = 0; i < this.vertices.length * 4 / 3; i += 4) {
                this.colors[i] = options.color[0];
                this.colors[i+1] = options.color[1];
                this.colors[i+2] = options.color[2];
                this.colors[i+3] = options.color[3];
            }
        }
        else {
            this.colors = new Float32Array([
                /* +Y+X+Z face (v0, v1, v2) */   1,1,1,1, 1,1,1,1, 1,1,1,1,
                /* +Y+X-Z face (v0, v2, v3) */   1,1,0,1, 1,1,0,1, 1,1,0,1,
                /* +Y-X-Z face (v0, v3, v4) */   0,1,0,1, 0,1,0,1, 0,1,0,1,
                /* +Y-X+Z face (v0, v4, v1) */   0,1,1,1, 0,1,1,1, 0,1,1,1,
                /* -Y+X+Z face (v1, v2, v5) */   1,0,1,1, 1,0,1,1, 1,0,1,1,
                /* -Y+X-Z face (v2, v3, v5) */   1,0,0,1, 1,0,0,1, 1,0,0,1,
                /* -Y-X-Z face (v3, v4, v5) */   0,0,0,1, 0,0,0,1, 0,0,0,1,
                /* -Y-X+Z face (v4, v1, v5) */   0,0,1,1, 0,0,1,1, 0,0,1,1
            ]);
        }

        this.texCoords = new Float32Array([
            /* +Y+X+Z face (v0, v1, v2) */   0.50, 1.00,  0.00, 0.50,  0.25, 0.50,
            /* +Y+X-Z face (v0, v2, v3) */   0.50, 1.00,  0.25, 0.50,  0.50, 0.50,
            /* +Y-X-Z face (v0, v3, v4) */   0.50, 1.00,  0.50, 0.50,  0.75, 0.50,
            /* +Y-X+Z face (v0, v4, v1) */   0.50, 1.00,  0.75, 0.50,  1.00, 0.50,
            /* -Y+X+Z face (v1, v2, v5) */   0.00, 0.50,  0.25, 0.50,  0.50, 0.00,
            /* -Y+X-Z face (v2, v3, v5) */   0.25, 0.50,  0.50, 0.50,  0.50, 0.00,
            /* -Y-X-Z face (v3, v4, v5) */   0.50, 0.50,  0.75, 0.50,  0.50, 0.00,
            /* -Y-X+Z face (v4, v1, v5) */   0.75, 0.50,  1.00, 0.50,  0.50, 0.00
        ]);

        this.copyFaceNormalsToNormals();
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
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 