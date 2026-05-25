import { useState, useEffect } from 'react';
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto, isPracticeSession, isTeleopV2Session } from '../utils/autoAccess';

function Endgame() {
  const savedClimb = localStorage.getItem('endgame_climb') ?? 'None';
  const savedClimbType = localStorage.getItem('endgame_climb_type') ?? 'Center';
  const initialClimbStatus: 'None' | 'Failed' | 'Success' = savedClimb === 'None' ? 'None' : (savedClimb === 'Failed' ? 'Failed' : 'Success');
  const initialClimbLevel: 'Level 1' | 'Level 2' | 'Level 3' | null =
    savedClimb === 'Level 1' || savedClimb === 'Level 2' || savedClimb === 'Level 3' ? savedClimb : null;
  const [climbStatus, setClimbStatus] = useState<'None' | 'Failed' | 'Success'>(initialClimbStatus);
  const [climbLevel, setClimbLevel] = useState<'Level 1' | 'Level 2' | 'Level 3' | null>(initialClimbLevel);
  const [climbType, setClimbType] = useState<'Center' | 'Side'>(savedClimbType === 'Side' ? 'Side' : 'Center');
  const [shootWhileClimb, setShootWhileClimb] = useState<boolean>(localStorage.getItem('endgame_shoot_while_climb') === 'true');
  const [buddyClimb, setBuddyClimb] = useState<boolean>(localStorage.getItem('endgame_buddy_climb') === 'true');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (
      window.location.hostname !== 'localhost' &&
      localStorage.getItem('profile_is_signed_in') !== 'true' &&
      !isPracticeSession()
    ) {
      navigate('/profile');
    }
  }, [navigate]);

  const persistClimb = (nextStatus: 'None' | 'Failed' | 'Success', nextLevel: 'Level 1' | 'Level 2' | 'Level 3' | null, nextType: 'Center' | 'Side') => {
    let finalValue = 'None';
    if (nextStatus === 'Success') {
      finalValue = nextLevel ?? 'None';
    } else if (nextStatus === 'Failed') {
      finalValue = 'Failed';
    }
    const shouldStoreType = nextStatus === 'Success';
    localStorage.setItem('endgame_climb', finalValue);
    localStorage.setItem('endgame_climb_status', nextStatus);
    localStorage.setItem('endgame_climb_level', shouldStoreType ? (nextLevel ?? '') : '');
    localStorage.setItem('endgame_climb_type', shouldStoreType ? nextType : '');
  };

  const handleStatusSelect = (status: 'None' | 'Failed' | 'Success') => {
    setClimbStatus(status);
    if (status !== 'Success') {
      setClimbLevel(null);
    }
    persistClimb(status, status === 'Success' ? climbLevel : null, climbType);
  };

  const handleLevelSelect = (level: 'Level 1' | 'Level 2' | 'Level 3' | null) => {
    setClimbLevel(level);
    setClimbStatus('Success');
    persistClimb('Success', level, climbType);
  };

  const handleClimbTypeSelect = (type: 'Center' | 'Side') => {
    setClimbType(type);
    persistClimb(climbStatus, climbLevel, type);
  };

  return (
    <div className="mainContainer" style={{padding: '20px'}}>
      {/* Top header */}
      <div style={{marginBottom: '20px'}}>
        <div>
          <h1>Endgame</h1>
        </div>
      </div>
      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button style={{ background:'#b2c2f6', opacity: climbLevel === "Level 3" && climbStatus === 'Success' ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleLevelSelect('Level 3')}>Level 3</button>
        <button style={{ background:'#b2c2f6', opacity: climbLevel === "Level 2" && climbStatus === 'Success' ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleLevelSelect('Level 2')}>Level 2</button>
        <button style={{ background:'#b2c2f6', opacity: climbLevel === "Level 1" && climbStatus === 'Success' ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleLevelSelect('Level 1')}>Level 1</button>
      </div>


      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button style={{ background:'#d7b3fb', opacity: climbStatus === "None" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleStatusSelect('None')}>Not Attempted</button>
        <button style={{ background:'#d7b3fb', opacity: climbStatus === "Failed" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleStatusSelect('Failed')}>Failed</button>
      </div>

      {/* Climb type selection (only on success) */}
      {climbStatus === 'Success' && climbLevel && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '1rem', width: '100%' }}>
          <button style={{ background: climbType === 'Center' ? '#f6e7b2' : '#e0e0e0', color: '#2f1404', opacity: climbType === 'Center' ? 0.7 : 1 }} onClick={() => handleClimbTypeSelect('Center')}> Center of Tower</button>
          <button style={{ background: climbType === 'Side' ? '#f6e7b2' : '#e0e0e0', color: '#2f1404', opacity: climbType === 'Side' ? 0.7 : 1 }} onClick={() => handleClimbTypeSelect('Side')}>Side of Tower</button>
        </div>
      )}

      {/* Checkbox */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "1rem", flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem', marginRight: '4.4rem' }}>
          <Checkbox.Root className="CheckboxRoot" id="c1" onClick={() => {
            const next = !shootWhileClimb;
            setShootWhileClimb(next);
            localStorage.setItem('endgame_shoot_while_climb', String(next));
          }} checked={shootWhileClimb}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label">
            Shooting while climbing?
          </label>
        </div>
        <center>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem', marginRight: '0.5rem' }}>
          <Checkbox.Root className="CheckboxRoot" id="c2" onClick={() => {
            const next = !buddyClimb;
            setBuddyClimb(next);
            localStorage.setItem('endgame_buddy_climb', String(next));
          }} checked={buddyClimb}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label">
          Did they climb with another robot?
          </label>
        </div>
        </center>
      </div>
      

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: "1rem", flexWrap: 'wrap', width: '100%' }}>
        <button
          className="navBtns"
          style={{ flex: '1 1 auto', minWidth: '100px' }}
          onClick={() =>
            navigate(currentScoutCanUseAuto() && !isTeleopV2Session() ? '/auto' : '/teleop')
          }
        >
          Back
        </button>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/Submit')}>Next</button>
      </div>
    </div>
  );
}

export default Endgame;
