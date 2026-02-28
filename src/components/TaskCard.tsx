import { Task, CATEGORY_NAMES, STATUS_NAMES } from "@/types";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import CategoryIcon from "./CategoryIcon";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();

  const timeRemaining = task.deadline - Math.floor(Date.now() / 1000);
  const hoursRemaining = Math.floor(timeRemaining / 3600);
  const daysRemaining = Math.floor(hoursRemaining / 24);

  const getTimeDisplay = () => {
    if (timeRemaining < 0) return "Expired";
    if (daysRemaining > 0) return `${daysRemaining}d`;
    return `${hoursRemaining}h`;
  };

  return (
    <div
      onClick={() => navigate(`/tasks/${task.taskId}`)}
      className="glass rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CategoryIcon category={task.category} />
          <span className="text-xs text-gray-400">{CATEGORY_NAMES[task.category]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono font-bold">
            ${ethers.formatUnits(task.bounty, 6)}
          </span>
        </div>
      </div>

      <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {task.description}
      </h3>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>🎯 {task.bidCount} bids</span>
          <span>⏱️ {getTimeDisplay()}</span>
        </div>
        {task.isRecurring && <span className="text-secondary">🔄 Recurring</span>}
      </div>
    </div>
  );
}
