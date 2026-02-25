import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.tsx'
import Profile from './Profile';
import Prematch from './Prematch';
import Auto from './Auto';
import Endgame from './Endgame';
import Submit from './Submit';
import Teleop from './Teleop';
import TeleopV2 from './teleopv2';
import TeleopV3 from './teleopv3';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="1052919843340-og0i5nd5otropoqgtdqbla3lrsr4o1pd.apps.googleusercontent.com">
  <BrowserRouter>
      <Routes>
      <Route path="/" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/prematch" element={<Prematch />} />
        <Route path="/auto" element={<Auto />} />
        <Route path="/teleop" element={<Teleop />} />
        <Route path="/endgame" element={<Endgame />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/teleopv2" element={<TeleopV2 />} />
        <Route path="/teleopv3" element={<TeleopV3 />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
  
)
