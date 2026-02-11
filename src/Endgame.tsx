import './Endgame.css';
import { useState} from 'react';
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { useNavigate } from 'react-router-dom';

function Endgame() {
  const [climb, setClimb] = useState("None");
  const [shootWhileClimb, setShootWhileClimb] = useState(false);
  const [buddyClimb, setBuddyClimb] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="mainContainer">
      {/* Top header */}
      <div className="topHeader">
        <div>
          <h1>Endgame</h1>
        </div>
      </div>

      {/* Trench/Bump and Score/Pass toggle  */}
      <h3>Climb Level</h3>
      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button style={{ background: climb === "Level 1" ? '#90ee90' : '#ffe0bb', color: '#2f1404' }} onClick={() => setClimb("Level 1")}>Level 1</button>
        <button style={{ background: climb === "Level 2" ? '#90ee90' : '#ffe0bb', color: '#2f1404' }} onClick={() => setClimb("Level 2")}>Level 2</button>
        <button style={{ background: climb === "Level 3" ? '#90ee90' : '#ffe0bb', color: '#2f1404' }} onClick={() => setClimb("Level 3")}>Level 3</button>
        <button style={{ background: climb === "None" ? '#90ee90' : '#ffe0bb', color: '#2f1404' }} onClick={() => setClimb("None")}>None</button>
        <button style={{ background: climb === "Climb Fail" ? '#90ee90' : '#ffe0bb', color: '#2f1404' }} onClick={() => setClimb("Climb Fail")}>Climb Fail</button>
      </div>

      {/* Checkbox */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "1rem", flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem' }}>
          <Checkbox.Root className="CheckboxRoot" id="c1" onClick={() => setShootWhileClimb(!shootWhileClimb)} checked={shootWhileClimb}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label">
            Shooting while climbing?
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem' }}>
          <Checkbox.Root className="CheckboxRoot" id="c2" onClick={() => setBuddyClimb(!buddyClimb)} checked={buddyClimb}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label">
            Buddy climb?
          </label>
        </div>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: "1rem", flexWrap: 'wrap', width: '100%' }}>
        <button style={{ flex: '1 1 auto', minWidth: '100px', background: '#ffe0bb', color: '#2f1404' }} onClick={() => navigate('/Teleop')}>Back</button>
        <button style={{ flex: '1 1 auto', minWidth: '100px', background: '#ffe0bb', color: '#2f1404' }} onClick={() => navigate('/Submit')}>Next</button>
      </div>
    </div>
  );
}

export default Endgame;