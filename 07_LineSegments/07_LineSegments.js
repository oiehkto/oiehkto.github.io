/*-------------------------------------------------------------------------
07_LineSegments.js

left mouse button을 click하면 선분을 그리기 시작하고, 
button up을 하지 않은 상태로 마우스를 움직이면 임시 선분을 그리고, 
button up을 하면 최종 선분을 저장하고 임시 선분을 삭제함.

임시 선분의 color는 회색이고, 최종 선분의 color는 빨간색임.

이 과정을 반복하여 여러 개의 선분 (line segment)을 그릴 수 있음. 
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
let isInitialized = false; // global variable로 event listener가 등록되었는지 확인
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let positionBuffer;

let phase = 0; // (0: initial) -> (1: drawing circle) -> (2) -> (3: drawing line) -> (4)
let circleCenter = [0.0, 0.0];
let circleRadius = 0.0;
let lineStart = [0.0, 0.0];
let lineEnd = [0.0, 0.0];
let iPoints = [];
const CIRCLE_POINTS = 100;
let circleArray = [];

let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임 

// mouse 쓸 때 main call 방법
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

function setupCanvas() {
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    window.addEventListener('resize', render);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 상단이 (-1, 1), 우측 하단이 (1, -1) 
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        switch(phase) {
        case 0:
            circleCenter = convertToWebGLCoordinates(x,y);
            phase++;
            console.log(phase);
            break;
        case 2:
            lineStart = convertToWebGLCoordinates(x,y);
            lineEnd = convertToWebGLCoordinates(x,y);
            phase++;
            console.log(phase);
            break;
        }
    }

    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        switch(phase) {
        case 1:
            let [glX, glY] = convertToWebGLCoordinates(x,y);
            circleRadius = Math.sqrt( (circleCenter[0]-glX)*(circleCenter[0]-glX) + 
                                    (circleCenter[1]-glY)*(circleCenter[1]-glY) );
            makeCircle();
            render();
            break;
        case 3:
            lineEnd = convertToWebGLCoordinates(x,y);
            render();
            break;
        }
    }

    function handleMouseUp() {
        switch(phase) {
        case 1:
            phase++;
            updateText(textOverlay, "Circle: center ("+circleCenter[0].toFixed(2)+", "+
                        circleCenter[1].toFixed(2)+") radius = "+circleRadius.toFixed(2));
            render();
            console.log(phase);
            break;
        case 3:
            phase++;
            updateText(textOverlay2, "Line segment: ("+lineStart[0].toFixed(2)+", "+
                        lineStart[1].toFixed(2)+") ~ ("+lineEnd[0].toFixed(2)+", "+
                        lineEnd[1].toFixed(2)+")");
            calculateIntersection();
            if(iPoints.length == 0) {
                updateText(textOverlay3, "No intersection");
            } else if(iPoints.length == 1) {
                updateText(textOverlay3, "Intersection Points: 1 Point 1: ("+
                            iPoints[0][0].toFixed(2)+", "+
                            iPoints[0][1].toFixed(2)+")");
            } else {
                updateText(textOverlay3, "Intersection Points: 2 Point 1: ("+
                            iPoints[0][0].toFixed(2)+", "+
                            iPoints[0][1].toFixed(2)+") Point 2: ("+
                            iPoints[1][0].toFixed(2)+", "+
                            iPoints[1][1].toFixed(2)+")");
            }
            render();
            console.log(phase);
            break;
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function makeCircle() {
    if(circleArray.length == 0) {
        for(let i=0; i<CIRCLE_POINTS; i++) {
            circleArray.push(circleCenter[0] + circleRadius * 
                             Math.cos(2*i*Math.PI/CIRCLE_POINTS));
            circleArray.push(circleCenter[1] + circleRadius * 
                             Math.sin(2*i*Math.PI/CIRCLE_POINTS));
        }
    } else {
        for(let i=0; i<CIRCLE_POINTS; i++) {
            circleArray[2*i] = circleCenter[0] + circleRadius * 
                             Math.cos(2*i*Math.PI/CIRCLE_POINTS);
            circleArray[2*i+1] = circleCenter[1] + circleRadius * 
                             Math.sin(2*i*Math.PI/CIRCLE_POINTS);
        }
    }
}

function calculateIntersection() {
    let [x0, y0] = circleCenter;
    let [x1, y1] = lineStart;
    let [x2, y2] = lineEnd;
    let a = (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
    let b_half = (x1 - x2)*(x2 - x0) + (y1 - y2)*(y2 - y0);
    let c = (x2 - x0)*(x2 - x0) + (y2 - y0)*(y2 - y0) - circleRadius*circleRadius;
    let d = b_half*b_half - a*c
    let t1 = null;
    let t2 = null;
    if (d == 0) {
        t1 = -b_half / a;
    }
    else if (d > 0) {
        t1 = -(b_half + Math.sqrt(d)) / a;
        t2 = -(b_half - Math.sqrt(d)) / a;
    }
    if(t1 != null && t1 >= 0 && t1 <= 1) {
        iPoints.push([x1*t1 + x2*(1 - t1), y1*t1 + y2*(1 - t1)]);
    }
    if(t2 != null && t2 >= 0 && t2 <= 1) {
        iPoints.push([x1*t2 + x2*(1 - t2), y1*t2 + y2*(1 - t2)]);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();

    if (phase > 0) {
        if (phase == 1) {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
        }
        else {
            shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
        }
        if (circleArray.length == 0) {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleCenter), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            shader.setBool("intersection_point", 0);
            gl.drawArrays(gl.POINTS, 0, 1);
        }
        else {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleArray), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, CIRCLE_POINTS);
        }
        if (phase > 2) {
            if (phase == 3) {
                shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
            }
            else {
                shader.setVec4("u_color", [0.5, 0.5, 1.0, 1.0]);
            }
            if (lineStart[0] == lineEnd[0] && lineStart[1] == lineEnd[1]) {
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineStart), 
                              gl.STATIC_DRAW);
                gl.bindVertexArray(vao);
                shader.setBool("intersection_point", 0);
                gl.drawArrays(gl.POINTS, 0, 1);
            }
            else {
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...lineStart, ...lineEnd]), 
                              gl.STATIC_DRAW);
                gl.bindVertexArray(vao);
                gl.drawArrays(gl.LINES, 0, 2);
            }
        }
    }
    if (phase == 4 && iPoints.length > 0) { // draw points
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        let points;
        if (iPoints.length == 1) {
            points = new Float32Array(iPoints[0]);
        } else {
            points = new Float32Array([...iPoints[0], ...iPoints[1]]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        shader.setBool("intersection_point", 1);
        gl.drawArrays(gl.POINTS, 0, iPoints.length);
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create());
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

        // 셰이더 초기화
        shader = await initShader();
        
        // 나머지 초기화
        setupCanvas();
        setupBuffers(shader);
        shader.use();

        phase = 0;
        iPoints = [];
        circleArray = [];

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
