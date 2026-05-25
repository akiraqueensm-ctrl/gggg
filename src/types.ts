/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PartShape = 'sphere' | 'box' | 'capsule' | 'cylinder' | 'cone' | 'torus' | 'spiky';

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
  initialHeadRelativePosition?: [number, number, number]; // Offset relative to default head center
  sculpt?: {
    pinch?: number;     // nose / snout stretch (-1 to 1)
    taper?: number;     // narrowing from rear to front (-1 to 1)
    flatten?: number;   // squash or boxy flattening (-1 to 1)
    ridges?: number;    // segment waves / layer ridges (0 to 1)
    noise?: number;     // hand-sculpted organic clay bumps (0 to 1)
  };
  earBend?: number;     // -1 to 1: Bends/curves the structure (for organic ears)
  earFold?: number;     // -1 to 1: Extra inward/outward cup folding
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
  eyeSize?: number;     // multiplier for eyeball dimensions (0.4 to 2.5)
  eyeRotation?: number; // tilt angle of eyes in degrees (-45 to 45)
  eyeDepth?: number;    // depth forward-offset multiplier (0.5 to 1.8)
  mouthSize?: number;   // multiplier for mouth width/dimensions (0.4 to 2.5)
  mouthHeight?: number; // vertical height modifier relative to face base (0.2 to 2.5)
  mouthDepth?: number;  // depth forward-offset multiplier for mouth (0.5 to 1.8)
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
