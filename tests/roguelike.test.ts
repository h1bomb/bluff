import { describe, it, expect } from 'vitest';
import {
  initRoguelikeGame,
  toggleSelectCard,
  discardSelectedCards,
  playSelectedCards,
  buyShopItem,
  advanceFromShopToNextBlind,
} from '../src/game/engine/game-engine';
import { HeuristicDecisionProvider } from '../src/jev/heuristic-provider';
import { generateShopInventory } from '../src/game/shop/definitions';
import { getBlindInfo } from '../src/game/engine/blinds';

describe('Roguelike Ante & Deckbuilder Flow', () => {
  const provider = new HeuristicDecisionProvider();

  it('handles 8-card hand, discarding and card replenishing', () => {
    let game = initRoguelikeGame('rogue_test');
    expect(game.player.cards).toHaveLength(8);
    expect(game.ante).toBe(1);
    expect(game.blind?.blindType).toBe('SMALL');
    expect(game.handsLeft).toBe(4);
    expect(game.discardsLeft).toBe(3);
    expect(game.jokers).toHaveLength(0);

    // Select 2 cards to discard
    const card1 = game.player.cards[0].id;
    const card2 = game.player.cards[1].id;
    game = toggleSelectCard(game, card1);
    game = toggleSelectCard(game, card2);
    expect(game.selectedCardIds).toEqual([card1, card2]);

    // Discard
    const { game: afterDiscard } = discardSelectedCards(game);
    expect(afterDiscard.player.cards).toHaveLength(8);
    expect(afterDiscard.discardsLeft).toBe(2);
    expect(afterDiscard.selectedCardIds).toEqual([]);
    expect(afterDiscard.discardPile).toHaveLength(2);
  });

  it('plays 3 selected cards, adds score, and transitions to SHOP when beating blind', async () => {
    let game = initRoguelikeGame('rogue_play_test');
    game.targetScore = 15; // Set low target to guarantee clear on any played hand

    // Select 3 cards to play
    game = toggleSelectCard(game, game.player.cards[0].id);
    game = toggleSelectCard(game, game.player.cards[1].id);
    game = toggleSelectCard(game, game.player.cards[2].id);

    const { game: afterPlay, scoreResult } = await playSelectedCards(game, 1500, provider);
    expect(scoreResult.finalScore).toBeGreaterThan(0);
    expect(afterPlay.currentRoundScore).toBe(scoreResult.finalScore);
    expect(afterPlay.handsLeft).toBe(3);
    // Target was 50, score should beat it -> phase SHOP!
    expect(afterPlay.phase).toBe('SHOP');
    expect(afterPlay.money).toBeGreaterThan(4); // Earned money!
  });

  it('allows buying item in shop and advances to BIG blind', () => {
    const game = initRoguelikeGame('rogue_shop_test');
    game.phase = 'SHOP';
    game.money = 10;

    const inventory = generateShopInventory();
    const upgradeItem = inventory.find((i) => i.itemType === 'HAND_UPGRADE') || inventory[0];

    const { game: afterBuy, success } = buyShopItem(game, upgradeItem);
    expect(success).toBe(true);
    expect(afterBuy.money).toBe(10 - upgradeItem.cost);

    // Advance to next blind
    const nextGame = advanceFromShopToNextBlind(afterBuy);
    expect(nextGame.blind?.blindType).toBe('BIG');
    expect(nextGame.phase).toBe('PLAYER_TURN');
    expect(nextGame.handsLeft).toBe(4);
    expect(nextGame.currentRoundScore).toBe(0);
  });

  it('transitions to RUN_COMPLETE when clearing Ante 8 BOSS blind', async () => {
    let game = initRoguelikeGame('rogue_ante8_win_test');
    game.ante = 8;
    game.blind = {
      ante: 8,
      blindType: 'BOSS',
      targetScore: 100000,
      rewardMoney: 5,
      bossName: 'THE CYNIC',
      bossAbility: 'AI confidence gain halved against fast plays.',
      bossAbilityZh: '多疑者：对秒出牌戒备，AI置信度提升速度减半。',
    };
    game.targetScore = 15; // easily beaten

    // Select 3 cards to play
    game = toggleSelectCard(game, game.player.cards[0].id);
    game = toggleSelectCard(game, game.player.cards[1].id);
    game = toggleSelectCard(game, game.player.cards[2].id);

    const { game: afterPlay } = await playSelectedCards(game, 1500, provider);
    expect(afterPlay.phase).toBe('RUN_COMPLETE');
  });
});

describe('Blind target curve', () => {
  it('stays gentle through Ante 3 and steepens from Ante 4', () => {
    const a1 = getBlindInfo(1, 'SMALL').targetScore;
    const a3 = getBlindInfo(3, 'BOSS').targetScore;
    const a4 = getBlindInfo(4, 'SMALL').targetScore;
    const a8 = getBlindInfo(8, 'BOSS').targetScore;

    expect(a1).toBe(300);
    expect(a3).toBe(4000);
    expect(a4).toBe(10000);
    expect(a8).toBe(250000);
  });

  it('increases monotonically within each blind type across antes', () => {
    for (const type of ['SMALL', 'BIG', 'BOSS'] as const) {
      let prev = 0;
      for (let ante = 1; ante <= 8; ante++) {
        const t = getBlindInfo(ante, type).targetScore;
        expect(t).toBeGreaterThan(prev);
        prev = t;
      }
    }
  });
});
