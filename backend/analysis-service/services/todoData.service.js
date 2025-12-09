import { fetchData } from '../utils/axiosClient.js';

export const getTodoData = async (token) => {
  try {
    const todos = await fetchData('TODO', '/api/todos', token);
    return todos;
  } catch (error) {
    console.error('Error fetching todo data:', error);
    throw error;
  }
};

export const getTodoStatistics = async (token) => {
  const todos = await getTodoData(token);
  
  const pendingTodos = todos.filter(t => t.status === 'pending');
  const inProgressTodos = todos.filter(t => t.status === 'in_progress');
  const completedTodos = todos.filter(t => t.status === 'completed');
  
  // Todos by assignee
  const assigneeDistribution = {};
  todos.forEach(todo => {
    assigneeDistribution[todo.assignee] = (assigneeDistribution[todo.assignee] || 0) + 1;
  });
  
  // Todos by priority
  const priorityDistribution = {};
  todos.forEach(todo => {
    priorityDistribution[todo.priority] = (priorityDistribution[todo.priority] || 0) + 1;
  });
  
  return {
    totalTodos: todos.length,
    pendingTodos: pendingTodos.length,
    inProgressTodos: inProgressTodos.length,
    completedTodos: completedTodos.length,
    assigneeDistribution,
    priorityDistribution
  };
};