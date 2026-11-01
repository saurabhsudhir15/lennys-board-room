export const EASE = [0.22, 1, 0.36, 1] as const;
export const C = {
  ink: '#14100D',
  ink2: '#1F1915',
  ember: '#F2683C',
  cream: '#F3E9DA',
  brass: '#C9A46A',
  muted: '#7A6D5E',
  soft: '#B8A994',
};
export const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;
export const ROLES = [
  { role: 'The Challenger', short: 'CH', line: 'Reframes the problem' },
  { role: 'The Operator', short: 'OP', line: 'How do you actually do it' },
  { role: 'The Visionary', short: 'VI', line: 'The 10x you are missing' },
  { role: 'The User Advocate', short: 'UA', line: 'Back to the user, always' },
  { role: 'The Data Oracle', short: 'DO', line: 'What you measure wrong' },
];
