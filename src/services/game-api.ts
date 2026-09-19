import { BuffId, PokerAction, PublicGameState } from '@/game/types';

export async function sendGameAction(params: {
  gameId: string;
  sequence: number;
  action: PokerAction | 'TOGGLE_SELECT' | 'SET_SELECTED_CARDS' | 'BUY_ITEM' | 'SELL_JOKER' | 'REROLL_SHOP' | 'NEXT_BLIND' | 'DISCARD' | 'PLAY_HAND';
  clientState: PublicGameState;
  [key: string]: unknown;
}) {
  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function startGameApi(mode: string = 'roguelike') {
  const res = await fetch('/api/game/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  return res.json();
}

export async function pickBuffApi(gameId: string, buffId: BuffId) {
  const res = await fetch('/api/game/buff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, buffId }),
  });
  return res.json();
}
