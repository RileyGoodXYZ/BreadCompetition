import './Teleop.css';
import * as Switch from '@radix-ui/react-switch';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";


function Teleop() {
  const [checked, setChecked] = useState(false);
  const [passOrScore, handlePassScoreToggle] = useState("Score");
  const navigate = useNavigate();
  const [trenchCount, setTrenchCount] = useState(0);
  const [bumpCount, setBumpCount] = useState(0);
  const [hubState, setHubState] = useState("Off");

    return (
      <div>
        {/* Top header */}
        <div className="topHeader">
          <Switch.Root
            checked={checked}
            onCheckedChange={(checked) => {
              setChecked(checked);
              setHubState(checked ? "On" : "Off");
            }}
            className="flex-item"
            style={{
              width: 70,
              height: 40,
              backgroundColor: checked ? '#ffe0bb' : '#ccc',
              borderRadius: '9999px',
              position: 'relative',
              outline: 'none',
              border: 'none',
              transition: 'background-color 100ms',
            }}
            id="radix-switch"
            aria-checked={checked}
          >
            <Switch.Thumb
              style={{
                display: 'block',
                width: 32,
                height: 32,
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'transform 100ms',
                willChange: 'transform',
                position: 'absolute',
                top: 4,
                left: checked ? 38 : 2,
              }}
            />
          </Switch.Root>
          <div>
            <h1>Teleop</h1>
          </div>
          <div style={{marginLeft: '1rem'}}>
            <h2>{hubState}</h2> 
          </div>
        </div>

        {/* Trench/Bump and Score/Pass toggle  */}
        <div style={{marginBottom: '1rem'}}>
          <button onClick={() => setTrenchCount(trenchCount + 1)} style={{marginRight: '0.5rem', height: '3rem', width:'7.1rem', paddingLeft: '0.1rem', paddingRight: '0.1rem'}}>Trench:  {trenchCount}</button>
          { (passOrScore === "Score") ? (
            <button onClick={() => handlePassScoreToggle("Pass")} style={{marginLeft: '0.5rem', marginRight: '0.5rem', height: '3rem', width:'7.1rem'}}>Pass</button>
          ) : (
            <button onClick={() => handlePassScoreToggle("Score")} style={{marginLeft: '0.5rem', marginRight: '0.5rem', height: '3rem', width:'7.1rem'}}>Score</button>
          ) 
          }
          <button onClick={() => setBumpCount(bumpCount + 1)} style={{marginLeft: '0.5rem', height: '3rem', width:'7.1rem', paddingLeft: '0.1rem', paddingRight: '0.1rem'}}>Bump: {bumpCount}</button>
        </div>

        {/* Field map */}
        <div className="fieldMap">
          <p>{passOrScore} Mode</p>
          {(passOrScore === "Pass") ? (
            <img src="src/assets/passMap.png" style={{width: '75vw', height: 'auto', marginLeft:'1rem'}} />
          ) : (
            <img src="src/assets/scoreMap.png" style={{width: '75vw', height: 'auto', marginLeft:'1rem'}} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: "1rem", marginLeft: "5rem" }}>
          <Checkbox.Root className="CheckboxRoot" id="c1">
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label">
            Shooting while climbing?
          </label>
        </div>
        
      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3em' }}  >
        <button
          style={{ padding: '0.75rem 1rem',borderRadius: '8px', border: 'none', background: '#ffe0bb', color: '#2f1404' }}
          onClick={() => navigate('/Prematch')}
        >
          Back
        </button>
        <button
          style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: '#ffe0bb', color: '#2f1404' }}
          onClick={() => navigate('/Endgame')}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Teleop
  