import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ReactFlow,
  useNodesState,
  MarkerType,
  Background,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import {
  Globe2,
  ShieldCheck,
  Server,
  Database,
  Network,
  Maximize2,
  ArrowUpRight,
  Braces,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
const icons: Record<string, typeof Server> = {
  external: Globe2,
  firewall: ShieldCheck,
  app: Server,
  api: Braces,
  database: Database,
  internal: Network,
};
export const assets = [
  {
    id: "external",
    name: "External test segment",
    description: "Untrusted · 172.16.0.0/24",
    status: "Test source",
  },
  {
    id: "firewall",
    name: "Sentinel Firewall",
    description: "Policy engine · FW-014",
    status: "Active",
  },
  {
    id: "app",
    name: "Application server",
    description: "Trusted · 10.0.1.10",
    status: "Healthy",
  },
  {
    id: "api",
    name: "API service",
    description: "Internal · 10.0.1.20",
    status: "Healthy",
  },
  {
    id: "database",
    name: "Database server",
    description: "MySQL · TCP 3306",
    status: "Protected",
  },
  {
    id: "internal",
    name: "Internal network",
    description: "Approved · 10.0.1.0/24",
    status: "Trusted",
  },
];
function AssetNode({ data }: NodeProps) {
  const Icon = icons[String(data.kind)] || Server;
  return (
    <div
      className={`asset-node ${data.kind === "firewall" ? "firewall-node" : ""} ${data.selected ? "node-selected" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      {data.kind === "firewall" && (
        <Handle type="target" id="internal" position={Position.Bottom} />
      )}
      <div className="node-top">
        <div className="node-icon">
          <Icon size={22} strokeWidth={1.6} />
        </div>
        <button
          className="node-inspect"
          aria-label={`Inspect ${String(data.name)}`}
          onClick={(e) => {
            e.stopPropagation();
            (data.inspect as () => void)();
          }}
        >
          <ArrowUpRight size={15} />
        </button>
        <span
          className={`node-state ${data.kind === "external" ? "warning" : ""}`}
        />
      </div>
      <strong>{String(data.name)}</strong>
      <small>{String(data.description)}</small>
      <Handle
        type="source"
        position={data.kind === "internal" ? Position.Top : Position.Right}
      />
    </div>
  );
}
function TrafficEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath(props);
  const red = props.source === "external";
  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={props.markerEnd}
        style={{
          stroke: props.selected
            ? "#B7F36B"
            : red
              ? "#9b6556"
              : props.source === "internal"
                ? "#596050"
                : "#657a50",
          strokeWidth: 1.5,
          strokeDasharray: red ? "5 5" : undefined,
        }}
        interactionWidth={24}
      />
      {props.data?.running && (
        <circle r="4" fill={red ? "#E66D5E" : "#B7F36B"}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {props.label && (
        <g transform={`translate(${labelX},${labelY})`}>
          <rect x="-36" y="-10" width="72" height="20" rx="4" fill="#111310" />
          <text
            textAnchor="middle"
            dy="3"
            fill={red ? "#C98B76" : "#A5A69B"}
            fontSize="9"
            fontFamily="monospace"
          >
            {props.label}
          </text>
        </g>
      )}
    </>
  );
}
const nodeTypes = { asset: AssetNode };
const edgeTypes = { traffic: TrafficEdge };
export default function Topology({
  large = false,
  running = false,
  fixed = false,
  reduced = false,
  onSelect,
  onFullscreen,
}: {
  large?: boolean;
  running?: boolean;
  fixed?: boolean;
  reduced?: boolean;
  onSelect: (id: string, edge?: boolean) => void;
  onFullscreen?: () => void;
}) {
  const systemReduced = useReducedMotion();
  const initialNodes = useMemo(
    () =>
      assets.map((a) => ({
        id: a.id,
        type: "asset",
        position: (
          {
            external: { x: 0, y: 15 },
            app: { x: 0, y: 195 },
            firewall: { x: 265, y: 100 },
            database: { x: 530, y: 15 },
            api: { x: 530, y: 195 },
            internal: { x: 265, y: 300 },
          } as Record<string, { x: number; y: number }>
        )[a.id],
        data: { ...a, kind: a.id, inspect: () => onSelect(a.id) },
        draggable: large,
      })),
    [large],
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const edges = useMemo(
    () =>
      [
        {
          id: "external-firewall",
          source: "external",
          target: "firewall",
          label: fixed ? "BLOCKED" : "UNTRUSTED",
        },
        {
          id: "app-firewall",
          source: "app",
          target: "firewall",
          label: "ALLOWED",
        },
        {
          id: "firewall-database",
          source: "firewall",
          target: "database",
          label: "TCP 3306",
        },
        {
          id: "firewall-api",
          source: "firewall",
          target: "api",
          label: "TCP 443",
        },
        {
          id: "internal-firewall",
          source: "internal",
          target: "firewall",
          targetHandle: "internal",
          label: "",
        },
      ].map((e) => ({
        ...e,
        type: "traffic",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.source === "external" ? "#9b6556" : "#657a50",
          width: 12,
          height: 12,
        },
        data: { running: running && !reduced && !systemReduced },
      })),
    [running, fixed, reduced, systemReduced],
  );
  return (
    <div className={`topology ${large ? "large" : ""}`}>
      <div className="topology-caption">
        <span className="micro">ISOLATED DEMO NETWORK</span>
        <span className="topology-count">
          6 assets <span>·</span> 5 connections
        </span>
      </div>
      <ReactFlow
        onNodesChange={onNodesChange}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.35}
        maxZoom={1.6}
        panOnDrag={large}
        zoomOnScroll={large}
        zoomOnPinch={large}
        nodesConnectable={false}
        onNodeClick={(_, n) => onSelect(n.id)}
        onEdgeClick={(_, e) => onSelect(e.id, true)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#383c31" gap={20} size={1} />
      </ReactFlow>
      <div className="topology-legend">
        <span>
          <i className="line green-line" />
          Expected path
        </span>
        <span>
          <i className="line red-line" />
          {fixed ? "Blocked path" : "Requires review"}
        </span>
        <span>
          <i className="line grey-line" />
          Inactive
        </span>
      </div>
      {onFullscreen && (
        <button
          className="topology-expand icon-btn"
          onClick={onFullscreen}
          aria-label="Expand topology"
        >
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  );
}
