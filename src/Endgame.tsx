import './Endgame.css';
import { useState} from 'react';
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { useNavigate } from 'react-router-dom';

function Endgame() {
  const [climb, setClimb] = useState<string>(localStorage.getItem('endgame_climb') ?? "None");
  const [shootWhileClimb, setShootWhileClimb] = useState<boolean>(localStorage.getItem('endgame_shoot_while_climb') === 'true');
  const [buddyClimb, setBuddyClimb] = useState<boolean>(localStorage.getItem('endgame_buddy_climb') === 'true');
  const navigate = useNavigate();
  return (
    <div className="mainContainer">
      {/* Top header */}
      <div className="topHeader">
        <div>
          <h1>Endgame</h1>
        </div>
      </div>

      {/* Climb Selections  */}
      <h3>Climb Level</h3>
      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button style={{ background:'#b2c2f6', opacity: climb === "Level 1" ? 0.6 : 1, color: '#2f1404' }} onClick={() => {
          setClimb("Level 1");
          localStorage.setItem('endgame_climb', 'Level 1');
        }}>Level 1</button>
        <button style={{ background:'#b2c2f6', opacity: climb === "Level 2" ? 0.6 : 1, color: '#2f1404' }} onClick={() => {
          setClimb("Level 2");
          localStorage.setItem('endgame_climb', 'Level 2');
        }}>Level 2</button>
        <button style={{ background:'#b2c2f6', opacity: climb === "Level 3" ? 0.6 : 1, color: '#2f1404' }} onClick={() => {
          setClimb("Level 3");
          localStorage.setItem('endgame_climb', 'Level 3');
        }}>Level 3</button>
        <button style={{ background:'#d7b3fb', opacity: climb === "None" ? 0.6 : 1, color: '#2f1404' }} onClick={() => {
          setClimb("None");
          localStorage.setItem('endgame_climb', 'None');
        }}>None</button>
        <button style={{ background:'#d7b3fb', opacity: climb === "Climb Fail" ? 0.6 : 1, color: '#2f1404' }} onClick={() => {
          setClimb("Climb Fail");
          localStorage.setItem('endgame_climb', 'Climb Fail');
        }}>Climb Fail</button>
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
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/teleopv2')}>Back</button>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/Submit')}>Next</button>
      </div>
    </div>
  );
}

export default Endgame;
