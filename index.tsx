import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("GoQuantum: Inicializando aplicação...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("GoQuantum: Erro - Elemento 'root' não encontrado.");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("GoQuantum: Renderização inicial concluída.");