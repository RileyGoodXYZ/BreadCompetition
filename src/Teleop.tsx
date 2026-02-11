import './Teleop.css';
import * as Switch from '@radix-ui/react-switch';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


function Teleop() {
  const [checked, setChecked] = useState(false);
  const [passOrScore, handlePassScoreToggle] = useState("Score");
  const navigate = useNavigate();
  const [trenchCount, setTrenchCount] = useState(0);
  const [bumpCount, setBumpCount] = useState(0);
  const [hubState, setHubState] = useState("Off");
  const topMargin = passOrScore === "Pass" ? "8vh" : "2vh";

  // Time button presses
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [buttonTimes, setButtonTimes] = useState<{ [key: string]: number }>({});
  const startTimeRef = useRef<number | null>(null);
  const pressingDown = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const buttonId = (e.currentTarget as HTMLButtonElement).getAttribute('data-button-id');
    if (buttonId) {
      setActiveButton(buttonId);
      startTimeRef.current = performance.now();
    }
  };
  const notPressingDown = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const buttonId = (e.currentTarget as HTMLButtonElement).getAttribute('data-button-id');
    if (buttonId && startTimeRef.current !== null) {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setButtonTimes((prev) => ({
        ...prev,
        [buttonId]: elapsed,
      }));
      console.log(`Button ${buttonId}: ${elapsed} ms`);
    }
    setActiveButton(null);
    startTimeRef.current = null;
  };

  const handleMapButtonTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    // make this acutally work 
  };


  return (
    <div className="mainContainer">
      {/* Top header */}
      <div className="topHeader">
        <Switch.Root
          checked={checked}
          onCheckedChange={(checked) => {
            setChecked(checked);
            setHubState(checked ? "On" : "Off");
          }}
          style={{
            width: '3rem',
            height: '1.85rem',
            backgroundColor: checked ? '#ffe0bb' : '#ccc',
            borderRadius: '9999px',
            position: 'relative',
            outline: 'none',
            padding: '0',
            minHeight: '0',
            border: 'none',
            transition: 'background-color 100ms',
          }}
          id="radix-switch"
          aria-checked={checked}
        >
          <Switch.Thumb
            style={{
              display: 'block',
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: 'transform 100ms',
              willChange: 'transform',
              position: 'absolute',
              top: '0.15rem',
              left: checked ? '1.35rem' : '0.125rem',
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
      <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
        <button onClick={() => setTrenchCount(trenchCount + 1)} style={{ flex: '1 1 auto', minWidth: '85px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Trench: {trenchCount}</button>
        {(passOrScore === "Score") ? (
          <button onClick={() => handlePassScoreToggle("Pass")} style={{ flex: '1 1 auto', minWidth: '70px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Pass</button>
        ) : (
          <button onClick={() => handlePassScoreToggle("Score")} style={{ flex: '1 1 auto', minWidth: '70px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Score</button>
        )}
        <button onClick={() => setBumpCount(bumpCount + 1)} style={{ flex: '1 1 auto', minWidth: '85px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Bump: {bumpCount}</button>
      </div>

      {/* Field map */}
      <div className="fieldMap">
        <p>{passOrScore} Mode</p>
        {(passOrScore === "Pass") ? (
          <div style={{ position: 'relative', width: '100%', paddingBottom: '85%' }}>
            <img src="src/assets/passMap.png" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto' }} />
            <div className="passOverlay">
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="oppAllianceTopPassButton" className="oppAllianceTopPassButton" />
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="oppAllianceBottomPassButton" className="oppAllianceBottomPassButton" />
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="neutralTopPassButton" className="neutralTopPassButton" />
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="neutralBottomPassButton" className="neutralBottomPassButton" />
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="myAllianceTopPassButton" className="myAllianceTopPassButton" />
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="myAllianceBottomPassButton" className="myAllianceBottomPassButton" />
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
            <img src="src/assets/scoreMap.png" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            <div className="scoreOverlay">
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="topScoreButton" className="topScoreButton" />
              <button onMouseDown={pressingDown} onMouseUp={notPressingDown} onTouchStart={pressingDown} onTouchEnd={notPressingDown} onTouchMove={handleMapButtonTouchMove} data-button-id="bottomScoreButton" className="bottomScoreButton" />
            </div>
          </div>
        )}
      </div>


      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: topMargin, flexWrap: 'wrap', width: '100%' }}>
        <button style={{ flex: '1 1 auto', minWidth: '100px', background: '#ffe0bb', color: '#2f1404' }} onClick={() => navigate('/Prematch')}>Back</button>
        <button style={{ flex: '1 1 auto', minWidth: '100px', background: '#ffe0bb', color: '#2f1404' }} onClick={() => navigate('/Endgame')}>Next</button>
      </div>
    </div>
  );
}

export default Teleop
