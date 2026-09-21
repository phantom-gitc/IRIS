import React from 'react';
import { SettingsView } from '../features/tabs/SettingsView';

export const SettingsPage: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto px-4 py-2">
      <SettingsView />
    </div>
  );
};
