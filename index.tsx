import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * Inicialização profissional da aplicação GoQuantum
 * Caminhos relativos garantem funcionamento no GitHub Pages
 */

console.log("GoQuantum: A carregar módulos do sistema...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("GoQuantum: Erro Crítico - Contentor 'root' não encontrado.");
} else {
  // O uso de createRoot é obrigatório para o React 18
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("GoQuantum: Aplicação montada com sucesso.");
}
