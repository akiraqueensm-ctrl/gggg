/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Part, FaceConfig, EyeExpression, MouthExpression } from '../types';
import { ANIMAL_PRESETS, ACCESSORY_TEMPLATES, PALETTES } from '../data/presets';
import { Sparkles, Sliders, Smile, Award, Settings, Plus, Trash2, HelpCircle, Activity, Zap, Shield, Eye, EyeOff, HelpCircle as InfoIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SidebarProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  face: FaceConfig;
  setFace: React.Dispatch<React.SetStateAction<FaceConfig>>;
  selectedPartId: string | null;
  setSelectedPartId: (id: string | null) => void;
  showPedestal: boolean;
  setShowPedestal: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  onLoadPreset: (presetId: string) => void;

  // Flexible / Articulated Joint and Segmentation settings
  isFlexible: boolean;
  setIsFlexible: (val: boolean) => void;
  segmentCount: number;
  setSegmentCount: (val: number) => void;
  segmentSpacing: number;
  setSegmentSpacing: (val: number) => void;
  connectorType: 'ring' | 'ball' | 'flexible';
  setConnectorType: (val: 'ring' | 'ball' | 'flexible') => void;
  wiggleSpeed: number;
  setWiggleSpeed: (val: number) => void;
  wiggleAmplitude: number;
  setWiggleAmplitude: (val: number) => void;

  // FDM / Filament states
  fdmEnabled: boolean;
  setFdmEnabled: (v: boolean) => void;
  fdmDensity: number;
  setFdmDensity: (v: number) => void;
  filamentStyle: 'matte' | 'silk_standard' | 'silk_dual' | 'silk_rainbow';
  setFilamentStyle: (v: 'matte' | 'silk_standard' | 'silk_dual' | 'silk_rainbow') => void;
}

export function Sidebar({
  parts,
  setParts,
  face,
  setFace,
  selectedPartId,
  setSelectedPartId,
  showPedestal,
  setShowPedestal,
  showGrid,
  setShowGrid,
  onLoadPreset,

  // Articulated props
  isFlexible,
  setIsFlexible,
  segmentCount,
  setSegmentCount,
  segmentSpacing,
  setSegmentSpacing,
  connectorType,
  setConnectorType,
  wiggleSpeed,
  setWiggleSpeed,
  wiggleAmplitude,
  setWiggleAmplitude,

  // FDM / Filament props
  fdmEnabled,
  setFdmEnabled,
  fdmDensity,
  setFdmDensity,
  filamentStyle,
  setFilamentStyle,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'flexi' | 'face' | 'parts' | 'accessories' | 'scene'>('presets');
  const [syncSculptGlobally, setSyncSculptGlobally] = useState<boolean>(false);
  const [linkHeadParts, setLinkHeadParts] = useState<boolean>(true);

  // Helper to get or calculate initial relative position of part to head
  const getInitialHeadRelativePosition = (part: Part, currentParts: Part[]): [number, number, number] => {
    if (part.initialHeadRelativePosition) {
      return part.initialHeadRelativePosition;
    }
    const head = currentParts.find((p) => p.id === 'head');
    if (head) {
      return [
        part.position[0] - head.position[0],
        part.position[1] - head.position[1],
        part.position[2] - head.position[2],
      ];
    }
    return [0, 0, 0];
  };

  // Re-align ears, snout, horns, and all head accessories perfectly onto the head
  const handleAutoAlignCompanionParts = () => {
    const headPart = parts.find((p) => p.id === 'head');
    if (!headPart) return;

    setParts((prevParts) => {
      return prevParts.map((part) => {
        if (
          part.id !== 'head' &&
          (part.category === 'head' ||
            part.category === 'face' ||
            part.category === 'accessories' ||
            part.name.toLowerCase().includes('oreja') ||
            part.name.toLowerCase().includes('cuerno') ||
            part.name.toLowerCase().includes('hocico') ||
            part.name.toLowerCase().includes('sombrero') ||
            part.name.toLowerCase().includes('corona') ||
            part.name.toLowerCase().includes('lazo') ||
            part.name.toLowerCase().includes('ala'))
        ) {
          const relativePos = getInitialHeadRelativePosition(part, prevParts);
          return {
            ...part,
            position: [
              headPart.position[0] + relativePos[0],
              headPart.position[1] + relativePos[1],
              headPart.position[2] + relativePos[2],
            ],
            initialHeadRelativePosition: relativePos,
          };
        }
        return part;
      });
    });

    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#a855f7', '#ec4899'],
    });
  };

  const propagateSculptToAll = () => {
    if (!selectedPart || !selectedPart.sculpt) return;
    setParts((prev) =>
      prev.map((p) => ({
        ...p,
        sculpt: { ...selectedPart.sculpt }
      }))
    );
  };

  // Find currently selected part
  const selectedPart = parts.find((p) => p.id === selectedPartId);

  // Update a single part's properties
  const updatePartProperty = (partId: string, updates: Partial<Part>) => {
    setParts((prevParts) => {
      const mainPart = prevParts.find((p) => p.id === partId);
      if (!mainPart) return prevParts;

      // Handle real-time propagation of head movement to ears and accessories
      if (partId === 'head' && updates.position !== undefined && linkHeadParts) {
        const dx = updates.position[0] - mainPart.position[0];
        const dy = updates.position[1] - mainPart.position[1];
        const dz = updates.position[2] - mainPart.position[2];

        return prevParts.map((part) => {
          if (part.id === 'head') {
            return { ...part, ...updates };
          }
          if (
            part.category === 'head' ||
            part.category === 'face' ||
            part.category === 'accessories' ||
            part.name.toLowerCase().includes('oreja') ||
            part.name.toLowerCase().includes('cuerno') ||
            part.name.toLowerCase().includes('hocico') ||
            part.name.toLowerCase().includes('sombrero') ||
            part.name.toLowerCase().includes('corona') ||
            part.name.toLowerCase().includes('lazo') ||
            part.name.toLowerCase().includes('ala')
          ) {
            const relativeOffset = part.initialHeadRelativePosition || [
              part.position[0] - mainPart.position[0],
              part.position[1] - mainPart.position[1],
              part.position[2] - mainPart.position[2],
            ];
            return {
              ...part,
              position: [
                part.position[0] + dx,
                part.position[1] + dy,
                part.position[2] + dz,
              ],
              initialHeadRelativePosition: relativeOffset,
            };
          }
          return part;
        });
      }

      return prevParts.map((part) => {
        // If syncing sculpt globally, update sculpt for all parts!
        if (syncSculptGlobally && updates.sculpt !== undefined) {
          return {
            ...part,
            sculpt: { ...updates.sculpt }
          };
        }

        if (part.id === partId) {
          return { ...part, ...updates };
        }

        if (mainPart.mirrorId && part.id === mainPart.mirrorId) {
          const mirroredUpdates: Partial<Part> = { ...updates };
          
          if (updates.position !== undefined) {
            mirroredUpdates.position = [
              -updates.position[0],
              updates.position[1],
              updates.position[2]
            ];
          }
          if (updates.rotation !== undefined) {
            mirroredUpdates.rotation = [
              updates.rotation[0],
              -updates.rotation[1],
              -updates.rotation[2]
            ];
          }
          if (updates.sculpt !== undefined) {
            mirroredUpdates.sculpt = { ...updates.sculpt };
          }
          return { ...part, ...mirroredUpdates };
        }

        return part;
      });
    });
  };

  // Add accessory
  const handleAddAccessory = (accTemplate: typeof ACCESSORY_TEMPLATES[0]) => {
    const freshId = `acc_${Date.now()}`;
    const freshAcc: Part = {
      id: freshId,
      name: accTemplate.name,
      shape: accTemplate.shape,
      color: accTemplate.color,
      scale: [...accTemplate.scale] as [number, number, number],
      position: [...accTemplate.position] as [number, number, number],
      rotation: [...accTemplate.rotation] as [number, number, number],
      visible: true,
      category: 'accessories',
      isAccessory: true,
      roughness: 0.8,
      metalness: 0.15,
    };

    setParts((p) => [...p, freshAcc]);
    setSelectedPartId(freshId);
  };

  // Delete part
  const handleDeletePart = (id: string) => {
    setParts((prev) => {
      const toDel = prev.find((p) => p.id === id);
      let filtered = prev.filter((p) => p.id !== id);
      if (toDel && toDel.mirrorId) {
        filtered = filtered.filter((p) => p.id !== toDel.mirrorId);
      }
      return filtered;
    });
    if (selectedPartId === id) setSelectedPartId(null);
  };

  return (
    <div
      id="sidebar-panel"
      className="w-full lg:w-96 flex flex-col bg-white dark:bg-zinc-950 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-zinc-900 overflow-hidden relative"
    >
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/10 p-1.5 gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'presets', label: 'Plantillas', icon: Sparkles },
          { id: 'flexi', label: 'Articulado 🧬', icon: Activity },
          { id: 'face', label: 'Rostro', icon: Smile },
          { id: 'parts', label: 'Editar 3D', icon: Sliders },
          { id: 'accessories', label: 'Deco', icon: Plus },
          { id: 'scene', label: 'Escena', icon: Settings },
        ].map((tab) => {
          const IconObj = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-semibold border-b-2 border-pink-500'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30'
              }`}
            >
              <IconObj className="w-3.5 h-3.5 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Content (Scrollable Container) */}
      <div className="flex-1 h-0 overflow-y-auto p-4 lg:p-5 space-y-6 pb-28">
        
        {/* TAB 1: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Carga un Animalito Base</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Selecciona uno de nuestros diseños pre-construidos para empezar a esculpir.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50/20 p-1 rounded-3xl">
              {ANIMAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onLoadPreset(preset.id)}
                  className="flex flex-col items-center justify-center p-3 text-center bg-slate-50 dark:bg-zinc-900 hover:bg-pink-50/55 dark:hover:bg-pink-500/5 border border-slate-100 dark:border-zinc-800 hover:border-pink-300/40 rounded-[22px] transition-all group pointer-events-auto cursor-pointer"
                >
                  <span className="text-3xl mb-1.5 filter drop-shadow hover:scale-110 transition-transform duration-200">{preset.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">{preset.name}</span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-550 leading-tight line-clamp-1">{preset.description}</span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-blue-50/40 dark:bg-zinc-900 border border-blue-100/20 dark:border-zinc-800/80 rounded-xl flex gap-2.5 items-start">
              <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                ¡Puedes hacer clic en cualquier parte del muñequito en 3D para editarla inmediatamente! Usa los controles en la pestaña <strong>Editar 3D</strong> para moldear y pintar.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: FLEXI JOINT STRUCTURES (The Infinite Articulated Animal panel) */}
        {activeTab === 'flexi' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Cuerpo Articulado (Flexi)</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Convierte tu modelo en un juguete con eslabones print-in-place.</p>
            </div>

            {/* Toggle switch for isFlexible */}
            <div className="p-4 bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850 rounded-[24px] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-200">Activar Estructura Flexible</div>
                  <div className="text-[10px] text-gray-400">Segmenta el cuerpo principal en eslabones móviles</div>
                </div>
                <button
                  onClick={() => setIsFlexible(!isFlexible)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    isFlexible ? 'bg-pink-500' : 'bg-slate-200 dark:bg-zinc-800'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    isFlexible ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {isFlexible && (
                <div className="text-[10px] text-pink-600 dark:text-pink-450 font-semibold flex items-center gap-1.5 bg-pink-50/40 dark:bg-pink-950/10 p-2 rounded-xl border border-pink-100/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 animate-ping"></span>
                  ¡Mueve los controles de abajo para ver el bamboleo en tiempo real!
                </div>
              )}
            </div>

            {isFlexible ? (
              <div className="space-y-4">
                
                {/* 1. Segment Count */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Cantidad de Segmentos:</span>
                    <span className="font-mono font-bold text-pink-550">{segmentCount} piezas</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="11"
                    value={segmentCount}
                    onChange={(e) => setSegmentCount(parseInt(e.target.value, 10))}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 uppercase tracking-widest">
                    <span>Corto</span>
                    <span>Súper Flexible 🐍</span>
                  </div>
                </div>

                {/* 2. Segment Spacing */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Espaciado de Juntas</span>
                    <span className="font-mono font-bold text-pink-550">{segmentSpacing.toFixed(2)}m</span>
                  </div>
                  <input
                    type="range"
                    min="0.22"
                    max="0.48"
                    step="0.01"
                    value={segmentSpacing}
                    onChange={(e) => setSegmentSpacing(parseFloat(e.target.value))}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 uppercase tracking-widest">
                    <span>Ajustado (Firme)</span>
                    <span>Suelto</span>
                  </div>
                </div>

                {/* 3. Joint Type Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-650 dark:text-gray-300">Tipo de Mecanismo de Unión</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-zinc-900 p-1 rounded-xl">
                    {[
                      { id: 'ring', label: 'Eslabón 🥨', desc: 'Real Chain' },
                      { id: 'ball', label: 'Rótula ⚽', desc: 'Ball Joint' },
                      { id: 'flexible', label: 'Goma 🩹', desc: 'Rubber Bellow' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setConnectorType(type.id as any)}
                        className={`py-2 px-1 text-[10px] rounded-lg border text-center transition-all cursor-pointer ${
                          connectorType === type.id
                            ? 'bg-pink-500 border-pink-500 text-white font-bold'
                            : 'bg-transparent border-transparent text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div>{type.label}</div>
                        <div className={`text-[7px] uppercase tracking-wide opacity-80 ${connectorType === type.id ? 'text-pink-100' : 'text-gray-400'}`}>{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Wasp / Wiggle intensity slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Amplitud del Wiggle (Bamboleo)</span>
                    <span className="font-mono font-bold text-pink-550">{wiggleAmplitude.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="0.35"
                    step="0.01"
                    value={wiggleAmplitude}
                    onChange={(e) => setWiggleAmplitude(parseFloat(e.target.value))}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 uppercase tracking-widest">
                    <span>Quieto (Rígido)</span>
                    <span>Sacudida</span>
                  </div>
                </div>

                {/* 5. Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Velocidad del Bamboleo</span>
                    <span className="font-mono font-bold text-pink-550">{wiggleSpeed.toFixed(1)}Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.1"
                    value={wiggleSpeed}
                    onChange={(e) => setWiggleSpeed(parseFloat(e.target.value))}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Info about physical 3D Printing */}
                <div className="p-3.5 bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/10 dark:border-pink-500/20 rounded-[20px] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400">
                    <Shield className="w-4 h-4 text-pink-500" />
                    <span>¿Cómo se imprime esto?</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Los conectores representados en el visor 3D se exportan con una holgura mecánica calibrada de <strong>0.3mm</strong>. Esto permite que las impresoras de filamento FDM impriman el juguete como una sola pieza que sale de la cama de la impresora ya totalmente flexible y articulada (sin tornillos ni pegamentos).
                  </p>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-gray-150 dark:border-zinc-850 rounded-2xl">
                <Activity className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-gray-500 leading-normal">
                  Este modelo es estático en este momento.<br />
                  Activa la <strong>Estructura Flexible</strong> arriba para habilitar la división del cuerpo por segmentos y ver cómo cobra vida.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FACE EXPRESSIONS */}
        {activeTab === 'face' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Aspecto y Expresiones</h3>
              <p className="text-xs text-gray-400 dark:text-gray-550">Modifica los ojos, mejillas y boca de tu criatura de corte anime.</p>
            </div>

            {/* Eyes Section */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Estilo de Ojos</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'classic', label: 'Classic Kawaii' },
                  { id: 'anime', label: 'Brillo Anime' },
                  { id: 'happy', label: 'Arco Feliz' },
                  { id: 'sleepy', label: 'Dormilón' },
                  { id: 'blinking', label: 'Guiño/Triste' },
                ].map((eye) => (
                  <button
                    key={eye.id}
                    onClick={() => setFace(f => ({ ...f, eyeStyle: eye.id as EyeExpression }))}
                    className={`px-3 py-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                      face.eyeStyle === eye.id
                        ? 'bg-pink-500 border-pink-500 text-white font-medium shadow-md shadow-pink-500/10'
                        : 'bg-transparent border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-305 hover:bg-gray-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {eye.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mouth Section */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tipo de Boca</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'wiggle', label: 'Gatito (:3)' },
                  { id: 'smile', label: 'Sonrisa (‿)' },
                  { id: 'sad', label: 'Triste (︵)' },
                  { id: 'dot', label: 'Puntito (•)' },
                  { id: 'open', label: 'Abierta (o)' },
                ].map((mouth) => (
                  <button
                    key={mouth.id}
                    onClick={() => setFace(f => ({ ...f, mouthStyle: mouth.id as MouthExpression }))}
                    className={`px-3 py-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                      face.mouthStyle === mouth.id
                        ? 'bg-pink-500 border-pink-500 text-white font-medium shadow-md shadow-pink-500/10'
                        : 'bg-transparent border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-305 hover:bg-gray-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {mouth.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blush Toggles */}
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">¿Mejillas Rosadas? (Blush)</span>
                <button
                  onClick={() => setFace(f => ({ ...f, hasCheeks: !f.hasCheeks }))}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    face.hasCheeks ? 'bg-pink-500' : 'bg-slate-200 dark:bg-zinc-800'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    face.hasCheeks ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Eye spacing slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Espaciado de Ojos</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{face.eyeSpacing.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  value={face.eyeSpacing}
                  onChange={(e) => setFace(f => ({ ...f, eyeSpacing: parseFloat(e.target.value) }))}
                  className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Eye height slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Altura de los Ojos</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{face.eyeHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.6"
                  step="0.1"
                  value={face.eyeHeight}
                  onChange={(e) => setFace(f => ({ ...f, eyeHeight: parseFloat(e.target.value) }))}
                  className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Eye and Cheek colors */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Color Ojos</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={face.eyeColor}
                      onChange={(e) => setFace(f => ({ ...f, eyeColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-500">{face.eyeColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Color Rubor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={face.cheekColor}
                      onChange={(e) => setFace(f => ({ ...f, cheekColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-500">{face.cheekColor}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: EDIT INDIVIDUAL 3D PARTS / COLORS */}
        {activeTab === 'parts' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Estructura & Escala</h3>
              <p className="text-xs text-gray-400 dark:text-gray-550">Haz clic en una parte o elígela a continuación para deformar sus proporciones.</p>
            </div>

            {/* Dropdown Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Seleccionar Parte del Cuerpo</label>
              <select
                value={selectedPartId || ''}
                onChange={(e) => setSelectedPartId(e.target.value || null)}
                className="w-full pointer-events-auto cursor-pointer p-2.5 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-700 dark:text-gray-305 focus:outline-none focus:border-pink-400"
              >
                <option value="">-- Ninguna seleccionada --</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.category === 'accessories' ? '✨' : ''} {!p.visible ? '(Oculto)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-align & Head Linkage helper */}
            <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 p-3 rounded-2xl border border-purple-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    ⚡ Vincular Accesorios a Cabeza
                  </span>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight">
                    Mueve orejas, hocico y sombreros junto con la cabeza
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkHeadParts(!linkHeadParts)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    linkHeadParts ? 'bg-purple-500' : 'bg-slate-200 dark:bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    linkHeadParts ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAutoAlignCompanionParts}
                className="w-full text-center text-[10px] font-bold py-1.5 px-3 bg-white dark:bg-zinc-900 border border-purple-500/15 hover:border-purple-550 hover:bg-purple-500/5 dark:border-purple-550/20 text-purple-600 dark:text-purple-305 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                🔗 Re-alinear y Acoplar Orejas/Deco a la Cabeza
              </button>
            </div>

            {selectedPart ? (
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-[24px] border border-slate-100 dark:border-zinc-850 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide flex items-center gap-1">
                      {selectedPart.name}
                      {!selectedPart.visible && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-gray-200 text-gray-750 dark:bg-zinc-800 dark:text-gray-400 rounded">
                          Invisible 🙈
                        </span>
                      )}
                    </span>
                    <span className="text-[8px] text-gray-450 mt-0.5 font-mono">
                      ID: {selectedPart.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Visibility Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => updatePartProperty(selectedPart.id, { visible: !selectedPart.visible })}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedPart.visible
                          ? 'text-pink-550 hover:bg-pink-500/10 dark:hover:bg-pink-500/20'
                          : 'text-gray-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title={selectedPart.visible ? "Ocultar elemento" : "Mostrar elemento"}
                    >
                      {selectedPart.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Delete button (except for body/head) */}
                    {selectedPart.id !== 'body' && selectedPart.id !== 'head' && (
                      <button
                        type="button"
                        onClick={() => handleDeletePart(selectedPart.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-500/10 dark:hover:bg-red-500/20 p-1.5 rounded-lg cursor-pointer transition-colors"
                        title="Eliminar elemento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Color de Pintura de la Malla</span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <input
                      type="color"
                      value={selectedPart.color}
                      onChange={(e) => updatePartProperty(selectedPart.id, { color: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                    />
                    
                    {/* PALETTE PICKS */}
                    {PALETTES.map((palette) => (
                      <div key={palette.name} className="flex gap-0.5 border border-slate-250 dark:border-zinc-800 p-0.5 rounded-lg bg-white dark:bg-zinc-850">
                        {palette.colors.slice(0, 3).map((clr) => (
                          <button
                            key={clr}
                            type="button"
                            onClick={() => updatePartProperty(selectedPart.id, { color: clr })}
                            className="w-4 h-4 rounded-full border border-black/5 hover:scale-110 transition-transform cursor-pointer"
                            style={{ backgroundColor: clr }}
                            title={`${palette.name} Color`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Part Shape Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-zinc-800">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Forma 3D de la Pieza (Mesh Shape)</label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-zinc-850 p-1 rounded-xl">
                    {[
                      { id: 'sphere', label: 'Esfera 🔴' },
                      { id: 'box', label: 'Caja 📦' },
                      { id: 'capsule', label: 'Cápsu 💊' },
                      { id: 'cylinder', label: 'Cilin 🔋' },
                      { id: 'cone', label: 'Cono 🔺' },
                      { id: 'torus', label: 'Rosca 🍩' },
                      { id: 'spiky', label: 'Púas 🦔' },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => updatePartProperty(selectedPart.id, { shape: sh.id as any })}
                        className={`py-1.5 px-0.5 text-[9px] rounded-lg border text-center transition-all cursor-pointer ${
                          selectedPart.shape === sh.id
                            ? 'bg-pink-500 border-pink-500 text-white font-bold'
                            : 'bg-transparent border-transparent text-slate-650 dark:text-gray-400 hover:bg-slate-205 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TALLER DE ESCULTURA 3D 🏺 */}
                <div className="space-y-3.5 pt-3.5 border-t border-slate-150 dark:border-zinc-800 bg-gradient-to-br from-pink-500/5 to-purple-500/5 dark:from-pink-500/10 dark:to-purple-500/10 p-3.5 rounded-2xl border border-pink-550/10 dark:border-pink-400/15">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-1.5">
                      🏺 Taller de Escultura 3D
                    </span>
                    {(selectedPart.sculpt && (
                      (selectedPart.sculpt.pinch || 0) !== 0 ||
                      (selectedPart.sculpt.taper || 0) !== 0 ||
                      (selectedPart.sculpt.flatten || 0) !== 0 ||
                      (selectedPart.sculpt.ridges || 0) !== 0 ||
                      (selectedPart.sculpt.noise || 0) !== 0
                    )) && (
                      <button
                        type="button"
                        onClick={() => updatePartProperty(selectedPart.id, { sculpt: { pinch: 0, taper: 0, flatten: 0, ridges: 0, noise: 0 } })}
                        className="text-[9px] font-bold text-pink-600 dark:text-pink-450 hover:text-pink-800 dark:hover:text-pink-300 bg-pink-100/60 dark:bg-pink-950/20 px-2 py-0.5 rounded-lg cursor-pointer transition-all"
                      >
                        RESTAURAR
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal">
                    Modelado digital interactivo. ¡Evoluciona las formas tradicionales a nivel de esculpido de arcilla!
                  </p>

                  {/* Global propagation tools */}
                  <div className="bg-white/60 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-pink-100 dark:border-pink-900/20 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-gray-650 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer selection:bg-transparent select-none">
                        <input
                          type="checkbox"
                          checked={syncSculptGlobally}
                          onChange={(e) => setSyncSculptGlobally(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-pink-550 focus:ring-pink-400 accent-pink-550 cursor-pointer"
                        />
                        <span>Sincronizar escultura en tiempo real 🔄</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={propagateSculptToAll}
                      disabled={!selectedPart.sculpt}
                      className="w-full text-center text-[9px] font-extrabold py-1.5 px-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-550 hover:to-purple-600 hover:text-white text-pink-650 dark:text-pink-300 disabled:opacity-40 disabled:hover:from-transparent disabled:hover:bg-transparent disabled:hover:text-pink-650 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-pink-500/10"
                    >
                      💥 Propagar escultura actual a TODAS las piezas
                    </button>
                  </div>

                  {/* Slider: Pinch */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-550 dark:text-gray-305 font-semibold">Tirar Hocico / Pellizco (Pinch)</span>
                      <span className="font-mono text-pink-650 dark:text-pink-400 font-bold">{(selectedPart.sculpt?.pinch ?? 0).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={selectedPart.sculpt?.pinch ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updatePartProperty(selectedPart.id, {
                          sculpt: { ...(selectedPart.sculpt || {}), pinch: val }
                        });
                      }}
                      className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-805 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-405">
                      <span>Cara Chata ◄</span>
                      <span>► Hocico / Punta</span>
                    </div>
                  </div>

                  {/* Slider: Taper */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-550 dark:text-gray-305 font-semibold">Cónico / Estrechar (Taper)</span>
                      <span className="font-mono text-pink-655 dark:text-pink-400 font-bold">{(selectedPart.sculpt?.taper ?? 0).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={selectedPart.sculpt?.taper ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updatePartProperty(selectedPart.id, {
                          sculpt: { ...(selectedPart.sculpt || {}), taper: val }
                        });
                      }}
                      className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-805 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-405">
                      <span>Ancho Frontal ◄</span>
                      <span>► Cola / Cono Fino</span>
                    </div>
                  </div>

                  {/* Slider: Flatten */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-550 dark:text-gray-305 font-semibold">Aplanar para Impresión (Flatten)</span>
                      <span className="font-mono text-pink-655 dark:text-pink-400 font-bold">{(selectedPart.sculpt?.flatten ?? 0).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={selectedPart.sculpt?.flatten ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updatePartProperty(selectedPart.id, {
                          sculpt: { ...(selectedPart.sculpt || {}), flatten: val }
                        });
                      }}
                      className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-805 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-405">
                      <span>Boxy/Escuadra ◄</span>
                      <span>► Base Plana Suave</span>
                    </div>
                  </div>

                  {/* Slider: Ridges */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-550 dark:text-gray-305 font-semibold">Anillos de Textura (Ridges)</span>
                      <span className="font-mono text-pink-655 dark:text-pink-400 font-bold">{(selectedPart.sculpt?.ridges ?? 0).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={selectedPart.sculpt?.ridges ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updatePartProperty(selectedPart.id, {
                          sculpt: { ...(selectedPart.sculpt || {}), ridges: val }
                        });
                      }}
                      className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-805 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider: Noise */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-550 dark:text-gray-305 font-semibold">Arcilla Sólida / Rugoso (Noise)</span>
                      <span className="font-mono text-pink-655 dark:text-pink-400 font-bold">{(selectedPart.sculpt?.noise ?? 0).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.02"
                      value={selectedPart.sculpt?.noise ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updatePartProperty(selectedPart.id, {
                          sculpt: { ...(selectedPart.sculpt || {}), noise: val }
                        });
                      }}
                      className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-805 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Position X */}
                <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-zinc-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-550 font-medium">Posición Horizontal (Izquierda ◄ / ► Derecha X)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{selectedPart.position[0].toFixed(2)}m</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.02"
                    value={selectedPart.position[0]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updatePartProperty(selectedPart.id, {
                        position: [val, selectedPart.position[1], selectedPart.position[2]],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Position Y */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-550 font-medium">Posición Vertical (Abajo ▼ / ▲ Arriba Y)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{selectedPart.position[1].toFixed(2)}m</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="3.0"
                    step="0.02"
                    value={selectedPart.position[1]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updatePartProperty(selectedPart.id, {
                        position: [selectedPart.position[0], val, selectedPart.position[2]],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Position Z */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-550 font-medium">Posición Profundidad (Atrás ◄ / ► Adelante Z)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{selectedPart.position[2].toFixed(2)}m</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.02"
                    value={selectedPart.position[2]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updatePartProperty(selectedPart.id, {
                        position: [selectedPart.position[0], selectedPart.position[1], val],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Scale X */}
                <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-zinc-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Grosor (Ancho X)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.scale[0].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.8"
                    step="0.05"
                    value={selectedPart.scale[0]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updatePartProperty(selectedPart.id, {
                        scale: [val, selectedPart.scale[1], selectedPart.scale[2]],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Scale Y */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Altura (Largo Y)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.scale[1].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.8"
                    step="0.05"
                    value={selectedPart.scale[1]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updatePartProperty(selectedPart.id, {
                        scale: [selectedPart.scale[0], val, selectedPart.scale[2]],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Scale Z */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Profundidad (Prof Undo Z)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.scale[2].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.8"
                    step="0.05"
                    value={selectedPart.scale[2]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updatePartProperty(selectedPart.id, {
                        scale: [selectedPart.scale[0], selectedPart.scale[1], val],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotation Pitch */}
                <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-zinc-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Inclinación (Pitch X Rot)</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.rotation[0]}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={selectedPart.rotation[0]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updatePartProperty(selectedPart.id, {
                        rotation: [val, selectedPart.rotation[1], selectedPart.rotation[2]],
                      });
                    }}
                    className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-gray-150 dark:border-zinc-850 rounded-2xl">
                <Sliders className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-normal">
                  No hay ninguna parte seleccionada.<br />
                  Haz clic sobre una parte del animalito en 3D o búscala en la lista de arriba para empezar a editar sus dimensiones.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ACCESSORIES & DECO */}
        {activeTab === 'accessories' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Añadir Accesorios</h3>
              <p className="text-xs text-gray-400 dark:text-gray-550">Personaliza tu creación con lindos sombreros, lazos, alas, ¡y coronas!</p>
            </div>

            <div className="space-y-2 bg-slate-50/20 p-1.5 rounded-3xl">
              {ACCESSORY_TEMPLATES.map((acc, index) => (
                <button
                  key={index}
                  onClick={() => handleAddAccessory(acc)}
                  className="w-full pointer-events-auto cursor-pointer flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-150/60 dark:border-zinc-800 hover:border-pink-300/40 hover:bg-pink-50/10 rounded-[20px] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-base">
                      {acc.name.includes('Sombrero') ? '🎩' : acc.name.includes('Lazo') ? '🎀' : acc.name.includes('Corona') ? '👑' : acc.name.includes('Alas') ? '👼' : acc.name.includes('Cuernos') ? '😈' : acc.name.includes('Corazón') ? '💖' : '👓'}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-705 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">{acc.name}</div>
                      <div className="text-[9px] text-gray-400 dark:text-gray-555">Añadir al visor 3D</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-pink-500 group-hover:scale-110 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: STUDIO BACKGROUND */}
        {activeTab === 'scene' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Material de Impresión & Escena</h3>
              <p className="text-xs text-gray-400 dark:text-gray-555">Configura el filamento plástico, la laminación FDM y la iluminación.</p>
            </div>

            {/* Simulación Filamento FDM (WOW!) */}
            <div className="p-3.5 bg-gradient-to-br from-violet-500/5 to-pink-500/5 dark:from-violet-500/10 dark:to-pink-500/10 border border-violet-500/15 dark:border-violet-400/20 rounded-2xl space-y-3.5">
              <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                🔌 Filamento Plástico PLA (3D Print Base)
              </span>

              {/* Styles of filament */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'matte', label: '🔴 Mate Sólido', desc: 'Matte Standard PLA' },
                  { id: 'silk_standard', label: '✨ Seda Monocolor', desc: 'Glossy Silk PLA' },
                  { id: 'silk_dual', label: '🧬 Seda Bicapa', desc: 'Chameleon Red/Cyan' },
                  { id: 'silk_rainbow', label: '🌈 Arcoíris Silk', desc: 'Vertical Gradient PLA' },
                ].map((sty) => (
                  <button
                    key={sty.id}
                    type="button"
                    onClick={() => setFilamentStyle(sty.id as any)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      filamentStyle === sty.id
                        ? 'bg-violet-600 border-violet-600 text-white font-bold shadow-md shadow-violet-500/10'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-zinc-805'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{sty.label}</div>
                    <div className={`text-[8px] mt-0.5 ${filamentStyle === sty.id ? 'text-violet-200' : 'text-gray-400'}`}>{sty.desc}</div>
                  </button>
                ))}
              </div>

              {/* FDM Layers simulator height */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Simulador de Capas FDM</div>
                    <div className="text-[10px] text-gray-400">Activa el relieve de líneas de deposición de plástico fundido (PLA)</div>
                  </div>
                  <button
                    onClick={() => setFdmEnabled(!fdmEnabled)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      fdmEnabled ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-850'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                      fdmEnabled ? 'translate-x-4.5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {fdmEnabled && (
                  <div className="space-y-1.5 pt-2 animate-fade-in">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-550 font-semibold">Resolución del Laminado (Grosor de capas)</span>
                      <span className="font-mono text-violet-650 dark:text-violet-400 font-bold">{fdmDensity === 300 ? '0.12mm (Ultra Fino)' : fdmDensity === 200 ? '0.20mm (Estándar)' : '0.28mm (Rápido Coarse)'}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="300"
                      step="50"
                      value={fdmDensity}
                      onChange={(e) => setFdmDensity(parseInt(e.target.value, 10))}
                      className="w-full h-1 accent-violet-550 bg-gray-200 dark:bg-zinc-805 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-400">
                      <span>0.28mm Rápido ◄</span>
                      <span>► 0.12mm Detallado</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mostrar Pedestal</div>
                  <div className="text-[10px] text-gray-400">Plataforma circular suave para sostener la figura</div>
                </div>
                <button
                  onClick={() => setShowPedestal(!showPedestal)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    showPedestal ? 'bg-pink-500' : 'bg-slate-200 dark:bg-zinc-850'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    showPedestal ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Grid de Guía (Rejilla)</div>
                  <div className="text-[10px] text-gray-400">Guía de escala y posicionamiento del suelo</div>
                </div>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    showGrid ? 'bg-pink-500' : 'bg-slate-200 dark:bg-zinc-850'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    showGrid ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-pink-50/15 dark:bg-zinc-900/50 border border-pink-100/20 dark:border-zinc-800 rounded-3xl flex gap-3 items-start pt-4.5 text-xs text-slate-600 dark:text-gray-400">
              <Award className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-700 dark:text-gray-300">¿Cómo funciona la Exportación OBJ?</strong>
                <p className="text-[11px] leading-normal mt-1 text-gray-500 dark:text-gray-450">
                  Cuando exportas, la app descarga un archivo <strong>.obj</strong> (la malla 3D) y un archivo <strong>.mtl</strong> (la paleta de colores/materiales). Pon ambos archivos en la misma carpeta e impórtalos en software como Blender, Unity o Unreal Engine para ver tu modelo con sus texturas completas y colores hermosos y originales.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
