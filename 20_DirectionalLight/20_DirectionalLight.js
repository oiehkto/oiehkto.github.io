/*--------------------------------------------------------------------------------
20_DirectionalLight.js

- Viewing a 3D unit cylinder at origin with perspective projection
- Rotating the cylinder by ArcBall interface (by left mouse button dragging)
- Keyboard controls:
    - 'a' to switch between camera and model rotation modes in ArcBall interface
    - 'r' to reset arcball
    - 's' to switch to smooth shading
    - 'f' to switch to flat shading
- Applying Texture mapping for computing diffuse reflection 
- Lighting by directional light
----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Arcball } from './arcball_customized.js';
import { Cylinder } from '../util/cylinder.js';
import { loadTexture } from '../util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
const texture = loadTexture(gl, true, './sunrise.jpg');
let shader;
let textOverlay1, arcBallMode = 'CAMERA';
let textOverlay2, toonLevel = 3;
let textOverlay3, texMode = 'OFF';
let textOverlay4, toonMode = 0;
let isInitialized = false;
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


let modelMatrix, viewMatrix, projMatrix, viewPos;

const cylinder = new Cylinder(gl, 32, {color : [1.0, 0.5, 0.0, 1.0]});
const axes = new Axes(gl, 1.5);
const arcball = new Arcball(canvas, 3.0, { rotation: 2.0, zoom: 0.0005 });

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'a') {
            if (arcBallMode == 'CAMERA') { arcBallMode = 'MODEL'; }
            else { arcBallMode = 'CAMERA'; }
            arcball.switch_mode(arcBallMode);
            updateText(textOverlay1, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 'r') {
            arcBallMode = 'CAMERA';
            arcball.reset(arcBallMode);
            updateText(textOverlay1, "arcball mode: " + arcBallMode);
        }
        else if (event.key >= '1' && event.key <= '5') {
            toonLevel = parseInt(event.key);
            updateText(textOverlay2, "toon levels: " + toonLevel);
            render();
        }
        else if (event.key == 't') {
            if (texMode == 'ON') { texMode = 'OFF'; }
            else { texMode = 'ON'; }
            updateText(textOverlay3, "texture: " + texMode);
            render();
        }
        else if (event.key == 'm') {
            toonMode = ++toonMode % 5;
            updateText(textOverlay4, "toon mode: " + toonMode);
            render();
        }
    });
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    modelMatrix = arcball.getModelMatrix();
    let _viewMatrix = arcball.getViewMatrix(true);
    viewMatrix = _viewMatrix[0];
    viewPos = _viewMatrix[1];

    // drawing the cylinder
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', viewPos);
    shader.setFloat('toonLevel', toonLevel);
    shader.setBool('texMode', texMode == 'ON');
    shader.setInt('toonMode', toonMode);
    cylinder.draw(shader);

    // drawing the axes (using the axes's shader: see util.js)
    axes.draw(viewMatrix, projMatrix);

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

        cylinder.copyVertexNormalsToNormals();
        cylinder.updateNormals();

        shader = await initShader();
        shader.use();
        shader.setMat4("u_projection", projMatrix);
        shader.setVec3("light.direction", vec3.fromValues(1.0, 0.25, 0.5));
        shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
        shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
        shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        shader.setInt("material.diffuse", 0);
        shader.setVec3("material.specular", vec3.fromValues(0.8, 0.8, 0.8));
        shader.setFloat("material.shininess", 32.0);

        let ln = 1;
        setupText(canvas, "TOON SHADING", ln++);
        textOverlay1 = setupText(canvas, "arcball mode: " + arcBallMode, ln++);
        textOverlay2 = setupText(canvas, "toon levels: " + toonLevel, ln++);
        setupText(canvas, "press a/r to change/reset arcball mode", ln++);
        setupText(canvas, "press 1 - 5 to change toon shading levels", ln++);
        ln = 31;
        textOverlay3 = setupText(canvas, "texture: " + texMode, ln++);
        textOverlay4 = setupText(canvas, "toon mode: " + toonMode, ln++);
        setupText(canvas, "press t to turn on/off the texture", ln++);
        setupText(canvas, "press m to change toon shading modes (0 - 4)", ln++);

        setupKeyboardEvents();
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}

