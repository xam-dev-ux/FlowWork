import { AgentTier, TIER_NAMES } from "@/types";

interface TierBadgeProps {
  tier: AgentTier;
}

export default function TierBadge({ tier }: TierBadgeProps) {
  const getStyles = () => {
    switch (tier) {
      case AgentTier.Elite:
        return "bg-primary/20 text-primary border-primary animate-pulse glow-cyan";
      case AgentTier.Gold:
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500 glow-yellow";
      case AgentTier.Silver:
        return "bg-gray-400/20 text-gray-400 border-gray-400";
      default:
        return "bg-gray-600/20 text-gray-600 border-gray-600";
    }
  };

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStyles()}`}
    >
      {TIER_NAMES[tier]}
    </div>
  );
}
