import type { TemplateColor } from '../types';

// Цвета смен из UI-кита Figma («Смена проставленная»).
// Полные строки классов, а не склейка: Tailwind находит классы, только если они написаны целиком.
export const shiftColors: Record<TemplateColor | 'custom', { cell: string; hours: string; border: string }> = {
    blue: { cell: 'bg-[#e9eefd] text-ink', hours: 'text-[#5b7cf0]', border: 'border-l-[#8fa9f5]' }, // Утро
    violet: { cell: 'bg-[#ebe3fd] text-ink', hours: 'text-[#7c5cf0]', border: 'border-l-[#a58cf5]' }, // День
    teal: { cell: 'bg-[#dcf5f0] text-ink', hours: 'text-[#16a394]', border: 'border-l-[#6fd3c3]' }, // Вечер
    custom: { cell: 'bg-primary text-white', hours: 'text-white/80', border: 'border-l-primary' }, // своя смена
};
