/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PartShape = 'sphere' | 'box' | 'capsule' | 'cylinder' | 'cone' | 'torus';

export interface Part {
  id: string;
  name: string;
  shape: PartShape;
  color: string;
  position: [number, number, number]; // [x, y, z]
  scale: [number, number, number];    // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] in degrees
  category: 'body' | 'head' | 'face' | 'limbs' | 'accessories';
  isAccessory: boolean;
  visible: boolean;
  roughness: number;  // 0 to 1
  metalness: number;  // 0 to 1
  mirrorId?: string;  // ID of the paired symmetrical part, if any
}

export type EyeExpression = 'classic' | 'happy' | 'sleepy' | 'blinking' | 'anime';
export type MouthExpression = 'dot' | 'wiggle' | 'smile' | 'open' | 'sad';

export interface FaceConfig {
  eyeStyle: EyeExpression;
  mouthStyle: MouthExpression;
  hasCheeks: boolean;
  cheekColor: string;
  eyeColor: string;
  mouthColor: string;
  eyeSpacing: number; // multiplier for eye distance
  eyeHeight: number;  // multiplier for eye height relative to face base
}

export interface AnimalPreset {
  id: string;
  name: string;
  icon: string; // emoji or lucide icon name
  description: string;
  parts: Part[];
  face: FaceConfig;
}

export interface MaterialPreset {
  name: string;
  roughness: number;
  metalness: number;
}
