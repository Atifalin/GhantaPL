export type Position = 'GK' | 'DEF' | 'MID' | 'ATT';
export type Formation = '442' | '433' | '352' | '541' | '4231';

export interface PlayerPosition {
  x: number;
  y: number;
  position: Position;
}

export interface FormationConfig {
  name: Formation;
  label: string;
  stats: Record<Position, number>;
  positions: PlayerPosition[];
}

export const FORMATIONS: Record<Formation, FormationConfig> = {
  '442': {
    name: '442',
    label: '4-4-2',
    stats: {
      GK: 1,
      DEF: 4,
      MID: 4,
      ATT: 2
    },
    positions: [
      { x: 0.5, y: 0.9, position: 'GK' },
      { x: 0.2, y: 0.7, position: 'DEF' },
      { x: 0.4, y: 0.7, position: 'DEF' },
      { x: 0.6, y: 0.7, position: 'DEF' },
      { x: 0.8, y: 0.7, position: 'DEF' },
      { x: 0.2, y: 0.4, position: 'MID' },
      { x: 0.4, y: 0.4, position: 'MID' },
      { x: 0.6, y: 0.4, position: 'MID' },
      { x: 0.8, y: 0.4, position: 'MID' },
      { x: 0.35, y: 0.1, position: 'ATT' },
      { x: 0.65, y: 0.1, position: 'ATT' }
    ]
  },
  '433': {
    name: '433',
    label: '4-3-3',
    stats: {
      GK: 1,
      DEF: 4,
      MID: 3,
      ATT: 3
    },
    positions: [
      { x: 0.5, y: 0.9, position: 'GK' },
      { x: 0.2, y: 0.7, position: 'DEF' },
      { x: 0.4, y: 0.7, position: 'DEF' },
      { x: 0.6, y: 0.7, position: 'DEF' },
      { x: 0.8, y: 0.7, position: 'DEF' },
      { x: 0.3, y: 0.4, position: 'MID' },
      { x: 0.5, y: 0.4, position: 'MID' },
      { x: 0.7, y: 0.4, position: 'MID' },
      { x: 0.2, y: 0.1, position: 'ATT' },
      { x: 0.5, y: 0.1, position: 'ATT' },
      { x: 0.8, y: 0.1, position: 'ATT' }
    ]
  },
  '352': {
    name: '352',
    label: '3-5-2',
    stats: {
      GK: 1,
      DEF: 3,
      MID: 5,
      ATT: 2
    },
    positions: [
      { x: 0.5, y: 0.9, position: 'GK' },
      { x: 0.3, y: 0.7, position: 'DEF' },
      { x: 0.5, y: 0.7, position: 'DEF' },
      { x: 0.7, y: 0.7, position: 'DEF' },
      { x: 0.1, y: 0.4, position: 'MID' },
      { x: 0.3, y: 0.4, position: 'MID' },
      { x: 0.5, y: 0.4, position: 'MID' },
      { x: 0.7, y: 0.4, position: 'MID' },
      { x: 0.9, y: 0.4, position: 'MID' },
      { x: 0.35, y: 0.1, position: 'ATT' },
      { x: 0.65, y: 0.1, position: 'ATT' }
    ]
  },
  '541': {
    name: '541',
    label: '5-4-1',
    stats: {
      GK: 1,
      DEF: 5,
      MID: 4,
      ATT: 1
    },
    positions: [
      { x: 0.5, y: 0.9, position: 'GK' },
      { x: 0.1, y: 0.7, position: 'DEF' },
      { x: 0.3, y: 0.7, position: 'DEF' },
      { x: 0.5, y: 0.7, position: 'DEF' },
      { x: 0.7, y: 0.7, position: 'DEF' },
      { x: 0.9, y: 0.7, position: 'DEF' },
      { x: 0.2, y: 0.4, position: 'MID' },
      { x: 0.4, y: 0.4, position: 'MID' },
      { x: 0.6, y: 0.4, position: 'MID' },
      { x: 0.8, y: 0.4, position: 'MID' },
      { x: 0.5, y: 0.1, position: 'ATT' }
    ]
  },
  '4231': {
    name: '4231',
    label: '4-2-3-1',
    stats: {
      GK: 1,
      DEF: 4,
      MID: 5,
      ATT: 1
    },
    positions: [
      { x: 0.5, y: 0.9, position: 'GK' },
      { x: 0.2, y: 0.7, position: 'DEF' },
      { x: 0.4, y: 0.7, position: 'DEF' },
      { x: 0.6, y: 0.7, position: 'DEF' },
      { x: 0.8, y: 0.7, position: 'DEF' },
      { x: 0.35, y: 0.5, position: 'MID' },
      { x: 0.65, y: 0.5, position: 'MID' },
      { x: 0.2, y: 0.3, position: 'MID' },
      { x: 0.5, y: 0.3, position: 'MID' },
      { x: 0.8, y: 0.3, position: 'MID' },
      { x: 0.5, y: 0.1, position: 'ATT' }
    ]
  }
};

const FormationsModule = {
  FORMATIONS,
  Position: ['GK', 'DEF', 'MID', 'ATT'] as const,
  Formation: ['442', '433', '352', '541', '4231'] as const,
};

export default FormationsModule;
