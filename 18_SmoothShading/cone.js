export class Cone {
    /**
     * @param {WebGLRenderingContext} gl         - WebGL 렌더링 컨텍스트
     * @param {number} segments                 - 옆면 세그먼트 수 (원 둘레를 몇 등분할지)
     * @param {object} options
     *        options.color : [r, g, b, a] 형태의 색상 (기본 [0.8, 0.8, 0.8, 1.0])
     */
    constructor(gl, segments = 32, options = {}) {
        this.gl = gl;

        // VAO, VBO, EBO 생성
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // helper functions, variables
        const colorOption = options.color || [0.8, 0.8, 0.8, 1.0];
        const SIN = Math.sin(2 * Math.PI / segments);
        const COS = Math.cos(2 * Math.PI / segments);
        function rotate(v) {
            return [ COS*v[0] + SIN*v[2],
                     v[1],
                    -SIN*v[0] + COS*v[2] ];
        }
        function normalize(v) {
            let norm = Math.sqrt( v[0]*v[0] + v[1]*v[1] + v[2]*v[2] );
            return [v[0]/norm, v[1]/norm, v[2]/norm];
        }
        function add(v1,v2,v3) {
            return [ v1[0] + v2[0] + v3[0],
                     v1[1] + v2[1] + v3[1],
                     v1[2] + v2[2] + v3[2] ];
        }

        const position_apex = [0.0, 0.5, 0.0];
        const v_normal_apex = [0.0, 1.0, 0.0];
        let position_i = [0.0, -0.5, 0.5];
        let f_normal_i = normalize([1-COS, SIN/2, SIN]);
        let v_normal_i = normalize(add( f_normal_i,
                                        normalize([COS-1, SIN/2, SIN]),
                                        [0, -1, 0] ));
        let position_i2 = rotate(position_i);
        let v_normal_i2 = rotate(v_normal_i);

        // fill buffers
        const position = [];
        const f_normal = [];
        const v_normal = [];
        const colors = [];
        const texCoords = [];
        const indices = [];

        for(let i=0; i < segments; i++) {
            position.push(
                ...position_apex,
                ...position_i,
                ...position_i2
            );
            f_normal.push(
                ...f_normal_i,
                ...f_normal_i,
                ...f_normal_i
            );
            v_normal.push(
                ...v_normal_apex,
                ...v_normal_i,
                ...v_normal_i2
            );
            colors.push(
                ...colorOption,
                ...colorOption,
                ...colorOption
            );
            texCoords.push(
                (1/2 + i)/segments, 1,
                       i /segments, 0,
                  (1 + i)/segments, 0
            );
            indices.push(
                3*i, 3*i+1, 3*i+2
            );
            position_i = rotate(position_i);
            f_normal_i = rotate(f_normal_i);
            v_normal_i = rotate(v_normal_i);
            position_i2 = rotate(position_i2);
            v_normal_i2 = rotate(v_normal_i2);
        }

        this.vertices      = new Float32Array(position);
        this.faceNormals   = new Float32Array(f_normal);
        this.vertexNormals = new Float32Array(v_normal);
        this.normals       = new Float32Array(this.vertices.length);
        this.colors        = new Float32Array(colors);
        this.texCoords     = new Float32Array(texCoords);
        this.indices       = new  Uint16Array(indices);

        this.initBuffers();
    }

    // methods updating normal
    copyFaceNormalsToNormals() { this.normals.set(this.faceNormals); }
    copyVertexNormalsToNormals() { this.normals.set(this.vertexNormals); }
    updateNormals() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

        const vSize = this.vertices.byteLength;
        // normals 부분만 다시 업로드
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }



    initBuffers() {
        const gl = this.gl;

        // 배열 크기 측정
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);

        // 순서대로 복사 (positions -> normals -> colors -> texCoords)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // 인덱스 버퍼 (EBO)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertexAttribPointer 설정
        // (shader의 layout: 0->pos, 1->normal, 2->color, 3->texCoord)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // positions
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normals
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // colors
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoords

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
