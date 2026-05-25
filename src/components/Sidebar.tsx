/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Part, FaceConfig, EyeExpression, MouthExpression } from '../types';
import { ANIMAL_PRESETS, ACCESSORY_TEMPLATES, PALETTES } from '../data/presets';
import { Sparkles, Sliders, Smile, Award, Settings, Plus, Trash2, HelpCircle } from 'lucide-react';

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
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'face' | 'parts' | 'accessories' | 'scene'>('presets');

  // Find currently selected part
  const selectedPart = parts.find((p) => p.id === selectedPartId);

  // Update a single part's properties
  const updatePartProperty = (partId: string, updates: Partial<Part>) => {
    setParts((prevParts) => {
      // Find the part to update
      const mainPart = prevParts.find((p) => p.id === partId);
      if (!mainPart) return prevParts;

      return prevParts.map((part) => {
        // Apply main updates
        if (part.id === partId) {
          return { ...part, ...updates };
        }

        // Apply mirrored updates if Mirror editing is applicable
        if (mainPart.mirrorId && part.id === mainPart.mirrorId) {
          const mirroredUpdates: Partial<Part> = { ...updates };
          
          // Mirror position on X-axis: if we shifted X left, shift right
          if (updates.position !== undefined) {
            mirroredUpdates.position = [
              -updates.position[0],
              updates.position[1],
              updates.position[2]
            ];
          }
          
          // Mirror scales directly (no inversion needed)
          if (updates.scale !== undefined) {
            mirroredUpdates.scale = [...updates.scale];
          }

          // Mirror rotation around Y & Z axes: swap signs to keep symmetry
          if (updates.rotation !== undefined) {
            mirroredUpdates.rotation = [
              updates.rotation[0],       // X rotation (same)
              -updates.rotation[1],      // Y rotation (mirror)
              -updates.rotation[2]       // Z rotation (mirror)
            ];
          }

          return { ...part, ...mirroredUpdates };
        }

        return part;
      });
    });
  };

  // Add a new accessory to the scene
  const handleAddAccessory = (accTemplate: Omit<Part, 'id'>) => {
    const accId = `accessory_${Date.now()}`;
    const newAccessory: Part = {
      ...accTemplate,
      id: accId,
      isAccessory: true,
      visible: true,
    };
    setParts((prev) => [...prev, newAccessory]);
    setSelectedPartId(accId);
  };

  // Delete designated accessory
  const handleDeletePart = (partId: string) => {
    setParts((prev) => prev.filter((p) => p.id !== partId));
    if (selectedPartId === partId) setSelectedPartId(null);
  };

  return (
    <div className="w-full lg:w-96 bg-white dark:bg-zinc-950 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-zinc-800 flex flex-col flex-1 lg:flex-none h-1/2 lg:h-full overflow-hidden select-none">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/10 p-1.5 gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'presets', label: 'Plantillas', icon: Sparkles },
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
              className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-semibold border-b-2 border-pink-500'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30'
              }`}
            >
              <IconObj className="w-4 h-4 mb-0.5" />
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
            
            <div className="grid grid-cols-2 gap-2.5">
              {ANIMAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onLoadPreset(preset.id)}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-zinc-900 hover:bg-pink-50/55 dark:hover:bg-pink-500/5 border border-slate-100 dark:border-zinc-800 hover:border-pink-300/40 rounded-[24px] transition-all group pointer-events-auto cursor-pointer text-center"
                >
                  <span className="text-4xl mb-2 filter drop-shadow hover:scale-110 transition-transform duration-200">{preset.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">{preset.name}</span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-550 mt-1 line-clamp-1 leading-tight">{preset.description}</span>
                </button>
              ))}
            </div>

            {/* General Advice */}
            <div className="p-3 bg-blue-50/40 dark:bg-zinc-900 border border-blue-100/20 dark:border-zinc-800/80 rounded-xl flex gap-2.5 items-start">
              <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                ¡Puedes hacer clic en cualquier parte del muñequito en 3D para editarla inmediatamente! Usa los controles en la pestaña <strong>Editar 3D</strong> para moldear y pintar.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: FACE EXPRESSIONS */}
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
                    face.hasCheeks ? 'bg-pink-500' : 'bg-gray-250 dark:bg-zinc-850'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    face.hasCheeks ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Eye Spacing / Eye Height Sliders */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-gray-400 dark:text-gray-500">Separación de Ojos</span>
                    <span className="text-gray-700 dark:text-gray-300">x{face.eyeSpacing.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={face.eyeSpacing}
                    onChange={(e) => setFace(f => ({ ...f, eyeSpacing: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500 h-1 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-gray-400 dark:text-gray-500">Altura del Rostro</span>
                    <span className="text-gray-700 dark:text-gray-300">x{face.eyeHeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={face.eyeHeight}
                    onChange={(e) => setFace(f => ({ ...f, eyeHeight: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500 h-1 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Color selectors for eye/shading */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-gray-405">Ojos y Boca</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={face.eyeColor}
                      onChange={(e) => setFace(f => ({ ...f, eyeColor: e.target.value, mouthColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-400">{face.eyeColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-gray-405">Rubor</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={face.cheekColor}
                      onChange={(e) => setFace(f => ({ ...f, cheekColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono uppercase text-gray-400">{face.cheekColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PARTS CUSTOMIZER & HIERARCHY */}
        {activeTab === 'parts' && (
          <div className="space-y-5">
            {/* Parts List Selector (Hierarchy) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Estructura del Animalito</label>
              <select
                value={selectedPartId || ''}
                onChange={(e) => setSelectedPartId(e.target.value || null)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-zinc-90 w-full rounded-xl border border-gray-150 dark:border-zinc-850 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="">-- Selecciona una Parte 3D --</option>
                <optgroup label="Cuerpo Principal">
                  {parts.filter(p => !p.isAccessory && (p.category === 'body' || p.category === 'head')).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Extremidades y Detalles">
                  {parts.filter(p => !p.isAccessory && (p.category === 'limbs' || p.category === 'face')).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                {parts.some(p => p.isAccessory) && (
                  <optgroup label="Accesorios Añadidos">
                    {parts.filter(p => p.isAccessory).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Transform Controls for Selected Part */}
            {selectedPart ? (
              <div className="space-y-5 pt-3 border-t border-gray-100 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                      {selectedPart.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                      Forma: {selectedPart.shape} {selectedPart.mirrorId ? '(Simétrico)' : ''}
                    </span>
                  </div>

                  {selectedPart.isAccessory && (
                    <button
                      onClick={() => handleDeletePart(selectedPart.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar Accesorio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Color & Material Properties */}
                <div className="space-y-3.5 p-3.5 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-450">Color del Componente</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedPart.color}
                        onChange={(e) => updatePartProperty(selectedPart.id, { color: e.target.value })}
                        className="w-10 h-7 overflow-hidden border border-gray-200 dark:border-zinc-800 rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 uppercase">
                        {selectedPart.color}
                      </span>
                    </div>
                  </div>

                  {/* Curated Colors Quick-Palette */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Paleta Kawaii Sugerida</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(PALETTES[0].colors.concat(PALETTES[1].colors)).map((colorHex, idx) => (
                        <button
                          key={idx}
                          onClick={() => updatePartProperty(selectedPart.id, { color: colorHex[1] })}
                          className="w-4.5 h-4.5 rounded-full border border-black/5 hover:scale-110 active:scale-95 transition-transform pointer-events-auto cursor-pointer"
                          style={{ backgroundColor: colorHex[1] }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Shiny / Clay Slider */}
                  <div className="space-y-1 pt-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400 dark:text-gray-500">Textura (Brillo)</span>
                      <span className="text-gray-700 dark:text-gray-350">
                        {selectedPart.roughness < 0.4 ? 'Brillante/Plástico' : selectedPart.roughness > 0.7 ? 'Mate/Arcilla' : 'Normal'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.05"
                      value={selectedPart.roughness}
                      onChange={(e) => updatePartProperty(selectedPart.id, { roughness: parseFloat(e.target.value) })}
                      className="w-full h-1 accent-pink-500 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3D POSITION (Translate) */}
                <div className="space-y-2.5">
                  <h5 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Posición (X, Y, Z)</h5>
                  
                  {/* Position X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Izquierda / Derecha (X)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.position[0].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.02"
                      value={selectedPart.position[0]}
                      disabled={selectedPart.mirrorId !== undefined && selectedPart.id > selectedPart.mirrorId} // disable secondary mirror parts
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
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Abajo / Arriba (Y)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.position[1].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.5"
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
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Atrás / Adelante (Z)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.position[2].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
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
                </div>

                {/* 3D SCALING (Size X, Y, Z) */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-zinc-900">
                  <h5 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tamaño / Grosor (Ancho, Alto, Profundidad)</h5>
                  
                  {/* Aspect Lock indicator/toggle if helpful, but free scaling is extremely funny and cute ! */}
                  
                  {/* Scale X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Grosor Horizontal (X)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.scale[0].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.8"
                      step="0.02"
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
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Altura del Componente (Y)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.scale[1].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.8"
                      step="0.02"
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
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Profundidad (Z)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.scale[2].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.8"
                      step="0.02"
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
                </div>

                {/* 3D ROTATION (degrees) */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-zinc-900">
                  <h5 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Inclinación (Rotación)</h5>
                  
                  {/* Rotation Z */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Rotar de Lado (Z)</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{selectedPart.rotation[2]}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={selectedPart.rotation[2]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updatePartProperty(selectedPart.id, {
                          rotation: [selectedPart.rotation[0], selectedPart.rotation[1], val],
                        });
                      }}
                      className="w-full h-1 accent-pink-550 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Rotation X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Rotar Adelante / Atrás (X)</span>
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

        {/* TAB 4: ACCESSORIES & DECO */}
        {activeTab === 'accessories' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Añadir Accesorios</h3>
              <p className="text-xs text-gray-400 dark:text-gray-550">Personaliza tu creación con lindos sombreros, lazos, alas, ¡y coronas!</p>
            </div>

            <div className="space-y-2">
              {ACCESSORY_TEMPLATES.map((acc, index) => (
                <button
                  key={index}
                  onClick={() => handleAddAccessory(acc)}
                  className="w-full pointer-events-auto cursor-pointer flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-150/60 dark:border-zinc-800 hover:border-pink-300/40 hover:bg-pink-50/10 rounded-[20px] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold">
                      {acc.name.includes('Sombrero') ? '🎩' : acc.name.includes('Lazo') ? '🎀' : acc.name.includes('Corona') ? '👑' : acc.name.includes('Alas') ? '👼' : acc.name.includes('Cuernos') ? '😈' : acc.name.includes('Corazón') ? '💖' : '👓'}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-705 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">{acc.name}</div>
                      <div className="text-[9px] text-gray-400 dark:text-gray-550">Haga clic para agregar al modelo 3D</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-pink-500 group-hover:scale-110 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STUDIO BACKGROUND */}
        {activeTab === 'scene' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Escenario & Fotografía</h3>
              <p className="text-xs text-gray-400 dark:text-gray-550">Modifica el escenario en el que posa tu adorable animal 3D.</p>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              {/* Pedestal toggle */}
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

              {/* Grid toggle */}
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

            {/* General tips */}
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
