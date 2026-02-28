import { useState } from "react";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function DisputeModal({ isOpen, onClose, onSubmit }: DisputeModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
      setReason("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Open Dispute</h2>

        <p className="text-sm text-gray-400 mb-4">
          Opening a dispute will freeze the funds and notify 3 reviewers. They will vote on the outcome.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the issue..."
          className="w-full bg-gray-900 text-white rounded-lg p-3 mb-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-danger hover:bg-danger/80 rounded-lg font-medium transition-all"
          >
            Open Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
