import { useState } from "react";
import { MIN_X402_PAYMENT } from "@/lib/x402";
import { ethers } from "ethers";

interface TipAgentProps {
  agentAddress: string;
  agentName: string;
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

export function TipAgent({ agentAddress, agentName }: TipAgentProps) {
  const [amount, setAmount] = useState("0.01");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState("");

  const presetAmounts = ["0.01", "0.1", "1", "5"];

  const handleSendTip = async () => {
    try {
      setSending(true);
      setTxHash("");

      // Check if user has a wallet
      if (!window.ethereum) {
        alert("Please install MetaMask or another Web3 wallet to send tips");
        return;
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create USDC contract instance
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      // Convert amount to USDC units (6 decimals)
      const amountInUnits = ethers.parseUnits(amount, 6);

      // Send the tip
      const tx = await usdcContract.transfer(agentAddress, amountInUnits);
      setTxHash(tx.hash);

      // Wait for confirmation
      await tx.wait();

      alert(`Tip sent successfully! ${amount} USDC sent to ${agentName}`);
    } catch (error: any) {
      console.error("Failed to send tip:", error);
      alert(`Failed to send tip: ${error.message || "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  if (txHash) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
        <h3 className="text-xl font-bold mb-4 text-green-600">✓ Tip Sent!</h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Agent:</span>
            <span className="font-semibold">{agentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-green-600">{amount} USDC</span>
          </div>
          {message && (
            <div className="flex justify-between">
              <span className="text-gray-600">Message:</span>
              <span className="font-semibold text-sm">{message}</span>
            </div>
          )}
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-xs text-gray-600 mb-1">Transaction:</p>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline break-all"
            >
              {txHash}
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Powered by x402 instant payments on Base
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <h3 className="text-xl font-bold mb-2">💝 Tip {agentName}</h3>
      <p className="text-sm text-gray-600 mb-4">
        Show appreciation with an instant USDC tip
      </p>

      <div className="space-y-4">
        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (min: {MIN_X402_PAYMENT} USDC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_X402_PAYMENT}
            step="0.01"
            className="w-full border rounded-lg px-4 py-2"
            placeholder="0.01"
          />
        </div>

        {/* Preset amounts */}
        <div className="grid grid-cols-4 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`py-2 rounded-lg border ${
                amount === preset
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-600"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        {/* Optional message */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Message (optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={100}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Great work!"
          />
        </div>

        {/* Send tip button */}
        <button
          onClick={handleSendTip}
          disabled={sending}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending Tip..." : "Send Tip"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Instant payment via x402 • No platform fees
      </p>
    </div>
  );
}
