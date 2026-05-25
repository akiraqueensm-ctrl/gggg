/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Part, FaceConfig } from '../types';
import { KAWAII_COLORS, PALETTES, ACCESSORY_TEMPLATES } from '../data/presets';

// Extra cute names helper
const PREFIXES = ['Copito', 'Santi', 'Peluchín', 'Mochi', 'Yogui', 'Boni', 'Kiki', 'Lilo', 'Michi', 'Chibi', 'Nube', 'Pipo', 'Fito', 'Lulú', 'Coco'];
const ANIMALS = ['Bunny', 'Osito', 'Gatito', 'Pandita', 'Pingüino', 'Shiba', 'Zorrito', 'Koala', 'Axolotl', 'Dragón'];
const ADJECTIVES = ['Flexible', 'Saltarín', 'Pachoncito', 'Glotón', 'Risueño', 'Ondulante', 'Mágico', 'Chiquito', 'Travieso', 'Burbuja'];

export interface ProceduralAnimal {
  name: string;
  parts: Part[];
  face: FaceConfig;
  isFlexible: boolean;
  segmentCount: number;
  segmentSpacing: number;
  connectorType: 'ring' | 'ball' | 'flexible';
  wiggleAmplitude: number;
}

export function generateRandomAnimal(): ProceduralAnimal {
  const isFlexible = Math.random() < 0.65; // High chance of flexible jointed structure
  const segmentCount = Math.floor(Math.random() * 5) + 4; // 4 to 8 segments
  const connectorType = (['ring', 'ball', 'flexible'] as const)[Math.floor(Math.random() * 3)];
  const segmentSpacing = 0.28 + Math.random() * 0.12; // 0.28 to 0.40
  const wiggleAmplitude = 0.12 + Math.random() * 0.10;

  // Choose a random palette
  const randomMutedPalette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const baseColor = randomMutedPalette.colors[0];
  const accentColor = randomMutedPalette.colors[1] || KAWAII_COLORS.pinkSoft;
  const secondaryColor = randomMutedPalette.colors[2] || KAWAII_COLORS.cream;
  const spotColor = randomMutedPalette.colors[3] || KAWAII_COLORS.charcoal;

  // Decide animal style
  const styleIdx = Math.floor(Math.random() * 6); // 0: Bunny, 1: Bear, 2: Cat, 3: Panda, 4: Shiba, 5: Dragon/Axolotl
  const presetAnimalName = ANIMALS[styleIdx < ANIMALS.length ? styleIdx : 0];
  
  const randomPrefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const randomAdjective = isFlexible ? 'Articulado' : ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const finalName = `${randomPrefix} el ${presetAnimalName} ${randomAdjective}`;

  // Build standard body parts with chosen colors
  const parts: Part[] = [
    {
      id: 'body',
      name: 'Cuerpo',
      shape: 'sphere',
      color: baseColor,
      position: [0, 0.45, 0],
      scale: [0.85, 0.8, 0.8],
      rotation: [0, 0, 0],
      category: 'body',
      isAccessory: false,
      visible: true,
      roughness: 0.8,
      metalness: 0.1,
    },
    {
      id: 'head',
      name: 'Cabeza',
      shape: 'sphere',
      color: baseColor,
      position: [0, 1.15, 0],
      scale: [0.95, 0.85, 0.85],
      rotation: [0, 0, 0],
      category: 'body',
      isAccessory: false,
      visible: true,
      roughness: 0.8,
      metalness: 0.1,
    },
    // Front limbs (Arms)
    {
      id: 'arm_l',
      name: 'Brazo Izquierdo',
      shape: 'capsule',
      color: isFlexible ? secondaryColor : baseColor,
      position: [-0.48, 0.55, 0.1],
      scale: [0.22, 0.4, 0.22],
      rotation: [0, 0, 35],
      category: 'limbs',
      isAccessory: false,
      visible: true,
      roughness: 0.8,
      metalness: 0.1,
      mirrorId: 'arm_r',
    },
    {
      id: 'arm_r',
      name: 'Brazo Derecho',
      shape: 'capsule',
      color: isFlexible ? secondaryColor : baseColor,
      position: [0.48, 0.55, 0.1],
      scale: [0.22, 0.4, 0.22],
      rotation: [0, 0, -35],
      category: 'limbs',
      isAccessory: false,
      visible: true,
      roughness: 0.8,
      metalness: 0.1,
      mirrorId: 'arm_l',
    },
    // Back legs (will sit nicely depending on spacing)
    {
      id: 'leg_l',
      name: 'Pata Izquierda',
      shape: 'capsule',
      color: isFlexible ? secondaryColor : baseColor,
      position: [-0.28, 0.1, isFlexible ? -0.45 : 0.05],
      scale: [0.25, 0.3, 0.25],
      rotation: [0, 0, 0],
      category: 'limbs',
      isAccessory: false,
      visible: true,
      roughness: 0.8,
      metalness: 0.1,
      mirrorId: 'leg_r',
    },
    {
      id: 'leg_r',
      name: 'Pata Derecha',
      shape: 'capsule',
      color: isFlexible ? secondaryColor : baseColor,
      position: [0.28, 0.1, isFlexible ? -0.45 : 0.05],
      scale: [0.25, 0.3, 0.25],
      rotation: [0, 0, 0],
      category: 'limbs',
      isAccessory: false,
      visible: true,
      roughness: 0.8,
      metalness: 0.1,
      mirrorId: 'leg_l',
    },
    // Snout
    {
      id: 'snout',
      name: 'Hocico',
      shape: 'sphere',
      color: secondaryColor,
      position: [0, 1.05, 0.35],
      scale: [0.28, 0.18, 0.15],
      rotation: [0, 0, 0],
      category: 'face',
      isAccessory: false,
      visible: true,
      roughness: 0.9,
      metalness: 0.0,
    }
  ];

  // Head Ears & Features based on chosen styles
  if (styleIdx === 0) { // Bunny
    parts.push(
      {
        id: 'ear_l',
        name: 'Oreja Izquierda',
        shape: 'capsule',
        color: baseColor,
        position: [-0.25, 1.7, 0.0],
        scale: [0.16, 0.65, 0.14],
        rotation: [0, 0, 15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_r',
      },
      {
        id: 'ear_r',
        name: 'Oreja Derecha',
        shape: 'capsule',
        color: baseColor,
        position: [0.25, 1.7, 0.0],
        scale: [0.16, 0.65, 0.14],
        rotation: [0, 0, -15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_l',
      },
      {
        id: 'ear_inner_l',
        name: 'Interior Oreja Izquierda',
        shape: 'capsule',
        color: accentColor,
        position: [-0.22, 1.7, 0.04],
        scale: [0.1, 0.52, 0.03],
        rotation: [0, 0, 15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_r',
      },
      {
        id: 'ear_inner_r',
        name: 'Interior Oreja Derecha',
        shape: 'capsule',
        color: accentColor,
        position: [0.22, 1.7, 0.04],
        scale: [0.1, 0.52, 0.03],
        rotation: [0, 0, -15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_l',
      },
      {
        id: 'tail',
        name: 'Cola Pompon',
        shape: 'sphere',
        color: baseColor,
        position: [0, 0.35, isFlexible ? -1.5 : -0.45],
        scale: [0.18, 0.18, 0.18],
        rotation: [0, 0, 0],
        category: 'body',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
      }
    );
  } else if (styleIdx === 1) { // Bear
    parts.push(
      {
        id: 'ear_l',
        name: 'Oreja Izquierda',
        shape: 'sphere',
        color: baseColor,
        position: [-0.42, 1.62, 0.0],
        scale: [0.25, 0.25, 0.18],
        rotation: [0, 0, 30],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_r',
      },
      {
        id: 'ear_r',
        name: 'Oreja Derecha',
        shape: 'sphere',
        color: baseColor,
        position: [0.42, 1.62, 0.0],
        scale: [0.25, 0.25, 0.18],
        rotation: [0, 0, -30],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_l',
      },
      {
        id: 'ear_inner_l',
        name: 'Interior Oreja Izquierda',
        shape: 'sphere',
        color: secondaryColor,
        position: [-0.38, 1.62, 0.05],
        scale: [0.14, 0.14, 0.06],
        rotation: [0, 0, 30],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_r',
      },
      {
        id: 'ear_inner_r',
        name: 'Interior Oreja Derecha',
        shape: 'sphere',
        color: secondaryColor,
        position: [0.38, 1.62, 0.05],
        scale: [0.14, 0.14, 0.06],
        rotation: [0, 0, -30],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_l',
      },
      {
        id: 'tail',
        name: 'Cola',
        shape: 'sphere',
        color: baseColor,
        position: [0, 0.35, isFlexible ? -1.5 : -0.42],
        scale: [0.15, 0.15, 0.15],
        rotation: [0, 0, 0],
        category: 'body',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
      }
    );
  } else if (styleIdx === 2) { // Cat
    parts.push(
      {
        id: 'ear_l',
        name: 'Oreja Izquierda',
        shape: 'cone',
        color: baseColor,
        position: [-0.35, 1.6, 0.0],
        scale: [0.22, 0.3, 0.22],
        rotation: [0, 0, 15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_r',
      },
      {
        id: 'ear_r',
        name: 'Oreja Derecha',
        shape: 'cone',
        color: baseColor,
        position: [0.35, 1.6, 0.0],
        scale: [0.22, 0.3, 0.22],
        rotation: [0, 0, -15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_l',
      },
      {
        id: 'ear_inner_l',
        name: 'Interior Oreja Izquierda',
        shape: 'cone',
        color: accentColor,
        position: [-0.32, 1.58, 0.04],
        scale: [0.14, 0.2, 0.1],
        rotation: [0, 0, 15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_r',
      },
      {
        id: 'ear_inner_r',
        name: 'Interior Oreja Derecha',
        shape: 'cone',
        color: accentColor,
        position: [0.32, 1.58, 0.04],
        scale: [0.14, 0.2, 0.1],
        rotation: [0, 0, -15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_l',
      },
      {
        id: 'tail',
        name: 'Cola Larga',
        shape: 'capsule',
        color: baseColor,
        position: [0, 0.55, isFlexible ? -1.5 : -0.45],
        scale: [0.08, 0.45, 0.08],
        rotation: [35, 0, 0],
        category: 'body',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
      }
    );
  } else if (styleIdx === 3) { // Panda / Koala
    parts.push(
      {
        id: 'ear_l',
        name: 'Oreja Izquierda',
        shape: 'sphere',
        color: spotColor,
        position: [-0.42, 1.62, 0.0],
        scale: [0.24, 0.24, 0.16],
        rotation: [0, 0, 30],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_r',
      },
      {
        id: 'ear_r',
        name: 'Oreja Derecha',
        shape: 'sphere',
        color: spotColor,
        position: [0.42, 1.62, 0.0],
        scale: [0.24, 0.24, 0.16],
        rotation: [0, 0, -30],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_l',
      },
      {
        id: 'eye_patch_l',
        name: 'Ojera Izquierda',
        shape: 'sphere',
        color: spotColor,
        position: [-0.22, 1.15, 0.32],
        scale: [0.15, 0.22, 0.04],
        rotation: [0, 0, -15],
        category: 'face',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'eye_patch_r',
      },
      {
        id: 'eye_patch_r',
        name: 'Ojera Derecha',
        shape: 'sphere',
        color: spotColor,
        position: [0.22, 1.15, 0.32],
        scale: [0.15, 0.22, 0.04],
        rotation: [0, 0, 15],
        category: 'face',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'eye_patch_l',
      },
      {
        id: 'tail',
        name: 'Cola Panda',
        shape: 'sphere',
        color: spotColor,
        position: [0, 0.35, isFlexible ? -1.5 : -0.42],
        scale: [0.15, 0.15, 0.15],
        rotation: [0, 0, 0],
        category: 'body',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
      }
    );
  } else if (styleIdx === 4) { // Shiba / Fox
    parts.push(
      {
        id: 'ear_l',
        name: 'Oreja Izquierda',
        shape: 'cone',
        color: baseColor,
        position: [-0.32, 1.6, 0.0],
        scale: [0.2, 0.28, 0.2],
        rotation: [5, 0, 12],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_r',
      },
      {
        id: 'ear_r',
        name: 'Oreja Derecha',
        shape: 'cone',
        color: baseColor,
        position: [0.32, 1.6, 0.0],
        scale: [0.2, 0.28, 0.2],
        rotation: [5, 0, -12],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
        mirrorId: 'ear_l',
      },
      {
        id: 'ear_inner_l',
        name: 'Interior Oreja Izquierda',
        shape: 'cone',
        color: secondaryColor,
        position: [-0.29, 1.58, 0.05],
        scale: [0.12, 0.2, 0.08],
        rotation: [5, 0, 12],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_r',
      },
      {
        id: 'ear_inner_r',
        name: 'Interior Oreja Derecha',
        shape: 'cone',
        color: secondaryColor,
        position: [0.29, 1.58, 0.05],
        scale: [0.12, 0.2, 0.08],
        rotation: [5, 0, -12],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'ear_inner_l',
      },
      {
        id: 'tail',
        name: 'Cola Shiba',
        shape: 'torus',
        color: baseColor,
        position: [0, 0.52, isFlexible ? -1.5 : -0.42],
        scale: [0.18, 0.18, 0.08],
        rotation: [25, 45, 0],
        category: 'body',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
      }
    );
  } else { // Dragon / Axolotl (Fantasy elements)
    parts.push(
      {
        id: 'ear_l',
        name: 'Cuerno Izquierdo',
        shape: 'cone',
        color: accentColor,
        position: [-0.3, 1.65, 0.0],
        scale: [0.12, 0.35, 0.12],
        rotation: [20, 0, 15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.3,
        metalness: 0.6,
        mirrorId: 'ear_r',
      },
      {
        id: 'ear_r',
        name: 'Cuerno Derecho',
        shape: 'cone',
        color: accentColor,
        position: [0.3, 1.65, 0.0],
        scale: [0.12, 0.35, 0.12],
        rotation: [20, 0, -15],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.3,
        metalness: 0.6,
        mirrorId: 'ear_l',
      },
      {
        id: 'gills_l',
        name: 'Branquia Izquierda',
        shape: 'capsule',
        color: secondaryColor,
        position: [-0.45, 1.05, 0.0],
        scale: [0.1, 0.28, 0.22],
        rotation: [0, 0, 45],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'gills_r',
      },
      {
        id: 'gills_r',
        name: 'Branquia Derecha',
        shape: 'capsule',
        color: secondaryColor,
        position: [0.45, 1.05, 0.0],
        scale: [0.1, 0.28, 0.22],
        rotation: [0, 0, -45],
        category: 'head',
        isAccessory: false,
        visible: true,
        roughness: 0.9,
        metalness: 0.0,
        mirrorId: 'gills_l',
      },
      {
        id: 'tail',
        name: 'Cola de Dragón',
        shape: 'cone',
        color: baseColor,
        position: [0, 0.35, isFlexible ? -1.6 : -0.48],
        scale: [0.18, 0.45, 0.18],
        rotation: [-85, 0, 0], // pointing back!
        category: 'body',
        isAccessory: false,
        visible: true,
        roughness: 0.8,
        metalness: 0.1,
      }
    );
  }

  // 15% chance to add a random decorative accessory
  if (Math.random() < 0.75) {
    const accTemplate = ACCESSORY_TEMPLATES[Math.floor(Math.random() * ACCESSORY_TEMPLATES.length)];
    const accId = `accessory_${Date.now()}`;
    // Fit accessory beautifully
    parts.push({
      ...accTemplate,
      id: accId,
      color: Math.random() < 0.5 ? spotColor : randomMutedPalette.colors[2] || '#FFD700',
      isAccessory: true,
      visible: true,
    } as Part);
  }

  // Generate happy kawaii faces
  const eyesIdOpt = ['classic', 'anime', 'happy', 'sleepy', 'blinking'] as const;
  const mouthIdOpt = ['dot', 'wiggle', 'smile', 'open', 'sad'] as const;

  const face: FaceConfig = {
    eyeStyle: eyesIdOpt[Math.floor(Math.random() * eyesIdOpt.length)],
    mouthStyle: mouthIdOpt[Math.floor(Math.random() * (mouthIdOpt.length - 1))], // avoid sad mouth mostly
    hasCheeks: Math.random() < 0.9,
    cheekColor: KAWAII_COLORS.pinkSoft,
    eyeColor: KAWAII_COLORS.charcoal,
    mouthColor: KAWAII_COLORS.charcoal,
    eyeSpacing: 0.85 + Math.random() * 0.35, // 0.85 to 1.2
    eyeHeight: 0.9 + Math.random() * 0.25, // 0.9 to 1.15
  };

  return {
    name: finalName,
    parts,
    face,
    isFlexible,
    segmentCount,
    segmentSpacing,
    connectorType,
    wiggleAmplitude
  };
}
