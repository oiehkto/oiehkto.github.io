// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

const INITIAL_SIZE = 500;
canvas.width = canvas.height = INITIAL_SIZE;

// Start rendering
render();

// Render loop
function render() {
    let half_width = canvas.width/2;
    let half_height = canvas.height/2;
    gl.enable(gl.SCISSOR_TEST);

    gl.viewport(0, half_height, half_width, half_height);
    gl.scissor(0, half_height, half_width, half_height);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(half_width, half_height, half_width, half_height);
    gl.scissor(half_width, half_height, half_width, half_height);
    gl.clearColor(0.0, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, half_width, half_height);
    gl.scissor(0, 0, half_width, half_height);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(half_width, 0, half_width, half_height);
    gl.scissor(half_width, 0, half_width, half_height);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.SCISSOR_TEST);
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    let new_size = INITIAL_SIZE;
    if(window.innerWidth < new_size) new_size = window.innerWidth;
    if(window.innerHeight < new_size) new_size = window.innerHeight;
    canvas.width = canvas.height = new_size;
    render();
});

