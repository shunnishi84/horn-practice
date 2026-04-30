import type { InstrumentKey, InstrumentProfile } from '../types';

export const INSTRUMENTS: Record<InstrumentKey, InstrumentProfile> = {
  soprano_sax: { key: 'soprano_sax', displayName: 'ソプラノサックス', defaultTransposition: 'Bb', range: { lowest: 'Ab3', highest: 'E6' } },
  alto_sax: { key: 'alto_sax', displayName: 'アルトサックス', defaultTransposition: 'Eb', range: { lowest: 'Db3', highest: 'A5' } },
  tenor_sax: { key: 'tenor_sax', displayName: 'テナーサックス', defaultTransposition: 'Bb', range: { lowest: 'Ab2', highest: 'E5' } },
  baritone_sax: { key: 'baritone_sax', displayName: 'バリトンサックス', defaultTransposition: 'Eb', range: { lowest: 'Db2', highest: 'A4' } },
  trumpet: { key: 'trumpet', displayName: 'トランペット', defaultTransposition: 'Bb', range: { lowest: 'E3', highest: 'C6' } },
  horn: { key: 'horn', displayName: 'ホルン', defaultTransposition: 'F', range: { lowest: 'B1', highest: 'F5' } },
  flute: { key: 'flute', displayName: 'フルート', defaultTransposition: 'C', range: { lowest: 'C4', highest: 'C7' } },
  clarinet: { key: 'clarinet', displayName: 'クラリネット', defaultTransposition: 'Bb', range: { lowest: 'D3', highest: 'C6' } },
  trombone: { key: 'trombone', displayName: 'トロンボーン', defaultTransposition: 'C', range: { lowest: 'E2', highest: 'F5' } },
  tuba: { key: 'tuba', displayName: 'チューバ', defaultTransposition: 'C', range: { lowest: 'D1', highest: 'F4' } },
};

export const INSTRUMENT_LIST: InstrumentProfile[] = Object.values(INSTRUMENTS);
