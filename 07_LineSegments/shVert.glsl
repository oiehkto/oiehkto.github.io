#version 300 es

in vec2 a_position;
uniform bool intersection_point;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = intersection_point ? 10.0 : 2.0;
} 