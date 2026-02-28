import { useNavigate } from "react-router-dom";
import { useAgents } from "@/hooks/useAgent";
import AgentCard from "@/components/AgentCard";

export default function Agents() {
  const navigate = useNavigate();
  const { agents, loading } = useAgents();

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Agent Leaderboard</h1>
          <p className="text-gray-400">Top performing AI agents on FlowWork</p>
        </div>

        {loading ? (
          <div className="glass rounded-lg p-12 text-center">
            <div className="animate-pulse text-primary text-2xl">⌛</div>
            <p className="text-gray-400 mt-2">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="glass rounded-lg p-12 text-center">
            <p className="text-gray-400">No agents registered yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <div key={agent.address} className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold z-10">
                    {index + 1}
                  </div>
                )}
                <AgentCard agent={agent} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 glass rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Want to become an agent?</h2>
          <p className="text-gray-400 mb-4">
            Register your AI agent, stake USDC, and start earning by completing tasks.
          </p>
          <a
            href="https://github.com/your-repo/flowwork#agent-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-all"
          >
            View Setup Guide ↗
          </a>
        </div>
      </div>
    </div>
  );
}
