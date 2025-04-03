
import { resizeAspectRatio } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let axesVAO;
let cubeVAO;

let initialTime = 0;
const ID = mat4.create();
const YELLOW = mat4.fromValues(1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1);
const CYAN = mat4.fromValues(0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(render);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupAxesBuffers(shader) {
    axesVAO = gl.createVertexArray();
    gl.bindVertexArray(axesVAO);

    const axesVertices = new Float32Array([
        -1.0, 0.0, 1.0, 0.0,  // x축
        0.0, -1.0, 0.0, 1.0   // y축
    ]);

    const axesColors = new Float32Array([
        1.0, 0.3, 0.0, 1.0, 1.0, 0.3, 0.0, 1.0,  // x축 색상
        0.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.5, 1.0   // y축 색상
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function setupCubeBuffers(shader) {
    const cubeVertices = new Float32Array([
        -0.05,  0.05,  // 좌상단
        -0.05, -0.05,  // 좌하단
         0.05, -0.05,  // 우하단
         0.05,  0.05   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // 빨간색
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);

    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function getMatrices(currentTime) {
    const t = Math.PI * (currentTime - initialTime) / 1000;
    // sun
    let SUN = mat4.create();
    mat4.rotate(SUN, SUN, t/4, [0, 0, 1]);     //  45 deg/sec
    mat4.scale(SUN, SUN, [2, 2, 1]);
    // earth
    let EARTH = mat4.create();
    mat4.rotate(EARTH, EARTH, t/6, [0, 0, 1]); //  30 deg/sec
    mat4.translate(EARTH, EARTH, [0.7, 0, 0]);
    mat4.rotate(EARTH, EARTH, t, [0, 0, 1]);   // 180 deg/sec
    // moon
    let MOON = mat4.create();
    mat4.rotate(MOON, MOON, t/6, [0, 0, 1]);   //  30 deg/sec
    mat4.translate(MOON, MOON, [0.7, 0, 0]);
    mat4.rotate(MOON, MOON, t*2, [0, 0, 1]);   // 360 deg/sec
    mat4.translate(MOON, MOON, [0.2, 0, 0]);
    mat4.rotate(MOON, MOON, t, [0, 0, 1]);     // 180 deg/sec
    mat4.scale(MOON, MOON, [0.5, 0.5, 1]);

    return {SUN, EARTH, MOON};
}

function render(currentTime) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.use();

    if(!initialTime) initialTime = currentTime;
    const {SUN, EARTH, MOON} = getMatrices(currentTime);

    // axes
    shader.setMat4("u_model", ID);
    shader.setMat4("u_color", ID);
    gl.bindVertexArray(axesVAO);
    gl.drawArrays(gl.LINES, 0, 4);

    // sun
    shader.setMat4("u_model", SUN);
    shader.setMat4("u_color", ID);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    // earth
    shader.setMat4("u_model", EARTH);
    shader.setMat4("u_color", CYAN);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    // moon
    shader.setMat4("u_model", MOON);
    shader.setMat4("u_color", YELLOW);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        shader = await initShader();
        setupAxesBuffers(shader);
        setupCubeBuffers(shader);
        shader.use();
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
