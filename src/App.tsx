import React from 'react';
import { IslandProvider } from './context/IslandContext';
import { DynamicIsland } from './components/island/DynamicIsland';
import { useElectronIPC } from './hooks/useElectronIPC';

// Wrapper component to call hooks that need context
function IslandApp() {
  useElectronIPC();
  return <DynamicIsland />;
}

function App() {
  return (
    <IslandProvider>
      <IslandApp />
    </IslandProvider>
  );
}

export default App;
