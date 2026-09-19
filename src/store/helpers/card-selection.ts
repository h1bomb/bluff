import { Card, PublicGameState } from '@/game/types';

export function resolveCardIdsToPlay(
  publicState: PublicGameState,
  customCardIds?: string[]
): string[] {
  const availableCardIds = (publicState.playerCards || []).map((c: Card) => c.id);

  if (
    customCardIds &&
    customCardIds.length >= 1 &&
    customCardIds.length <= 5 &&
    customCardIds.every((id) => availableCardIds.includes(id))
  ) {
    return customCardIds;
  }

  if (
    publicState.selectedCardIds &&
    publicState.selectedCardIds.length >= 1 &&
    publicState.selectedCardIds.length <= 5 &&
    publicState.selectedCardIds.every((id) => availableCardIds.includes(id))
  ) {
    return publicState.selectedCardIds;
  }

  if (availableCardIds.length >= 1) {
    const validSelected = (publicState.selectedCardIds || []).filter((id) => availableCardIds.includes(id));
    if (validSelected.length >= 1 && validSelected.length <= 5) {
      return validSelected;
    }
    const remaining = availableCardIds.filter((id) => !validSelected.includes(id));
    return [...validSelected, ...remaining].slice(0, Math.min(3, availableCardIds.length));
  }

  return [];
}
