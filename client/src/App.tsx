import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initAuthListener } from './services/firebase/auth';
import { leadAutomationService } from './services/lead-automation';
import { dripWorker } from './services/drip-worker';
import './index.css';

function App() {
  useEffect(() => {
    initAuthListener();
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(isPersisted => {
        console.log(`Persisted storage granted: ${isPersisted}`);
      });
    }
  }, []);

  useEffect(() => {
    leadAutomationService.start();
    dripWorker.start();
    
    return () => {
      leadAutomationService.stop();
      dripWorker.stop();
    };
  }, []);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
