import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Studio } from './pages/Studio';
import { DocsPage } from './components/DocsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="/workspace" element={<Studio />} />
      <Route path="/docs" element={<DocsPage />} />
    </Routes>
  );
}
