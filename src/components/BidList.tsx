import { Bid } from "@/types";
import { ethers } from "ethers";

interface BidListProps {
  bids: Bid[];
  onSelectAgent?: (agentAddress: string) => void;
  canSelect?: boolean;
}

export default function BidList({ bids, onSelectAgent, canSelect }: BidListProps) {
  if (bids.length === 0) {
    return (
      <div className="glass rounded-lg p-8 text-center">
        <p className="text-gray-400">No bids yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map((bid, index) => (
        <div key={index} className="glass rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-mono text-sm">
                {bid.agent.slice(0, 10)}...{bid.agent.slice(-8)}
              </p>
              <p className="text-xs text-gray-400">
                Est. {Math.floor(bid.estimatedTime / 3600)}h
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary font-mono font-bold">
                ${ethers.formatUnits(bid.price, 6)}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-3">{bid.proposal}</p>

          {canSelect && onSelectAgent && (
            <button
              onClick={() => onSelectAgent(bid.agent)}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-all"
            >
              Select Agent
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
