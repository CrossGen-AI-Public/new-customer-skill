/* ContentHub landing mockup: the three.js hero (dusk hillside, wind-swayed grass, the CrossGen mark on the crest).
   Loaded by index.html after three r160 UMD; expects #hero and #scene. */
(function () {
  if (!window.THREE) return;
  var canvas = document.getElementById('scene');
  var hero = document.getElementById('hero');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 720;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.NoToneMapping;

  var scene = new THREE.Scene();
  var FOG = '#1f3050';
  scene.fog = new THREE.Fog(FOG, 7, 27);

  var camera = new THREE.PerspectiveCamera(small ? 50 : 38, 1, 0.1, 400);
  var camBase = small ? new THREE.Vector3(0.9, 3.0, 9.6) : new THREE.Vector3(0, 2.35, 8.8);
  var look = small ? new THREE.Vector3(1.5, 3.9, 0) : new THREE.Vector3(0.5, 3.0, 0);
  camera.position.copy(camBase);

  /* ---- the hill: one rise, crest a little right of centre ---- */
  var CREST_X = 1.6, CREST_Z = -0.3;
  function hill(x, z) {
    var xx = x - CREST_X, zz = z - CREST_Z;
    var r2 = xx * xx * 0.55 + zz * zz;
    return 2.4 * Math.exp(-r2 / 14)
      + 0.22 * Math.sin(x * 0.55 + 1.3) * Math.cos(z * 0.5)
      + 0.12 * Math.sin(x * 1.7) * Math.sin(z * 1.3)
      - 0.4;
  }
  var hg = new THREE.PlaneGeometry(60, 44, 150, 110);
  hg.rotateX(-Math.PI / 2);
  var hp = hg.attributes.position, cols = [];
  var cA = new THREE.Color('#12281a'), cB = new THREE.Color('#2b6334'), cT = new THREE.Color();
  for (var k = 0; k < hp.count; k++) {
    var hx = hp.getX(k), hz = hp.getZ(k), hy = hill(hx, hz);
    hp.setY(k, hy);
    cT.copy(cA).lerp(cB, THREE.MathUtils.clamp((hy + 0.4) / 2.6, 0, 1));
    cols.push(cT.r, cT.g, cT.b);
  }
  hg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  hg.computeVertexNormals();
  scene.add(new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })));

  /* ---- lights: dusk from behind, blue sky bounce, green from the mark ---- */
  scene.add(new THREE.HemisphereLight('#4d6fb8', '#1a3a22', 1.15));
  var sun = new THREE.DirectionalLight('#bcd0f5', 1.5);
  sun.position.set(-5, 8, -7);
  scene.add(sun);
  var markPos = new THREE.Vector3(CREST_X, hill(CREST_X, CREST_Z) + 0.02, CREST_Z);
  var glow = new THREE.PointLight('#7fd6a0', 7, 7, 2);
  glow.position.set(markPos.x, markPos.y + 2.1, markPos.z + 0.3);
  scene.add(glow);

  /* ---- sky dome: gradient, dusk haze to the right, drifting clouds ---- */
  var NOISE = [
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return v; }'
  ].join('\n');

  var skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTime: { value: 0 },
      uZenith: { value: new THREE.Color('#0c1018') },
      uHorizon: { value: new THREE.Color(FOG) },
      uCloud: { value: new THREE.Color('#6f86ad') },
      uGlow: { value: new THREE.Color('#5b86e5') }
    },
    vertexShader: [
      'varying vec3 vDir;',
      'void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
    ].join('\n'),
    fragmentShader: [
      'uniform float uTime; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uCloud; uniform vec3 uGlow;',
      'varying vec3 vDir;',
      NOISE,
      'void main(){',
      '  float h = clamp(vDir.y, -0.2, 1.0);',
      '  vec3 col = mix(uHorizon, uZenith, smoothstep(0.0, 0.7, h));',
      '  float g = pow(max(dot(normalize(vDir.xz), normalize(vec2(0.55, -1.0))), 0.0), 3.0) * (1.0 - smoothstep(0.0, 0.45, h));',
      '  col += uGlow * g * 0.32;',
      '  if (vDir.y > 0.01) {',
      '    vec2 p = vDir.xz / (vDir.y + 0.28) * 2.4;',
      '    float n = fbm(p + vec2(uTime * 0.018, uTime * 0.005));',
      '    float c = smoothstep(0.47, 0.8, n);',
      '    float fade = smoothstep(0.01, 0.22, vDir.y) * (1.0 - smoothstep(0.55, 0.95, vDir.y));',
      '    col = mix(col, uCloud, c * fade * 0.8);',
      '  }',
      '  gl_FragColor = vec4(col, 1.0);',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(180, 40, 20), skyMat));

  /* ---- grass: instanced blades bent by wind in the vertex shader ---- */
  function bladeGeometry() {
    var segs = 4, w = 0.075, pos = [], uv = [], idx = [];
    for (var j = 0; j <= segs; j++) {
      var t = j / segs, hw = w * 0.5 * (1 - t * t * 0.92);
      pos.push(-hw, t, 0, hw, t, 0);
      uv.push(0, t, 1, t);
    }
    for (var s = 0; s < segs; s++) { var a = s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }
  var swayVertex = [
    'uniform float uTime; uniform float uWind; uniform vec3 uPointer; uniform vec2 uBrush; uniform float uPush;',
    'attribute float aPhase;',
    'varying float vY; varying float vPhase; varying vec3 vWorld;',
    '#ifdef FLOWER', 'varying vec3 vColor;', '#endif',
    '#include <fog_pars_vertex>',
    NOISE,
    'void main(){',
    '  vY = uv.y; vPhase = aPhase;',
    '  #ifdef FLOWER', '    #ifdef USE_INSTANCING_COLOR', '    vColor = instanceColor;', '    #else', '    vColor = vec3(1.0);', '    #endif', '  #endif',
    '  vec4 wp = vec4(position, 1.0);',
    '  #ifdef USE_INSTANCING', '  wp = instanceMatrix * wp;', '  #endif',
    '  wp = modelMatrix * wp;',
    '  #ifdef FLOWER', '  float bend = 1.0;', '#else', '  float bend = vY * vY;', '#endif',
    '  float gust = noise(wp.xz * 0.16 + vec2(uTime * 0.22, uTime * 0.11));',
    '  float sway = sin(uTime * 1.7 + wp.x * 0.6 + wp.z * 0.45 + aPhase * 6.2831) * 0.11;',
    '  vec2 dir = normalize(vec2(1.0, 0.35));',
    '  wp.xz += dir * bend * (0.3 * (gust - 0.3) * uWind + sway);',
    '  wp.y -= bend * 0.05 * gust;',
    '  vec2 away = wp.xz - uPointer.xz;',
    '  float pd = length(away);',
    '  float push = pow(1.0 - smoothstep(0.0, 1.1, pd), 1.5) * uPush;',
    '  #ifdef FLOWER', '  push *= 0.5;', '  #endif',
    '  wp.xz += (uBrush * 0.8 + (away / max(pd, 0.001)) * 0.2) * push * bend * 0.22;',
    '  wp.y -= push * bend * 0.05;',
    '  vWorld = wp.xyz;',
    '  vec4 mvPosition = viewMatrix * wp;',
    '  gl_Position = projectionMatrix * mvPosition;',
    '  #include <fog_vertex>',
    '}'
  ].join('\n');
  var swayFragment = [
    'uniform vec3 uBase; uniform vec3 uTip; uniform vec3 uRim; uniform vec3 uGlowColor; uniform vec3 uMark;',
    'varying float vY; varying float vPhase; varying vec3 vWorld;',
    '#ifdef FLOWER', 'varying vec3 vColor;', '#endif',
    '#include <fog_pars_fragment>',
    'void main(){',
    '  #ifdef FLOWER',
    '  vec3 col = vColor * (0.8 + 0.4 * vPhase);',
    '  #else',
    '  vec3 col = mix(uBase, uTip, smoothstep(0.0, 1.0, vY));',
    '  col *= 0.7 + 0.6 * vPhase;',
    '  col *= 0.5 + 0.5 * vY;',
    '  col += uRim * pow(vY, 3.0) * 0.22;',
    '  #endif',
    '  float d = distance(vWorld, uMark);',
    '  col += uGlowColor * exp(-d * d / 1.6) * 0.55;',
    '  gl_FragColor = vec4(col, 1.0);',
    '  #include <tonemapping_fragment>',
    '  #include <colorspace_fragment>',
    '  #include <fog_fragment>',
    '}'
  ].join('\n');
  function swayMaterial(flower) {
    var u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uWind: { value: 1 }, uPointer: { value: new THREE.Vector3(0, -10, 0) }, uBrush: { value: new THREE.Vector2(1, 0) }, uPush: { value: 0 },
      uBase: { value: new THREE.Color('#10271a') }, uTip: { value: new THREE.Color('#3f8a44') },
      uRim: { value: new THREE.Color('#9fb8e8') }, uGlowColor: { value: new THREE.Color('#7fd6a0') },
      uMark: { value: new THREE.Vector3() }
    }]);
    var m = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: swayVertex, fragmentShader: swayFragment,
      side: THREE.DoubleSide, fog: true, defines: flower ? { FLOWER: '' } : {}
    });
    m.uniforms.uMark.value.set(markPos.x, markPos.y + 0.9, markPos.z);
    return m;
  }
  var grassMat = swayMaterial(false), flowerMat = swayMaterial(true);

  var N = small ? 14000 : 36000;
  var grass = new THREE.InstancedMesh(bladeGeometry(), grassMat, N);
  var dummy = new THREE.Object3D(), phase = new Float32Array(N), i = 0;
  while (i < N) {
    var gx = (Math.random() * 2 - 1) * 13, gz = (Math.random() * 2 - 1) * 9 - 1.5;
    var dx = gx - CREST_X, dz = gz - CREST_Z, r2 = dx * dx * 0.55 + dz * dz;
    if (Math.random() > Math.exp(-r2 / 70)) continue;
    var near = Math.exp(-r2 / 9);
    var sc = (0.26 + Math.random() * 0.3) * (1 + 0.5 * near);
    dummy.position.set(gx, hill(gx, gz), gz);
    dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
    dummy.scale.set(1 + Math.random() * 0.6, sc, 1);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    phase[i] = Math.random();
    i++;
  }
  grass.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  grass.frustumCulled = false;
  scene.add(grass);

  /* ---- wildflowers: the track colours, scattered near the crest ---- */
  var FN = small ? 220 : 460;
  var flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.048, 1), flowerMat, FN);
  var fphase = new Float32Array(FN);
  var palette = [new THREE.Color('#d35a6e'), new THREE.Color('#cf9647'), new THREE.Color('#e7ebf1'), new THREE.Color('#8a7cc8')];
  for (var f = 0; f < FN; f++) {
    var ang = Math.random() * Math.PI * 2, rad = 0.6 + Math.pow(Math.random(), 0.6) * 5.2;
    var fx = CREST_X + Math.cos(ang) * rad * 1.35, fz = CREST_Z + Math.sin(ang) * rad;
    var fy = hill(fx, fz) + 0.28 + Math.random() * 0.22;
    dummy.position.set(fx, fy, fz);
    dummy.rotation.set(0, 0, 0);
    var fs = 0.7 + Math.random() * 0.6;
    dummy.scale.set(fs, fs, fs);
    dummy.updateMatrix();
    flowers.setMatrixAt(f, dummy.matrix);
    flowers.setColorAt(f, palette[Math.random() < 0.42 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.6 ? 2 : 3]);
    fphase[f] = Math.random();
  }
  flowers.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(fphase, 1));
  flowers.frustumCulled = false;
  scene.add(flowers);

  /* ---- the CrossGen mark, standing on the crest (traced from the logo) ---- */
  var S = 2.6, R_TUBE = 0.021 * S, R_RING = 0.0625 * S;
  var traces = [
    { ring: [0.104, 0.637], path: [[0.158, 0.582], [0.392, 0.349], [0.392, -0.2]] },
    { ring: [0.383, 0.914], path: [[0.383, 0.839], [0.383, 0.527], [0.508, 0.390], [0.508, -0.2]] },
    { ring: [0.625, 0.692], path: [[0.625, 0.616], [0.625, -0.2]] },
    { ring: [0.900, 0.610], path: [[0.900, 0.534], [0.900, 0.342], [0.742, 0.205], [0.742, -0.2]] }
  ];
  var markMat = new THREE.MeshStandardMaterial({ color: '#f2f6f5', emissive: '#7fd6a0', emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.15 });
  var mark = new THREE.Group();
  var jointGeo = new THREE.SphereGeometry(R_TUBE, 12, 10);
  var ringGeo = new THREE.TorusGeometry(R_RING, R_TUBE, 12, 40);
  function P(u, v) { return new THREE.Vector3((u - 0.5) * S * 0.82, v * S, 0); }
  traces.forEach(function (t) {
    var ring = new THREE.Mesh(ringGeo, markMat);
    ring.position.copy(P(t.ring[0], t.ring[1]));
    mark.add(ring);
    for (var s = 0; s < t.path.length - 1; s++) {
      var a = P(t.path[s][0], t.path[s][1]), b = P(t.path[s + 1][0], t.path[s + 1][1]);
      var len = a.distanceTo(b);
      var cyl = new THREE.Mesh(new THREE.CylinderGeometry(R_TUBE, R_TUBE, len, 12), markMat);
      cyl.position.copy(a).lerp(b, 0.5);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      mark.add(cyl);
      var j = new THREE.Mesh(jointGeo, markMat);
      j.position.copy(a);
      mark.add(j);
    }
  });
  mark.position.set(markPos.x, markPos.y + 0.5, markPos.z);
  mark.rotation.y = -0.38;
  scene.add(mark);

  var haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 256;
  var hc = haloCanvas.getContext('2d');
  var grd = hc.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(210,255,225,0.85)');
  grd.addColorStop(0.32, 'rgba(127,214,160,0.34)');
  grd.addColorStop(1, 'rgba(127,214,160,0)');
  hc.fillStyle = grd;
  hc.fillRect(0, 0, 256, 256);
  var haloTex = new THREE.CanvasTexture(haloCanvas);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7 }));
  halo.position.set(markPos.x, markPos.y + 2.3, markPos.z - 0.05);
  halo.scale.set(6.2, 6.2, 1);
  scene.add(halo);

  /* ---- sizing, pointer parallax, loop ---- */
  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(function () { resize(); if (reduce) render(0); }).observe(hero);

  var mx = 0, my = 0, tx = 0, ty = 0;
  var raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), probe = new THREE.Vector3();
  var pointerWorld = new THREE.Vector3(0, -10, 0), pointerTarget = new THREE.Vector3(0, -10, 0), pushNow = 0, pushTarget = 0;
  var brushDir = new THREE.Vector2(1, 0), brushStep = new THREE.Vector2(), lastHit = new THREE.Vector3(), hadHit = false;
  /* Where the pointer's ray meets the grass tips (the hill plus blade height): march
     along it until it dips under that surface, then bisect. Cheap enough to run on every pointer event. */
  function hillHit(nx, ny) {
    ndc.set(nx, ny);
    raycaster.setFromCamera(ndc, camera);
    var o = raycaster.ray.origin, d = raycaster.ray.direction, prev = 0.5;
    for (var t = 0.5; t < 40; t += 0.35) {
      probe.copy(o).addScaledVector(d, t);
      if (probe.y < hill(probe.x, probe.z) + 0.45) {
        var lo = prev, hi = t;
        for (var k = 0; k < 6; k++) {
          var mid = (lo + hi) / 2;
          probe.copy(o).addScaledVector(d, mid);
          if (probe.y < hill(probe.x, probe.z) + 0.45) hi = mid; else lo = mid;
        }
        return probe.copy(o).addScaledVector(d, hi);
      }
      prev = t;
    }
    return null;
  }
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    var hit = hillHit(tx * 2, -ty * 2);
    if (!hit) { pushTarget = 0; hadHit = false; return; }
    pointerTarget.copy(hit);
    if (hadHit) {
      /* The brush leans the blades the way the hand moves; a resting hand does nothing. */
      brushStep.set(hit.x - lastHit.x, hit.z - lastHit.z);
      var speed = brushStep.length();
      if (speed > 0.002) {
        brushDir.lerp(brushStep.normalize(), 0.35).normalize();
        pushTarget = Math.min(1, pushTarget + speed * 2.5);
      }
    }
    lastHit.copy(hit);
    hadHit = true;
  });
  hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; pushTarget = 0; hadHit = false; });

  function render(t) {
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;
    camera.position.set(camBase.x + Math.sin(t * 0.07) * 0.25 + mx * 0.7, camBase.y + Math.cos(t * 0.05) * 0.1 - my * 0.3, camBase.z);
    camera.lookAt(look);
    var wind = 1 + 0.5 * Math.sin(t * 0.3) + 0.25 * Math.sin(t * 0.77);
    grassMat.uniforms.uTime.value = t; grassMat.uniforms.uWind.value = wind;
    flowerMat.uniforms.uTime.value = t; flowerMat.uniforms.uWind.value = wind * 0.6;
    pointerWorld.lerp(pointerTarget, 0.18);
    pushTarget *= 0.9;
    pushNow += (pushTarget - pushNow) * 0.1;
    grassMat.uniforms.uPointer.value.copy(pointerWorld); grassMat.uniforms.uBrush.value.copy(brushDir); grassMat.uniforms.uPush.value = pushNow;
    flowerMat.uniforms.uPointer.value.copy(pointerWorld); flowerMat.uniforms.uBrush.value.copy(brushDir); flowerMat.uniforms.uPush.value = pushNow;
    skyMat.uniforms.uTime.value = t;
    var breathe = 0.5 + 0.5 * Math.sin(t * 1.1);
    markMat.emissiveIntensity = 0.38 + 0.3 * breathe;
    glow.intensity = 6 + 3 * breathe;
    halo.material.opacity = 0.55 + 0.25 * breathe;
    mark.rotation.z = Math.sin(t * 0.9) * 0.012;
    renderer.render(scene, camera);
  }

  if (reduce) { render(2.5); return; }
  var clock = new THREE.Clock(), running = false;
  function loop() { if (!running) return; render(clock.getElapsedTime()); requestAnimationFrame(loop); }
  function start() { if (running) return; running = true; requestAnimationFrame(loop); }
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start(); else running = false;
  }, { threshold: 0.02 }).observe(hero);
  start();
})();
