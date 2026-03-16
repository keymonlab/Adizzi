import type { Category, CategoryInfo } from '../types/app.types';

export const CATEGORIES: CategoryInfo[] = [
  { value: 'electronics', label: '전자기기', icon: '📱' },
  { value: 'wallet', label: '지갑', icon: '👛' },
  { value: 'keys', label: '열쇠', icon: '🔑' },
  { value: 'pet', label: '반려동물', icon: '🐾' },
  { value: 'bag', label: '가방', icon: '🎒' },
  { value: 'clothing', label: '의류', icon: '🧥' },
  { value: 'shoes', label: '신발', icon: '👟' },
  { value: 'toy', label: '장난감', icon: '🧸' },
  { value: 'other', label: '기타', icon: '📦' },
];

export function getCategoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryIcon(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.icon ?? '📦';
}
