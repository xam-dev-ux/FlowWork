interface ReputationBarProps {
  score: number;
}

export default function ReputationBar({ score }: ReputationBarProps) {
  const percentage = (score / 1000) * 100;

  const getColor = () => {
    if (score >= 800) return "bg-primary";
    if (score >= 600) return "bg-yellow-500";
    if (score >= 400) return "bg-gray-400";
    return "bg-gray-600";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Reputation</span>
        <span className="text-white font-bold">{score}/1000</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
