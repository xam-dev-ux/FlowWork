import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContract } from "@/hooks/useContract";
import { useUserTasks } from "@/hooks/useTasks";
import { useAgent } from "@/hooks/useAgent";
import { ethers } from "ethers";
import TaskCard from "@/components/TaskCard";
import TierBadge from "@/components/TierBadge";
import ReputationBar from "@/components/ReputationBar";
import { STATUS_NAMES } from "@/types";

export default function Profile() {
  const navigate = useNavigate();
  const { userAddress, getWriteContract } = useContract();
  const { clientTasks, agentTasks, loading: tasksLoading } = useUserTasks(userAddress);
  const { agent, loading: agentLoading } = useAgent(userAddress);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      const contract = getWriteContract();
      const tx = await contract.withdrawEarnings();
      await tx.wait();
      alert("Earnings withdrawn successfully!");
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      alert(`Withdraw failed: ${error.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  if (!userAddress) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass rounded-lg p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to view your profile
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold gradient-text mb-2">Your Profile</h1>
          <p className="text-gray-400 font-mono">{userAddress}</p>
        </div>

        {!agentLoading && agent?.isActive && (
          <div className="glass rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {agent.basename || "Agent Profile"}
                </h2>
                <p className="text-sm text-gray-400">Registered Agent</p>
              </div>
              <TierBadge tier={agent.tier} />
            </div>

            <ReputationBar score={agent.reputationScore} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Completed</p>
                <p className="text-2xl font-bold">{agent.completedTasks}</p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-primary font-mono">
                  ${ethers.formatUnits(agent.totalEarnings, 6)}
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-secondary font-mono">
                  ${ethers.formatUnits(agent.pendingEarnings, 6)}
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Stake</p>
                <p className="text-2xl font-bold font-mono">
                  ${ethers.formatUnits(agent.stake, 6)}
                </p>
              </div>
            </div>

            {agent.pendingEarnings > 0n && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="w-full mt-6 px-6 py-3 bg-success hover:bg-success/80 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {withdrawing ? "Withdrawing..." : "Withdraw Earnings"}
              </button>
            )}

            {agent.specialties && agent.specialties.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((specialty, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {agentTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Agent Tasks</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {agentTasks.map((task) => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
          </div>
        )}

        {clientTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Tasks You Posted</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {clientTasks.map((task) => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
          </div>
        )}

        {tasksLoading && (
          <div className="glass rounded-lg p-12 text-center">
            <div className="animate-pulse text-primary text-2xl">⌛</div>
            <p className="text-gray-400 mt-2">Loading your tasks...</p>
          </div>
        )}

        {!tasksLoading &&
          clientTasks.length === 0 &&
          agentTasks.length === 0 &&
          !agent?.isActive && (
            <div className="glass rounded-lg p-12 text-center">
              <h3 className="text-xl font-bold mb-2">No activity yet</h3>
              <p className="text-gray-400 mb-6">
                Post a task or register as an agent to get started
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate("/post")}
                  className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-all"
                >
                  Post Task
                </button>
                <button
                  onClick={() => navigate("/agents")}
                  className="px-6 py-3 glass hover:bg-white/10 rounded-lg font-medium transition-all"
                >
                  View Agents
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
