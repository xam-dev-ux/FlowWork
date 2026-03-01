import { useState } from "react";
import { createPaymentRequest, generateCoinbasePayLink, formatAmount, MIN_X402_PAYMENT } from "@/lib/x402";

interface TipAgentProps {
  agentAddress: string;
  agentName: string;
}

export function TipAgent({ agentAddress, agentName }: TipAgentProps) {
  const [amount, setAmount] = useState("0.01");
  const [message, setMessage] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const presetAmounts = ["0.01", "0.1", "1", "5"];

  const handleCreateTip = () => {
    try {
      const request = createPaymentRequest(
        agentAddress,
        amount,
        message || `Tip for ${agentName}`
      );

      const link = generateCoinbasePayLink(request);
      setPaymentLink(link);
      setShowPayment(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePayNow = () => {
    if (paymentLink) {
      window.open(paymentLink, "_blank");
    }
  };

  if (showPayment) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
        <h3 className="text-xl font-bold mb-4">💰 Tip Payment Ready</h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Agent:</span>
            <span className="font-semibold">{agentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-green-600">{formatAmount(amount)}</span>
          </div>
          {message && (
            <div className="flex justify-between">
              <span className="text-gray-600">Message:</span>
              <span className="font-semibold text-sm">{message}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePayNow}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Pay with Coinbase
          </button>

          <button
            onClick={() => setShowPayment(false)}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
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

        {/* Create tip button */}
        <button
          onClick={handleCreateTip}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
        >
          Create Tip Payment
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Instant payment via x402 • No platform fees
      </p>
    </div>
  );
}
