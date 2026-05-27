import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import Profile from './pages/data-scout/Profile';
import Prematch from './pages/data-scout/Prematch';
import Auto from './pages/data-scout/Auto';
import Endgame from './pages/data-scout/Endgame';
import Submit from './pages/data-scout/Submit';
import Teleop from './pages/data-scout/Teleop';
import Library from './pages/picklist/Library';
import Manager from './pages/picklist/Manager';
import RobotData from './pages/picklist/RobotData';
import MatchStrategyLibrary from './pages/match-strategy/Library';
import MatchStrategyDetail from './pages/match-strategy/Detail';
import RequireAuth from './utils/RequireAuth';
import { PicklistsProvider } from './lib/picklists-store';


import { BrowserRouter, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
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
        <Route
          path="/picklists"
          element={
            <PicklistsProvider>
              <Library />
            </PicklistsProvider>
          }
        />
        <Route
          path="/robot-data"
          element={
            <PicklistsProvider>
              <RobotData />
            </PicklistsProvider>
          }
        />
        <Route
          path="/picklists/:id"
          element={
            <PicklistsProvider>
              <Manager />
            </PicklistsProvider>
          }
        />
        <Route path="/match-strategy" element={<MatchStrategyLibrary />} />
        <Route
          path="/match-strategy/:id"
          element={<MatchStrategyDetail />}
        />
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
