import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "@/hooks/useTasks";
import { useContract } from "@/hooks/useContract";
import { Bid, CATEGORY_NAMES, STATUS_NAMES, TaskStatus } from "@/types";
import { ethers } from "ethers";
import CategoryIcon from "@/components/CategoryIcon";
import BidList from "@/components/BidList";
import DeliveryViewer from "@/components/DeliveryViewer";
import DisputeModal from "@/components/DisputeModal";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const taskId = parseInt(id || "0");
  const { task, loading } = useTask(taskId);
  const { contract, userAddress, getWriteContract } = useContract();

  const [bids, setBids] = useState<Bid[]>([]);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!contract || !taskId) return;

    async function fetchBids() {
      try {
        const bidData = await contract.getTaskBids(taskId);
        setBids(
          bidData.map((bid: any) => ({
            agent: bid.agent,
            price: bid.price,
            proposal: bid.proposal,
            estimatedTime: Number(bid.estimatedTime),
            submittedAt: Number(bid.submittedAt),
          }))
        );
      } catch (error) {
        console.error("Failed to fetch bids:", error);
      }
    }

    fetchBids();

    const interval = setInterval(fetchBids, 10000);

    return () => clearInterval(interval);
  }, [contract, taskId]);

  const handleSelectAgent = async (agentAddress: string) => {
    try {
      setActionLoading(true);
      const writeContract = getWriteContract();
      const tx = await writeContract.selectAgent(taskId, agentAddress);
      await tx.wait();
      alert("Agent selected successfully!");
    } catch (error: any) {
      console.error("Failed to select agent:", error);
      alert(`Failed to select agent: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const writeContract = getWriteContract();
      const tx = await writeContract.approveDelivery(taskId);
      await tx.wait();
      alert("Delivery approved! Payment released.");
    } catch (error: any) {
      console.error("Failed to approve:", error);
      alert(`Failed to approve: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (reason: string) => {
    try {
      setActionLoading(true);
      const writeContract = getWriteContract();
      const tx = await writeContract.openDispute(taskId, reason);
      await tx.wait();
      alert("Dispute opened. Reviewers have been notified.");
    } catch (error: any) {
      console.error("Failed to open dispute:", error);
      alert(`Failed to open dispute: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this task?")) return;

    try {
      setActionLoading(true);
      const writeContract = getWriteContract();
      const tx = await writeContract.cancelTask(taskId);
      await tx.wait();
      alert("Task cancelled. Funds refunded.");
      navigate("/");
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      alert(`Failed to cancel: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-primary text-4xl mb-2">⌛</div>
          <p className="text-gray-400">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Task not found</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-primary rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isClient = userAddress?.toLowerCase() === task.client.toLowerCase();
  const isAgent = userAddress?.toLowerCase() === task.assignedAgent.toLowerCase();

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <div className="glass rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <CategoryIcon category={task.category} />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-400">{CATEGORY_NAMES[task.category]}</span>
                <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs">
                  {STATUS_NAMES[task.status]}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{task.description}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Task #{task.taskId}</span>
                <span>•</span>
                <span>
                  Deadline:{" "}
                  {new Date(task.deadline * 1000).toLocaleDateString()}
                </span>
                {task.isRecurring && (
                  <>
                    <span>•</span>
                    <span className="text-secondary">🔄 Recurring</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary font-mono">
                ${ethers.formatUnits(task.bounty, 6)}
              </p>
              <p className="text-xs text-gray-400">USDC</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-gray-400">Client</p>
              <p className="font-mono text-sm">{task.client.slice(0, 10)}...</p>
            </div>
            {task.assignedAgent !== ethers.ZeroAddress && (
              <div>
                <p className="text-xs text-gray-400">Agent</p>
                <p className="font-mono text-sm">{task.assignedAgent.slice(0, 10)}...</p>
              </div>
            )}
          </div>
        </div>

        {task.status === TaskStatus.Open && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Bids ({bids.length})</h2>
            <BidList
              bids={bids}
              onSelectAgent={isClient ? handleSelectAgent : undefined}
              canSelect={isClient && !actionLoading}
            />
          </div>
        )}

        {task.status === TaskStatus.Delivered && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Delivery</h2>
            <DeliveryViewer ipfsHash={task.ipfsHash} />
          </div>
        )}

        {isClient && task.status === TaskStatus.Delivered && (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 bg-success hover:bg-success/80 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              ✅ Approve & Pay
            </button>
            <button
              onClick={() => setDisputeModalOpen(true)}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 bg-danger hover:bg-danger/80 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              ⚠️ Open Dispute
            </button>
          </div>
        )}

        {isClient &&
          (task.status === TaskStatus.Open || task.status === TaskStatus.Assigned) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              Cancel Task
            </button>
          )}

        <DisputeModal
          isOpen={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          onSubmit={handleDispute}
        />
      </div>
    </div>
  );
}
