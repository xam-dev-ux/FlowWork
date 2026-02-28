import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContract } from "./useContract";
import { Task } from "@/types";

export function useTasks() {
  const { contract } = useContract();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract) return;

    async function fetchTasks() {
      try {
        const openTaskIds = await contract.getOpenTasks();
        const taskPromises = openTaskIds.map(async (id: bigint) => {
          const task = await contract.getTask(id);
          return {
            taskId: Number(task.taskId),
            client: task.client,
            assignedAgent: task.assignedAgent,
            description: task.description,
            category: task.category,
            bounty: task.bounty,
            deadline: Number(task.deadline),
            status: task.status,
            ipfsHash: task.ipfsHash,
            bidCount: Number(task.bidCount),
            isRecurring: task.isRecurring,
          };
        });

        const fetchedTasks = await Promise.all(taskPromises);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();

    const interval = setInterval(fetchTasks, 10000);

    return () => clearInterval(interval);
  }, [contract]);

  return { tasks, loading };
}

export function useTask(taskId: number) {
  const { contract } = useContract();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || !taskId) return;

    async function fetchTask() {
      try {
        const taskData = await contract.getTask(taskId);
        setTask({
          taskId: Number(taskData.taskId),
          client: taskData.client,
          assignedAgent: taskData.assignedAgent,
          description: taskData.description,
          category: taskData.category,
          bounty: taskData.bounty,
          deadline: Number(taskData.deadline),
          status: taskData.status,
          ipfsHash: taskData.ipfsHash,
          bidCount: Number(taskData.bidCount),
          isRecurring: taskData.isRecurring,
        });
      } catch (error) {
        console.error("Failed to fetch task:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTask();

    const interval = setInterval(fetchTask, 10000);

    return () => clearInterval(interval);
  }, [contract, taskId]);

  return { task, loading };
}

export function useUserTasks(address: string | null) {
  const { contract } = useContract();
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [agentTasks, setAgentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || !address) return;

    async function fetchUserTasks() {
      try {
        const clientTaskIds = await contract.getClientTasks(address);
        const agentTaskIds = await contract.getAgentTasks(address);

        const fetchTaskData = async (id: bigint) => {
          const task = await contract.getTask(id);
          return {
            taskId: Number(task.taskId),
            client: task.client,
            assignedAgent: task.assignedAgent,
            description: task.description,
            category: task.category,
            bounty: task.bounty,
            deadline: Number(task.deadline),
            status: task.status,
            ipfsHash: task.ipfsHash,
            bidCount: Number(task.bidCount),
            isRecurring: task.isRecurring,
          };
        };

        const clientTasksData = await Promise.all(clientTaskIds.map(fetchTaskData));
        const agentTasksData = await Promise.all(agentTaskIds.map(fetchTaskData));

        setClientTasks(clientTasksData);
        setAgentTasks(agentTasksData);
      } catch (error) {
        console.error("Failed to fetch user tasks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserTasks();

    const interval = setInterval(fetchUserTasks, 10000);

    return () => clearInterval(interval);
  }, [contract, address]);

  return { clientTasks, agentTasks, loading };
}
