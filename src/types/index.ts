export type Outcome = "Passed" | "Finding detected" | "Needs review";
export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  expected: string;
  observed: string;
  outcome: Outcome;
  finding?: string;
}
export interface Run {
  id: string;
  scenarioId: string;
  title: string;
  date: string;
  outcome: Outcome;
  duration: string;
  environment: string;
  observed: string;
  expected: string;
  fixed: boolean;
  finding?: string;
}
export interface Finding {
  id: string;
  title: string;
  severity: string;
  component: string;
  evidence: string;
  recommendation: string;
  impact: string;
  confidence: string;
}
export interface State {
  runs: Run[];
  fixed: boolean;
  policy: boolean;
  environment: string;
  reduced: boolean;
  activity: boolean;
  theme: string;
}
