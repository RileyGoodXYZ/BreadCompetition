import './Endgame.css';
import { useState} from 'react';
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { useNavigate } from 'react-router-dom';

function Endgame() {
  const savedClimb = localStorage.getItem('endgame_climb') ?? 'None';
  const initialClimbStatus: 'None' | 'Climb' = savedClimb === 'None' ? 'None' : 'Climb';
  const initialClimbLevel: 'Level 1' | 'Level 2' | 'Level 3' | null =
    savedClimb === 'Level 1' || savedClimb === 'Level 2' || savedClimb === 'Level 3' ? savedClimb : null;
  const [climbStatus, setClimbStatus] = useState<'None' | 'Climb'>(initialClimbStatus);
  const [climbLevel, setClimbLevel] = useState<'Level 1' | 'Level 2' | 'Level 3' | null>(initialClimbLevel);
  const [shootWhileClimb, setShootWhileClimb] = useState<boolean>(localStorage.getItem('endgame_shoot_while_climb') === 'true');
  const [buddyClimb, setBuddyClimb] = useState<boolean>(localStorage.getItem('endgame_buddy_climb') === 'true');
  const navigate = useNavigate();

  const persistClimb = (nextStatus: 'None' | 'Climb', nextLevel: 'Level 1' | 'Level 2' | 'Level 3' | null) => {
    const finalValue = nextStatus === 'None' ? 'None' : (nextLevel ?? 'Climb');
    localStorage.setItem('endgame_climb', finalValue);
    localStorage.setItem('endgame_climb_status', nextStatus);
    localStorage.setItem('endgame_climb_level', nextLevel ?? '');
  };

  const handleStatusSelect = (status: 'None' | 'Climb') => {
    setClimbStatus(status);
    persistClimb(status, climbLevel);
  };

  const handleLevelSelect = (level: 'Level 1' | 'Level 2' | 'Level 3') => {
    setClimbLevel(level);
    persistClimb(climbStatus, level);
  };

  return (
    <div className="mainContainer">
      {/* Top header */}
      <div className="topHeader">
        <div>
          <h1>Endgame</h1>
        </div>
      </div>


      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button style={{ background:'#b2c2f6', opacity: climbLevel === "Level 1" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleLevelSelect('Level 1')}>Level 1</button>
        <button style={{ background:'#b2c2f6', opacity: climbLevel === "Level 2" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleLevelSelect('Level 2')}>Level 2</button>
        <button style={{ background:'#b2c2f6', opacity: climbLevel === "Level 3" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleLevelSelect('Level 3')}>Level 3</button>
      </div>


      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button style={{ background:'#d7b3fb', opacity: climbStatus === "None" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleStatusSelect('None')}>None</button>
        <button style={{ background:'#d7b3fb', opacity: climbStatus === "Climb" ? 0.6 : 1, color: '#2f1404' }} onClick={() => handleStatusSelect('Climb')}>Climb</button>
      </div>

      {/* Checkbox */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "1rem", flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem' }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem', marginRight: '4.4rem' }}>
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
            Buddy climb?
          </label>
        </div>
        </center>
      </div>
      

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: "1rem", flexWrap: 'wrap', width: '100%' }}>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/teleopv3')}>Back</button>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/Submit')}>Next</button>
      </div>
    </div>
  );
}

export default Endgame;
