'use client';

import React from 'react';
import { RANK_NAMES } from '@/game/poker/evaluator';
import { PokerCardProps, SIZE_CONFIG } from './poker-card-config';
import { audioManager } from '@/lib/audio/audio-manager';

export type { PokerCardProps } from './poker-card-config';

function CardCornerPip({
  positionClass,
  rankClass,
  suitClass,
  rankStr,
  suit,
  isRed,
  rotated = false,
}: {
  positionClass: string;
  rankClass: string;
  suitClass: string;
  rankStr: string;
  suit: string;
  isRed: boolean;
  rotated?: boolean;
}) {
  return (
    <div
      className={`absolute ${positionClass} flex flex-col items-center leading-none pointer-events-none z-10 gap-0.5 ${
        rotated ? 'rotate-180 origin-center' : ''
      }`}
    >
      <span
        className={`retro font-bold ${rankClass} leading-none ${
          rankStr === '10' ? 'tracking-tighter' : ''
        } ${isRed ? 'text-red-400' : 'text-zinc-100'}`}
      >
        {rankStr}
      </span>
      <span
        className={`select-none ${suitClass} leading-none ${
          isRed ? 'text-red-400' : 'text-zinc-300'
        }`}
      >
        {suit}
      </span>
    </div>
  );
}

export function PokerCard({
  card,
  faceDown = false,
  highlight = false,
  selected = false,
  onClick,
  className = '',
  size = 'md',
}: PokerCardProps) {
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  const config = SIZE_CONFIG[size];

  if (faceDown || !card) {
    return (
      <div
        className={`relative ${config.card} rounded-none border-2 border-slate-600 bg-slate-900 flex flex-col items-center justify-center select-none shadow-[2px_2px_0px_#000] overflow-hidden ${className}`}
      >
        {/* Retro diagonal hatch pattern back */}
        <div className="absolute inset-1 border border-slate-700 bg-slate-950 flex items-center justify-center">
          <div className="text-emerald-500/40 text-lg font-mono animate-pulse">
            [ ? ]
          </div>
        </div>
      </div>
    );
  }

  const rankStr = RANK_NAMES[card.rank] || `${card.rank}`;

  // Modifier visual cues
  const isFoil = card.modifier === 'FOIL' || (card.extraChips && card.extraChips > 0);
  const isHolo = card.modifier === 'HOLO';
  const isPoly = card.modifier === 'POLY';

  const modifierBorderClass = isPoly
    ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
    : isHolo
    ? 'border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.6)]'
    : isFoil
    ? 'border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
    : '';

  return (
    <div
      onClick={() => {
        if (onClick) {
          audioManager.playSfx('cardSelect');
          onClick();
        }
      }}
      className={`relative ${config.card} rounded-none border-2 ${
        selected
          ? '-translate-y-3.5 border-emerald-400 bg-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400/80 z-20'
          : highlight
          ? 'border-yellow-400 bg-zinc-900 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
          : modifierBorderClass || `border-zinc-500 bg-zinc-950 ${config.shadow} hover:border-zinc-300`
      } select-none transition-all duration-150 ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${className}`}
    >
      {/* Foil / Holographic Shimmer Effect */}
      {(isFoil || isHolo || isPoly) && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {isFoil && (
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-emerald-500/15 to-transparent animate-pulse" />
          )}
          {isHolo && (
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/15 via-pink-500/15 to-transparent animate-pulse" />
          )}
          {isPoly && (
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-red-500/15 to-blue-500/15" />
          )}
        </div>
      )}

      {/* Selected Indicator Pill */}
      {selected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-emerald-500 text-black retro text-[8px] font-black leading-none uppercase shadow-sm whitespace-nowrap z-30">
          PICK
        </div>
      )}

      {/* Modifier / Extra Chips Badge in Top-Right */}
      {(isFoil || isHolo || isPoly) && (
        <div className="absolute top-0.5 right-0.5 px-1 py-0.2 bg-black/80 border border-zinc-700 retro text-[7px] font-bold z-20 leading-none whitespace-nowrap">
          {isPoly ? (
            <span className="text-amber-400">×1.5</span>
          ) : isHolo ? (
            <span className="text-purple-400">+10m</span>
          ) : card.extraChips ? (
            <span className="text-cyan-300">+{card.extraChips}c</span>
          ) : (
            <span className="text-cyan-300">FOIL</span>
          )}
        </div>
      )}

      {/* Top-Left Corner Index */}
      <CardCornerPip
        positionClass={config.topCorner}
        rankClass={config.rank}
        suitClass={config.cornerSuit}
        rankStr={rankStr}
        suit={card.suit}
        isRed={isRed}
      />

      {/* Center Suit Emblem */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 ${
          !config.showBottomCorner ? 'pt-2.5 pl-2' : ''
        }`}
      >
        <span
          className={`font-black select-none ${config.centerSuit} ${
            isRed ? 'text-red-500/70' : 'text-zinc-200/70'
          }`}
        >
          {card.suit}
        </span>
      </div>

      {/* Bottom-Right Corner Index */}
      {config.showBottomCorner && (
        <CardCornerPip
          positionClass={config.bottomCorner}
          rankClass={config.rank}
          suitClass={config.cornerSuit}
          rankStr={rankStr}
          suit={card.suit}
          isRed={isRed}
          rotated={true}
        />
      )}
    </div>
  );
}
