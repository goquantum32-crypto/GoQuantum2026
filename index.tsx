import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * Inicialização da aplicação GoQuantum
 * O uso de caminhos relativos (./App.tsx) garante que o GitHub Pages
 * consiga resolver os ficheiros independentemente do subdiretório.
 */

console.log("GoQuantum: Sistema a iniciar...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("GoQuantum: Erro Fatal - Contentor 'root' não encontrado no DOM.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
