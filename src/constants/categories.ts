import type { Category, CategoryInfo } from '../types/app.types';

export const CATEGORIES: CategoryInfo[] = [
  { value: 'electronics', label: '전자기기', icon: 'phone-portrait-outline', iconLib: 'Ionicons' },
  { value: 'wallet', label: '지갑', icon: 'wallet-outline', iconLib: 'Ionicons' },
  { value: 'keys', label: '열쇠', icon: 'key-outline', iconLib: 'Ionicons' },
  { value: 'pet', label: '반려동물', icon: 'paw-outline', iconLib: 'Ionicons' },
  { value: 'bag', label: '가방', icon: 'bag-handle-outline', iconLib: 'Ionicons' },
  { value: 'clothing', label: '의류', icon: 'shirt-outline', iconLib: 'Ionicons' },
  { value: 'shoes', label: '신발', icon: 'footsteps-outline', iconLib: 'Ionicons' },
  { value: 'toy', label: '장난감', icon: 'game-controller-outline', iconLib: 'Ionicons' },
  { value: 'other', label: '기타', icon: 'ellipsis-horizontal-circle-outline', iconLib: 'Ionicons' },
];

export function getCategoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryIcon(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.icon ?? 'ellipsis-horizontal-circle-outline';
}

export function getCategoryInfo(value: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.value === value) ?? {
    value: 'other',
    label: '기타',
    icon: 'ellipsis-horizontal-circle-outline',
    iconLib: 'Ionicons',
  };
}
