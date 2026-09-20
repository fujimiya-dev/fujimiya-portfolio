"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParallaxRig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const targetRotY = state.pointer.x * 0.05;
    const targetRotX = -state.pointer.y * 0.03;
    g.rotation.y += (targetRotY - g.rotation.y) * 0.02;
    g.rotation.x += (targetRotX - g.rotation.x) * 0.02;
  });

  return <group ref={group}>{children}</group>;
}
