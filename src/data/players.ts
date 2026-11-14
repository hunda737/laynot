// Invented players for the demo leaderboards. Scores are generated from the date (see lib/leaderboard).
export interface Bot {
  id: string;
  name: string;
  city: string;
  /** Chance of answering a question right. */
  skill: number;
  /** Chance of playing on any given day. */
  activity: number;
  friend?: boolean;
}

const CITIES = ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Dire Dawa', 'Jimma', 'Gondar', 'Dessie', 'Harar'];

const RAW: [name: string, skill: number, activity: number, friend?: boolean][] = [
  ['Abel T.', 0.82, 0.95, true],
  ['Meron A.', 0.74, 0.9, true],
  ['Dawit G.', 0.66, 0.6],
  ['Selam M.', 0.88, 0.97],
  ['Yonas D.', 0.58, 0.8, true],
  ['Bethlehem W.', 0.71, 0.85],
  ['Kalkidan F.', 0.63, 0.5],
  ['Natnael S.', 0.9, 0.7],
  ['Liya H.', 0.55, 0.92, true],
  ['Biruk T.', 0.77, 0.65],
  ['Mahlet Y.', 0.69, 0.98],
  ['Eyob A.', 0.48, 0.55],
  ['Tsion G.', 0.8, 0.88],
  ['Robel M.', 0.6, 0.4],
  ['Rahel K.', 0.73, 0.78, true],
  ['Henok B.', 0.86, 0.93],
  ['Saron D.', 0.52, 0.7],
  ['Fitsum L.', 0.67, 0.83],
  ['Feven T.', 0.79, 0.6],
  ['Chala G.', 0.84, 0.9],
  ['Lensa D.', 0.62, 0.75],
  ['Gemechu A.', 0.57, 0.45],
  ['Ebise T.', 0.75, 0.96],
  ['Tolera B.', 0.7, 0.58],
  ['Hawi M.', 0.65, 0.87, true],
  ['Mulu H.', 0.5, 0.62],
  ['Senait A.', 0.81, 0.8],
  ['Teklu G.', 0.6, 0.35],
  ['Abdi M.', 0.72, 0.91],
  ['Hamza Y.', 0.68, 0.66],
  ['Ayan H.', 0.76, 0.74],
  ['Nebiyu Z.', 0.87, 0.52],
  ['Bezawit A.', 0.64, 0.94],
  ['Kidus M.', 0.54, 0.82],
  ['Ruth S.', 0.78, 0.69],
  ['Samuel E.', 0.61, 0.89],
  ['Mekdes F.', 0.7, 0.44],
  ['Ermias W.', 0.83, 0.77],
  ['Yared T.', 0.56, 0.97],
  ['Sifan K.', 0.74, 0.57],
];

export const BOTS: Bot[] = RAW.map(([name, skill, activity, friend], i) => ({
  id: `bot-${i + 1}`,
  name,
  city: CITIES[i % CITIES.length],
  skill,
  activity,
  friend,
}));
