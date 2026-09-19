'use client';

import { useEffect } from 'react';
import { useAudioStore } from '@/store/audio-store';
import { setupAutoplayUnlock } from '@/lib/audio/audio-context';
import { audioManager } from '@/lib/audio/audio-manager';

export function AudioInit() {
  const initAudioStore = useAudioStore((s) => s.initAudioStore);

  useEffect(() => {
    initAudioStore();
    setupAutoplayUnlock(() => {
      audioManager.startBgm();
    });
  }, [initAudioStore]);

  return null;
}
