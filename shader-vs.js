attribute vec2 vPos;
void main(void) {
    gl_Position = vec4(vPos, 0., 1.);
}
