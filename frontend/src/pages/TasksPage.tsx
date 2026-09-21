import React from 'react';
import { TasksView } from '../features/tabs/TasksView';

export const TasksPage: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto px-4 py-2">
      <TasksView />
    </div>
  );
};
