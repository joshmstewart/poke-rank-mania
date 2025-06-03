
import React from "react";
import AppContent from "./components/AppContent";

const App: React.FC = React.memo(() => {
  console.log(`🚀🚀🚀 ROOT_APP_FIXED: Rendering with maximum stability`);

  return <AppContent />;
});

App.displayName = 'App';

export default App;
