"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Crimson embers drifting through the hero (threejs-skills / threejs-animation
 * patterns): ~420 additive points, low-power renderer, loop stops when the
 * hero scrolls away or the tab hides, full dispose on unmount, one rendered
 * frame under prefers-reduced-motion, silent skip if WebGL is unavailable.
 */
export default function EmberField({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return; // ponytail: no WebGL = no embers, never a broken hero
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
    camera.position.z = 6;

    const COUNT = 420;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2.5; // clamp depth: never near the z=6 camera, or sizeAttenuation blows it up
      speeds[i] = 0.12 + Math.random() * 0.3;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // PointsMaterial draws each point as a hard-edged square primitive; a
    // radial-gradient sprite map is what makes them read as soft embers
    // instead of crimson blocks. One 64px canvas, cached on the material.
    const sprite = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.42)");
      g.addColorStop(0.6, "rgba(255,255,255,0.12)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    const material = new THREE.PointsMaterial({
      size: 0.028,
      map: sprite,
      color: 0xff4d6d,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

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
      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3 + 1] += speeds[i] * dt;
        pos[i * 3] += Math.sin(t * 0.6 + phases[i]) * dt * 0.18;
        if (pos[i * 3 + 1] > 4.2) pos[i * 3 + 1] = -4.2;
      }
      geometry.attributes.position.needsUpdate = true;
      camera.position.x = Math.sin(t * 0.14) * 0.35;
      camera.position.y = Math.cos(t * 0.1) * 0.18;
      camera.lookAt(0, 0, -1);
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

    if (reduce) renderer.render(scene, camera); // one frame, no loop
    else start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      geometry.dispose();
      material.dispose();
      sprite.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
