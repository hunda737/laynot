import type { GameKind } from '@/hooks/useOpenGame';
import type { StringKey } from '@/i18n';
import type { GameId } from '@/lib/games/common';
import type { IconName } from '../ui';

export interface GameCard {
  kind: GameKind;
  icon: IconName;
  title: StringKey;
  body: StringKey;
  /** The daily puzzles this game has (the word game has one per language). */
  ids: { id: GameId; label?: string }[];
}

/** The four games, in the order the Games tab and the Home preview show them. */
export const GAME_CARDS: GameCard[] = [
  { kind: 'blitz', icon: 'swap-horizontal', title: 'games.blitz', body: 'games.blitzBody', ids: [{ id: 'blitz' }] },
  {
    kind: 'wordle',
    icon: 'grid',
    title: 'games.wordle',
    body: 'games.wordleBody',
    ids: [
      { id: 'wordle-en', label: 'EN' },
      { id: 'wordle-am', label: 'አማ' },
    ],
  },
  { kind: 'groups', icon: 'apps', title: 'games.groups', body: 'games.groupsBody', ids: [{ id: 'groups' }] },
  { kind: 'player', icon: 'football', title: 'games.player', body: 'games.playerBody', ids: [{ id: 'player' }] },
];
