import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Network,
  Fingerprint,
  RotateCcw,
} from "lucide-react";
import Topology from "../components/Topology";
export default function Landing({
  go,
  onSelect,
}: {
  go: (p: string) => void;
  onSelect: (id: string, edge?: boolean) => void;
}) {
  return (
    <div className="landing">
      <div className="landing-nav">
        <span className="micro">
          <i className="small-dot" /> CONTROLLED SECURITY VALIDATION
        </span>
        <button className="text-btn" onClick={() => go("overview")}>
          Open console <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="hero">
        <div className="hero-copy">
          <div className="micro text-lime">LESS ASSUMPTION. MORE EVIDENCE.</div>
          <h1>
            Know what your firewall <em>actually protects.</em>
          </h1>
          <p>
            Validate access policies, uncover exposure risks, and verify
            security improvements with controlled, evidence-based testing.
          </p>
          <div className="button-group">
            <button className="btn primary" onClick={() => go("overview")}>
              Launch Security Console <ArrowUpRight size={16} />
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                document
                  .getElementById("capabilities")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore the Platform <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-foot">
            <ShieldCheck size={14} />
            Isolated by design <span>·</span> Evidence at every step
          </div>
        </div>
        <div className="hero-visual panel">
          <div className="panel-heading">
            <span className="micro">NETWORK VALIDATION ENGINE</span>
            <span className="live-label">
              <i /> SIMULATED
            </span>
          </div>
          <Topology running onSelect={onSelect} />
          <div className="network-foot">
            <span>
              <CheckCircle2 size={14} />
              Trusted application path verified
            </span>
            <span className="mono">TCP 3306</span>
          </div>
        </div>
      </div>
      <section id="capabilities" className="landing-section">
        <span className="micro">01 / BUILT FOR CLARITY</span>
        <h2>
          Understand the boundary.
          <br />
          Not just the rule.
        </h2>
        <div className="capabilities">
          {[
            {
              icon: ShieldCheck,
              title: "Firewall Validation",
              copy: "Check whether security rules behave as intended.",
            },
            {
              icon: Network,
              title: "Exposure Analysis",
              copy: "Identify overly broad access paths and potential weaknesses.",
            },
            {
              icon: Fingerprint,
              title: "Evidence-Based Findings",
              copy: "Understand what happened, why it matters, and what to investigate.",
            },
            {
              icon: RotateCcw,
              title: "Verified Retesting",
              copy: "Repeat the same checks after a defensive change to confirm the result.",
            },
          ].map((c, i) => (
            <motion.button
              whileHover={{ y: -4 }}
              key={c.title}
              className="capability"
              onClick={() =>
                go(["scenarios", "topology", "findings", "remediation"][i])
              }
            >
              <c.icon size={26} />
              <h3>{c.title}</h3>
              <p>{c.copy}</p>
              <ArrowUpRight size={18} />
            </motion.button>
          ))}
        </div>
      </section>
      <section className="landing-section">
        <span className="micro">02 / THE VALIDATION CYCLE</span>
        <h2>From assumption to assurance.</h2>
        <div className="process">
          {["Discover", "Simulate", "Evaluate", "Analyze", "Retest"].map(
            (s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09 }}
              >
                <span className="process-number">0{i + 1}</span>
                <h3>{s}</h3>
                <p>
                  {
                    [
                      "Define your assets and authorized scope.",
                      "Run controlled, repeatable scenarios.",
                      "Compare expected and observed behavior.",
                      "Review evidence and defensive changes.",
                      "Verify the fix with the same checks.",
                    ][i]
                  }
                </p>
              </motion.div>
            ),
          )}
        </div>
      </section>
      <section className="trust-section">
        <ShieldCheck size={35} />
        <h2>
          Every finding should have evidence.
          <br />
          Every recommendation should be reviewable.
          <br />
          <span>Every test should have a defined scope.</span>
        </h2>
        <div>
          {[
            "Controlled testing",
            "Auditable results",
            "Human-reviewed changes",
            "Repeatable verification",
          ].map((t) => (
            <span key={t}>
              <CheckCircle2 size={15} />
              {t}
            </span>
          ))}
        </div>
        <button className="btn primary" onClick={() => go("overview")}>
          Enter the security console <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}
