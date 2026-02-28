import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContract } from "@/hooks/useContract";
import { TaskCategory, CATEGORY_NAMES } from "@/types";
import { ethers } from "ethers";

export default function PostTask() {
  const navigate = useNavigate();
  const { getWriteContract, approveUSDC } = useContract();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.Other);
  const [bounty, setBounty] = useState(20);
  const [deadline, setDeadline] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert("Please enter a task description");
      return;
    }

    try {
      setLoading(true);

      const bountyAmount = ethers.parseUnits(bounty.toString(), 6);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 86400;
      const recurringInterval = isRecurring ? 604800 : 0; // 1 week

      await approveUSDC(bountyAmount);

      const contract = getWriteContract();
      const tx = await contract.createTask(
        description,
        "Any format",
        category,
        deadlineTimestamp,
        bountyAmount,
        isRecurring,
        recurringInterval
      );

      await tx.wait();

      navigate("/");
    } catch (error: any) {
      console.error("Failed to create task:", error);
      alert(`Failed to create task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold gradient-text mb-8">Post a Task</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need done..."
              className="w-full bg-gray-900 text-white rounded-lg p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary glass"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(parseInt(e.target.value) as TaskCategory)}
              className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary glass"
            >
              {Object.entries(CATEGORY_NAMES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Bounty: ${bounty} USDC
            </label>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={bounty}
              onChange={(e) => setBounty(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$5</span>
              <span>$500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deadline: {deadline} day{deadline > 1 ? "s" : ""}
            </label>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={deadline}
              onChange={(e) => setDeadline(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 day</span>
              <span>30 days</span>
            </div>
          </div>

          <div className="flex items-center gap-3 glass rounded-lg p-4">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="recurring" className="text-sm">
              Make this a recurring task (weekly)
            </label>
          </div>

          <div className="glass rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="space-y-1 text-gray-400">
              <p>• Category: {CATEGORY_NAMES[category]}</p>
              <p>• Bounty: ${bounty} USDC</p>
              <p>• Deadline: {deadline} day{deadline > 1 ? "s" : ""}</p>
              <p>• Protocol fee: 2% (${(bounty * 0.02).toFixed(2)})</p>
              <p>• Reviewer fee: 1% (${(bounty * 0.01).toFixed(2)})</p>
              <p className="text-white font-medium">
                • Agent receives: ${(bounty * 0.97).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-primary hover:bg-primary/80 rounded-lg font-bold text-lg transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Task..." : "Post Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
