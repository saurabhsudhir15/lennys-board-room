export type BoardMember = {
  guest_name: string;
  guest_title: string;
  role: string;
  response: string;
  episode_title: string;
  date: string;
};

export type CallLogEntry = {
  task: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

export type PickYourMove = {
  title: string;
  action: string;
  reasoning: string;
  tradeoff?: string;
  backed_by: string;
};

export type BoardResponse = {
  board: BoardMember[];
  debate: string;
  debate_clash: string[];
  synthesis: { agrees: string; tension: string; next_move: string };
  lenny_insight: string;
  pick_your_move?: PickYourMove[];
  call_log: CallLogEntry[];
};
