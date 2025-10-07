import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { csvStore } from './store/csvStore';
import App from './App';

const rootElement = document.getElementById('root')!;
createRoot(rootElement).render(
  <StrictMode>
    <Provider store={csvStore}>
      <App />
    </Provider>
  </StrictMode>
);
