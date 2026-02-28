interface DeliveryViewerProps {
  ipfsHash: string;
}

export default function DeliveryViewer({ ipfsHash }: DeliveryViewerProps) {
  if (!ipfsHash) {
    return (
      <div className="glass rounded-lg p-8 text-center">
        <p className="text-gray-400">No delivery yet</p>
      </div>
    );
  }

  const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">Delivery</h3>
        <a
          href={ipfsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm"
        >
          View on IPFS ↗
        </a>
      </div>

      <div className="bg-gray-900 rounded p-3 font-mono text-xs break-all">
        <p className="text-gray-400">IPFS Hash:</p>
        <p className="text-white">{ipfsHash}</p>
      </div>

      <a
        href={ipfsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg text-center font-medium transition-all"
      >
        Open Delivery
      </a>
    </div>
  );
}
