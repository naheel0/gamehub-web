"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import gsap from "gsap";

/**
 * The arena controller (threejs-skills composition) — modeled on the
 * Midnight Black DualSense reference: all-matte-black shell, wide top-edge
 * touchpad flanked by two THIN VERTICAL LIGHT STRIPS (the PS5 signature,
 * re-tinted crimson for the arena), 4-way d-pad left, four dark face buttons
 * right, twin concave sticks, speaker dot-grid + PS button + mic button
 * stacked on the center line, create/options slivers above the touchpad
 * corners, chunky grips sweeping down-out. A cool white rim light from
 * behind-left keeps the black body reading against the near-black page.
 *
 * Motion (threejs-animation, procedural): GSAP drop-in on the outer group
 * (expo.out, killed on unmount), inner-group idle = hover sway (yaw
 * oscillation — a wide object reads better swaying than spinning) + float,
 * light strips breathe on a sine. Parallax trails the cursor (fine pointers
 * only). Lifecycle mirrors EmberField: WebGL try/catch, ResizeObserver,
 * pause off-view/off-tab, one frame under reduced motion, full dispose.
 */
export default function ArenaController({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL = no controller, never a broken page
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0.1, 7.2);

    // ---- materials: midnight-black palette (reference), crimson bar ----
    const shell = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.52, metalness: 0.12 });
    const face = new THREE.MeshStandardMaterial({ color: 0x232327, roughness: 0.42, metalness: 0.15 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x141417, roughness: 0.88 });
    const button = new THREE.MeshStandardMaterial({ color: 0x3a3a41, roughness: 0.3, metalness: 0.2 });
    const symbol = new THREE.MeshStandardMaterial({ color: 0x8a8a92, roughness: 0.4 });
    const well = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.6 });
    const lightBar = new THREE.MeshStandardMaterial({
      color: 0x1a0409,
      emissive: 0xff2d55,
      emissiveIntensity: 2.1,
    });

    const root = new THREE.Group(); // entrance transforms (GSAP)
    const pad = new THREE.Group(); // idle transforms (per-frame)
    root.add(pad);
    scene.add(root);

    const add = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      pos: [number, number, number],
      rot?: [number, number, number],
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      if (rot) m.rotation.set(...rot);
      pad.add(m);
      return m;
    };

    // ---- shell: wide top body + center face plate + chunky angled grips ----
    add(new RoundedBoxGeometry(2.34, 1.0, 0.62, 5, 0.28), shell, [0, 0.05, 0]);
    add(new RoundedBoxGeometry(1.5, 0.72, 0.66, 4, 0.2), face, [0, 0.08, 0]);
    // grips: steep down-out sweep like the reference, rounded ends
    add(new THREE.CapsuleGeometry(0.27, 0.62, 6, 18), shell, [-0.76, -0.62, -0.06], [0.22, 0, -0.42]);
    add(new THREE.CapsuleGeometry(0.27, 0.62, 6, 18), shell, [0.76, -0.62, -0.06], [0.22, 0, 0.42]);

    // ---- touchpad (wide, top center) + the twin crimson light strips ----
    add(new RoundedBoxGeometry(1.06, 0.5, 0.05, 3, 0.06), well, [0, 0.38, 0.315]);
    add(new RoundedBoxGeometry(0.05, 0.52, 0.055, 2, 0.024), lightBar, [-0.575, 0.38, 0.31]);
    add(new RoundedBoxGeometry(0.05, 0.52, 0.055, 2, 0.024), lightBar, [0.575, 0.38, 0.31]);

    // create / options slivers flanking the touchpad top corners
    add(new RoundedBoxGeometry(0.09, 0.17, 0.06, 2, 0.028), well, [-0.64, 0.66, 0.29], [0, 0, 0.28]);
    add(new RoundedBoxGeometry(0.09, 0.17, 0.06, 2, 0.028), well, [0.64, 0.66, 0.29], [0, 0, -0.28]);

    // ---- analog sticks: recessed well + shaft + concave cap + rim ----
    for (const sx of [-0.34, 0.34]) {
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), well, [sx, -0.12, 0.32], [Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.16, 0.022, 10, 28), face, [sx, -0.12, 0.34]);
      add(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), rubber, [sx, -0.12, 0.38], [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.11, 0.116, 0.06, 24), rubber, [sx, -0.12, 0.46], [Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.094, 0.019, 8, 24), rubber, [sx, -0.12, 0.485]);
    }

    // ---- d-pad: 4 separate directional segments (left wing) ----
    const dpadX = -0.84;
    const dpadY = 0.42;
    add(new RoundedBoxGeometry(0.15, 0.13, 0.05, 2, 0.03), button, [dpadX, dpadY + 0.14, 0.3]); // up
    add(new RoundedBoxGeometry(0.15, 0.13, 0.05, 2, 0.03), button, [dpadX, dpadY - 0.14, 0.3]); // down
    add(new RoundedBoxGeometry(0.13, 0.15, 0.05, 2, 0.03), button, [dpadX - 0.14, dpadY, 0.3]); // left
    add(new RoundedBoxGeometry(0.13, 0.15, 0.05, 2, 0.03), button, [dpadX + 0.14, dpadY, 0.3]); // right

    // ---- four face buttons (right wing) with embossed symbol marks ----
    const btnX = 0.84;
    const btnY = 0.42;
    const buttons: Array<[number, number]> = [
      [btnX, btnY + 0.15], // triangle position
      [btnX + 0.15, btnY], // circle position
      [btnX, btnY - 0.15], // cross position
      [btnX - 0.15, btnY], // square position
    ];
    for (const [bx, by] of buttons) {
      add(new THREE.CylinderGeometry(0.075, 0.075, 0.055, 22), button, [bx, by, 0.3], [Math.PI / 2, 0, 0]);
    }
    // symbol marks: tiny light-gray shapes standing in for ▲ ● ✕ ■
    add(new THREE.CylinderGeometry(0.028, 0.028, 0.012, 3), symbol, [btnX, btnY + 0.15, 0.335], [Math.PI / 2, 0, 0]);
    add(new THREE.TorusGeometry(0.026, 0.008, 6, 16), symbol, [btnX + 0.15, btnY, 0.335], [Math.PI / 2, 0, 0]);
    add(new THREE.BoxGeometry(0.045, 0.012, 0.012), symbol, [btnX, btnY - 0.15, 0.335], [0, 0, Math.PI / 4]);
    add(new THREE.BoxGeometry(0.04, 0.04, 0.012), symbol, [btnX - 0.15, btnY, 0.335], [Math.PI / 2, 0, 0]);

    // ---- speaker dot-grid, PS button, mic button (center stack) ----
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        add(
          new THREE.SphereGeometry(0.011, 8, 8),
          well,
          [-0.075 + c * 0.03, 0.115 - r * 0.032, 0.335],
        );
      }
    }
    add(new RoundedBoxGeometry(0.09, 0.06, 0.045, 2, 0.02), well, [0, 0.0, 0.32]); // PS button
    add(new RoundedBoxGeometry(0.055, 0.075, 0.04, 2, 0.016), well, [0, -0.28, 0.31]); // mic mute

    // ---- orbiting ember shards (shared arena language with the landing) ----
    const shardGeo = new THREE.TetrahedronGeometry(0.075, 0);
    const shards: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(shardGeo, lightBar);
      s.userData = { r: 2.2 + i * 0.22, speed: 0.32 + i * 0.06, phase: (i / 5) * Math.PI * 2, y: -1 + i * 0.55 };
      scene.add(s);
      shards.push(s);
    }

    // ---- light: cool key + white rim (black body must read on dark page)
    // + crimson spill from the light strips ----
    scene.add(new THREE.AmbientLight(0x404050, 0.85));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xbfc6d4, 1.1);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);
    const barLight = new THREE.PointLight(0xff2d55, 12, 7);
    barLight.position.set(0, 0.38, 0.9);
    scene.add(barLight);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ---- entrance: GSAP drop-in on root (outer), skipped under reduced motion ----
    const cleanup: (() => void)[] = [];
    const pointer = { x: 0, y: 0 };
    if (reduce) {
      root.rotation.y = 0.3;
    } else {
      root.position.y = -5;
      root.rotation.y = -0.9;
      gsap.to(root.position, { y: 0, duration: 1.15, ease: "expo.out" });
      gsap.to(root.rotation, { y: 0, duration: 1.35, ease: "expo.out" });
      gsap.from(camera.position, { z: 10, duration: 1.5, ease: "power3.out" });
      if (finePointer) {
        const onMove = (e: PointerEvent) => {
          pointer.x = (e.clientX / window.innerWidth - 0.5) * 0.9;
          pointer.y = (e.clientY / window.innerHeight - 0.5) * 0.5;
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        cleanup.push(() => window.removeEventListener("pointermove", onMove));
      }
    }

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

      // idle: hover sway (yaw oscillation + micro-tilt) + float
      pad.rotation.y = Math.sin(t * 0.4) * 0.5;
      pad.rotation.x = -0.06 + Math.sin(t * 0.27) * 0.05;
      pad.position.y = Math.sin(t * 0.8) * 0.08;

      // light strips breathe; spill light follows
      lightBar.emissiveIntensity = 2 + Math.sin(t * 1.8) * 0.7;
      barLight.intensity = 11 + Math.sin(t * 1.8) * 3;

      for (const s of shards) {
        const d = s.userData as { r: number; speed: number; phase: number; y: number };
        s.position.set(
          Math.cos(t * d.speed + d.phase) * d.r,
          d.y + Math.sin(t * 0.7 + d.phase) * 0.15,
          Math.sin(t * d.speed + d.phase) * d.r,
        );
        s.rotation.x += dt * 1.1;
        s.rotation.y += dt * 0.8;
      }

      // camera parallax trails the pointer (fine pointers only)
      camera.position.x += (pointer.x - camera.position.x) * dt * 2.4;
      camera.position.y += (0.1 - pointer.y - camera.position.y) * dt * 2.4;
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

    renderer.render(scene, camera); // paint immediately (also the single reduced-motion frame)
    if (!reduce) start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      gsap.killTweensOf([root.position, root.rotation, camera.position]);
      for (const fn of cleanup) fn();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
