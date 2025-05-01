/*--------------------------------------------------------------------------------
18_SmoothShading.js

- Viewing a 3D unit cylinder at origin with perspective projection
- Rotating the cylinder by ArcBall interface (by left mouse button dragging)
- Keyboard controls:
    - 'a' to switch between camera and model rotation modes in ArcBall interface
    - 'r' to reset arcball
    - 's' to switch to smooth shading
    - 'f' to switch to flat shading
- Applying Diffuse & Specular reflection using Flat/Smooth shading to the cylinder
----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';
import { Cone } from './cone.js';
import { Arcball } from './arcball_customized.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;

let shader, shaders;
let lampShader;

let modelMatrix, viewMatrix, projMatrix, cameraPos;

let textOverlay,  textOverlay2, textOverlay3; 
let textOverlay4, textOverlay5, textOverlay6;
let textOverlay7, textOverlay8, textOverlay9;

let arcBallMode = 'CAMERA';        // 'CAMERA' or 'MODEL'
let shadingMode1 = 'FLAT';         // 'FLAT' or 'SMOOTH'
let shadingMode2 = 'PHONG';        // 'PHONG' or 'GOURAUD'

const cone = new Cone(gl, 32);
const lamp = new Cube(gl);
const axes = new Axes(gl, 1.5);

// cameraPos = (0.0, 0.0, 3.0) (initial)
// lightPos  = (1.0, 0.7, 1.0)
// lightSize = (0.1, 0.1, 0.1)
const arcball = new Arcball(canvas, 3.0, { rotation: 2.0, zoom: 0.0005 }, "CAMERA");
const lightPos = vec3.fromValues(1.0, 0.7, 1.0);
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'a') {
            if (arcBallMode == 'CAMERA') arcBallMode = 'MODEL';
            else arcBallMode = 'CAMERA';
            arcball.switch_mode(arcBallMode);
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 'r') {
            arcBallMode = 'CAMERA';
            arcball.reset(arcBallMode);
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 's') {
            shadingMode1 = 'SMOOTH';
            updateShadingMode();
        }
        else if (event.key == 'f') {
            shadingMode1 = 'FLAT';
            updateShadingMode();
        }
        else if (event.key == 'g') {
            shadingMode2 = 'GOURAUD';
            updateShadingMode();
        }
        else if (event.key == 'p') {
            shadingMode2 = 'PHONG';
            updateShadingMode();
        }
    });
}

function updateShadingMode() {
    if(shadingMode1 == 'FLAT') cone.copyFaceNormalsToNormals();
    else cone.copyVertexNormalsToNormals();
    cone.updateNormals();
    if(shadingMode2 == 'PHONG') shader = shaders[0];
    else shader = shaders[1];
    updateText(textOverlay3, "shading mode: " + shadingMode1 + " (" + shadingMode2 + ")");
    render();
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

async function initShaders() {
    const vertexShaderSource = await readShaderFile('shPhongVert.glsl');
    const fragmentShaderSource = await readShaderFile('shPhongFrag.glsl');
    const vertexShaderSource2 = await readShaderFile('shGouraudVert.glsl');
    const fragmentShaderSource2 = await readShaderFile('shGouraudFrag.glsl');
    return [new Shader(gl, vertexShaderSource, fragmentShaderSource),
            new Shader(gl, vertexShaderSource2, fragmentShaderSource2)];
}

async function initLampShader() {
    const vertexShaderSource = await readShaderFile('shLampVert.glsl');
    const fragmentShaderSource = await readShaderFile('shLampFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    // clear canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // get model matrix, view matrix from arcball
    modelMatrix = arcball.getModelMatrix();
    let _viewMatrix = arcball.getViewMatrix(true);
    viewMatrix = _viewMatrix[0];
    cameraPos = _viewMatrix[1];

    // drawing the cylinder
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', cameraPos);
    cone.draw(shader);

    // drawing the lamp
    lampShader.use();
    lampShader.setMat4('u_view', viewMatrix);
    lamp.draw(lampShader);

    // drawing the axes (using the axes's shader: see util.js)
    //axes.draw(viewMatrix, projMatrix);

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }

        // Projection transformation matrix (invariant in the program)
        projMatrix = mat4.create();
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // Model matrix of lamp (invariant in the program)
        const lampModelMatrix = mat4.create();
        mat4.translate(lampModelMatrix, lampModelMatrix, lightPos);
        mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);

        // creating shaders
        shaders = await initShaders();
        lampShader = await initLampShader();

        // set attribute variables
        for(let i = 0; i < 2; i++) {
            shaders[i].use();
            shaders[i].setMat4("u_projection", projMatrix);

            shaders[i].setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
            shaders[i].setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
            shaders[i].setFloat("material.shininess", 16);

            shaders[i].setVec3("light.position", lightPos);
            shaders[i].setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
            shaders[i].setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
            shaders[i].setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        }
        lampShader.use();
        lampShader.setMat4("u_projection", projMatrix);
        lampShader.setMat4('u_model', lampModelMatrix);

        // set texts
        textOverlay = setupText(canvas, "Cone with Lighting");
        textOverlay2 = setupText(canvas, "arcball mode: " + arcBallMode, 2);
        textOverlay3 = setupText(canvas, "shading mode: " + shadingMode1 + " (" + shadingMode2 + ")", 3);
        textOverlay4 = setupText(canvas, "press 'a' to change arcball mode", 4);
        textOverlay5 = setupText(canvas, "press 'r' to reset arcball", 5);
        textOverlay6 = setupText(canvas, "press 's' to switch to smooth shading", 6);
        textOverlay7 = setupText(canvas, "press 'f' to switch to flat shading", 7);
        textOverlay8 = setupText(canvas, "press 'g' to switch to Gouraud shading", 8);
        textOverlay9 = setupText(canvas, "press 'p' to switch to Phong shading", 9);
        setupKeyboardEvents();

        // call the render function the first time for animation
        updateShadingMode();
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}

