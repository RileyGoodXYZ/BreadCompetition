import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import Home from './pages/Home';
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
import BreakHome from './pages/break-scout/BreakHome';
import BreakPage from './pages/break-scout/BreakPage';
import FoulHome from './pages/foul-scout/FoulHome';
import FoulPage from './pages/foul-scout/FoulPage';
import PitHome from './pages/pit-scout/PitHome';
import PitPage from './pages/pit-scout/PitPage';
import AdvPitPage from './pages/pit-scout/AdvPitPage';
import SubjectiveHome from './pages/subjective-scout/SubjectiveHome';
import SubjectivePage from './pages/subjective-scout/SubjectivePage';
import { PicklistsProvider } from './lib/picklists-store';
import { MatchStrategyProvider } from './lib/match-strategy-store';
import { installViewportTracker } from './lib/viewport';

installViewportTracker();


import { BrowserRouter, Route, Routes } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="1052919843340-og0i5nd5otropoqgtdqbla3lrsr4o1pd.apps.googleusercontent.com">
  <BrowserRouter>
      <PicklistsProvider>
      <MatchStrategyProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/data-scout" element={<Profile />} />
        <Route path="/data-scout/profile" element={<Profile />} />
        <Route path="/data-scout/prematch" element={
          <RequireAuth>
            <Prematch />
          </RequireAuth>
        } />
        <Route path="/data-scout/auto" element={
          <RequireAuth>
            <Auto />
          </RequireAuth>
        } />
        <Route path="/data-scout/endgame" element={
          <RequireAuth>
            <Endgame />
          </RequireAuth>
        } />
        <Route path="/data-scout/submit" element={
          <RequireAuth>
            <Submit />
          </RequireAuth>
        } />
        <Route path="/data-scout/teleop" element={
          <RequireAuth>
            <Teleop />
          </RequireAuth>
        } />
        <Route path="/picklists" element={<Library />} />
        <Route path="/robot-data" element={<RobotData />} />
        <Route path="/picklists/:id" element={<Manager />} />
        <Route path="/match-strategy" element={<MatchStrategyLibrary />} />
        <Route
          path="/match-strategy/:id"
          element={<MatchStrategyDetail />}
        />
        <Route path="/break" element={<BreakHome />} />
        <Route path="/break/scout" element={<BreakPage />} />
        <Route path="/foul" element={<FoulHome />} />
        <Route path="/foul/scout" element={<FoulPage />} />
        <Route path="/pit" element={<PitHome />} />
        <Route path="/pit/scout" element={<PitPage />} />
        <Route path="/pit/advanced" element={<AdvPitPage />} />
        <Route path="/subjective" element={<SubjectiveHome />} />
        <Route path="/subjective/scout" element={<SubjectivePage />} />
      </Routes>
      </MatchStrategyProvider>
      </PicklistsProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
