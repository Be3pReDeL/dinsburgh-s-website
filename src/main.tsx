import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ContentProvider } from './content/ContentContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </React.StrictMode>
);
