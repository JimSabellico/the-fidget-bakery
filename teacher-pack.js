import { catalog } from './catalog.js';

export const teacherPackSize = 10;
export const teacherPackPriceCents = 6000;
export const packFidgets = catalog.filter(item => item.category === 'fidgets');

export function normalizeTeacherPack(value) {
  if (!value || !['single', 'random', 'custom'].includes(value.mode)) return null;
  if (value.mode === 'random') return { mode: 'random', selection: [] };
  if (!Array.isArray(value.selection) || value.selection.length < 1 || value.selection.length > packFidgets.length) return null;
  const seen = new Set();
  const selection = [];
  for (const choice of value.selection) {
    if (!packFidgets.some(item => item.id === choice?.id) || !Number.isInteger(choice.quantity) || choice.quantity < 1 || choice.quantity > teacherPackSize || seen.has(choice.id)) return null;
    seen.add(choice.id);
    selection.push({ id: choice.id, quantity: choice.quantity });
  }
  if (selection.reduce((sum, choice) => sum + choice.quantity, 0) !== teacherPackSize) return null;
  if (value.mode === 'single' && (selection.length !== 1 || selection[0].quantity !== teacherPackSize)) return null;
  return { mode: value.mode, selection };
}

export function teacherPackDescription(pack) {
  if (pack.mode === 'random') return 'Surprise assortment of 10 fidgets; repeats may be included.';
  return pack.selection.map(choice => `${choice.quantity} × ${packFidgets.find(item => item.id === choice.id).name}`).join(', ');
}

export function teacherPackMetadata(pack) {
  return pack.mode === 'random' ? 'random assortment of 10' : `${pack.mode}: ${pack.selection.map(choice => `${choice.id} x${choice.quantity}`).join(', ')}`;
}
