import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import './App.css'
import './Teleop.css'
import './teleopv3.css'
import Profile from './Profile';
import Prematch from './Prematch';
import Auto from './Auto';
import Endgame from './Endgame';
import Submit from './Submit';
import TeleopV2 from './teleopv2';
import RequireAuth from './RequireAuth';


import { BrowserRouter, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="1052919843340-og0i5nd5otropoqgtdqbla3lrsr4o1pd.apps.googleusercontent.com">
  <BrowserRouter>
      <Routes>
        <Route path="/" element={
            <Profile />
        } />
        <Route path="/profile" element={
            <Profile />
        } />
        <Route path="/prematch" element={
          <RequireAuth>
            <Prematch />
          </RequireAuth>
        } />
        <Route path="/auto" element={
          <RequireAuth>
            <Auto />
          </RequireAuth>
        } />
        <Route path="/endgame" element={
          <RequireAuth>
            <Endgame />
          </RequireAuth>
        } />
        <Route path="/submit" element={
          <RequireAuth>
            <Submit />
          </RequireAuth>
        } />
        <Route path="/teleopv2" element={
          <RequireAuth>
            <TeleopV2 />
          </RequireAuth>
        } />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
  
)
