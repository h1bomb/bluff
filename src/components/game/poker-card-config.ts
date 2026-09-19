import { Card as CardType } from '@/game/types';

export interface PokerCardProps {
  card?: CardType | null;
  faceDown?: boolean;
  highlight?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive';
}

export const SIZE_CONFIG = {
  xs: {
    card: 'w-11 h-16',
    rank: 'text-[10px]',
    cornerSuit: 'text-[8px]',
    centerSuit: 'text-sm sm:text-base',
    topCorner: 'top-1 left-1',
    bottomCorner: 'bottom-1 right-1',
    showBottomCorner: false,
    shadow: 'shadow-[1.5px_1.5px_0px_#000]',
  },
  sm: {
    card: 'w-12 h-18 sm:w-13 sm:h-19',
    rank: 'text-[11px]',
    cornerSuit: 'text-[9px]',
    centerSuit: 'text-base sm:text-lg',
    topCorner: 'top-1 left-1.5',
    bottomCorner: 'bottom-1 right-1.5',
    showBottomCorner: false,
    shadow: 'shadow-[2px_2px_0px_#000]',
  },
  responsive: {
    card: 'w-full aspect-[5/7]',
    rank: 'text-[11px] sm:text-xs',
    cornerSuit: 'text-[9px] sm:text-[10px]',
    centerSuit: 'text-base sm:text-lg',
    topCorner: 'top-1 left-1 sm:left-1.5',
    bottomCorner: 'bottom-1 right-1 sm:right-1.5',
    showBottomCorner: false,
    shadow: 'shadow-[2px_2px_0px_#000]',
  },
  md: {
    card: 'w-20 h-28',
    rank: 'text-sm',
    cornerSuit: 'text-xs',
    centerSuit: 'text-4xl',
    topCorner: 'top-1.5 left-2',
    bottomCorner: 'bottom-1.5 right-2',
    showBottomCorner: true,
    shadow: 'shadow-[3px_3px_0px_#000]',
  },
  lg: {
    card: 'w-24 h-36',
    rank: 'text-base',
    cornerSuit: 'text-sm',
    centerSuit: 'text-5xl',
    topCorner: 'top-2 left-2.5',
    bottomCorner: 'bottom-2 right-2.5',
    showBottomCorner: true,
    shadow: 'shadow-[3px_3px_0px_#000]',
  },
};
