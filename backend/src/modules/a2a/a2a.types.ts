export type A2ACapabilityName = "nba.matchup_brief" | "nba.matchup_full";

export type A2ATaskState =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type A2ATask = {
  id: string;
  capability: A2ACapabilityName;
  state: A2ATaskState;
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: { message: string };
  payerAddress?: string | null;
};

