'use client';

import React, { useEffect } from 'react';
import { HistoryList } from './history-list';
import { audioManager } from '@/lib/audio/audio-manager';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    audioManager.playSfx('modalOpen');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[900px] max-h-[92vh] overflow-y-auto bg-zinc-950 border-2 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative my-auto">
        <HistoryList onClose={onClose} />
      </div>
    </div>
  );
}
