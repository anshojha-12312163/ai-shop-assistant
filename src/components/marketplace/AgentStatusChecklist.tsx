import { CheckCircle2, Loader2, Circle, XCircle } from "lucide-react";
import type { AgentStepResult } from "@/lib/ai.functions";

interface AgentStatusChecklistProps {
  steps: AgentStepResult[];
  isScanningImage?: boolean;
  isStreaming?: boolean;
}

export function AgentStatusChecklist({
  steps,
  isScanningImage,
  isStreaming,
}: AgentStatusChecklistProps) {
  // Define full agent list order
  const allPossibleAgents = [
    ...(isScanningImage ? ["Image Recognition Agent"] : []),
    "Location Agent",
    "Search Agent",
    "Ranking Agent",
    "Verification Agent",
    "Conversational Agent",
  ];

  const stepsMap = new Map(steps.map((s) => [s.agent, s]));

  return (
    <div className="my-4 p-4 bg-surface-elevated/80 border border-border rounded-xl space-y-3 font-sans shadow-sm animate-fade-in">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
          Multi-Agent Pipeline ({allPossibleAgents.length} Agents)
          {isStreaming && (
            <span className="size-1.5 rounded-full bg-accent animate-ping inline-block" />
          )}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {isStreaming ? "Real-time Stream" : "Sequential execution"}
        </span>
      </div>

      <div className="space-y-2.5">
        {allPossibleAgents.map((agentName, idx) => {
          const step = stepsMap.get(agentName);
          const isDone = step?.status === "completed";
          const isInProgress = step?.status === "in_progress";
          const isFailed = step?.status === "failed";

          return (
            <div
              key={agentName}
              className={`flex items-start gap-2.5 text-xs transition-all duration-300 ${
                isDone
                  ? "text-foreground font-medium"
                  : isInProgress
                    ? "text-accent font-semibold"
                    : isFailed
                      ? "text-rose-600 font-semibold"
                      : "text-muted-foreground/60"
              }`}
            >
              {/* Icon Indicator */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="size-4 text-emerald-500 animate-scale-in" />
                ) : isInProgress ? (
                  <Loader2 className="size-4 text-accent animate-spin" />
                ) : isFailed ? (
                  <XCircle className="size-4 text-rose-500 animate-pulse" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground/40" />
                )}
              </div>

              {/* Agent Title & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-xs tracking-tight">{agentName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    Step {idx + 1}/{allPossibleAgents.length}
                  </span>
                </div>
                {step?.detail && (
                  <p
                    className={`text-[11px] font-mono mt-0.5 truncate ${isFailed ? "text-rose-600 font-semibold" : "text-muted-foreground"}`}
                  >
                    — {step.detail}
                  </p>
                )}
                {isInProgress && !step?.detail && (
                  <p className="text-[11px] text-accent/80 font-mono mt-0.5 animate-pulse">
                    — processing step...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
