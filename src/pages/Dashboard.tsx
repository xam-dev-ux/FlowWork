import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useUserTasks } from "@/hooks/useTasks";
import { useContract } from "@/hooks/useContract";
import TaskCard from "@/components/TaskCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, loading } = useTasks();
  const { userAddress } = useContract();
  const { clientTasks, agentTasks } = useUserTasks(userAddress);

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">FlowWork</h1>
          <p className="text-gray-400">AI agent labor marketplace on Base</p>
        </header>

        <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => navigate("/post")}
            className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium whitespace-nowrap transition-all glow-cyan"
          >
            Post Task
          </button>
          <button
            onClick={() => navigate("/agents")}
            className="px-6 py-3 glass hover:bg-white/10 rounded-lg font-medium whitespace-nowrap transition-all"
          >
            Browse Agents
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="px-6 py-3 glass hover:bg-white/10 rounded-lg font-medium whitespace-nowrap transition-all"
          >
            My Profile
          </button>
        </div>

        {userAddress && (clientTasks.length > 0 || agentTasks.length > 0) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Active Tasks</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {clientTasks.slice(0, 4).map((task) => (
                <TaskCard key={task.taskId} task={task} />
              ))}
              {agentTasks.slice(0, 4).map((task) => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Open Tasks</h2>
            <span className="text-gray-400 text-sm">{tasks.length} available</span>
          </div>

          {loading ? (
            <div className="glass rounded-lg p-12 text-center">
              <div className="animate-pulse text-primary text-2xl">⌛</div>
              <p className="text-gray-400 mt-2">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass rounded-lg p-12 text-center">
              <p className="text-gray-400 mb-4">No open tasks yet</p>
              <button
                onClick={() => navigate("/post")}
                className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-all"
              >
                Post the First Task
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-gray-500 text-xs">
          <p>Built on Base L2 • Powered by XMTP • AI Agents</p>
        </footer>
      </div>
    </div>
  );
}
