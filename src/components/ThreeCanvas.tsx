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

    // Soft rim light from back-top
    const rimLight = new THREE.DirectionalLight('#e0f0ff', 0.3);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

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
      
      // If clicked empty space, do not auto deselect if they clicked off but still on editor, 
      // but let's allow deselecting by clicking grid
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
      
      // Gentle floating animation to the animal group to make it feel extra alive!
      if (animalGroup) {
        const elapsedTime = clock.getElapsedTime();
        // subtle bobbing: only bob when nothing is selected to prevent slider jump, or just make it very quiet
        // We'll keep it static during editing or extremely subtle (e.g., amplitude 0.01) so it doesn't disturb editing position
        animalGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.015;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // RESIZE LISTENER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      let { width: newWidth, height: newHeight } = entries[0].contentRect;
      
      // Ensure we don't scale the renderer/canvas down to 0 or crash on division by zero
      if (newWidth <= 0 || newHeight <= 0) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          newWidth = rect.width;
          newHeight = rect.height;
        } else {
          return; // Ignore temporary transitions to zero size
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
      // Dispose geometries & materials
      scene.clear();
    };
  }, []); // Run once on mount

  // Platform & Grid Visibility Toggles
  useEffect(() => {
    if (pedestalRef.current) pedestalRef.current.visible = showPedestal;
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showPedestal, showGrid]);

  // Update Scene when Parts or Face settings change
  useEffect(() => {
    const scene = sceneRef.current;
    const animalGroup = animalGroupRef.current;
    if (!scene || !animalGroup) return;

    // Clear previous meshes
    while (animalGroup.children.length > 0) {
      const child = animalGroup.children[0];
      // Dispose materials & geometries recursion
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

    // Helper functions for geometry generation
    const getGeometry = (shape: string, scale: [number, number, number]) => {
      let geo: THREE.BufferGeometry;
      
      switch (shape) {
        case 'box':
          // Slightly rounded corners are built by using BoxGeometry, 
          // but standard is fine
          geo = new THREE.BoxGeometry(1, 1, 1);
          break;
        case 'capsule':
          // Cylindrical shape with hemisphere caps 
          geo = new THREE.CapsuleGeometry(0.5, 0.6, 16, 24);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(0.5, 1, 32);
          // offset cone center so pivot point is at the base
          geo.translate(0, 0.5, 0);
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

    // Render configuration Parts
    parts.forEach((part) => {
      if (!part.visible) return;

      const geometry = getGeometry(part.shape, part.scale);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(part.color),
        roughness: part.roughness ?? 0.8,
        metalness: part.metalness ?? 0.15,
        bumpScale: 0.05,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = part.name;
      mesh.userData = { partId: part.id };

      // Apply transformations
      mesh.position.set(part.position[0], part.position[1], part.position[2]);
      mesh.scale.set(part.scale[0], part.scale[1], part.scale[2]);
      
      // Euler rotation (convert degrees to radians)
      mesh.rotation.set(
        THREE.MathUtils.degToRad(part.rotation[0]),
        THREE.MathUtils.degToRad(part.rotation[1]),
        THREE.MathUtils.degToRad(part.rotation[2])
      );

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      animalGroup.add(mesh);
    });

    // RENDER FACE DETAILS INSIDE HEAD MESH CONTAINER
    // We attach them to a "head" local system so they move, rotate, scale and animate dynamically with Head alterations!
    const headPart = parts.find(p => p.id === 'head');
    if (headPart && headPart.visible) {
      // Find head mesh in animalGroup to get its world scale/pivot or we can create a face container group
      const faceGroup = new THREE.Group();
      faceGroup.name = 'FaceFeatures';
      
      // Place face relative to head position
      // Head center is headPart.position. Let's orient child elements relative to it.
      faceGroup.position.set(headPart.position[0], headPart.position[1], headPart.position[2]);
      // Apply same rotation as head so it points forward with head!
      faceGroup.rotation.set(
        THREE.MathUtils.degToRad(headPart.rotation[0]),
        THREE.MathUtils.degToRad(headPart.rotation[1]),
        THREE.MathUtils.degToRad(headPart.rotation[2])
      );
      // Face group scale is locked to head scale so eyes and mouth scale together nicely!
      faceGroup.scale.set(headPart.scale[0], headPart.scale[1], headPart.scale[2]);

      // Eye Material
      const eyeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(face.eyeColor),
        roughness: 0.1,
        metalness: 0.9, // glossy anime eyeballs!
      });

      // Highlight spot material (pure white emission for reflection)
      const shineMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.1,
        metalness: 0.0,
      });

      // Cheek Material
      const cheekMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(face.cheekColor),
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.7,
      });

      // Mouth Material
      const mouthMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(face.mouthColor),
        roughness: 0.8,
        metalness: 0.1,
      });

      const eyeDistanceX = 0.22 * face.eyeSpacing;
      const eyeHeightY = 0.08 * face.eyeHeight;
      const faceZOffset = 0.44; // Sitting on front surface of the sphere (radius 0.5 * headScale.z)

      // 1. EYES GENERATION
      const createEyeball = (isLeft: boolean) => {
        const sideMult = isLeft ? -1 : 1;
        const eyeGroup = new THREE.Group();
        eyeGroup.name = isLeft ? 'LeftEye' : 'RightEye';
        eyeGroup.position.set(eyeDistanceX * sideMult, eyeHeightY, faceZOffset - 0.02);

        if (face.eyeStyle === 'classic' || face.eyeStyle === 'anime') {
          // Sphere eye
          const size = face.eyeStyle === 'anime' ? 0.09 : 0.065;
          const eyeGeo = new THREE.SphereGeometry(size, 16, 16);
          const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
          eyeMesh.scale.set(1, face.eyeStyle === 'anime' ? 1.3 : 1, 0.75); // make anime eyes oval!
          eyeGroup.add(eyeMesh);

          // Shiny sparkle highlight overlays
          const shine1 = new THREE.Mesh(new THREE.SphereGeometry(size * 0.35, 12, 12), shineMat);
          // Position spark slightly forward and top-right relative to eyeball
          shine1.position.set(size * 0.35, size * 0.35, size * 0.65);
          eyeGroup.add(shine1);

          // Secondary minor sparkle (double shininess!)
          if (face.eyeStyle === 'anime') {
            const shine2 = new THREE.Mesh(new THREE.SphereGeometry(size * 0.2, 12, 12), shineMat);
            shine2.position.set(-size * 0.25, -size * 0.3, size * 0.65);
            eyeGroup.add(shine2);
          }
        } 
        else if (face.eyeStyle === 'happy') {
          // Upside down curved ring
          const arcGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 24, Math.PI);
          const arcMesh = new THREE.Mesh(arcGeo, eyeMat);
          arcMesh.rotation.set(0, 0, Math.PI); // rotate to form high arch
          eyeGroup.add(arcMesh);
        } 
        else if (face.eyeStyle === 'sleepy') {
          // Flat horizontal line
          const barGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
          const barMesh = new THREE.Mesh(barGeo, eyeMat);
          eyeGroup.add(barMesh);
        } 
        else if (face.eyeStyle === 'blinking') {
          // Standard curved ring (u shape)
          const arcGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 24, Math.PI);
          const arcMesh = new THREE.Mesh(arcGeo, eyeMat);
          eyeGroup.add(arcMesh);
        }

        faceGroup.add(eyeGroup);
      };

      createEyeball(true);  // Left Eye
      createEyeball(false); // Right Eye

      // 2. CHEEKS GENERATION (BLUSH)
      if (face.hasCheeks) {
        const cheekSize = 0.08;
        const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(cheekSize, 16, 12), cheekMat);
        leftCheek.name = 'LeftCheekBlush';
        leftCheek.position.set(-eyeDistanceX - 0.06, eyeHeightY - 0.12, faceZOffset - 0.06);
        leftCheek.scale.set(1.4, 0.6, 0.4); // squashed pink egg under eye!
        
        const rightCheek = leftCheek.clone();
        rightCheek.name = 'RightCheekBlush';
        rightCheek.position.set(eyeDistanceX + 0.06, eyeHeightY - 0.12, faceZOffset - 0.06);

        faceGroup.add(leftCheek);
        faceGroup.add(rightCheek);
      }

      // 3. MOUTH GENERATION
      const mouthGroup = new THREE.Group();
      mouthGroup.name = 'Mouth';
      // Placed slightly below eyes and on snout surface (which sits at z=0.35 + snout size)
      // Standard snout position is snout is at Z = 0.35, scale is Z = 0.15, so snout front is around Z=0.42. Let's make it sit on Z=0.48!
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
        smileMesh.rotation.set(0, 0, 0); // smiling U-shape
        mouthGroup.add(smileMesh);
      }
      else if (face.mouthStyle === 'sad') {
        const torusGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 24, Math.PI);
        const sadMesh = new THREE.Mesh(torusGeo, mouthMat);
        sadMesh.rotation.set(0, 0, Math.PI); // sad arch
        mouthGroup.add(sadMesh);
      }
      else if (face.mouthStyle === 'open') {
        const cylinderGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 24);
        const openMesh = new THREE.Mesh(cylinderGeo, mouthMat);
        openMesh.rotation.set(Math.PI / 2, 0, 0); // open circle
        mouthGroup.add(openMesh);
      }
      else if (face.mouthStyle === 'wiggle') {
        // Double cute cat mouth ':3'
        const rw = 0.035;
        const torusGeo = new THREE.TorusGeometry(rw, 0.011, 8, 24, Math.PI);
        
        const curlL = new THREE.Mesh(torusGeo, mouthMat);
        curlL.position.set(-rw, 0, 0);
        curlL.rotation.set(0, 0, 0); // U-shape

        const curlR = new THREE.Mesh(torusGeo, mouthMat);
        curlR.position.set(rw, 0, 0);
        curlR.rotation.set(0, 0, 0); // U-shape

        mouthGroup.add(curlL);
        mouthGroup.add(curlR);
        
        // Add tiny black nose dot above the wiggle mouth
        const tinyNose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), mouthMat);
        tinyNose.position.set(0, 0.035, 0);
        tinyNose.scale.set(1.3, 0.8, 0.8);
        mouthGroup.add(tinyNose);
      }

      faceGroup.add(mouthGroup);
      animalGroup.add(faceGroup);
    }

    // DRAW EXTRAS / RE-HIGHLIGHT THE SELECTED PART
    if (selectedPartId) {
      // Find the mesh with this ID
      const targetMesh = animalGroup.children.find(c => c.userData && c.userData.partId === selectedPartId) as THREE.Mesh;
      if (targetMesh) {
        // Create bounding frame / box helper
        const boxHelper = new THREE.BoxHelper(targetMesh, '#ec4899'); // pink border edge!
        
        // Convert to Lines segments and style
        if (boxHelper.material instanceof THREE.LineBasicMaterial) {
          boxHelper.material.linewidth = 2; // ignored by some implementations, but good practice
          boxHelper.material.depthTest = false; // Always render on top!
        }
        
        boxHelper.name = 'SelectionOutline';
        boxHelper.renderOrder = 999; // Draw on top
        
        animalGroup.add(boxHelper);
        outlineMeshRef.current = boxHelper as any;
      }
    } else {
      outlineMeshRef.current = null;
    }

  }, [parts, face, selectedPartId]);

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
