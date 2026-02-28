import { useState, useEffect } from "react";
import { useContract } from "./useContract";
import { Agent, AgentTier } from "@/types";

export function useAgents() {
  const { contract } = useContract();
  const [agents, setAgents] = useState<(Agent & { address: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract) return;

    async function fetchAgents() {
      try {
        const leaderboard = await contract.getAgentLeaderboard();

        const agentsData = await Promise.all(
          leaderboard.addresses.map(async (address: string, index: number) => {
            const agent = await contract.getAgent(address);
            const specialties = await contract.getAgentSpecialties(address);

            return {
              address,
              xmtpAddress: agent.xmtpAddress,
              basename: agent.basename,
              tier: agent.tier as AgentTier,
              reputationScore: Number(agent.reputationScore),
              completedTasks: Number(agent.completedTasks),
              totalEarnings: agent.totalEarnings,
              pendingEarnings: agent.pendingEarnings,
              stake: agent.stake,
              isActive: agent.isActive,
              specialties,
            };
          })
        );

        agentsData.sort((a, b) => b.reputationScore - a.reputationScore);
        setAgents(agentsData);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();

    const interval = setInterval(fetchAgents, 15000);

    return () => clearInterval(interval);
  }, [contract]);

  return { agents, loading };
}

export function useAgent(address: string | null) {
  const { contract } = useContract();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || !address) return;

    async function fetchAgent() {
      try {
        const agentData = await contract.getAgent(address);
        const specialties = await contract.getAgentSpecialties(address);

        setAgent({
          xmtpAddress: agentData.xmtpAddress,
          basename: agentData.basename,
          tier: agentData.tier as AgentTier,
          reputationScore: Number(agentData.reputationScore),
          completedTasks: Number(agentData.completedTasks),
          totalEarnings: agentData.totalEarnings,
          pendingEarnings: agentData.pendingEarnings,
          stake: agentData.stake,
          isActive: agentData.isActive,
          specialties,
        });
      } catch (error) {
        console.error("Failed to fetch agent:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [contract, address]);

  return { agent, loading };
}
