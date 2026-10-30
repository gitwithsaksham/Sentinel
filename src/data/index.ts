import type { Scenario, Finding, State } from "../types";
export const scenarios: Scenario[] = [
  {
    id: "SCN-001",
    title: "Unexpected Database Access",
    description:
      "Check whether an untrusted network segment is incorrectly permitted to reach a database service.",
    category: "Network exposure",
    expected: "Blocked at the firewall",
    observed:
      "Simulated TCP path permitted from an unintended segment. Database authentication was not tested.",
    outcome: "Finding detected",
    finding: "FND-001",
  },
  {
    id: "SCN-002",
    title: "Trusted Application Access",
    description:
      "Verify that the approved application segment can access only the database services it requires.",
    category: "Access control",
    expected: "Allowed within the defined scope",
    observed:
      "Approved application path allowed on TCP 3306. Other ports blocked by the simulated policy.",
    outcome: "Passed",
  },
  {
    id: "SCN-003",
    title: "Broad Rule Review",
    description:
      "Review a simulated firewall policy for source ranges that grant excessive access.",
    category: "Policy configuration",
    expected: "Flag overly broad access",
    observed:
      "Rule FW-014 permits source 0.0.0.0/0 instead of the documented application range 10.0.1.0/24.",
    outcome: "Finding detected",
    finding: "FND-001",
  },
  {
    id: "SCN-004",
    title: "Database Security Boundary",
    description:
      "Distinguish network reachability from database authentication and authorization.",
    category: "Security boundary",
    expected: "Do not infer database access from network reachability",
    observed:
      "Network reachability observed. Authentication and authorization remain unverified; compare with firewall and database logs.",
    outcome: "Needs review",
    finding: "FND-002",
  },
];
export const findings: Finding[] = [
  {
    id: "FND-001",
    title: "Database access scope too broad",
    severity: "High",
    component: "Database server",
    evidence:
      "Simulated policy review detected an access rule with a broader source range than the application’s documented requirement.",
    recommendation:
      "Restrict the source range to approved application infrastructure and review the default-deny policy.",
    impact:
      "An unintended segment may reach the database service. This does not establish authenticated database access.",
    confidence: "High · simulated rule evidence",
  },
  {
    id: "FND-002",
    title: "Access behavior requires confirmation",
    severity: "Medium",
    component: "Firewall",
    evidence:
      "Simulated access outcome should be compared against firewall logs before being treated as confirmed.",
    recommendation:
      "Review the relevant firewall events and validate the expected network path.",
    impact:
      "The network outcome alone cannot confirm database authentication or authorization.",
    confidence: "Medium · investigation required",
  },
  {
    id: "FND-003",
    title: "Retest evidence missing",
    severity: "Low",
    component: "Access policy",
    evidence:
      "A proposed policy correction has not yet been verified by a repeat test.",
    recommendation:
      "Rerun the original scenario and attach the verification result.",
    impact:
      "A proposed correction cannot be considered verified without repeatable evidence.",
    confidence: "High · missing verification record",
  },
];
export function initialState(): State {
  return {
    runs: Array.from({ length: 24 }, (_, i) => {
      const s = scenarios[i % 4];
      return {
        id: `RUN-${String(24 - i).padStart(3, "0")}`,
        scenarioId: s.id,
        title: s.title,
        date: new Date(Date.UTC(2026, 9, 4, 15, 34) - i * 240000).toISOString(),
        outcome: i > 7 ? "Passed" : s.outcome,
        duration: `${(1.8 + (i % 5) * 0.3).toFixed(1)}s`,
        environment: "Sentinel Sandbox",
        observed:
          i > 7
            ? "Scoped baseline check matched the expected policy."
            : s.observed,
        expected: s.expected,
        fixed: false,
        finding: i > 7 ? undefined : s.finding,
      };
    }),
    fixed: false,
    policy: false,
    environment: "Sentinel Sandbox",
    reduced: false,
    activity: true,
    theme: "Graphite",
  };
}
export const trend = [
  { day: "Sep 28", risk: 68 },
  { day: "Sep 29", risk: 61 },
  { day: "Sep 30", risk: 64 },
  { day: "Oct 01", risk: 48 },
  { day: "Oct 02", risk: 50 },
  { day: "Oct 03", risk: 40 },
  { day: "Oct 04", risk: 36 },
];
