"use client";

import { Background, MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import { AGENT_NODE_WIDTH, AgentNode, type AgentNodeType } from "./nodes/AgentNode";
import { OrchestratorNode, type OrchestratorNodeType, type OrchestratorStatus } from "./nodes/OrchestratorNode";
import { ResultNode, type ResultNodeType, type ResultStatus } from "./nodes/ResultNode";
import type { AgentView, RunView } from "./useRun";

const nodeTypes = { orchestrator: OrchestratorNode, agent: AgentNode, result: ResultNode };

const GAP = 36;
const ROW_AGENTS = 190;
const ROW_RESULT = 380;
const CIRCLE = 128;

type Props = { view: RunView; onSelectAgent: (position: number) => void };

function orchestratorStatus(view: RunView): OrchestratorStatus {
  if (view.status === "planning") return "working";
  return view.status === "idle" ? "waiting" : "done";
}

function resultStatus(view: RunView): ResultStatus {
  switch (view.status) {
    case "synthesizing":
      return "working";
    case "completed":
      return "done";
    case "failed":
      return "failed";
    default:
      return "waiting";
  }
}

/** With no plan yet, show three placeholder agents like the reference diagram. */
const PLACEHOLDER_AGENTS: AgentView[] = [0, 1, 2].map((position) => ({
  position,
  role: `Agent ${position + 1}`,
  title: "Assigned by the orchestrator",
  status: "pending",
  output: "",
  inputTokens: 0,
  outputTokens: 0,
  durationMs: null,
  error: null,
}));

function buildGraph(view: RunView): { nodes: Node[]; edges: Edge[] } {
  const agents = view.agents.length ? view.agents : PLACEHOLDER_AGENTS;
  const rowWidth = agents.length * AGENT_NODE_WIDTH + (agents.length - 1) * GAP;
  const centerX = rowWidth / 2;
  const synthesizing = view.status === "synthesizing";

  const orchestrator: OrchestratorNodeType = {
    id: "orchestrator",
    type: "orchestrator",
    position: { x: centerX - CIRCLE / 2, y: 0 },
    data: { status: orchestratorStatus(view) },
    draggable: false,
  };
  const result: ResultNodeType = {
    id: "result",
    type: "result",
    position: { x: centerX - CIRCLE / 2, y: ROW_RESULT },
    data: { status: resultStatus(view) },
    draggable: false,
  };
  const agentNodes: AgentNodeType[] = agents.map((agent, i) => ({
    id: `agent-${agent.position}`,
    type: "agent",
    position: { x: i * (AGENT_NODE_WIDTH + GAP), y: ROW_AGENTS },
    data: { agent },
    draggable: false,
  }));

  const edges: Edge[] = agentNodes.flatMap(({ id, data: { agent } }) => [
    {
      id: `o-${id}`,
      source: "orchestrator",
      target: id,
      type: "smoothstep",
      animated: agent.status === "running",
      style: { stroke: "#f59e0b", strokeWidth: agent.status === "running" ? 2 : 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
    },
    {
      id: `${id}-r`,
      source: id,
      target: "result",
      type: "smoothstep",
      animated: synthesizing,
      style: { stroke: agent.status === "completed" ? "#0ea5e9" : "#d4d4d8", strokeWidth: synthesizing ? 2 : 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: agent.status === "completed" ? "#0ea5e9" : "#d4d4d8" },
    },
  ]);

  return { nodes: [orchestrator, ...agentNodes, result], edges };
}

function Canvas({ view, onSelectAgent }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(view), [view]);
  const { fitView } = useReactFlow();
  const agentCount = view.agents.length;

  // Refit whenever the number of agents changes so the diagram always fills the card.
  useEffect(() => {
    const id = requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
    return () => cancelAnimationFrame(id);
  }, [agentCount, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => {
        if (node.type === "agent" && view.agents.length) onSelectAgent((node as AgentNodeType).data.agent.position);
      }}
    >
      <Background gap={20} size={1.2} color="#d4d4d8" />
    </ReactFlow>
  );
}

export function PipelineCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
