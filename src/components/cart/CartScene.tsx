"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import gsap from "gsap";

/**
 * The cart panel scene (threejs-skills): the CC BY 4.0 PS4 DualShock 4 GLB
 * by JeppeHove-Nyborg under the same studio rig as the login DualSense —
 * RoomEnvironment PMREM, white key + crimson rim/spill — minus the
 * DualSense-specific finish/decal work (this model ships its own materials).
 * Idle sway + bob + breathing spill + pointer parallax + drag-to-rotate
 * (fine pointers; touch-action pan-y). Lifecycle mirrors ControllerScene:
 * WebGL try/catch, pause off-view/off-tab, one frame under reduced motion,
 * full dispose. Load failure leaves the panel as glow + caption — honest
 * absence, never a broken page.
 */

const MODEL_URL = "/models/dualshock4.glb";

export default function CartScene({ className }: { className?: string }) {
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

    // studio env for the plastic — the trick that makes the GLB read real
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

        // the GLB ships in centimetre-ish units (~0.03) — normalize to a
        // real ~16 cm controller so the shared light rig and the 0.1 near
        // plane behave exactly like the login DualSense scene
        const raw = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        model.scale.setScalar(0.16 / Math.max(raw.x, raw.y, raw.z));

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center); // center at pivot origin
        pivot.add(model);

        // fit camera to model (aspect-aware, same math as the login scene)
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const dist =
          Math.max(
            size.y / (2 * Math.tan(vFov / 2)),
            size.x / (2 * Math.tan(vFov / 2) * (width / height || 1)),
          ) * 1.9; // bigger multiplier = smaller controller in frame
        camera.position.z = dist;
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
        /* load failure: panel stays glow + caption — honest absence */
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
      gsap.killTweensOf([enter, spill, renderer.domElement]);
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
