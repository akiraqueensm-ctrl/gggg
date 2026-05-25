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
import { Sparkles, Dice5, HelpCircle, Laptop } from 'lucide-react';

export default function App() {
  const threeCanvasRef = useRef<ThreeCanvasHandle>(null);

  // Load the first preset (Bunny) as initial state
  const initialPreset = ANIMAL_PRESETS[0];

  const [parts, setParts] = useState<Part[]>(() => {
    // Deep clone the initial preset parts
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

  // Load a new preset helper
  const handleLoadPreset = (presetId: string) => {
    const preset = ANIMAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Deep clone parts to ensure fresh reference and trigger full rerender
    const clonedParts = JSON.parse(JSON.stringify(preset.parts));
    setParts(clonedParts);
    setFace({ ...preset.face });
    setSelectedPartId(null);

    // Cute name generator
    const cuteNouns = ['Copito', 'Santi', 'Peluchín', 'Mochi', 'Yogui', 'Boni', 'Kiki', 'Lilo', 'Michi', 'Chibi'];
    const randomNoun = cuteNouns[Math.floor(Math.random() * cuteNouns.length)];
    setAnimalName(`${randomNoun} ${preset.name}`);

    // Confetti on template change for extra delight!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#fb7185', '#c084fc', '#60a5fa'],
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
      
      // Explosion of hearts and sparkles!
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

  // Quick Randomizer / Mix and Match for fun designs
  const handleRandomizeColors = () => {
    // Generate a set of cute pastel hues
    const cutePastels = [
      '#FFCAD4', '#FFE5EC', '#F3EBFD', '#E2EFDA', '#FFF5E6', 
      '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', 
      '#C7CEEA', '#E8DFF5', '#FCE1E4', '#FCF6BD', '#D0F4DE',
      '#A9DEF9', '#E3F2FD', '#E0F2F1', '#FFF4E0', '#FFF176',
    ];

    setParts((prevParts) =>
      prevParts.map((part) => {
        // Only randomize major body coloring segments, not eyes, whiskers or small accessories by default, 
        // to keep the visual identity cohesive
        if (part.category === 'body' || part.category === 'head' || part.id === 'ear_l' || part.id === 'ear_r') {
          const randomColor = cutePastels[Math.floor(Math.random() * cutePastels.length)];
          return { ...part, color: randomColor };
        }
        return part;
      })
    );

    confetti({
      particleCount: 30,
      spread: 40,
      scalar: 1.2,
      origin: { y: 0.8 },
    });
  };

  // Real vertices and triangles count based on shape types
  const calculateGeometryStats = () => {
    let vertices = 0;
    let triangles = 0;
    
    parts.forEach(p => {
      if (!p.visible) return;
      // Cylinder, sphere, box, cone, torus, etc have standard segments
      switch (p.shape) {
        case 'sphere':
          vertices += 121; // 10x10 sphere segments
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
    });

    // Add face elements stats
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
        <div className="flex-[1.3] lg:flex-1 flex flex-col p-3 md:p-4 lg:p-6 overflow-hidden bg-white/40 dark:bg-zinc-900/10 justify-center items-center relative">
          
          {/* Subtle design helper labels */}
          <div className="absolute left-8 top-8 z-10 pointer-events-none flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-550 tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              Estudio 3D Activo
            </span>
            <span className="text-[10px] text-slate-405 dark:text-zinc-650">
              Arrastra para girar • Rueda de scroll para zoom
            </span>
          </div>

          {/* Canvas box frame */}
          <div className="w-full h-full max-w-5xl rounded-[32px] md:rounded-[40px] bg-[#EEF0F2] dark:bg-zinc-900/80 relative overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-inner">
            {/* Geometric balance grid dot pattern */}
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
            />

            {/* Centered actions menu exactly matching the Geometric Balance design spec */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-10">
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur p-2 rounded-2xl flex items-center gap-2 border border-slate-200/50 dark:border-zinc-850 shadow-lg select-none">
                {/* Randomize look shortcut */}
                <button
                  onClick={handleRandomizeColors}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-2 pointer-events-auto cursor-pointer transition-colors"
                  title="Generar combinación de colores aleatoria"
                >
                  <Dice5 className="w-4 h-4 text-pink-500" />
                  <span>Mezclar Colores</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Righthand Workspace Board (Editor and properties) */}
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
        />

      </main>

      {/* 3. Footer Section (Geometric Balance style) */}
      <footer className="h-10 px-8 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 border-t border-slate-200 dark:border-zinc-850 select-none">
        <div className="flex gap-6">
          <span>Vértices: {stats.vertices.toLocaleString()}</span>
          <span>Triángulos: {stats.triangles.toLocaleString()}</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden sm:inline">Eje: Y-UP</span>
          <span className="text-pink-400">Listo para Exportar</span>
        </div>
      </footer>
    </div>
  );
}
