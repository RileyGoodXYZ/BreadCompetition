import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import Profile from './pages/Profile';
import Prematch from './pages/Prematch';
import Auto from './pages/Auto';
import Endgame from './pages/Endgame';
import Submit from './pages/Submit';
import Teleop from './pages/Teleop';
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
        <Route path="/teleop" element={
          <RequireAuth>
            <Teleop />
          </RequireAuth>
        } />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
  
)
