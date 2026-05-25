/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface ExportResult {
  obj: string;
  mtl: string;
}

export function exportToObjMtl(sceneGroup: THREE.Group, animalName: string): ExportResult {
  let obj = `# Cute 3D Animal: ${animalName}\n`;
  obj += `# Created with Cute 3D Animal Creator\n`;
  obj += `mtllib ${animalName.toLowerCase().replace(/\s+/g, '_')}.mtl\n\n`;

  let mtl = `# Materials for ${animalName}\n\n`;

  let vertexCount = 0;
  let normalCount = 0;

  const uniqueMaterials = new Map<string, { color: THREE.Color, roughness: number, metalness: number }>();

  // Temporary variables to avoid allocation inside loops
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();

  // Helper lists
  const verticesLines: string[] = [];
  const normalsLines: string[] = [];
  const facesLines: string[] = [];

  sceneGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mesh = child;
      const geometry = mesh.geometry;

      if (!geometry) return;

      // Ensure geometry has positions
      const posAttr = geometry.attributes.position;
      if (!posAttr) return;

      // Extract material info
      let colorHex = '#ffffff';
      let roughness = 0.8;
      let metalness = 0.1;

      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        colorHex = '#' + mesh.material.color.getHexString();
        roughness = mesh.material.roughness;
        metalness = mesh.material.metalness;
      } else if (Array.isArray(mesh.material)) {
        // Handle array of materials if any
        const mainMat = mesh.material[0];
        if (mainMat instanceof THREE.MeshStandardMaterial) {
          colorHex = '#' + mainMat.color.getHexString();
          roughness = mainMat.roughness;
          metalness = mainMat.metalness;
        }
      }

      const matName = `Mat_${colorHex.replace('#', '')}_r_${Math.round(roughness * 100)}_m_${Math.round(metalness * 100)}`;
      
      if (!uniqueMaterials.has(matName)) {
        uniqueMaterials.set(matName, {
          color: new THREE.Color(colorHex),
          roughness,
          metalness
        });
      }

      // We turn on matrixWorld updating
      mesh.updateMatrixWorld(true);
      const worldMatrix = mesh.matrixWorld;
      normalMatrix.getNormalMatrix(worldMatrix);

      // Get positions and normals
      const normAttr = geometry.attributes.normal;
      const indexAttr = geometry.index;

      facesLines.push(`\ng ${mesh.name || 'part'}`);
      facesLines.push(`usemtl ${matName}`);

      const localVertexOffset = vertexCount + 1;
      const localNormalOffset = normalCount + 1;

      // Write vertices
      for (let i = 0; i < posAttr.count; i++) {
        vertex.fromBufferAttribute(posAttr, i);
        vertex.applyMatrix4(worldMatrix);
        verticesLines.push(`v ${vertex.x.toFixed(4)} ${vertex.y.toFixed(4)} ${vertex.z.toFixed(4)}`);
        vertexCount++;
      }

      // Write normals
      if (normAttr) {
        for (let i = 0; i < normAttr.count; i++) {
          normal.fromBufferAttribute(normAttr, i);
          normal.applyMatrix3(normalMatrix).normalize();
          normalsLines.push(`vn ${normal.x.toFixed(4)} ${normal.y.toFixed(4)} ${normal.z.toFixed(4)}`);
          normalCount++;
        }
      }

      // Write faces
      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i += 3) {
          const a = indexAttr.getX(i) + localVertexOffset;
          const b = indexAttr.getX(i + 1) + localVertexOffset;
          const c = indexAttr.getX(i + 2) + localVertexOffset;

          if (normAttr) {
            const na = indexAttr.getX(i) + localNormalOffset;
            const nb = indexAttr.getX(i + 1) + localNormalOffset;
            const nc = indexAttr.getX(i + 2) + localNormalOffset;
            facesLines.push(`f ${a}//${na} ${b}//${nb} ${c}//${nc}`);
          } else {
            facesLines.push(`f ${a} ${b} ${c}`);
          }
        }
      } else {
        // Non-indexed faces (triangles sequence)
        for (let i = 0; i < posAttr.count; i += 3) {
          const a = i + localVertexOffset;
          const b = i + 1 + localVertexOffset;
          const c = i + 2 + localVertexOffset;

          if (normAttr) {
            const na = i + localNormalOffset;
            const nb = i + 1 + localNormalOffset;
            const nc = i + 2 + localNormalOffset;
            facesLines.push(`f ${a}//${na} ${b}//${nb} ${c}//${nc}`);
          } else {
            facesLines.push(`f ${a} ${b} ${c}`);
          }
        }
      }
    }
  });

  // Assemble OBJ
  obj += verticesLines.join('\n') + '\n\n';
  if (normalCount > 0) {
    obj += normalsLines.join('\n') + '\n\n';
  }
  obj += facesLines.join('\n') + '\n';

  // Generate MTL
  uniqueMaterials.forEach((props, name) => {
    mtl += `newmtl ${name}\n`;
    mtl += `Kd ${props.color.r.toFixed(4)} ${props.color.g.toFixed(4)} ${props.color.b.toFixed(4)}\n`;
    mtl += `Ka ${(props.color.r * 0.15).toFixed(4)} ${(props.color.g * 0.15).toFixed(4)} ${(props.color.b * 0.15).toFixed(4)}\n`;
    mtl += `Ks 0.15 0.15 0.15\n`;
    // Approximate shininess exponent (Ns) based on roughness: low roughness = high shininess
    const shininess = Math.max(1, Math.round((1.0 - props.roughness) * 200));
    mtl += `Ns ${shininess}.0000\n`;
    mtl += `illum 2\n\n`;
  });

  return { obj, mtl };
}

/**
 * Fires a browser download for a raw string as a text file
 */
export function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
