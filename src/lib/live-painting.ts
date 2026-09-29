// GPU budget: max pixels per full-screen pass, and the frame rate the painting renders at
const PIXEL_BUDGET = 1.6e6;
const FRAME_MS = 1000 / 30;

const COMMON = `
uniform float uTime;
uniform vec4 uW;        // weights: strata, rosettes, facets, blocks
uniform vec3 uForm;     // x scale, yz seed offset
uniform float uAspect;
uniform float uSpeed;

float hash1(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash1(i), hash1(i + vec2(1.0, 0.0)), u.x), mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm3(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v * 1.14;
}

// The "latent" form field: a continuous blend of four families of motion
vec2 formFlow(vec2 uv){
  vec2 p = vec2(uv.x * uAspect, uv.y) * uForm.x + uForm.yz;
  vec2 wp = p + vec2(fbm3(p * 0.5 + uTime * 0.01), fbm3(p * 0.5 + vec2(5.2, -uTime * 0.012))) * 1.5;
  float e = 0.03;
  float h = fbm3(wp);
  vec2 g = vec2(fbm3(wp + vec2(e, 0.0)) - h, fbm3(wp + vec2(0.0, e)) - h) / e;
  vec2 tang = vec2(-g.y, g.x);
  float tl = length(tang) + 1e-4;
  vec2 strata = tang / tl * min(tl * 1.2, 1.0);                // flow along contours: banded strata

  vec2 cp = p * 0.8;
  vec2 n = floor(cp), f = fract(cp);
  float md = 8.0; vec2 mr = vec2(0.0), mid = vec2(0.0);
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++){
    vec2 gg = vec2(float(i), float(j));
    vec2 r = gg + hash2(n + gg) - f;
    float d = dot(r, r);
    if (d < md){ md = d; mr = r; mid = n + gg; }
  }
  vec2 d = -mr; float dl = length(d) + 1e-4;
  float spin = hash1(mid) > 0.5 ? 1.0 : -1.0;
  vec2 rings = vec2(-d.y, d.x) / dl * spin * smoothstep(0.0, 0.2, dl);   // orbits: rosettes
  vec2 facets = d / dl * smoothstep(0.0, 0.3, dl);                       // outward to cell edges: crystal facets
  vec2 blocks = (abs(strata.x) > abs(strata.y) ? vec2(sign(strata.x), 0.0) : vec2(0.0, sign(strata.y))) * min(tl * 1.2, 1.0);

  vec2 v = uW.x * strata + uW.y * rings + uW.z * facets + uW.w * blocks;
  return vec2(v.x / uAspect, v.y);
}
vec2 curlNoise(vec2 uv){
  vec2 p = vec2(uv.x * uAspect, uv.y) * 1.4 + uForm.zy * 0.7 + vec2(0.0, uTime * 0.03);
  float e = 0.02;
  float n1 = fbm3(p + vec2(0.0, e)), n2 = fbm3(p - vec2(0.0, e));
  float n3 = fbm3(p + vec2(e, 0.0)), n4 = fbm3(p - vec2(e, 0.0));
  vec2 c = vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
  return vec2(c.x / uAspect, c.y);
}
`;

const SHADERS: Record<string, string> = {
  "vs-quad": `
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`,
  "fs-advect": `
in vec2 vUv; out vec4 o;
uniform sampler2D uVel;
uniform float uDt, uForceMix;
uniform vec2 uPointer, uPointerVel;
void main(){
  vec2 v = texture(uVel, vUv).xy;
  vec2 nv = texture(uVel, vUv - v * uDt).xy * 0.998;
  vec2 ff = formFlow(vUv);
  vec2 target = (ff + curlNoise(vUv) * 0.22) * uSpeed;
  nv = mix(nv, target, uForceMix);
  vec2 d = vUv - uPointer; d.x *= uAspect;
  nv += uPointerVel * exp(-dot(d, d) / 0.003);
  o = vec4(nv, ff * uSpeed);
}
`,
  "fs-div": `
in vec2 vUv; out vec4 o;
uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * ((R - L) / uTexel.x + (T - B) / uTexel.y), 0.0, 0.0, 1.0);
}
`,
  "fs-jacobi": `
in vec2 vUv; out vec4 o;
uniform sampler2D uP; uniform sampler2D uDiv; uniform vec2 uTexel;
void main(){
  float L = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4((L + R + B + T - texture(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}
`,
  "fs-grad": `
in vec2 vUv; out vec4 o;
uniform sampler2D uVel; uniform sampler2D uP; uniform vec2 uTexel;
void main(){
  float L = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  vec4 cur = texture(uVel, vUv);
  vec2 v = cur.xy - 0.5 * vec2((R - L) * uTexel.x, (T - B) * uTexel.y);
  o = vec4(v, cur.zw);
}
`,
  "fs-particles": `
out vec4 o;
uniform sampler2D uState; uniform sampler2D uVel; uniform float uDt;
void main(){
  vec4 s = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);   // xy position, z life, w pigment key
  vec2 pos = s.xy;
  vec4 vv = texture(uVel, pos);
  vec2 v = vv.xy + vv.zw * 0.35;
  pos += v * uDt;
  float life = s.z - uDt;
  if (life <= 0.0 || pos.x < 0.0 || pos.x > 1.0 || pos.y < 0.0 || pos.y > 1.0){
    vec2 r = hash2(gl_FragCoord.xy * 0.731 + fract(uTime * 0.1234) * vec2(371.0, 913.0));
    pos = r;
    life = 3.0 + 11.0 * hash1(r + 3.1);
  }
  o = vec4(pos, life, s.w);
}
`,
  "vs-draw": `
uniform sampler2D uState; uniform int uSide;
uniform vec3 uPal[5]; uniform float uAlpha, uPointSize, uSpeckle;
out vec4 vCol;
void main(){
  int id = gl_VertexID;
  vec4 s = texelFetch(uState, ivec2(id % uSide, id / uSide), 0);
  gl_Position = vec4(s.xy * 2.0 - 1.0, 0.0, 1.0);
  // pigment chosen by a slow banding field, so colour gathers into regions and strata
  vec2 p = vec2(s.x * uAspect, s.y) * uForm.x * 0.6 + uForm.yz * 1.3 + 40.0;
  float band = fbm3(p) * 8.0 + s.w * 0.55;
  int ci = int(mod(floor(band), 5.0));
  float fid = float(id);
  vec3 c = uPal[ci] * (0.99 + uSpeckle * (hash1(vec2(fid, 1.3)) - 0.5));   // tone per bristle: high reads as streaks
  vCol = vec4(c, uAlpha * smoothstep(0.0, 1.5, s.z));
  gl_PointSize = uPointSize * (0.6 + 0.9 * hash1(vec2(fid, 7.1)));
}
`,
  "fs-draw": `
in vec4 vCol; out vec4 o;
void main(){
  float a = vCol.a * (1.0 - smoothstep(0.38, 0.5, length(gl_PointCoord - 0.5)));
  o = vec4(vCol.rgb * a, a);
}
`,
  "fs-fade": `
in vec2 vUv; out vec4 o;
uniform sampler2D uCanvas; uniform sampler2D uVel;
uniform float uDt, uFade, uWet; uniform vec2 uTexel;
void main(){
  vec2 v = texture(uVel, vUv).xy;
  vec2 q = vUv - v * uDt * uWet;                          // wet pigment drifts with the current, then slowly lifts
  o = texture(uCanvas, q) * uFade;
}
`,
  "fs-copy": `
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc;
void main(){ o = texture(uSrc, vUv); }
`,
  // static surface, rendered only on resize or when the weave changes:
  // rgb = paper tone, a = linen weave multiplier applied over paint and paper alike
  "fs-paper": `
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform vec3 uPaper; uniform float uWeave;
void main(){
  vec2 px = vUv * uRes;
  vec3 paper = uPaper * (0.95 + 0.06 * fbm3(px * 0.03)) * (0.975 + 0.05 * noise(px * 0.9));
  float w = 1.0;
  if (uWeave > 0.01){
    float wx = 0.5 + 0.5 * sin(px.x * 1.7 + 2.5 * noise(px * vec2(0.015, 0.25)));
    float wy = 0.5 + 0.5 * sin(px.y * 1.7 + 2.5 * noise(px * vec2(0.25, 0.015)));
    float over = step(0.5, fract((floor(px.x / 3.7) + floor(px.y / 3.7)) * 0.5));
    float weave = mix(wx, wy, over) * (0.8 + 0.4 * noise(px * 0.08));
    w = 1.0 + (weave - 0.5) * 0.2 * uWeave;
  }
  o = vec4(paper, w);
}
`,
  // melt individual bristle marks into a field of colour (once per frame, shared by the misregistered plate)
  "fs-soft": `
in vec2 vUv; out vec4 o;
uniform sampler2D uCanvas; uniform vec2 uTexel; uniform float uSoften;
void main(){
  vec2 r = uTexel * uSoften;
  vec4 s = texture(uCanvas, vUv) * 2.0;
  for (int i = 0; i < 8; i++){
    float a = float(i) * 0.785398 + 0.39;
    s += texture(uCanvas, vUv + vec2(cos(a), sin(a)) * r);
  }
  o = s / 10.0;
}
`,
  "fs-composite": `
in vec2 vUv; out vec4 o;
uniform sampler2D uCanvas, uSoft, uPaperT; uniform vec2 uTexel, uRes, uLight;
uniform float uGrain;
uniform float uSharpen, uRelief, uGloss, uSoften, uEdge, uGrainAmt, uMisreg;

// pull coverage towards a clean edge, like cut paper or a flat stencil
float edgeA(float a){ return mix(a, smoothstep(0.42, 0.58, a), uEdge); }
vec4 shape(vec4 c){
  float na = edgeA(c.a);
  vec3 hue = min(c.rgb / max(c.a, 1e-3), vec3(1.5));
  return vec4(hue * na, na);
}

void main(){
  vec2 t = uTexel;
  float k = max(1.0, uSoften);
  vec4 c = texture(uSoft, vUv);
  vec4 cL = texture(uCanvas, vUv - vec2(t.x * k, 0.0)), cR = texture(uCanvas, vUv + vec2(t.x * k, 0.0));
  vec4 cB = texture(uCanvas, vUv - vec2(0.0, t.y * k)), cT = texture(uCanvas, vUv + vec2(0.0, t.y * k));
  float aL = edgeA(cL.a), aR = edgeA(cR.a), aB = edgeA(cB.a), aT = edgeA(cT.a);
  // display-only sharpening: crisp brushwork without feeding back into the painting
  c = c + (c - (cL + cR + cB + cT) * 0.25) * uSharpen;
  c.a = clamp(c.a, 0.0, 1.0); c.rgb = clamp(c.rgb, vec3(0.0), vec3(c.a));
  c = shape(c);
  vec3 n = normalize(vec3((aL - aR) * uRelief, (aB - aT) * uRelief, 1.0));
  vec3 L = normalize(vec3(uLight, 0.9));
  float diff = dot(n, L) - L.z;

  vec2 px = vUv * uRes;
  vec4 pw = texture(uPaperT, vUv);
  vec3 paper = pw.rgb;
  vec3 col = paper * (1.0 - c.a) + c.rgb;

  // riso-style misregistration: the red plate prints slightly off
  if (uMisreg > 0.01){
    vec4 c2 = shape(texture(uSoft, vUv + vec2(t.x, -0.6 * t.y) * uMisreg));
    col.r = (paper * (1.0 - c2.a) + c2.rgb).r;
  }

  // linen weave showing through the paint
  col *= pw.a;

  col *= 1.0 + clamp(diff, -0.25, 0.25) * 1.1;

  // a thin glaze: pigment ridges catch the light like varnish
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = max(pow(max(dot(n, H), 0.0), 50.0) - pow(H.z, 50.0), 0.0);
  col += vec3(1.0, 0.97, 0.92) * spec * uGloss * smoothstep(0.25, 0.9, c.a);

  // gallery wash of light falling across the wall
  vec2 lp = vec2(0.5, 0.5) + uLight * vec2(0.45, 0.4);
  vec2 dq = (vUv - lp) * vec2(uAspect, 1.0);
  col *= 0.84 + 0.22 * smoothstep(1.5, 0.0, length(dq));

  col += (hash1(px + uGrain * 97.0) - 0.5) * uGrainAmt * (0.5 + c.a);
  o = vec4(col, 1.0);
}
`
};

export type TextureSettings = {
  speckle: number; // tone variation between bristles (the "fur")
  sharpen: number; // crisp bristle detail
  soften: number; // blur radius in css px that melts marks into fields
  edge: number; // 0 = feathered edges, 1 = cut-paper edges
  relief: number; // embossed height of the paint
  gloss: number; // varnish highlight on ridges
  weave: number; // linen canvas showing through
  grain: number; // print / film grain
  misreg: number; // riso plate offset in css px
  calm: number; // 0 = restless flow with seams, 1 = smooth banded flow
};

export const TEXTURE_PRESETS: Record<string, TextureSettings> = {
  // the site's default: soft printed fields on linen with an offset colour plate
  artispace: { speckle: 0.29, sharpen: 0, soften: 1.6, edge: 0.85, relief: 2.8, gloss: 0.5, weave: 1.1, grain: 0.05, misreg: 6.8, calm: 0.2 },
  original: { speckle: 0.46, sharpen: 0.6, soften: 0, edge: 0, relief: 4, gloss: 0.9, weave: 0, grain: 0.02, misreg: 0, calm: 0 },
  gouache: { speckle: 0.1, sharpen: 0, soften: 2.5, edge: 0.35, relief: 1.2, gloss: 0, weave: 0, grain: 0.03, misreg: 0, calm: 0.6 },
  "cut paper": { speckle: 0.04, sharpen: 0, soften: 3, edge: 1, relief: 2.5, gloss: 0, weave: 0, grain: 0.025, misreg: 0, calm: 0.75 },
  linen: { speckle: 0.2, sharpen: 0.2, soften: 1.5, edge: 0.2, relief: 2, gloss: 0.2, weave: 1, grain: 0.02, misreg: 0, calm: 0.5 },
  riso: { speckle: 0.08, sharpen: 0, soften: 2, edge: 0.8, relief: 0, gloss: 0, weave: 0, grain: 0.12, misreg: 3, calm: 0.6 },
  oil: { speckle: 0.3, sharpen: 0.3, soften: 1.2, edge: 0.1, relief: 5, gloss: 1.2, weave: 0.3, grain: 0.02, misreg: 0, calm: 0.4 }
};

export function initLivePainting(
  canvas: HTMLCanvasElement,
  fb: HTMLElement,
  pauseBtn: HTMLButtonElement,
  // read every frame, so mutating it restyles the painting live
  texture: TextureSettings = { ...TEXTURE_PRESETS.artispace }
): () => void {
  let rafId = 0;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let gl: WebGL2RenderingContext | null = null;
  let disposed = false;

  function fail(msg: string) {
    fb.textContent = msg;
    fb.style.display = "grid";
  }

  gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance"
  });
  if (!gl) {
    fail("This page needs WebGL 2. Try a recent desktop version of Chrome, Firefox, Edge, or Safari.");
    return () => undefined;
  }
  // React Strict Mode remounts effects on the same canvas. Never call
  // WEBGL_lose_context in cleanup — a lost context makes getExtension() return null
  // and surfaces as a false "missing floating point render targets" error.
  if (gl.isContextLost()) {
    fail("The graphics context was lost. Reload the page to start a new painting.");
    return () => undefined;
  }
  if (!gl.getExtension("EXT_color_buffer_float")) {
    fail("Your browser is missing floating point render targets, which this painting needs.");
    return () => undefined;
  }

  const HEAD =
    "#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n";

  function compile(type: number, code: string) {
    const sh = gl!.createShader(type);
    if (!sh) throw new Error("Could not create shader");
    gl!.shaderSource(sh, code);
    gl!.compileShader(sh);
    if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
      throw new Error(gl!.getShaderInfoLog(sh) || "Shader compile failed");
    }
    return sh;
  }

  function program(vsId: string, fsId: string) {
    const p = gl!.createProgram() as any;
    gl!.attachShader(p, compile(gl!.VERTEX_SHADER, HEAD + COMMON + SHADERS[vsId]));
    gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, HEAD + COMMON + SHADERS[fsId]));
    gl!.bindAttribLocation(p, 0, "aPos");
    gl!.linkProgram(p);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
      throw new Error(gl!.getProgramInfoLog(p) || "Program link failed");
    }
    p.locs = {};
    return p;
  }

  const P: Record<string, any> = {};
  try {
    P.advect = program("vs-quad", "fs-advect");
    P.div = program("vs-quad", "fs-div");
    P.jacobi = program("vs-quad", "fs-jacobi");
    P.grad = program("vs-quad", "fs-grad");
    P.particles = program("vs-quad", "fs-particles");
    P.draw = program("vs-draw", "fs-draw");
    P.fade = program("vs-quad", "fs-fade");
    P.copy = program("vs-quad", "fs-copy");
    P.paper = program("vs-quad", "fs-paper");
    P.soft = program("vs-quad", "fs-soft");
    P.composite = program("vs-quad", "fs-composite");
  } catch (err) {
    console.error(err);
    fail("Shader error: " + (err as Error).message);
    return () => undefined;
  }

  function loc(p: any, n: string) {
    if (!(n in p.locs)) p.locs[n] = gl!.getUniformLocation(p, n);
    return p.locs[n];
  }
  function f1(p: any, n: string, a: number) {
    gl!.uniform1f(loc(p, n), a);
  }
  function f2(p: any, n: string, a: number, b: number) {
    gl!.uniform2f(loc(p, n), a, b);
  }
  function f3(p: any, n: string, a: number, b: number, c: number) {
    gl!.uniform3f(loc(p, n), a, b, c);
  }
  function f4(p: any, n: string, a: number, b: number, c: number, d: number) {
    gl!.uniform4f(loc(p, n), a, b, c, d);
  }
  function i1(p: any, n: string, a: number) {
    gl!.uniform1i(loc(p, n), a);
  }
  function tex(p: any, n: string, unit: number, t: WebGLTexture | null) {
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.uniform1i(loc(p, n), unit);
  }

  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const qb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const pointVao = gl.createVertexArray();
  gl.bindVertexArray(null);

  function target(
    w: number,
    h: number,
    internal: number,
    type: number,
    filter: number,
    data?: ArrayBufferView | null
  ) {
    const t = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, internal, w, h, 0, gl!.RGBA, type, data || null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    const f = gl!.createFramebuffer();
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, f);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, t, 0);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    return { tex: t, fbo: f, w, h };
  }

  function pair(
    w: number,
    h: number,
    internal: number,
    type: number,
    filter: number,
    data?: ArrayBufferView | null
  ) {
    const a = target(w, h, internal, type, filter, data);
    const b = target(w, h, internal, type, filter, data);
    return {
      read: a,
      write: b,
      swap() {
        const t = this.read;
        this.read = this.write;
        this.write = t;
      }
    };
  }

  function freeT(t: { tex: WebGLTexture | null; fbo: WebGLFramebuffer | null }) {
    gl!.deleteTexture(t.tex);
    gl!.deleteFramebuffer(t.fbo);
  }

  // 512² particles; each deposits more pigment so coverage matches the original 768² look
  const SIDE = 512;
  const DENSITY = (768 * 768) / (SIDE * SIDE);
  const COUNT = SIDE * SIDE;
  const init = new Float32Array(COUNT * 4);
  for (let k = 0; k < COUNT; k++) {
    init[k * 4] = Math.random();
    init[k * 4 + 1] = Math.random();
    init[k * 4 + 2] = Math.random() * 12;
    init[k * 4 + 3] = Math.random();
  }
  const state = pair(SIDE, SIDE, gl.RGBA32F, gl.FLOAT, gl.NEAREST, init);

  let W = 1;
  let H = 1;
  let aspect = 1;
  let vel: ReturnType<typeof pair> | null = null;
  let pres: ReturnType<typeof pair> | null = null;
  let divT: ReturnType<typeof target> | null = null;
  let paint: ReturnType<typeof pair> | null = null;
  let paperT: ReturnType<typeof target> | null = null;
  let softT: ReturnType<typeof target> | null = null;
  let paperWeave = -1;

  function pass(p: any, t: { fbo: WebGLFramebuffer | null; w: number; h: number } | null, setup: () => void) {
    gl!.useProgram(p);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, t ? t.fbo : null);
    gl!.viewport(0, 0, t ? t.w : W, t ? t.h : H);
    setup();
    gl!.bindVertexArray(quadVao);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function build() {
    if (disposed || !gl) return;
    const cssPx = canvas.clientWidth * canvas.clientHeight;
    // the surface is soft and grainy, so retina resolution buys nothing but GPU time;
    // text and UI stay crisp because they are HTML above the canvas
    let dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    if (cssPx * dpr * dpr > PIXEL_BUDGET) dpr = Math.sqrt(PIXEL_BUDGET / cssPx);
    const cw = Math.max(2, Math.floor(canvas.clientWidth * dpr));
    const ch = Math.max(2, Math.floor(canvas.clientHeight * dpr));
    if (cw === W && ch === H) return;
    const old = paint;
    W = cw;
    H = ch;
    canvas.width = W;
    canvas.height = H;
    aspect = W / H;
    const gw = 256;
    const gh = Math.max(64, Math.round(256 / aspect));
    if (vel) {
      freeT(vel.read);
      freeT(vel.write);
      freeT(pres!.read);
      freeT(pres!.write);
      freeT(divT!);
      freeT(paperT!);
      freeT(softT!);
    }
    vel = pair(gw, gh, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
    pres = pair(gw, gh, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
    divT = target(gw, gh, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
    paint = pair(W, H, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
    paperT = target(W, H, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
    softT = target(W, H, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
    paperWeave = -1;
    if (old) {
      pass(P.copy, paint.read, function () {
        tex(P.copy, "uSrc", 0, old.read.tex);
      });
      freeT(old.read);
      freeT(old.write);
    }
  }

  function renderPaper() {
    paperWeave = texture.weave;
    pass(P.paper, paperT, function () {
      f2(P.paper, "uRes", W, H);
      f3(P.paper, "uPaper", 0.937, 0.91, 0.863);
      f1(P.paper, "uWeave", texture.weave);
    });
  }

  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  }

  function onContextLost(e: Event) {
    e.preventDefault();
    fail("The graphics context was lost. Reload the page to start a new painting.");
  }

  window.addEventListener("resize", onResize);
  canvas.addEventListener("webglcontextlost", onContextLost);
  build();

  function hex(h: string) {
    return [
      parseInt(h.slice(1, 3), 16) / 255,
      parseInt(h.slice(3, 5), 16) / 255,
      parseInt(h.slice(5, 7), 16) / 255
    ];
  }

  const SOURCES = [
    ["#c8553d", "#e98a45", "#3d7b8a", "#d9ccb4", "#4a5560"],
    ["#8e9aa3", "#e7a93a", "#c9483f", "#2f3438", "#b9ad98"],
    ["#1f3440", "#5f8e93", "#e3c28f", "#e48a4a", "#6e5a5a"],
    ["#1f4fa0", "#f0b429", "#c73a2e", "#3fb6c8", "#1a2230"],
    ["#6b3f2a", "#c98452", "#243447", "#5d7288", "#d8bf9c"],
    ["#d94f7a", "#f0a830", "#3fb1a6", "#7a5bd6", "#2b2440"],
    ["#2d4a3e", "#8aa36b", "#d8b45a", "#a8452f", "#1e2a2a"],
    ["#3b2a4f", "#b24f6b", "#e39b6d", "#f1d6a8", "#5e7fa3"]
  ].map((p) => p.map(hex));

  function rand(a: number, b: number) {
    return a + Math.random() * (b - a);
  }

  function shiftHue(c: number[], amt: number) {
    const k = [0.57735, 0.57735, 0.57735];
    const cs = Math.cos(amt);
    const sn = Math.sin(amt);
    const d = c[0] * k[0] + c[1] * k[1] + c[2] * k[2];
    const cr = [k[1] * c[2] - k[2] * c[1], k[2] * c[0] - k[0] * c[2], k[0] * c[1] - k[1] * c[0]];
    return c.map((v, i) => Math.min(1, Math.max(0, v * cs + cr[i] * sn + k[i] * d * (1 - cs))));
  }

  let source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  let sourceTimer = rand(40, 70);
  const pal = source.map((c) => c.slice());
  const palT = pal.map((c) => c.slice());
  const palTimers = [0, 1, 2, 3, 4].map(() => rand(6, 20));

  function newWeights() {
    const w = [0, 0, 0, 0].map(() => Math.pow(Math.random(), 3));
    w[Math.floor(Math.random() * 4)] += 0.6;
    const s = w[0] + w[1] + w[2] + w[3];
    return w.map((v) => v / s);
  }

  let weights = newWeights();
  let weightsT = newWeights();
  let weightTimer = rand(10, 20);
  let scale = rand(1.4, 2.6);
  let scaleT = scale;
  let scaleTimer = rand(15, 30);
  const seed = [rand(0, 60), rand(0, 60)];
  let seedAngle = rand(0, Math.PI * 2);

  function ease(cur: number, tgt: number, dt: number, tau: number) {
    return cur + (tgt - cur) * (1 - Math.exp(-dt / tau));
  }

  function updateLatent(dt: number) {
    weightTimer -= dt;
    if (weightTimer <= 0) {
      weightsT = newWeights();
      weightTimer = rand(10, 22);
    }
    for (let i = 0; i < 4; i++) weights[i] = ease(weights[i], weightsT[i], dt, 9);
    scaleTimer -= dt;
    if (scaleTimer <= 0) {
      scaleT = rand(1.3, 2.9);
      scaleTimer = rand(15, 30);
    }
    scale = ease(scale, scaleT, dt, 14);
    seedAngle += (Math.random() - 0.5) * dt * 0.6;
    seed[0] += Math.cos(seedAngle) * dt * 0.015;
    seed[1] += Math.sin(seedAngle) * dt * 0.015;
    sourceTimer -= dt;
    if (sourceTimer <= 0) {
      source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      sourceTimer = rand(40, 70);
    }
    for (let j = 0; j < 5; j++) {
      palTimers[j] -= dt;
      if (palTimers[j] <= 0) {
        const c = source[Math.floor(Math.random() * 5)];
        palT[j] = shiftHue(c, Math.random() < 0.2 ? rand(-1.2, 1.2) : rand(-0.15, 0.15));
        palTimers[j] = rand(8, 22);
      }
      for (let q = 0; q < 3; q++) pal[j][q] = ease(pal[j][q], palT[j][q], dt, 8);
    }
  }

  function lightDir() {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < 6 || h > 20) return [-0.35, 0.9];
    const x = (h - 6) / 14;
    return [-Math.cos(x * Math.PI) * 0.9, 0.55 + 0.4 * Math.sin(x * Math.PI)];
  }

  const ptr = [0.5, 0.5];
  let ptrLast: number[] | null = null;
  const ptrVel = [0, 0];

  function onPointerMove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const u = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    if (ptrLast) {
      ptrVel[0] += (u[0] - ptrLast[0]) * 0.9;
      ptrVel[1] += (u[1] - ptrLast[1]) * 0.9;
    }
    ptrLast = u;
    ptr[0] = u[0];
    ptr[1] = u[1];
  }

  window.addEventListener("pointermove", onPointerMove);

  let paused = false;
  function onPause() {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume the painting" : "Pause the painting";
  }
  pauseBtn.addEventListener("click", onPause);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOTION = reduce ? 0.3 : 1;

  let time = rand(0, 1000);
  let age = 0;
  let drawFrac = 1;
  let slow = 0;

  function common(p: any) {
    f1(p, "uTime", time);
    f1(p, "uAspect", aspect);
    f1(p, "uSpeed", 0.055);
    // calm pulls the flow towards smooth strata, away from the cell-edged motions that leave seams
    const k = texture.calm;
    f4(p, "uW", weights[0] * (1 - k) + k, weights[1] * (1 - k), weights[2] * (1 - k), weights[3] * (1 - k));
    f3(p, "uForm", scale, seed[0], seed[1]);
  }

  function step(dt: number) {
    if (!vel || !pres || !divT || !paint) return;
    const gx = 1 / vel.read.w;
    const gy = 1 / vel.read.h;
    pass(P.advect, vel.write, function () {
      common(P.advect);
      tex(P.advect, "uVel", 0, vel!.read.tex);
      f1(P.advect, "uDt", dt);
      f1(P.advect, "uForceMix", 1 - Math.exp(-dt * 1.2));
      f2(P.advect, "uPointer", ptr[0], ptr[1]);
      f2(P.advect, "uPointerVel", ptrVel[0], ptrVel[1]);
    });
    vel.swap();
    ptrVel[0] *= 0.5;
    ptrVel[1] *= 0.5;
    pass(P.div, divT, function () {
      tex(P.div, "uVel", 0, vel!.read.tex);
      f2(P.div, "uTexel", gx, gy);
    });
    for (let i = 0; i < 12; i++) {
      pass(P.jacobi, pres.write, function () {
        tex(P.jacobi, "uP", 0, pres!.read.tex);
        tex(P.jacobi, "uDiv", 1, divT!.tex);
        f2(P.jacobi, "uTexel", gx, gy);
      });
      pres.swap();
    }
    pass(P.grad, vel.write, function () {
      tex(P.grad, "uVel", 0, vel!.read.tex);
      tex(P.grad, "uP", 1, pres!.read.tex);
      f2(P.grad, "uTexel", gx, gy);
    });
    vel.swap();

    pass(P.particles, state.write, function () {
      common(P.particles);
      tex(P.particles, "uState", 0, state.read.tex);
      tex(P.particles, "uVel", 1, vel!.read.tex);
      f1(P.particles, "uDt", dt);
    });
    state.swap();

    pass(P.fade, paint.write, function () {
      tex(P.fade, "uCanvas", 0, paint!.read.tex);
      tex(P.fade, "uVel", 1, vel!.read.tex);
      f1(P.fade, "uDt", dt);
      f1(P.fade, "uFade", Math.pow(0.955, dt));
      f1(P.fade, "uWet", 0.3);
      f2(P.fade, "uTexel", 1 / W, 1 / H);
    });

    gl!.useProgram(P.draw);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, paint.write.fbo);
    gl!.viewport(0, 0, W, H);
    common(P.draw);
    tex(P.draw, "uState", 0, state.read.tex);
    i1(P.draw, "uSide", SIDE);
    gl!.uniform3fv(loc(P.draw, "uPal[0]"), new Float32Array(([] as number[]).concat(...pal)));
    const warm = 1 + 2.5 * Math.exp(-age / 2.5);
    f1(P.draw, "uAlpha", 0.035 * DENSITY * warm * dt * 60);
    f1(P.draw, "uPointSize", 0.6 + 1.25 * (W / canvas.clientWidth));
    f1(P.draw, "uSpeckle", texture.speckle);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.bindVertexArray(pointVao);
    gl!.drawArrays(gl!.POINTS, 0, Math.floor(COUNT * drawFrac));
    gl!.disable(gl!.BLEND);
    paint.swap();
  }

  function composite() {
    if (!paint || !softT || !paperT) return;
    const L = lightDir();
    const dpr = W / canvas.clientWidth;
    if (paperWeave !== texture.weave) renderPaper();
    const soften = texture.soften * dpr;
    if (soften >= 0.01) {
      pass(P.soft, softT, function () {
        tex(P.soft, "uCanvas", 0, paint!.read.tex);
        f2(P.soft, "uTexel", 1 / W, 1 / H);
        f1(P.soft, "uSoften", soften);
      });
    }
    pass(P.composite, null, function () {
      common(P.composite);
      tex(P.composite, "uCanvas", 0, paint!.read.tex);
      tex(P.composite, "uSoft", 1, soften >= 0.01 ? softT!.tex : paint!.read.tex);
      tex(P.composite, "uPaperT", 2, paperT!.tex);
      f2(P.composite, "uTexel", 1 / W, 1 / H);
      f2(P.composite, "uRes", W, H);
      f2(P.composite, "uLight", L[0], L[1]);
      f1(P.composite, "uGrain", Math.random());
      f1(P.composite, "uSharpen", texture.sharpen);
      f1(P.composite, "uRelief", texture.relief);
      f1(P.composite, "uGloss", texture.gloss);
      f1(P.composite, "uSoften", soften);
      f1(P.composite, "uEdge", texture.edge);
      f1(P.composite, "uGrainAmt", texture.grain);
      f1(P.composite, "uMisreg", texture.misreg * dpr);
    });
  }

  let last = performance.now();
  function frame(now: number) {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    // the painting drifts slowly, so 30 fps looks the same as 60 at half the GPU cost
    if (now - last < FRAME_MS - 4) return;
    const real = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (real > (FRAME_MS * 1.5) / 1000) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 60 && drawFrac > 0.4) {
      drawFrac -= 0.15;
      slow = 0;
    }
    if (!paused) {
      const dt = Math.min(real, 1 / 30) * MOTION;
      time += dt;
      age += dt;
      updateLatent(dt);
      step(dt);
    }
    composite();
  }
  rafId = requestAnimationFrame(frame);

  return function destroy() {
    disposed = true;
    cancelAnimationFrame(rafId);
    if (resizeTimer) clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    pauseBtn.removeEventListener("click", onPause);
    // release GPU memory so navigating away and back doesn't pile up textures
    for (const t of [state.read, state.write, vel?.read, vel?.write, pres?.read, pres?.write, divT, paint?.read, paint?.write, paperT, softT]) {
      if (t) freeT(t);
    }
    for (const p of Object.values(P)) gl!.deleteProgram(p);
    gl!.deleteBuffer(qb);
    gl!.deleteVertexArray(quadVao);
    gl!.deleteVertexArray(pointVao);
  };
}
