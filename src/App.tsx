/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { ThreeCanvas, ThreeCanvasHandle } from './components/ThreeCanvas';
import { Sidebar } from './components/Sidebar';
import { ANIMAL_PRESETS } from './data/presets';
import { Part, FaceConfig } from './types';
import { triggerDownload } from './utils/exporter';
import { generateRandomAnimal } from './utils/procedural';
import { Sparkles, Dice5, HelpCircle, Laptop, RefreshCw } from 'lucide-react';

export default function App() {
  const threeCanvasRef = useRef<ThreeCanvasHandle>(null);

  // Load the first preset (Bunny) as initial state
  const initialPreset = ANIMAL_PRESETS[0];

  const [parts, setParts] = useState<Part[]>(() => {
    return JSON.parse(JSON.stringify(initialPreset.parts));
  });

  const [face, setFace] = useState<FaceConfig>(() => {
    return { ...initialPreset.face };
  });

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [animalName, setAnimalName] = useState<string>('Copito Bunny');
  
  // Scene settings
  const [showPedestal, setShowPedestal] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Flexible / Articulated Joint and Segmentation settings
  const [isFlexible, setIsFlexible] = useState<boolean>(false);
  const [segmentCount, setSegmentCount] = useState<number>(5);
  const [segmentSpacing, setSegmentSpacing] = useState<number>(0.33);
  const [connectorType, setConnectorType] = useState<'ring' | 'ball' | 'flexible'>('ring');
  const [wiggleSpeed, setWiggleSpeed] = useState<number>(2.0);
  const [wiggleAmplitude, setWiggleAmplitude] = useState<number>(0.16);

  // FDM 3D Layer printer simulation & Filament properties
  const [fdmEnabled, setFdmEnabled] = useState<boolean>(true);
  const [fdmDensity, setFdmDensity] = useState<number>(180);
  const [filamentStyle, setFilamentStyle] = useState<'matte' | 'silk_standard' | 'silk_dual' | 'silk_rainbow'>('silk_standard');

  // Load a new preset helper with defaults
  const handleLoadPreset = (presetId: string) => {
    const preset = ANIMAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const clonedParts = JSON.parse(JSON.stringify(preset.parts));
    setParts(clonedParts);
    setFace({ ...preset.face });
    setSelectedPartId(null);
    setIsFlexible(presetId === 'shiba' ? true : false); // Start some as flexible by default!

    const cuteNouns = ['Copito', 'Santi', 'Peluchín', 'Mochi', 'Yogui', 'Boni', 'Kiki', 'Lilo', 'Michi', 'Chibi'];
    const randomNoun = cuteNouns[Math.floor(Math.random() * cuteNouns.length)];
    setAnimalName(`${randomNoun} ${preset.name}`);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ffd300', '#fb7185', '#c084fc', '#60a5fa'],
    });
  };

  // Procedural Random Infinite Animal Generator
  const handleGenerateInfiniteAnimal = () => {
    const fresh = generateRandomAnimal();
    setParts(fresh.parts);
    setFace(fresh.face);
    setAnimalName(fresh.name);
    setIsFlexible(fresh.isFlexible);
    setSegmentCount(fresh.segmentCount);
    setSegmentSpacing(fresh.segmentSpacing);
    setConnectorType(fresh.connectorType);
    setWiggleAmplitude(fresh.wiggleAmplitude);
    setSelectedPartId(null);

    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.72 },
      colors: ['#ec4899', '#3b82f6', '#10b981', '#fbbf24', '#a855f7']
    });
  };

  // Trigger OBJ download
  const handleExportObj = () => {
    if (!threeCanvasRef.current) return;
    const formattedName = animalName.trim() || 'Mi_Animalito_Kawaii';
    const result = threeCanvasRef.current.exportModel(formattedName);
    
    if (result) {
      const safeFilename = formattedName.toLowerCase().replace(/\s+/g, '_');
      triggerDownload(result.obj, `${safeFilename}.obj`);
      
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#FF1493', '#FF69B4', '#FFA07A', '#FFB6C1']
      });
    }
  };

  // Trigger MTL download
  const handleExportMtl = () => {
    if (!threeCanvasRef.current) return;
    const formattedName = animalName.trim() || 'Mi_Animalito_Kawaii';
    const result = threeCanvasRef.current.exportModel(formattedName);
    
    if (result) {
      const safeFilename = formattedName.toLowerCase().replace(/\s+/g, '_');
      triggerDownload(result.mtl, `${safeFilename}.mtl`);
      
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.75 },
        colors: ['#f59e0b', '#34d399', '#f472b6']
      });
    }
  };

  // Reset Camera Position
  const handleResetCamera = () => {
    if (threeCanvasRef.current) {
      threeCanvasRef.current.resetCamera();
    }
  };

  // Quick Randomizer for fun designs
  const handleRandomizeColors = () => {
    const cutePastels = [
      '#FFCAD4', '#FFE5EC', '#F3EBFD', '#E2EFDA', '#FFF5E6', 
      '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', 
      '#C7CEEA', '#E8DFF5', '#FCE1E4', '#FCF6BD', '#D0F4DE',
      '#A9DEF9', '#E3F2FD', '#E0F2F1', '#FFF4E0', '#FFF176',
    ];

    setParts((prevParts) =>
      prevParts.map((part) => {
        if (part.category === 'body' || part.category === 'head' || part.id === 'ear_l' || part.id === 'ear_r') {
          const randomColor = cutePastels[Math.floor(Math.random() * cutePastels.length)];
          return { ...part, color: randomColor };
        }
        return part;
      })
    );

    confetti({
      particleCount: 35,
      spread: 45,
      origin: { y: 0.8 },
    });
  };

  // Real vertices and triangles count estimation
  const calculateGeometryStats = () => {
    let vertices = 0;
    let triangles = 0;
    
    const countMeshStats = (shape: string) => {
      switch (shape) {
        case 'sphere':
          vertices += 121;
          triangles += 200;
          break;
        case 'box':
          vertices += 24;
          triangles += 12;
          break;
        case 'cylinder':
          vertices += 128;
          triangles += 256;
          break;
        case 'cone':
          vertices += 64;
          triangles += 128;
          break;
        case 'torus':
          vertices += 192;
          triangles += 384;
          break;
        default:
          vertices += 80;
          triangles += 150;
      }
    };

    parts.forEach(p => {
      if (!p.visible) return;
      if (isFlexible && p.id === 'body') {
        // We multiply stats by the custom segment count!
        for (let idx = 0; idx < segmentCount; idx++) {
          countMeshStats(p.shape);
          if (idx < segmentCount - 1) {
            // Include joints (torus/sphere links)
            countMeshStats(connectorType === 'ring' ? 'torus' : connectorType === 'ball' ? 'sphere' : 'cylinder');
          }
        }
      } else {
        countMeshStats(p.shape);
      }
    });

    // Face details
    vertices += 450;
    triangles += 850;

    return { vertices, triangles };
  };

  const stats = calculateGeometryStats();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FDFCFB] dark:bg-zinc-950 font-sans overflow-hidden">
      
      {/* 1. Header Section */}
      <Header
        animalName={animalName}
        setAnimalName={setAnimalName}
        onExportObj={handleExportObj}
        onExportMtl={handleExportMtl}
        onResetCamera={handleResetCamera}
      />

      {/* 2. Main Space */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Lefthand 3D Viewport wrapper */}
        <div className="flex-[1.3] lg:flex-1 flex flex-col h-[50vh] min-h-[380px] lg:h-full lg:min-h-0 p-3 md:p-4 lg:p-6 overflow-hidden bg-white/40 dark:bg-zinc-900/10 justify-center items-center relative">
          
          {/* Subtle design helper labels */}
          <div className="absolute left-8 top-8 z-10 pointer-events-none flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-550 tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              Estudio 3D Flexible Activo
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-605">
              Arrastra para girar • Rueda de scroll para zoom • ¡Cuerpo articulado!
            </span>
          </div>

          {/* Canvas box frame */}
          <div className="flex-1 w-full max-w-5xl rounded-[32px] md:rounded-[40px] bg-[#EEF0F2] dark:bg-zinc-900/80 relative overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-inner">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)' }}></div>

            <ThreeCanvas
              ref={threeCanvasRef}
              parts={parts}
              face={face}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              showPedestal={showPedestal}
              showGrid={showGrid}
              shadowColor="#cbd5e1"
              isFlexible={isFlexible}
              segmentCount={segmentCount}
              segmentSpacing={segmentSpacing}
              connectorType={connectorType}
              wiggleSpeed={wiggleSpeed}
              wiggleAmplitude={wiggleAmplitude}
              fdmEnabled={fdmEnabled}
              fdmDensity={fdmDensity}
              filamentStyle={filamentStyle}
            />

            {/* Floating Dual Actions Menu with both Random and Infinite generator options */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-10">
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2 rounded-2xl flex items-center gap-2 border border-slate-200/50 dark:border-zinc-800/80 shadow-xl select-none">
                
                {/* Infinite Generator Button */}
                <button
                  onClick={handleGenerateInfiniteAnimal}
                  className="px-4.5 py-2.5 bg-gradient-to-r from-pink-550 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-750 text-white rounded-xl font-bold text-xs flex items-center gap-2 pointer-events-auto cursor-pointer shadow-lg shadow-pink-500/10 hover:shadow-purple-500/20 active:scale-95 transition-all"
                  title="Generar infinitos modelos aleatorios con un solo toque"
                >
                  <Sparkles className="w-4.5 h-4.5 animate-bounce" />
                  <span>Modelo Infinito 🧬</span>
                </button>

                {/* Randomize look shortcut */}
                <button
                  onClick={handleRandomizeColors}
                  className="px-4.5 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-805 rounded-xl font-bold text-xs text-slate-705 dark:text-zinc-205 flex items-center gap-2 pointer-events-auto cursor-pointer transition-all"
                  title="Randomizar colores de la capa base"
                >
                  <Dice5 className="w-4 h-4 text-emerald-500" />
                  <span>Mezclar Colores</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Righthand Workspace Board (Editor, flexible joints, and face styles) */}
        <Sidebar
          parts={parts}
          setParts={setParts}
          face={face}
          setFace={setFace}
          selectedPartId={selectedPartId}
          setSelectedPartId={setSelectedPartId}
          showPedestal={showPedestal}
          setShowPedestal={setShowPedestal}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          onLoadPreset={handleLoadPreset}
          
          // Articulation parameters
          isFlexible={isFlexible}
          setIsFlexible={setIsFlexible}
          segmentCount={segmentCount}
          setSegmentCount={setSegmentCount}
          segmentSpacing={segmentSpacing}
          setSegmentSpacing={setSegmentSpacing}
          connectorType={connectorType}
          setConnectorType={setConnectorType}
          wiggleSpeed={wiggleSpeed}
          setWiggleSpeed={setWiggleSpeed}
          wiggleAmplitude={wiggleAmplitude}
          setWiggleAmplitude={setWiggleAmplitude}

          // New FDM / Filament properties
          fdmEnabled={fdmEnabled}
          setFdmEnabled={setFdmEnabled}
          fdmDensity={fdmDensity}
          setFdmDensity={setFdmDensity}
          filamentStyle={filamentStyle}
          setFilamentStyle={setFilamentStyle}
        />

      </main>

      {/* 3. Footer Section (Geometric Balance style) */}
      <footer className="h-10 px-8 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 border-t border-slate-200 dark:border-zinc-850 select-none">
        <div className="flex gap-6">
          <span>Vértices: {stats.vertices.toLocaleString()}</span>
          <span>Triángulos: {stats.triangles.toLocaleString()}</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden sm:inline">Modo: Articulado 3D Flexible (Print-in-Place)</span>
          <span className="text-pink-400">Listo para Slicer OBJ</span>
        </div>
      </footer>
    </div>
  );
}
