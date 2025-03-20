#version 300 es

layout (location = 0) in vec3 aPos;

uniform float x_off, y_off;

void main() {
    gl_Position = vec4(aPos[0] + x_off, aPos[1] + y_off, aPos[2], 1.0);
} 