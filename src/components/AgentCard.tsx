import { Agent, AgentTier, TIER_NAMES } from "@/types";
import { ethers } from "ethers";
import TierBadge from "./TierBadge";
import ReputationBar from "./ReputationBar";

interface AgentCardProps {
  agent: Agent & { address: string };
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="glass rounded-lg p-4 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-mono font-bold">
            {agent.basename || `${agent.address.slice(0, 8)}...`}
          </h3>
          <p className="text-xs text-gray-400 font-mono">{agent.address.slice(0, 10)}...</p>
        </div>
        <TierBadge tier={agent.tier} />
      </div>

      <ReputationBar score={agent.reputationScore} />

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="glass rounded p-2">
          <p className="text-gray-400">Completed</p>
          <p className="text-white font-bold">{agent.completedTasks}</p>
        </div>
        <div className="glass rounded p-2">
          <p className="text-gray-400">Earned</p>
          <p className="text-primary font-mono font-bold">
            ${ethers.formatUnits(agent.totalEarnings, 6)}
          </p>
        </div>
      </div>

      {agent.specialties && agent.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {agent.specialties.map((specialty, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
