import './Teleop.css';
import * as Switch from '@radix-ui/react-switch';
import { useState, useRef } from 'react';
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
  const topMargin = passOrScore === "Pass" ? "8rem" : "1.5rem";
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMs(prev => prev + 1);
    }, 1);
    return () => clearInterval(interval);
  }, []);

  const timerinterval = useRef<number|null>(null);

  const timer = (start: boolean) => {
    if (start) {
      timerinterval.current = window.setInterval(() => {
        setMs(ms => ms + 1);
      }, 1);
    } else {
      if (timerinterval.current !== null) {
        clearInterval(timerinterval.current);
      }
      setMs(0);
    }
  };

  const pressingDown = (e: any, button: String) => {
    e.preventDefault();
    timer(true);
  };

  const notPressingDown = (e: any, button: String) => {
    e.preventDefault();
    console.log("Total time: " + ms + " ms in " + button);
    timer(false);
    if (timerinterval.current !== null) {
      clearInterval(timerinterval.current);
    }
    setMs(0);
  };

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
            width: '4rem',
            height: '2rem',
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
              width: '1.75rem',
              height: '1.75rem',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: 'transform 100ms',
              willChange: 'transform',
              position: 'absolute',
              top: '0.25rem',
              left: checked ? '2.5rem' : '0.188rem',
            }}
          />
        </Switch.Root>
        <div>
          <h1>Teleop</h1>
        </div>
        <div style={{ marginLeft: '1rem' }}>
          <h2>{hubState}</h2>
        </div>
      </div>

      {/* Trench/Bump and Score/Pass toggle  */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setTrenchCount(trenchCount + 1)} style={{ marginRight: '0.5rem', height: '3rem', width: '6rem', paddingLeft: '0rem', paddingRight: '0rem' }}>Trench:  {trenchCount}</button>
        {(passOrScore === "Score") ? (
          <button onClick={() => handlePassScoreToggle("Pass")} style={{ marginLeft: '0.5rem', marginRight: '0.5rem', height: '3rem', width: '6rem' }}>Pass</button>
        ) : (
          <button onClick={() => handlePassScoreToggle("Score")} style={{ marginLeft: '0.5rem', marginRight: '0.6rem', height: '3rem', width: '6rem' }}>Score</button>
        )
        }
        <button onClick={() => setBumpCount(bumpCount + 1)} style={{ marginLeft: '0.5rem', height: '3rem', width: '6rem', paddingLeft: '0rem', paddingRight: '0rem' }}>Bump: {bumpCount}</button>
      </div>

      {/* Field map */}
      <div className="fieldMap">
        <p>{passOrScore} Mode</p>
        {(passOrScore === "Pass") ? (
          <div>
            <img src="src/assets/passMap.png" style={{ width: '75vw', height: 'auto', marginLeft: '1rem' }} />
            <div className = "passOverlay">
              <button 
              onMouseDown={(e) => pressingDown(e, "OppAllianceTopPass")}
              onMouseUp={(e) => notPressingDown(e, "OppAllianceTopPass")}
              onTouchStart={(e) => pressingDown(e, "OppAllianceTopPass")}
              onTouchEnd={(e) => notPressingDown(e, "OppAllianceTopPass")} 
              className="oppAllianceTopPassButton" >
              </button>
              <button 
              onMouseDown={(e) => pressingDown(e, "OppAllianceBottomPass")}
              onMouseUp={(e) => notPressingDown(e, "OppAllianceBottomPass")}
              onTouchStart={(e) => pressingDown(e, "OppAllianceBottomPass")}
              onTouchEnd={(e) => notPressingDown(e, "OppAllianceBottomPass")}
              className="oppAllianceBottomPassButton" >
              </button>
              <button 
              onMouseDown={(e) => pressingDown(e, "neutralTopPassButton")}
              onMouseUp={(e) => notPressingDown(e, "neutralTopPassButton")}
              onTouchStart={(e) => pressingDown(e, "neutralTopPassButton")}
              onTouchEnd={(e) => notPressingDown(e, "neutralTopPassButton")}
              className="neutralTopPassButton" >
              </button>
              <button 
              onMouseDown={(e) => pressingDown(e, "neutralBottomPassButton")}
              onMouseUp={(e) => notPressingDown(e, "neutralBottomPassButton")} 
              onTouchStart={(e) => pressingDown(e, "neutralBottomPassButton")} 
              onTouchEnd={(e) => notPressingDown(e, "neutralBottomPassButton")} 
              className="neutralBottomPassButton" >
              </button>
              <button 
              onMouseDown={(e) => pressingDown(e, "myAllianceTopPassButton")} 
              onMouseUp={(e) => notPressingDown(e, "myAllianceTopPassButton")} 
              onTouchStart={(e) => pressingDown(e, "myAllianceTopPassButton")} 
              onTouchEnd={(e) => notPressingDown(e, "myAllianceTopPassButton")} 
              className="myAllianceTopPassButton" >
              </button>
              <button 
              onMouseDown={(e) => pressingDown(e, "myAllianceBottomPassButton")} 
              onMouseUp={(e) => notPressingDown(e, "myAllianceBottomPassButton")} 
              onTouchStart={(e) => pressingDown(e, "myAllianceBottomPassButton")} 
              onTouchEnd={(e) => notPressingDown(e, "myAllianceBottomPassButton")} 
              className="myAllianceBottomPassButton" >
              </button>
            </div>
          </div>
        ) : (
          <div>
            <img src="src/assets/scoreMap.png" style={{ width: '75vw', height: '70 vw', marginLeft: '1rem' }} />
            <div className = "scoreOverlay">
              <button 
              onMouseDown={(e) => pressingDown(e, "topScoreButton")} 
              onMouseUp={(e) => notPressingDown(e, "topScoreButton")} 
              onTouchStart={(e) => pressingDown(e, "topScoreButton")} 
              onTouchEnd={(e) => notPressingDown(e, "topScoreButton")} 
              className="topScoreButton" >
              </button>
              <button 
              onMouseDown={(e) => pressingDown(e, "bottomScoreButton")} 
              onMouseUp={(e) => notPressingDown(e, "bottomScoreButton")} 
              onTouchStart={(e) => pressingDown(e, "bottomScoreButton")} 
              onTouchEnd={(e) => notPressingDown(e, "bottomScoreButton")} 
              className="bottomScoreButton" >
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Climb while shooting checkbox */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem", }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: topMargin }}  >
        <button
          style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: '#ffe0bb', color: '#2f1404' }}
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
