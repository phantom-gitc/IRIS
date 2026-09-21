import React from 'react';
import { MemoryView } from '../features/tabs/MemoryView';

export const MemoryPage: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto px-4 py-2">
      <MemoryView />
    </div>
  );
};
