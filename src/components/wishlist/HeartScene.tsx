"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

/**
 * The arena heart (/wishlist panel, threejs-skills): a primitive extruded
 * THREE.Shape heart — two lobes, top cleft, bottom point — in arena crimson
 * with a soft bevel, orbited by small matte-white shards (tetrahedra).
 * Same key/fill/crimson-rim/spill rig as the auth scenes; no downloaded
 * asset, no environment map (the emissive crimson carries it).
 *
 * Motion (threejs-animation, procedural): GSAP drop-in composed through an
 * `enter` progress so it never fights the per-frame transforms, a slow
 * heartbeat (scale yoyo through a separate `beat` channel), sway + float,
 * pointer parallax. One authored moment only — restraint over spectacle.
 * Reduced motion renders one frame at rest; unmount disposes everything.
 */
export default function HeartScene({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return; // no WebGL = the panel keeps glow + caption, page never breaks
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    // arena rig — white key for legibility, crimson rim + spill so the
    // heart's bevels catch #ff2d55 against the near-black page
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-3, 5, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7e1ff, 0.55);
    fill.position.set(5, 1, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff2d55, 1.5);
    rim.position.set(1, 4, -4);
    scene.add(rim);
    const spill = new THREE.PointLight(0xff2d55, 7, 14);
    spill.position.set(0, -1.4, 2.4);
    scene.add(spill);

    const spinner = new THREE.Group(); // idle sway
    const pivot = new THREE.Group(); // entrance compose + heartbeat
    spinner.add(pivot);
    scene.add(spinner);

    // ── the heart: symmetric bezier profile, explicit orientation ──
    const shape = new THREE.Shape();
    shape.moveTo(0, -1); // bottom point
    shape.bezierCurveTo(-0.9, -0.25, -1.05, 0.35, -0.6, 0.62); // left side up
    shape.bezierCurveTo(-0.28, 0.82, -0.1, 0.72, 0, 0.42); // left lobe → cleft
    shape.bezierCurveTo(0.1, 0.72, 0.28, 0.82, 0.6, 0.62); // cleft → right lobe
    shape.bezierCurveTo(1.05, 0.35, 0.9, -0.25, 0, -1); // right side down

    const heartGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.07,
      bevelSegments: 3,
      curveSegments: 28,
    });
    heartGeo.center();
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xff2d55,
      emissiveIntensity: 0.22,
    });
    const heart = new THREE.Mesh(heartGeo, heartMat);
    pivot.add(heart);

    // shards — matte white sparks orbiting the heart (deterministic offsets)
    const shardGeo = new THREE.TetrahedronGeometry(0.085);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xf4f1f2,
      roughness: 0.45,
      metalness: 0.1,
    });
    const SHARDS: [number, number, number][] = [
      [-1.5, 0.6, 0.3],
      [1.4, 0.9, -0.4],
      [-1.2, -0.9, -0.2],
      [1.6, -0.4, 0.4],
      [-0.7, 1.4, 0.5],
      [0.9, 1.5, -0.3],
      [0.2, -1.5, 0.2],
    ];
    SHARDS.forEach(([x, y, z], i) => {
      const m = new THREE.Mesh(shardGeo, shardMat);
      m.position.set(x, y, z);
      m.rotation.set(i * 0.7, i * 1.3, 0);
      pivot.add(m);
    });

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

    // fit camera to the heart (aspect-aware, same math as ControllerScene)
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hb = new THREE.Box3().setFromObject(heart);
    const hs = hb.getSize(new THREE.Vector3());
    const dist =
      Math.max(
        hs.y / (2 * Math.tan(vFov / 2)),
        hs.x / (2 * Math.tan(vFov / 2) * (width / height || 1)),
      ) * 1.5; // room for the caption and the heartbeat's peak scale
    camera.position.z = Math.max(dist, 3.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    // ── motion channels (composed, never written from two places) ──
    const cleanup: (() => void)[] = [];
    const pointer = { x: 0, y: 0 };
    const enter = { p: reduce ? 1 : 0 };
    const beat = { s: 1 };
    const rot = { yaw: 0.3, pitch: 0.12 };

    if (!reduce) {
      gsap.to(enter, { p: 1, duration: 1.25, ease: "expo.out", delay: 0.1 });
      gsap.from(renderer.domElement, { opacity: 0, duration: 0.6, ease: "power1.out" });
      // the one authored moment: a slow heartbeat through the beat channel
      const pulse = gsap.to(beat, {
        s: 1.05,
        duration: 0.55,
        yoyo: true,
        repeat: -1,
        repeatDelay: 0.6,
        ease: "sine.inOut",
      });
      cleanup.push(() => pulse.kill());

      const onPointer = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 0.9;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 0.5;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      cleanup.push(() => window.removeEventListener("pointermove", onPointer));
    }

    // ---- loop: sway + heartbeat + parallax, paused off-view/off-tab ----
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

      const e = enter.p;
      pivot.rotation.y = rot.yaw + (1 - e) * -0.9;
      pivot.rotation.x = rot.pitch;
      pivot.scale.setScalar((0.82 + 0.18 * e) * beat.s);
      spinner.rotation.z = Math.sin(t * 0.6) * 0.04;
      spinner.position.y = Math.sin(t * 1.1) * 0.06 + (1 - e) * -0.8;

      camera.position.x += (pointer.x - camera.position.x) * Math.min(dt * 2.4, 1);
      camera.position.y += (-pointer.y - camera.position.y) * Math.min(dt * 2.4, 1);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      // one frame at rest — heartbeat, sway and parallax all stay off
      pivot.rotation.y = rot.yaw;
      pivot.rotation.x = rot.pitch;
      renderer.render(scene, camera);
    }

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
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      gsap.killTweensOf([enter, beat, renderer.domElement]);
      for (const fn of cleanup) fn();
      heartGeo.dispose();
      heartMat.dispose();
      shardGeo.dispose();
      shardMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
