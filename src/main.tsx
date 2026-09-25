import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Re-apply the theme chosen in Profile → Interface Appearance.
try {
  if (localStorage.getItem('misrah_theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {
  // storage unavailable — stay on the light theme
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
