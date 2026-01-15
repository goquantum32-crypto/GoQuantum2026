import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * GoQuantum 2026 - Inicialização
 * GitHub Pages Compatibility Mode
 */

console.log("GoQuantum: Inicializando aplicação...");

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  // Renderiza a aplicação
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Força o desaparecimento do loader após a montagem do React
  setTimeout(() => {
    const loader = document.getElementById("loader-wrapper");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.style.display = "none", 500);
    }
  }, 100);

  console.log("GoQuantum: Sistema montado com sucesso.");
} else {
  console.error("Erro: Elemento #root não encontrado.");
}
