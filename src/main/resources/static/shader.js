/* =========================================================
   织梦 DreamWeave · WebGL 极光着色器
   参考 Awwwards 获奖站点常见的实时 GLSL 背景
   ========================================================= */

(function () {
    "use strict";

    var canvas = document.getElementById("shaderCanvas");

    if (!canvas) return;

    var gl = canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        powerPreference: "low-power"
    });

    /* 不支持 WebGL 时保留 CSS 极光作为降级背景 */
    if (!gl) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var vertexSource = [
        "attribute vec2 p;",
        "void main() {",
        "    gl_Position = vec4(p, 0.0, 1.0);",
        "}"
    ].join("\n");

    var fragmentSource = [
        "precision mediump float;",
        "",
        "uniform vec2 uRes;",
        "uniform float uTime;",
        "uniform vec2 uMouse;",
        "",
        "float hash(vec2 p) {",
        "    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
        "}",
        "",
        "float noise(vec2 p) {",
        "    vec2 i = floor(p);",
        "    vec2 f = fract(p);",
        "    vec2 u = f * f * (3.0 - 2.0 * f);",
        "    return mix(",
        "        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
        "        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),",
        "        u.y",
        "    );",
        "}",
        "",
        "float fbm(vec2 p) {",
        "    float value = 0.0;",
        "    float amplitude = 0.5;",
        "    for (int i = 0; i < 4; i++) {",
        "        value += amplitude * noise(p);",
        "        p *= 2.03;",
        "        amplitude *= 0.5;",
        "    }",
        "    return value;",
        "}",
        "",
        "void main() {",
        "    vec2 uv = gl_FragCoord.xy / uRes;",
        "    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;",
        "    float t = uTime * 0.05;",
        "    vec2 shift = (uMouse - 0.5) * 0.16;",
        "",
        "    vec2 q = vec2(",
        "        fbm(p * 1.3 + shift + vec2(0.0, t * 0.6)),",
        "        fbm(p * 1.3 + shift + vec2(4.7, -t * 0.4))",
        "    );",
        "",
        "    float f = fbm(p * 1.7 + q * 1.35 + vec2(t * 0.3, 0.0));",
        "",
        "    vec3 deep = vec3(0.012, 0.028, 0.055);",
        "    vec3 sky = vec3(0.06, 0.28, 0.62);",
        "    vec3 cyan = vec3(0.05, 0.34, 0.55);",
        "    vec3 indigo = vec3(0.18, 0.18, 0.55);",
        "",
        "    float g1 = smoothstep(0.25, 0.92, f);",
        "    float g2 = smoothstep(0.35, 0.95, q.x * 0.75 + f * 0.35);",
        "    float g3 = smoothstep(0.42, 0.95, q.y * 0.65 + f * 0.30);",
        "",
        "    vec3 col = deep;",
        "    col = mix(col, sky, g1 * 0.55);",
        "    col = mix(col, cyan, g2 * 0.45);",
        "    col = mix(col, indigo, g3 * 0.35);",
        "",
        "    vec2 v = uv - 0.5;",
        "    col *= 1.0 - dot(v, v) * 0.85;",
        "    col += vec3(0.015, 0.045, 0.08) * (1.0 - uv.y);",
        "",
        "    float grain = hash(gl_FragCoord.xy + uTime * 60.0);",
        "    col += (grain - 0.5) * 0.016;",
        "",
        "    gl_FragColor = vec4(col, 1.0);",
        "}"
    ].join("\n");

    function compile(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn("[DreamWeave] shader compile failed:", gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    var vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return;

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("[DreamWeave] shader link failed:", gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    var position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, "uRes");
    var uTime = gl.getUniformLocation(program, "uTime");
    var uMouse = gl.getUniformLocation(program, "uMouse");

    var scale = 0.55;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    var width = 1;
    var height = 1;
    var mouse = { x: 0.5, y: 0.5 };
    var rafId = null;
    var startTime = 0;

    function resize() {
        width = Math.max(1, Math.floor(window.innerWidth * scale * dpr));
        height = Math.max(1, Math.floor(window.innerHeight * scale * dpr));

        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);

        if (reduceMotion) {
            render(9);
        }
    }

    function render(seconds) {
        gl.uniform2f(uRes, width, height);
        gl.uniform1f(uTime, seconds);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function loop(now) {
        render((now - startTime) / 1000);
        rafId = window.requestAnimationFrame(loop);
    }

    function start() {
        if (rafId !== null) return;
        startTime = performance.now();
        rafId = window.requestAnimationFrame(loop);
    }

    function stop() {
        if (rafId === null) return;
        window.cancelAnimationFrame(rafId);
        rafId = null;
    }

    resize();
    document.body.classList.add("shader-on");

    if (reduceMotion) {
        render(9);
    } else {
        start();
    }

    var resizeTimer = null;

    window.addEventListener("resize", function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize, 140);
    });

    window.addEventListener("pointermove", function (event) {
        mouse.x = event.clientX / Math.max(1, window.innerWidth);
        mouse.y = 1 - event.clientY / Math.max(1, window.innerHeight);
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            stop();
        } else if (!reduceMotion) {
            start();
        }
    });
})();
