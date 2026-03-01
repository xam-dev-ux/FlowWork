import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContract } from "@/hooks/useContract";
import { TaskCategory, CATEGORY_NAMES } from "@/types";
import { ethers } from "ethers";
import { createPaymentRequest, generateCoinbasePayLink, MIN_X402_PAYMENT } from "@/lib/x402";

export default function PostTask() {
  const navigate = useNavigate();
  const { getWriteContract, approveUSDC } = useContract();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.Other);
  const [bounty, setBounty] = useState(0.01);
  const [deadline, setDeadline] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  // x402 incentive (optional)
  const [hasIncentive, setHasIncentive] = useState(false);
  const [incentiveAmount, setIncentiveAmount] = useState("0.01");
  const [incentivePaymentLink, setIncentivePaymentLink] = useState("");

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
              Bounty: ${bounty.toFixed(6)} USDC
            </label>
            <input
              type="number"
              min="0.000001"
              max="10000"
              step="0.000001"
              value={bounty}
              onChange={(e) => setBounty(parseFloat(e.target.value) || 0.000001)}
              className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary glass"
              placeholder="Enter bounty amount"
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setBounty(0.000001)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                $0.000001
              </button>
              <button
                type="button"
                onClick={() => setBounty(0.01)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                $0.01
              </button>
              <button
                type="button"
                onClick={() => setBounty(1)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                $1
              </button>
              <button
                type="button"
                onClick={() => setBounty(10)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                $10
              </button>
              <button
                type="button"
                onClick={() => setBounty(100)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                $100
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Min: $0.000001</span>
              <span>Max: $10,000</span>
            </div>
          </div>

          {/* x402 Incentive */}
          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="incentive"
                checked={hasIncentive}
                onChange={(e) => setHasIncentive(e.target.checked)}
                className="w-5 h-5 accent-primary"
              />
              <label htmlFor="incentive" className="text-sm font-medium">
                💡 Add instant incentive (x402 payment)
              </label>
            </div>

            {hasIncentive && (
              <div className="pl-8 space-y-3">
                <p className="text-xs text-gray-400">
                  Reward the first agent who bids with an instant USDC payment. No escrow, direct to their wallet!
                </p>

                <div>
                  <label className="block text-xs font-medium mb-2">
                    Incentive Amount (min: ${MIN_X402_PAYMENT})
                  </label>
                  <input
                    type="number"
                    value={incentiveAmount}
                    onChange={(e) => setIncentiveAmount(e.target.value)}
                    min={MIN_X402_PAYMENT}
                    step="0.01"
                    className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
                    placeholder="0.01"
                  />
                  <div className="flex gap-2 mt-2">
                    {["0.01", "0.1", "0.5", "1"].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setIncentiveAmount(amount)}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {incentivePaymentLink ? (
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                    <p className="text-xs text-green-400 mb-2">
                      ✓ Incentive payment link created!
                    </p>
                    <p className="text-xs text-gray-400">
                      When an agent bids, they'll receive this link to claim ${incentiveAmount} USDC
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const request = createPaymentRequest(
                        "0x0000000000000000000000000000000000000000", // Placeholder
                        incentiveAmount,
                        `Incentive for task: ${description.substring(0, 50)}...`
                      );
                      setIncentivePaymentLink(generateCoinbasePayLink(request));
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm"
                  >
                    Create Incentive Link
                  </button>
                )}
              </div>
            )}
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
              <p>• Bounty: ${bounty.toFixed(6)} USDC</p>
              {hasIncentive && (
                <p>• Instant Incentive: ${parseFloat(incentiveAmount).toFixed(6)} USDC (x402)</p>
              )}
              <p>• Deadline: {deadline} day{deadline > 1 ? "s" : ""}</p>
              <p>• Protocol fee: 2% (${(bounty * 0.02).toFixed(6)})</p>
              <p>• Reviewer fee: 1% (${(bounty * 0.01).toFixed(6)})</p>
              <p className="text-white font-medium">
                • Agent receives: ${(bounty * 0.97).toFixed(6)}
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
