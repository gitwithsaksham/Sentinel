import { useEffect, useRef, useContext } from "react";
import {
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  animate,
  MotionConfigContext,
} from "framer-motion";
export function Badge({ value }: { value: string }) {
  const color = /Passed|Verified|Resolved|Allowed|Active|Healthy/.test(value)
    ? "green"
    : /High|Finding detected|Open/.test(value)
      ? "red"
      : /Medium|review|Pending|Moderate/.test(value)
        ? "amber"
        : "neutral";
  return (
    <span className={`badge ${color}`}>
      <span className="badge-dot" />
      {value}
    </span>
  );
}
export function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const systemReduced = useReducedMotion();
  const config = useContext(MotionConfigContext);
  const reduced = systemReduced || config.reducedMotion === "always";
  useEffect(() => {
    if (reduced) {
      if (ref.current) ref.current.textContent = String(value);
      return;
    }
    const a = animate(0, value, {
      duration: 0.65,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => a.stop();
  }, [value, reduced]);
  return <span ref={ref}>{value}</span>;
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            {eyebrow && <span className="micro">{eyebrow}</span>}
            <h3>{title}</h3>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          'button, input, select, a, [tabindex="0"]',
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      old?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`modal ${wide ? "wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
export const LinkArrow = () => <ArrowUpRight size={15} />;
export function OutcomeIcon({ value }: { value: string }) {
  return value === "Passed" ? (
    <CheckCircle2 className="text-green" size={16} />
  ) : value === "Finding detected" ? (
    <AlertTriangle className="text-red" size={16} />
  ) : (
    <CircleDot className="text-amber" size={16} />
  );
}
