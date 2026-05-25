/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Part, FaceConfig, EyeExpression, MouthExpression } from '../types';
import { ANIMAL_PRESETS, ACCESSORY_TEMPLATES, PALETTES } from '../data/presets';
import { Sparkles, Sliders, Smile, Award, Settings, Plus, Trash2, HelpCircle, Activity, Zap, Shield, HelpCircle as InfoIcon } from 'lucide-react';

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
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'flexi' | 'face' | 'parts' | 'accessories' | 'scene'>('presets');

  // Find currently selected part
  const selectedPart = parts.find((p) => p.id === selectedPartId);

  // Update a single part's properties
  const updatePartProperty = (partId: string, updates: Partial<Part>) => {
    setParts((prevParts) => {
      const mainPart = prevParts.find((p) => p.id === partId);
      if (!mainPart) return prevParts;

      return prevParts.map((part) => {
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

  // Delete accessory
  const handleDeleteAccessory = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
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
      <div className="flex-1 overflow-y-auto p-4 lg:p-5 h-full space-y-6">
        
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
                    {p.name} {p.category === 'accessories' ? '✨' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedPart ? (
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-[24px] border border-slate-100 dark:border-zinc-850 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                      {selectedPart.name}
                    </span>
                    <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 font-bold rounded">
                      ID: {selectedPart.id}
                    </span>
                  </div>
                  {selectedPart.category === 'accessories' && (
                    <button
                      onClick={() => handleDeleteAccessory(selectedPart.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg cursor-pointer"
                      title="Quitar accesorio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Escenario & Fotografía</h3>
              <p className="text-xs text-gray-400 dark:text-gray-555">Modifica el escenario en el que posa tu adorable animal 3D.</p>
            </div>

            <div className="flex flex-col gap-4 pt-2">
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
