import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Prematch from './Prematch';
import Auto from './Auto';
import Endgame from './Endgame';
import Submit from './Submit';
import Teleop from './Teleop';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/prematch" element={<Prematch />} />
        <Route path="/auto" element={<Auto />} />
        <Route path="/teleop" element={<Teleop />} />
        <Route path="/endgame" element={<Endgame />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
