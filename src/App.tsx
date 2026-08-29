import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Workspace } from './pages/Workspace';
import { DocsPage } from './components/DocsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="/docs" element={<DocsPage />} />
    </Routes>
  );
}
