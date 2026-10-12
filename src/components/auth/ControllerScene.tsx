"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import gsap from "gsap";

/**
 * The DualSense on /login (threejs-skills): the CC BY 4.0 GLB by Taohid
 * Animation (same asset the dualsense-controller studio uses) in its
 * Midnight Black finish — recolor + redrawn △○×□ decals ported from the
 * studio — under a RoomEnvironment rig + the arena's crimson spill light. Idle sway +
 * pointer parallax + drag-to-rotate (fine pointers; touch-action pan-y so
 * a vertical swipe still scrolls the page). Lifecycle mirrors KeyScene /
 * EmberField: WebGL try/catch, pause off-view/off-tab, one frame under
 * reduced motion, full dispose (geometries, materials, textures). The GSAP
 * entrance composes through an `enter` progress so it never fights the
 * per-frame transforms.
 */

const MODEL_URL = "/models/dualsense.glb";

// Midnight Black finish + colored glyphs — palette and decal routine ported
// from the dualsense-controller studio (index.html setFinish('black')).
const FINISH = { shell: "#34343c", button: "#363740" };

const SYMBOLS: Record<string, { color: string; size: number; arrow?: boolean }> = {
  triangle: { color: "#3fbf5f", size: 0.235 },
  square: { color: "#e94f9a", size: 0.235 },
  cross: { color: "#3d8fe8", size: 0.235 },
  circle: { color: "#ef3f3f", size: 0.235 },
  up: { color: "#969dad", size: 0.11, arrow: true },
  down: { color: "#969dad", size: 0.11, arrow: true },
  left: { color: "#969dad", size: 0.11, arrow: true },
  right: { color: "#969dad", size: 0.11, arrow: true },
};

/** Draw a glyph on canvas, project it onto the button cap as a decal. */
function addSymbol(cap: THREE.Mesh, id: string): THREE.MeshStandardMaterial {
  const { color, size, arrow } = SYMBOLS[id];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 20;
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (id === "triangle") {
    ctx.moveTo(128, 35);
    ctx.lineTo(230, 213);
    ctx.lineTo(26, 213);
    ctx.closePath();
    ctx.stroke();
  } else if (id === "circle") {
    ctx.arc(128, 128, 92, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === "square") ctx.strokeRect(43, 43, 170, 170);
  else if (id === "cross") {
    ctx.moveTo(48, 48);
    ctx.lineTo(208, 208);
    ctx.moveTo(208, 48);
    ctx.lineTo(48, 208);
    ctx.stroke();
  } else {
    ctx.translate(128, 128);
    ctx.rotate(({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 } as Record<string, number>)[id]!);
    ctx.moveTo(0, -62);
    ctx.lineTo(65, 40);
    ctx.lineTo(-65, 40);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.MeshStandardMaterial({
    color,
    map: texture,
    transparent: true,
    depthWrite: false,
    roughness: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  cap.updateWorldMatrix(true, false);
  cap.geometry.computeBoundingBox();
  const bounds = cap.geometry.boundingBox!;
  const center = bounds.getCenter(new THREE.Vector3());
  center.z = bounds.max.z;
  if (arrow) {
    const ox = ({ left: -0.045, right: 0.045, up: 0, down: 0 } as Record<string, number>)[id] ?? 0;
    const oy = ({ up: 0.045, down: -0.045, left: 0, right: 0 } as Record<string, number>)[id] ?? 0;
    center.x += ox;
    center.y += oy;
  }
  cap.localToWorld(center);
  const orientation = new THREE.Euler().setFromQuaternion(
    cap.getWorldQuaternion(new THREE.Quaternion()),
  );
  const decal = new THREE.Mesh(
    new DecalGeometry(cap, center, orientation, new THREE.Vector3(size, size, 0.3)),
    material,
  );
  // DecalGeometry emits world-space vertices; move into cap space so the glyph rides along
  decal.geometry.applyMatrix4(new THREE.Matrix4().copy(cap.matrixWorld).invert());
  cap.add(decal);
  return material;
}

export default function ControllerScene({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return; // no WebGL = panel keeps glow + caption, page never breaks
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    // studio env for the plastic/metal — the trick that makes the GLB read real
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.035);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.62;
    pmrem.dispose();

    // key / fill / rim — arena grade: white key for legibility, crimson rim
    // so the shell edges catch #ff2d55, dim cool fill for depth
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-3, 5, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7e1ff, 0.5);
    fill.position.set(5, 1, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff2d55, 1.6);
    rim.position.set(1, 4, -4);
    scene.add(rim);
    const spill = new THREE.PointLight(0xff2d55, 6, 12);
    spill.position.set(0, -1.2, 2.2);
    scene.add(spill);

    const spinner = new THREE.Group(); // idle sway
    const pivot = new THREE.Group(); // user yaw/pitch + entrance compose
    spinner.add(pivot);
    scene.add(spinner);

    let width = 0;
    let height = 0;
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ---- model load (async; panel shows glow meanwhile) ----
    const cleanup: (() => void)[] = [];

    // The arena breathes — crimson spill pulses under the grips
    const breathe = reduce
      ? null
      : gsap.to(spill, { intensity: 10.5, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    if (breathe) cleanup.push(() => breathe.kill());
    const drag = { active: false, px: 0, py: 0 };
    const rot = { yaw: 0.35, pitch: 0.12, tYaw: 0.35, tPitch: 0.12 };
    const pointer = { x: 0, y: 0 };
    const enter = { p: reduce ? 1 : 0 };

    let disposed = false;
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeGltf(gltf.scene);
          return;
        }
        const model = gltf.scene;

        // Midnight Black finish (skip the white side panels + mounts)
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          if (/^(ps-mount|mute-mount|white-shell-detail)/.test(mesh.name)) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const n = m.name || "";
            if (["front_body", "VRayMtl55"].includes(n)) {
              const sm = m as THREE.MeshStandardMaterial;
              sm.color.set(FINISH.shell);
              sm.metalness = 0.015;
              sm.roughness = n === "front_body" ? 0.43 : 0.55;
            } else if (["Material.002", "Material.009", "Material.007"].includes(n)) {
              (m as THREE.MeshStandardMaterial).color.set(FINISH.button);
            }
          }
        });

        // Baked glyphs vanish on the black finish — hide them, draw our own.
        const caps: Record<string, THREE.Mesh> = {};
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const u = (mesh.userData ?? {}) as { part?: string; control?: string };
          if (u.part === "symbol-decal" || u.part === "symbol-decal-overlay") mesh.visible = false;
          if (u.part === "cap" && u.control && u.control in SYMBOLS) caps[u.control] = mesh;
        });
        // Pressables: each glyph cap + its decal material, for the idle press beat
        const pressables: { mesh: THREE.Mesh; z0: number; depth: number; mat: THREE.MeshStandardMaterial }[] = [];
        for (const id of Object.keys(caps)) {
          const mat = addSymbol(caps[id], id);
          // press depth relative to the cap itself — buttons differ in size
          const cb = new THREE.Box3().setFromObject(caps[id]);
          const depth = Math.max((cb.max.x - cb.min.x) * 0.16, 0.01);
          pressables.push({ mesh: caps[id], z0: caps[id].position.z, depth, mat });
        }
        if (!reduce && pressables.length > 0) {
          // The controller tests itself: one glyph cap depresses + glows, at random
          let pending: gsap.core.Tween | null = null;
          const pressNext = () => {
            const p = pressables[Math.floor(Math.random() * pressables.length)];
            gsap.to(p.mesh.position, { z: p.z0 - p.depth, duration: 0.14, ease: "power2.in" });
            gsap.to(p.mesh.position, { z: p.z0, duration: 0.3, delay: 0.14, ease: "back.out(2.5)" });
            p.mat.emissive.set(p.mat.color);
            gsap.fromTo(
              p.mat,
              { emissiveIntensity: 3 },
              { emissiveIntensity: 0, duration: 0.8, delay: 0.1, ease: "power1.out" },
            );
            pending = gsap.delayedCall(3.8 + Math.random() * 1.4, pressNext);
          };
          pending = gsap.delayedCall(2.6, pressNext);
          cleanup.push(() => {
            pending?.kill();
            for (const p of pressables) {
              gsap.killTweensOf(p.mesh.position);
              gsap.killTweensOf(p.mat);
            }
          });
        }

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center); // center at pivot origin
        pivot.add(model);

        // fit camera to model (aspect-aware, same math as the source studio)
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const dist =
          Math.max(
            size.y / (2 * Math.tan(vFov / 2)),
            size.x / (2 * Math.tan(vFov / 2) * (width / height || 1)),
          ) * 1.9; // bigger multiplier = smaller controller in frame
        camera.position.z = dist;
        camera.userData.baseZ = dist;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        if (reduce) {
          // one frame at rest — needs the fitted camera, so it lives here
          pivot.rotation.y = rot.yaw;
          pivot.rotation.x = rot.pitch;
          renderer.render(scene, camera);
        } else {
          // entrance composes through enter.p, never over the per-frame writes
          gsap.to(enter, { p: 1, duration: 1.25, ease: "expo.out" });
          gsap.from(renderer.domElement, { opacity: 0, duration: 0.6, ease: "power1.out" });
          start();
        }
      },
      undefined,
      () => {
        /* load failure: panel stays empty — honest absence, never a broken page */
      },
    );

    // drag-to-rotate (fine pointers only; pan-y keeps vertical scroll alive)
    if (finePointer && !reduce) {
      const dom = renderer.domElement;
      dom.style.cursor = "grab";
      dom.style.touchAction = "pan-y";
      const down = (e: PointerEvent) => {
        drag.active = true;
        drag.px = e.clientX;
        drag.py = e.clientY;
        dom.style.cursor = "grabbing";
        dom.setPointerCapture(e.pointerId);
      };
      const move = (e: PointerEvent) => {
        if (!drag.active) return;
        rot.tYaw += (e.clientX - drag.px) * 0.008;
        rot.tPitch = THREE.MathUtils.clamp(rot.tPitch + (e.clientY - drag.py) * 0.008, -1.2, 1.2);
        drag.px = e.clientX;
        drag.py = e.clientY;
      };
      const up = () => {
        drag.active = false;
        dom.style.cursor = "grab";
      };
      const hover = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 0.9;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 0.5;
      };
      dom.addEventListener("pointerdown", down);
      dom.addEventListener("pointermove", move);
      dom.addEventListener("pointerup", up);
      window.addEventListener("pointermove", hover, { passive: true });
      cleanup.push(() => {
        dom.removeEventListener("pointerdown", down);
        dom.removeEventListener("pointermove", move);
        dom.removeEventListener("pointerup", up);
        window.removeEventListener("pointermove", hover);
      });
    }

    // ---- loop: idle sway + composed entrance, paused off-view/off-tab ----
    let raf = 0;
    let running = false;
    let inView = true;
    const start = () => {
      if (!running && inView && !document.hidden && !reduce) {
        running = true;
        clock = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    let clock = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - clock) / 1000, 0.05);
      clock = now;
      const t = now / 1000;

      rot.yaw += (rot.tYaw - rot.yaw) * Math.min(dt * 7.5, 1);
      rot.pitch += (rot.tPitch - rot.pitch) * Math.min(dt * 7.5, 1);
      const e = enter.p;
      pivot.rotation.y = rot.yaw + (1 - e) * -0.9;
      pivot.rotation.x = rot.pitch;
      pivot.scale.setScalar(0.82 + 0.18 * e);
      spinner.rotation.z = Math.sin(t * 0.6) * 0.03;
      spinner.position.y = Math.sin(t * 1.1) * 0.05 + (1 - e) * -0.8;

      // camera parallax trails the pointer (fine pointers only)
      camera.position.x += (pointer.x - camera.position.x) * Math.min(dt * 2.4, 1);
      camera.position.y += (-pointer.y - camera.position.y) * Math.min(dt * 2.4, 1);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(host);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      gsap.killTweensOf([enter, renderer.domElement]);
      for (const fn of cleanup) fn();
      if (pivot.children.length > 0) disposeGltf(pivot.children[0] as THREE.Object3D);
      env.texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}

function disposeGltf(root: THREE.Object3D) {
  const seen = new Set<THREE.Texture>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of materials) {
      for (const value of Object.values(m as unknown as Record<string, unknown>)) {
        if (value instanceof THREE.Texture && !seen.has(value)) {
          seen.add(value);
          value.dispose();
        }
      }
      m.dispose();
    }
  });
}
