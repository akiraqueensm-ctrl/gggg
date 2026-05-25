/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, RotateCcw, HelpCircle, X, ChevronRight, Sparkles } from 'lucide-react';

interface HeaderProps {
  onExportObj: () => void;
  onExportMtl: () => void;
  onResetCamera: () => void;
  animalName: string;
  setAnimalName: (val: string) => void;
}

export function Header({
  onExportObj,
  onExportMtl,
  onResetCamera,
  animalName,
  setAnimalName,
}: HeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="w-full bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-855 px-6 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 relative select-none">
      
      {/* Brand title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center shrink-0">
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </div>
        <div>
          <h1 className="text-base md:text-md font-extrabold tracking-tight text-slate-900 dark:text-gray-100 flex items-center gap-1.5">
            ChibiCraft<span className="text-pink-500">3D</span>
            <span className="text-[10px] bg-pink-50 dark:bg-pink-950/20 text-pink-500 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">v1.2</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Diseña tus animalitos y expórtalos en OBJ 3D</p>
        </div>
      </div>

      {/* Model Name Input */}
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-full px-4 py-1.5 w-full md:w-auto max-w-xs">
        <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500 shrink-0 uppercase tracking-wider">Nombre:</span>
        <input
          type="text"
          value={animalName}
          onChange={(e) => setAnimalName(e.target.value.slice(0, 24))}
          placeholder="Mi Animalito Cute"
          className="text-xs font-bold text-slate-700 dark:text-gray-205 bg-transparent focus:outline-none w-full placeholder-slate-300 dark:placeholder-zinc-700"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {/* Reset Position camera */}
        <button
          onClick={onResetCamera}
          className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/65 rounded-full transition-all shadow-sm cursor-pointer"
          title="Restaurar Cámara"
        >
          <RotateCcw className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
        </button>

        {/* Learn To Import Help button */}
        <button
          onClick={() => setShowHelp(true)}
          className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200/90 dark:hover:bg-zinc-800 text-slate-700 dark:text-gray-300 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-pink-550" />
          <span className="hidden md:inline">¿Cómo importar?</span>
        </button>

        {/* EXPORT DIRECT OBJ */}
        <button
          onClick={onExportObj}
          className="px-5 py-2.5 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] text-white dark:text-zinc-900 text-xs font-bold rounded-full flex items-center justify-center gap-1.5 shadow-lg shadow-slate-200 dark:shadow-none transition-all duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Exportar .OBJ</span>
        </button>

        {/* EXPORT COMPANION MTL */}
        <button
          onClick={onExportMtl}
          className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-bold rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          title="Exporta los materiales y colores vinculados"
        >
          <span>.MTL</span>
        </button>
      </div>

      {/* HELP / IMPORTING IN BLENDER MODAL */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in pointer-events-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-550 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2.5 items-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/20 text-pink-500 flex items-center justify-center text-xl font-bold">
                🔮
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100">Guía: Importar en Blender</h3>
            </div>

            <div className="space-y-4 text-xs text-slate-650 dark:text-gray-300 leading-normal">
              <p>
                Tu modelo se exporta usando el formato estándar de la industria 3D (<strong>Wavefront OBJ</strong>). Para abrirlo con todos sus colores, sigue estos sencillos pasos:
              </p>

              <ol className="space-y-3 list-decimal pl-4.5">
                <li>
                  Descarga tanto el archivo <strong className="text-pink-500">.OBJ</strong> como el archivo <strong className="text-slate-700 dark:text-zinc-300">.MTL</strong>.
                </li>
                <li>
                  Asegúrate de guardar <strong>ambos archivos juntos</strong> en la misma carpeta de tu computadora.
                </li>
                <li>
                  Abre Blender y dirígete a: <br />
                  <span className="font-mono bg-slate-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-gray-400">File &gt; Import &gt; Wavefront (.obj)</span>
                </li>
                <li>
                  Selecciona tu archivo .OBJ y cárgalo. El archivo MTL se aplicará en segundo plano automáticamente.
                </li>
                <li>
                  Para ver los colores mágicos, recuerda cambiar el modo de vista (Viewport Shading) en la esquina superior derecha de Blender a <strong className="text-pink-500">Material Preview</strong> o <strong className="text-pink-500">Rendered</strong>.
                </li>
              </ol>

              <div className="p-3 bg-pink-50/50 dark:bg-pink-950/10 border border-pink-100/40 dark:border-pink-900/20 rounded-2xl flex gap-2 items-start mt-4">
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 dark:text-gray-400">
                  ¡También puedes importar este modelo OBJ en Unity, Unreal Engine, Godot, Mixamo o imprimirlo directamente en 3D!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white dark:hover:text-black font-semibold text-xs rounded-full transition-all cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
