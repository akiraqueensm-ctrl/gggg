/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Part, FaceConfig } from '../types';
import { exportToObjMtl } from '../utils/exporter';

interface ThreeCanvasProps {
  parts: Part[];
  face: FaceConfig;
  selectedPartId: string | null;
  onSelectPart: (id: string | null) => void;
  showPedestal: boolean;
  showGrid: boolean;
  shadowColor: string;
  isFlexible?: boolean;
  segmentCount?: number;
  segmentSpacing?: number;
  connectorType?: 'ring' | 'ball' | 'flexible';
  wiggleSpeed?: number;
  wiggleAmplitude?: number;
  fdmEnabled?: boolean;
  fdmDensity?: number;
  filamentStyle?: 'matte' | 'silk_standard' | 'silk_dual' | 'silk_rainbow';
}

export interface ThreeCanvasHandle {
  exportModel: (animalName: string) => { obj: string; mtl: string } | null;
  resetCamera: () => void;
}

export const ThreeCanvas = forwardRef<ThreeCanvasHandle, ThreeCanvasProps>(({
  parts,
  face,
  selectedPartId,
  onSelectPart,
  showPedestal = true,
  showGrid = true,
  isFlexible = false,
  segmentCount = 5,
  segmentSpacing = 0.32,
  connectorType = 'ring',
  wiggleSpeed = 2.0,
  wiggleAmplitude = 0.15,
  fdmEnabled = false,
  fdmDensity = 150,
  filamentStyle = 'silk_standard',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Keep refs of Three.js objects for manipulation inside callbacks and effects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animalGroupRef = useRef<THREE.Group | null>(null);
  const outlineMeshRef = useRef<THREE.LineSegments | null>(null);
  const pedestalRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const bounceLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Store flexible configurations in a Ref to read in the render loop without lagging
  const wiggleParamsRef = useRef({
    isFlexible,
    segmentCount,
    segmentSpacing,
    connectorType,
    wiggleSpeed,
    wiggleAmplitude,
  });

  useEffect(() => {
    wiggleParamsRef.current = {
      isFlexible,
      segmentCount,
      segmentSpacing,
      connectorType,
      wiggleSpeed,
      wiggleAmplitude,
    };
  }, [isFlexible, segmentCount, segmentSpacing, connectorType, wiggleSpeed, wiggleAmplitude]);

  // Expose export and reset capabilities to parent component
  useImperativeHandle(ref, () => ({
    exportModel: (animalName: string) => {
      if (animalGroupRef.current) {
        // Deselect or temporarily hide visual guides before export
        if (outlineMeshRef.current) outlineMeshRef.current.visible = false;
        
        // Export
        const result = exportToObjMtl(animalGroupRef.current, animalName);
        
        // Re-show visual guides
        if (outlineMeshRef.current && selectedPartId) outlineMeshRef.current.visible = true;
        
        return result;
      }
      return null;
    },
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 1.8, 3.5);
        controlsRef.current.target.set(0, 0.9, 0);
        controlsRef.current.update();
      }
    }
  }));

  // Initial Setup: Scene, Light, Controls
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background to let CSS theme shine through
    sceneRef.current = scene;

    // CAMERA
    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    // Fallback if dimensions are initially collapsed (common in iframe/sandboxed environments)
    if (width <= 0) width = 640;
    if (height <= 0) height = 480;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 20);
    camera.position.set(0, 1.8, 3.5);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go too far under ground
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.target.set(0, 0.9, 0);
    controlsRef.current = controls;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight('#ffffff', 1.0);
    mainLight.position.set(2, 4.5, 3.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 10;
    const d = 1.8;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    // Warm bounce light from below/opposite
    const bounceLight = new THREE.DirectionalLight('#fff0e0', 0.35);
    bounceLight.position.set(-2, 0.5, -2);
    scene.add(bounceLight);
    bounceLightRef.current = bounceLight;

    // Soft rim light from back-top
    const rimLight = new THREE.DirectionalLight('#e0f0ff', 0.3);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // PEDESTAL (Soft circular stage)
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.15, 64);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9,
      metalness: 0.05,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.075;
    pedestal.receiveShadow = true;
    scene.add(pedestal);
    pedestalRef.current = pedestal;

    // GRID
    const gridHelper = new THREE.GridHelper(5, 20, '#d1d5db', '#e5e7eb');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // ANIMAL GROUP
    const animalGroup = new THREE.Group();
    scene.add(animalGroup);
    animalGroupRef.current = animalGroup;

    // RAYCASTING FOR SELECTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // Query meshes inside animalGroup
      const intersects = raycaster.intersectObjects(animalGroup.children, true);

      if (intersects.length > 0) {
        // Find first parent with userData partId
        let object: THREE.Object3D | null = intersects[0].object;
        let selectedId: string | null = null;
        
        while (object && object !== animalGroup) {
          if (object.userData && object.userData.partId) {
            selectedId = object.userData.partId;
            break;
          }
          object = object.parent;
        }

        if (selectedId) {
          onSelectPart(selectedId);
          return;
        }
      }
      
      const intersectsPedestal = raycaster.intersectObject(pedestal);
      if (intersectsPedestal.length > 0) {
        onSelectPart(null);
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // ANIMATION LOOP
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (animalGroup) {
        const elapsedTime = clock.getElapsedTime();
        // Gentle static bobbing overall
        animalGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.012;

        const currentParams = wiggleParamsRef.current;
        if (currentParams.isFlexible) {
          const amp = currentParams.wiggleAmplitude;
          const speed = currentParams.wiggleSpeed;
          animalGroup.children.forEach((child) => {
            // Check if it is a segment to apply elegant snake curve wiggle
            if (child.name && child.name.startsWith('Segment_')) {
              const partsName = child.name.split('_');
              const idx = parseInt(partsName[1], 10);
              if (idx > 0) {
                // Wave/serpentine lateral angle
                const waveAngle = Math.sin(elapsedTime * speed * 3.0 - idx * 0.7) * (amp * 0.65);
                child.rotation.y = waveAngle;
                
                // Keep connected by offsetting along elegant wiggle arc path
                child.position.x = child.userData.baseX + Math.sin(elapsedTime * speed * 3.0 - idx * 0.7) * (amp * 0.28) * idx;
              }
            }
          });
        } else {
          // Reset segment offsets
          animalGroup.children.forEach((child) => {
            if (child.name && child.name.startsWith('Segment_')) {
              child.rotation.y = 0;
              child.position.x = child.userData.baseX || 0;
            }
          });
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // RESIZE LISTENER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      let { width: newWidth, height: newHeight } = entries[0].contentRect;
      
      if (newWidth <= 0 || newHeight <= 0) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          newWidth = rect.width;
          newHeight = rect.height;
        } else {
          return; // Ignore temporary transitions
        }
      }
      
      if (cameraRef.current) {
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
      }
      if (rendererRef.current) {
        rendererRef.current.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(containerRef.current);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', handleCanvasClick);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []); // Run once on mount

  // Platform & Grid Visibility Toggles
  useEffect(() => {
    if (pedestalRef.current) pedestalRef.current.visible = showPedestal;
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showPedestal, showGrid]);

  // Dynamic Filament Style light shifts (Chameleon co-extrusion PLA highlight)
  useEffect(() => {
    if (bounceLightRef.current && rimLightRef.current) {
      if (filamentStyle === 'silk_dual') {
        // Shimmering Red-Blue/Pink-Cyan dual-tone reflections
        bounceLightRef.current.color.set('#ff00bb');
        bounceLightRef.current.intensity = 1.35;
        rimLightRef.current.color.set('#00e8ff');
        rimLightRef.current.intensity = 1.25;
      } else {
        // Normal warm/cool studio bounce lights
        bounceLightRef.current.color.set('#fff0e0');
        bounceLightRef.current.intensity = 0.35;
        rimLightRef.current.color.set('#e0f0ff');
        rimLightRef.current.intensity = 0.3;
      }
    }
  }, [filamentStyle]);

  // Update Scene when Parts or Face settings change
  useEffect(() => {
    const scene = sceneRef.current;
    const animalGroup = animalGroupRef.current;
    if (!scene || !animalGroup) return;

    // Clear previous meshes
    while (animalGroup.children.length > 0) {
      const child = animalGroup.children[0];
      child.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      });
      animalGroup.remove(child);
    }

    // FDM 3D printing layer lines bump map
    const generateFdmTexture = (enabled: boolean, density: number) => {
      if (!enabled) return null;
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 16, size);
        for (let y = 0; y < size; y++) {
          const val = Math.floor((Math.sin((y / size) * Math.PI * 2 * 16) * 0.5 + 0.5) * 78 + 89);
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          ctx.fillRect(0, y, 16, 1);
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, density * 0.5);
      return tex;
    };

    // Vertical rainbow color gradient
    const generateRainbowTexture = (style: string) => {
      if (style !== 'silk_rainbow') return null;
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0.0, '#ff3030'); // Red
        grad.addColorStop(0.2, '#ff9000'); // Orange
        grad.addColorStop(0.4, '#4cd964'); // Green
        grad.addColorStop(0.6, '#00e5ff'); // Cyan
        grad.addColorStop(0.8, '#5856d6'); // Royal Blue
        grad.addColorStop(1.0, '#ff2d55'); // Magenta/Pink
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, size);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 4);
      return tex;
    };

    const fdmTex = generateFdmTexture(fdmEnabled, fdmDensity);
    const rainbowTex = generateRainbowTexture(filamentStyle);

    // Retrieve customized materials to replicate amazing FDM PLA/matte/silk/chameleon outcomes
    const getMaterialForPart = (partColor: string, partRoughness: number, partMetalness: number) => {
      let r = partRoughness;
      let m = partMetalness;

      if (filamentStyle === 'matte') {
        r = 0.95;
        m = 0.05;
      } else if (filamentStyle === 'silk_standard') {
        r = 0.22;
        m = 0.65;
      } else if (filamentStyle === 'silk_dual') {
        // High shined surface reflecting chameleon colors
        r = 0.16;
        m = 0.85;
      } else if (filamentStyle === 'silk_rainbow') {
        r = 0.22;
        m = 0.55;
      }

      const mat = new THREE.MeshStandardMaterial({
        color: filamentStyle === 'silk_rainbow' ? '#ffffff' : new THREE.Color(partColor),
        roughness: r,
        metalness: m,
      });

      if (fdmTex) {
        mat.bumpMap = fdmTex;
        mat.bumpScale = 0.0075;
      }
      if (rainbowTex) {
        mat.map = rainbowTex;
      }

      return mat;
    };

    // Geometry Factory
    const getGeometry = (shape: string) => {
      let geo: THREE.BufferGeometry;
      switch (shape) {
        case 'box':
          geo = new THREE.BoxGeometry(1, 1, 1);
          break;
        case 'capsule':
          geo = new THREE.CapsuleGeometry(0.5, 0.6, 16, 24);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(0.48, 0.48, 1, 32);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(0.5, 1, 32);
          geo.translate(0, 0.5, 0); // offset cone center so pivot is at base
          break;
        case 'torus':
          geo = new THREE.TorusGeometry(0.4, 0.12, 12, 48);
          break;
        case 'sphere':
        default:
          geo = new THREE.SphereGeometry(0.5, 32, 28);
          break;
      }
      return geo;
    };

    // Apply custom sculpt / sculpture deformations on vertex coordinates directly
    const applySculptDeformation = (geometry: THREE.BufferGeometry, part: Part) => {
      if (!part.sculpt) return;
      const { pinch = 0, taper = 0, flatten = 0, ridges = 0, noise = 0 } = part.sculpt;
      if (pinch === 0 && taper === 0 && flatten === 0 && ridges === 0 && noise === 0) return;

      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      if (!posAttr) return;

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox || new THREE.Box3();
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      for (let i = 0; i < posAttr.count; i++) {
        let x = posAttr.getX(i);
        let y = posAttr.getY(i);
        let z = posAttr.getZ(i);

        const rx = size.x > 0 ? (x - center.x) / size.x : 0;
        const ry = size.y > 0 ? (y - center.y) / size.y : 0;
        const rz = size.z > 0 ? (z - center.z) / size.z : 0;

        // 1. PINCH (Pointy snout / flattened muzzle)
        if (pinch !== 0) {
          const forwardFactor = rz + 0.5; // ranges 0 (rear) to 1 (front)
          if (pinch > 0) {
            z += Math.pow(forwardFactor, 2) * pinch * size.z * 0.45;
            const pointyScale = Math.max(0.12, 1.0 - Math.pow(forwardFactor, 1.5) * pinch * 0.65);
            x *= pointyScale;
            y *= pointyScale;
          } else {
            z += Math.pow(forwardFactor, 1.5) * pinch * size.z * 0.35;
          }
        }

        // 2. TAPER (Gradual narrowing)
        if (taper !== 0) {
          const tFactor = 1.0 - (rz + 0.5) * taper * 0.72;
          const safeTFactor = Math.max(0.1, tFactor);
          x *= safeTFactor;
          y *= safeTFactor;
        }

        // 3. FLATTEN (Bottom or Boxy)
        if (flatten !== 0) {
          if (flatten > 0) {
            if (ry < 0) {
              const flatFactor = 1.0 - Math.abs(ry) * flatten * 0.82;
              y *= Math.max(0.1, flatFactor);
            }
          } else {
            const squashY = 1.0 - Math.abs(ry) * Math.abs(flatten) * 0.45;
            const squashX = 1.0 - Math.abs(rx) * Math.abs(flatten) * 0.45;
            y *= Math.max(0.15, squashY);
            x *= Math.max(0.15, squashX);
          }
        }

        // 4. RIDGES (Stratified rings)
        if (ridges > 0) {
          const freq = 22.0;
          const wave = 1.0 + Math.sin(rz * freq) * ridges * 0.12;
          x *= wave;
          y *= wave;
        }

        // 5. NOISE (Random organic hand-sculpted bumps)
        if (noise > 0) {
          const freqX = rx * 14.0;
          const freqY = ry * 14.0;
          const freqZ = rz * 14.0;
          const bump = (Math.sin(freqX * 3.1) * Math.cos(freqY * 2.8) +
                        Math.sin(freqZ * 4.2) * Math.cos(freqX * 2.1) +
                        Math.sin(freqY * 3.4) * Math.cos(freqZ * 2.4)) / 3.0;
          
          const dirX = x - center.x;
          const dirY = y - center.y;
          const dirZ = z - center.z;
          const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1.0;
          
          const displace = bump * noise * size.x * 0.12;
          x += (dirX / len) * displace;
          y += (dirY / len) * displace;
          z += (dirZ / len) * displace;
        }

        posAttr.setXYZ(i, x, y, z);
      }

      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    };

    // Procedural spikes generator for 'spiky' shapes
    const addSpikesIfSpiky = (mesh: THREE.Mesh, shape: string, material: THREE.Material) => {
      if (shape !== 'spiky') return;
      
      const spikeGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
      spikeGeo.rotateX(Math.PI / 2); // align pointing out
      
      const spikePositions = [
        { pos: [0, 0.45, -0.2], rot: [-Math.PI / 4, 0, 0] },
        { pos: [-0.35, 0.3, -0.1], rot: [-Math.PI / 6, -Math.PI / 4, 0] },
        { pos: [0.35, 0.3, -0.1], rot: [-Math.PI / 6, Math.PI / 4, 0] },
        { pos: [-0.4, 0.1, -0.2], rot: [0, -Math.PI / 3, 0] },
        { pos: [0.4, 0.1, -0.2], rot: [0, Math.PI / 3, 0] },
        { pos: [0, 0.25, -0.4], rot: [-Math.PI / 3, 0, 0] },
      ];

      spikePositions.forEach((sp) => {
        const spikeMesh = new THREE.Mesh(spikeGeo, material);
        spikeMesh.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
        spikeMesh.rotation.set(sp.rot[0], sp.rot[1], sp.rot[2]);
        spikeMesh.castShadow = true;
        spikeMesh.receiveShadow = true;
        mesh.add(spikeMesh);
      });
    };

    // Store references of body parts to organize layout parenting easily
    const bodyPart = parts.find(p => p.id === 'body');
    const headPart = parts.find(p => p.id === 'head');

    // If structure is flexible, Segment 0 holds the main position, and we parent appendages elegantly!
    const segmentMeshes: THREE.Mesh[] = [];

    // Render configuration Parts
    parts.forEach((part) => {
      if (!part.visible) return;

      // EXCEPTION: If flexible and part is body, we generate continuous segments connected by links
      if (isFlexible && part.id === 'body') {
        const material = getMaterialForPart(part.color, part.roughness ?? 0.8, part.metalness ?? 0.15);

        for (let idx = 0; idx < segmentCount; idx++) {
          // Slowly taper segments down
          const t = segmentCount > 1 ? idx / (segmentCount - 1) : 0;
          const scaleFactor = Math.max(0.24, 1.0 - t * 0.62);

          const segGeo = getGeometry(part.shape);
          applySculptDeformation(segGeo, part);
          const segMesh = new THREE.Mesh(segGeo, material);
          
          segMesh.name = `Segment_${idx}`;
          addSpikesIfSpiky(segMesh, part.shape, material);
          // Make it selectable as the primary body part
          segMesh.userData = { 
            partId: part.id, 
            isSegment: true, 
            segmentIndex: idx,
            baseX: part.position[0],
            baseY: part.position[1],
            baseZ: part.position[2] - idx * segmentSpacing
          };

          segMesh.position.set(
            part.position[0],
            part.position[1],
            part.position[2] - idx * segmentSpacing
          );

          segMesh.scale.set(
            part.scale[0] * scaleFactor,
            part.scale[1] * scaleFactor,
            part.scale[2] * scaleFactor
          );

          // Apply slight tilt downwards towards the tail
          segMesh.rotation.set(
            THREE.MathUtils.degToRad(part.rotation[0] + idx * 1.5),
            THREE.MathUtils.degToRad(part.rotation[1]),
            THREE.MathUtils.degToRad(part.rotation[2])
          );

          segMesh.castShadow = true;
          segMesh.receiveShadow = true;

          // Render interlocking loop joint connectors
          if (idx < segmentCount - 1) {
            const nextT = (idx + 1) / (segmentCount - 1);
            const nextScaleFactor = Math.max(0.24, 1.0 - nextT * 0.62);
            
            // Connective link color: gold or shiny metal for standard feedback
            const linkColor = '#ffd300';
            const linkMaterial = new THREE.MeshStandardMaterial({
              color: new THREE.Color(linkColor),
              metalness: 0.9,
              roughness: 0.1,
            });

            const linkRadius = segmentSpacing * 0.22;
            const linkThickness = segmentSpacing * 0.045;

            if (connectorType === 'ring') {
              // Torus A: Vertical ring attached to segment idx
              const torusAGeo = new THREE.TorusGeometry(linkRadius, linkThickness, 12, 24);
              const torusAMesh = new THREE.Mesh(torusAGeo, linkMaterial);
              torusAMesh.name = `JointRingA_${idx}`;
              torusAMesh.position.set(0, 0, -segmentSpacing * 0.35);
              torusAMesh.scale.set(1.1, 1.1, 1.1);
              segMesh.add(torusAMesh);

              // Torus B: Horizontal ring (offset to overlap and interlock vertically)
              const torusBGeo = new THREE.TorusGeometry(linkRadius * 1.05, linkThickness, 12, 24);
              const torusBMesh = new THREE.Mesh(torusBGeo, linkMaterial);
              torusBMesh.name = `JointRingB_${idx}`;
              torusBMesh.position.set(0, 0, -segmentSpacing * 0.65);
              torusBMesh.rotation.set(Math.PI / 2, 0, 0); // rotated to lock with Ring A!
              segMesh.add(torusBMesh);
            } 
            else if (connectorType === 'ball') {
              // Standard socket ball joint
              const ballGeo = new THREE.SphereGeometry(linkRadius * 1.3, 16, 16);
              const ballMesh = new THREE.Mesh(ballGeo, linkMaterial);
              ballMesh.name = `JointBall_${idx}`;
              ballMesh.position.set(0, 0, -segmentSpacing * 0.5);
              segMesh.add(ballMesh);
            } 
            else if (connectorType === 'flexible') {
              // A ribbed accordion bellow link
              const flexibleGeo = new THREE.CylinderGeometry(linkRadius * 1.1, linkRadius * 1.1, segmentSpacing * 0.45, 12);
              const flexibleMesh = new THREE.Mesh(flexibleGeo, linkMaterial);
              flexibleMesh.name = `JointBellow_${idx}`;
              flexibleMesh.position.set(0, 0, -segmentSpacing * 0.5);
              flexibleMesh.rotation.set(Math.PI / 2, 0, 0); // turn horizontal
              segMesh.add(flexibleMesh);
            }
          }

          animalGroup.add(segMesh);
          segmentMeshes.push(segMesh);
        }
        return; // Finished body segment loop
      }

      // EXCEPTION: reposition limbs & tails to correct parents if flexible structure is active
      const geometry = getGeometry(part.shape);
      applySculptDeformation(geometry, part);
      const material = getMaterialForPart(part.color, part.roughness ?? 0.8, part.metalness ?? 0.15);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = part.name;
      mesh.userData = { partId: part.id };

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addSpikesIfSpiky(mesh, part.shape, material);

      if (isFlexible && segmentMeshes.length > 0) {
        const bodyY = bodyPart?.position[1] ?? 0.45;
        const bodyScaleVec = bodyPart?.scale ?? [1, 1, 1];

        if (part.id === 'head') {
          // Attached to Segment 0 (front anchor)
          mesh.position.set(part.position[0], part.position[1], part.position[2]);
          mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
          mesh.rotation.set(
            THREE.MathUtils.degToRad(part.rotation[0]),
            THREE.MathUtils.degToRad(part.rotation[1]),
            THREE.MathUtils.degToRad(part.rotation[2])
          );
          animalGroup.add(mesh);
        }
        else if (part.id.includes('tail')) {
          // Tail is dynamically attached as a child of the VERY LAST Segment to wiggle natively!
          const lastIdx = segmentCount - 1;
          const lastSegMesh = segmentMeshes[lastIdx];
          
          // Calculate relative position to Last Segment's center
          // Last segment is located at [0, bodyY, bodyZ - lastIdx * segmentSpacing]
          const targetZOffset = -(part.scale[2] * 0.35 + segmentSpacing * 0.28);
          mesh.position.set(0, 0, targetZOffset);
          
          // Tail scale is nested to last segment scale factor
          const lastScaleFactor = Math.max(0.24, 1.0 - (lastIdx / (segmentCount - 1)) * 0.62);
          mesh.scale.set(
            part.scale[0] / (bodyScaleVec[0] * lastScaleFactor),
            part.scale[1] / (bodyScaleVec[1] * lastScaleFactor),
            part.scale[2] / (bodyScaleVec[2] * lastScaleFactor)
          );

          mesh.rotation.set(
            THREE.MathUtils.degToRad(part.rotation[0]),
            THREE.MathUtils.degToRad(part.rotation[1]),
            THREE.MathUtils.degToRad(part.rotation[2])
          );

          lastSegMesh.add(mesh);
        }
        else if (part.id === 'leg_l' || part.id === 'leg_r') {
          // Back legs attach to segment S (towards the back)
          const attachmentIdx = Math.max(1, segmentCount - 2);
          const parentSegMesh = segmentMeshes[attachmentIdx];
          
          const sideFactor = part.id === 'leg_l' ? -1 : 1;
          const scaleFactorAtAttachment = Math.max(0.24, 1.0 - (attachmentIdx / (segmentCount - 1)) * 0.62);

          // Local coordinate offsets
          mesh.position.set(
            part.position[0],
            -0.3, // keep on ground relative to body segment center
            0
          );

          mesh.scale.set(
            part.scale[0] / scaleFactorAtAttachment,
            part.scale[1] / scaleFactorAtAttachment,
            part.scale[2] / scaleFactorAtAttachment
          );

          mesh.rotation.set(
            THREE.MathUtils.degToRad(part.rotation[0]),
            THREE.MathUtils.degToRad(part.rotation[1]),
            THREE.MathUtils.degToRad(part.rotation[2])
          );

          parentSegMesh.add(mesh);
        }
        else if (part.id === 'arm_l' || part.id === 'arm_r') {
          // Front legs attach as children of Segment 0
          const seg0Mesh = segmentMeshes[0];
          mesh.position.set(part.position[0], 0, 0.1);
          mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
          mesh.rotation.set(
            THREE.MathUtils.degToRad(part.rotation[0]),
            THREE.MathUtils.degToRad(part.rotation[1]),
            THREE.MathUtils.degToRad(part.rotation[2])
          );
          seg0Mesh.add(mesh);
        }
        else {
          // General accessory or fangs/horns
          mesh.position.set(part.position[0], part.position[1], part.position[2]);
          mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
          mesh.rotation.set(
            THREE.MathUtils.degToRad(part.rotation[0]),
            THREE.MathUtils.degToRad(part.rotation[1]),
            THREE.MathUtils.degToRad(part.rotation[2])
          );
          animalGroup.add(mesh);
        }
      } else {
        // Standard non-flexible model loading
        mesh.position.set(part.position[0], part.position[1], part.position[2]);
        mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
        mesh.rotation.set(
          THREE.MathUtils.degToRad(part.rotation[0]),
          THREE.MathUtils.degToRad(part.rotation[1]),
          THREE.MathUtils.degToRad(part.rotation[2])
        );
        animalGroup.add(mesh);
      }
    });

    // RENDER FACE DETAILS INSIDE HEAD MESH CONTAINER
    if (headPart && headPart.visible) {
      const faceGroup = new THREE.Group();
      faceGroup.name = 'FaceFeatures';
      
      faceGroup.position.set(headPart.position[0], headPart.position[1], headPart.position[2]);
      faceGroup.rotation.set(
        THREE.MathUtils.degToRad(headPart.rotation[0]),
        THREE.MathUtils.degToRad(headPart.rotation[1]),
        THREE.MathUtils.degToRad(headPart.rotation[2])
      );
      faceGroup.scale.set(headPart.scale[0], headPart.scale[1], headPart.scale[2]);

      // Eye Material
      const eyeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(face.eyeColor),
        roughness: 0.1,
        metalness: 0.9,
      });

      // Pure white glint reflecting sparkle
      const shineMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.1,
        metalness: 0.0,
      });

      const cheekMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(face.cheekColor),
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.7,
      });

      const mouthMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(face.mouthColor),
        roughness: 0.8,
        metalness: 0.1,
      });

      const eyeDistanceX = 0.22 * face.eyeSpacing;
      const eyeHeightY = 0.08 * face.eyeHeight;
      const faceZOffset = 0.44;

      const createEyeball = (isLeft: boolean) => {
        const sideMult = isLeft ? -1 : 1;
        const eyeGroup = new THREE.Group();
        eyeGroup.name = isLeft ? 'LeftEye' : 'RightEye';
        eyeGroup.position.set(eyeDistanceX * sideMult, eyeHeightY, faceZOffset - 0.02);

        if (face.eyeStyle === 'classic' || face.eyeStyle === 'anime') {
          const size = face.eyeStyle === 'anime' ? 0.09 : 0.065;
          const eyeGeo = new THREE.SphereGeometry(size, 16, 16);
          const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
          eyeMesh.scale.set(1, face.eyeStyle === 'anime' ? 1.3 : 1, 0.75);
          eyeGroup.add(eyeMesh);

          const shine1 = new THREE.Mesh(new THREE.SphereGeometry(size * 0.35, 12, 12), shineMat);
          shine1.position.set(size * 0.35, size * 0.35, size * 0.65);
          eyeGroup.add(shine1);

          if (face.eyeStyle === 'anime') {
            const shine2 = new THREE.Mesh(new THREE.SphereGeometry(size * 0.2, 12, 12), shineMat);
            shine2.position.set(-size * 0.25, -size * 0.3, size * 0.65);
            eyeGroup.add(shine2);
          }
        } 
        else if (face.eyeStyle === 'happy') {
          const arcGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 24, Math.PI);
          const arcMesh = new THREE.Mesh(arcGeo, eyeMat);
          arcMesh.rotation.set(0, 0, Math.PI);
          eyeGroup.add(arcMesh);
        } 
        else if (face.eyeStyle === 'sleepy') {
          const barGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
          const barMesh = new THREE.Mesh(barGeo, eyeMat);
          eyeGroup.add(barMesh);
        } 
        else if (face.eyeStyle === 'blinking') {
          const arcGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 24, Math.PI);
          const arcMesh = new THREE.Mesh(arcGeo, eyeMat);
          eyeGroup.add(arcMesh);
        }

        faceGroup.add(eyeGroup);
      };

      createEyeball(true);
      createEyeball(false);

      if (face.hasCheeks) {
        const cheekSize = 0.08;
        const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(cheekSize, 16, 12), cheekMat);
        leftCheek.name = 'LeftCheekBlush';
        leftCheek.position.set(-eyeDistanceX - 0.06, eyeHeightY - 0.12, faceZOffset - 0.06);
        leftCheek.scale.set(1.4, 0.6, 0.4);
        
        const rightCheek = leftCheek.clone();
        rightCheek.name = 'RightCheekBlush';
        rightCheek.position.set(eyeDistanceX + 0.06, eyeHeightY - 0.12, faceZOffset - 0.06);

        faceGroup.add(leftCheek);
        faceGroup.add(rightCheek);
      }

      const mouthGroup = new THREE.Group();
      mouthGroup.name = 'Mouth';
      mouthGroup.position.set(0, eyeHeightY - 0.1, faceZOffset + 0.04);

      if (face.mouthStyle === 'dot') {
        const dotGeo = new THREE.SphereGeometry(0.03, 12, 12);
        const dotMesh = new THREE.Mesh(dotGeo, mouthMat);
        dotMesh.scale.set(1.1, 1.1, 0.6);
        mouthGroup.add(dotMesh);
      }
      else if (face.mouthStyle === 'smile') {
        const torusGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 24, Math.PI);
        const smileMesh = new THREE.Mesh(torusGeo, mouthMat);
        mouthGroup.add(smileMesh);
      }
      else if (face.mouthStyle === 'sad') {
        const torusGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 24, Math.PI);
        const sadMesh = new THREE.Mesh(torusGeo, mouthMat);
        sadMesh.rotation.set(0, 0, Math.PI);
        mouthGroup.add(sadMesh);
      }
      else if (face.mouthStyle === 'open') {
        const cylinderGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 24);
        const openMesh = new THREE.Mesh(cylinderGeo, mouthMat);
        openMesh.rotation.set(Math.PI / 2, 0, 0);
        mouthGroup.add(openMesh);
      }
      else if (face.mouthStyle === 'wiggle') {
        const rw = 0.035;
        const torusGeo = new THREE.TorusGeometry(rw, 0.011, 8, 24, Math.PI);
        
        const curlL = new THREE.Mesh(torusGeo, mouthMat);
        curlL.position.set(-rw, 0, 0);

        const curlR = new THREE.Mesh(torusGeo, mouthMat);
        curlR.position.set(rw, 0, 0);

        mouthGroup.add(curlL);
        mouthGroup.add(curlR);
        
        const tinyNose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), mouthMat);
        tinyNose.position.set(0, 0.035, 0);
        tinyNose.scale.set(1.3, 0.8, 0.8);
        mouthGroup.add(tinyNose);
      }

      faceGroup.add(mouthGroup);
      animalGroup.add(faceGroup);
    }

    // Highlighting current selected part with outlines
    if (selectedPartId) {
      const targetMesh = animalGroup.children.find(c => c.userData && c.userData.partId === selectedPartId) as THREE.Mesh;
      if (targetMesh) {
        const boxHelper = new THREE.BoxHelper(targetMesh, '#ec4899');
        if (boxHelper.material instanceof THREE.LineBasicMaterial) {
          boxHelper.material.linewidth = 2;
          boxHelper.material.depthTest = false;
        }
        boxHelper.name = 'SelectionOutline';
        boxHelper.renderOrder = 999;
        animalGroup.add(boxHelper);
        outlineMeshRef.current = boxHelper as any;
      }
    } else {
      outlineMeshRef.current = null;
    }

  }, [parts, face, selectedPartId, isFlexible, segmentCount, segmentSpacing, connectorType, fdmEnabled, fdmDensity, filamentStyle]);

  return (
    <div
      ref={containerRef}
      id="three-container"
      className="absolute inset-0 w-full h-full select-none"
    >
      <canvas
        ref={canvasRef}
        id="three-canvas"
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none rounded-2xl md:rounded-3xl shadow-inner"
        style={{ touchAction: 'none' }}
      />
      <div className="absolute right-4 bottom-4 flex flex-col gap-1 items-end pointer-events-none text-[10px] font-mono text-gray-400 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs px-2 py-1 rounded border border-gray-100 dark:border-zinc-800">
        <div>Aris: Orbitar / Zoom</div>
        <div>Click: Seleccionar Parte</div>
      </div>
    </div>
  );
});

ThreeCanvas.displayName = 'ThreeCanvas';
