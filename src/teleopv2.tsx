import * as Switch from '@radix-ui/react-switch';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './teleopv2.css';

export default function TeleopV1() {
  const toggleStartTimeRef = useRef<number | null>(null);
  const [toggleElapsed, setToggleElapsed] = useState<number | null>(null);

  const [shiftToggled, setShiftToggled] = useState(false);
  const [checked, setChecked] = useState(false);
  const [intakeState, setIntakeState] = useState("Off");
  const [canBump, setCanBump] = useState(false);
  const [canTrench, setCanTrench] = useState(false);
  const navigate = useNavigate();

  // Timing logic for Pass, Score, Miss buttons
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

  return (
    <div className="mainContainer">
      <div className="topHeader">
        <h1>TELEOP V2</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <label
          className="Label"
          htmlFor="intakeMode"
          style={{ margin: 0, fontSize: '1rem', marginRight: '0.5rem' }}
        >
          Intaking
        </label>
        <Switch.Root
          checked={checked}
          id="intakeMode"
          onCheckedChange={(isChecked) => {
            setChecked(isChecked);
            setIntakeState(isChecked ? "On" : "Off");
            if (isChecked) {
              toggleStartTimeRef.current = performance.now();
            } else {
              if (toggleStartTimeRef.current !== null) {
                const elapsed = Math.round(performance.now() - toggleStartTimeRef.current);
                setToggleElapsed(elapsed);
                console.log(`Toggle ON duration: ${elapsed} ms`);
                toggleStartTimeRef.current = null;
              }
            }
          }}
          style={{
            width: '3rem',
            height: '1.85rem',
            backgroundColor: checked ? '#b2c2f6' : '#ccc',
            borderRadius: '9999px',
            position: 'relative',
            outline: 'none',
            padding: '0',
            minHeight: '0',
            border: 'none',
            transition: 'background-color 100ms',
          }}
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
      </div>

      {/* Pass and Score Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          data-button-id="pass"
          onMouseDown={pressingDown}
          onMouseUp={notPressingDown}
          onTouchStart={pressingDown}
          onTouchEnd={notPressingDown}
          style={{
            flex: 1,
            height: '120px',
            fontSize: '1.25rem',
          }}
        >
          Pass
        </button>
        <button
          data-button-id="score"
          onMouseDown={pressingDown}
          onMouseUp={notPressingDown}
          onTouchStart={pressingDown}
          onTouchEnd={notPressingDown}
          style={{
            flex: 1,
            height: '120px',
            fontSize: '1.25rem',
          }}
        >
          Score
        </button>
      </div>

      {/* Miss Row */}
      <button
        data-button-id="miss"
        onMouseDown={pressingDown}
        onMouseUp={notPressingDown}
        onTouchStart={pressingDown}
        onTouchEnd={notPressingDown}
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '60px',
          marginBottom: '30px',
          fontSize: '1rem',
        }}
      >
        Miss
      </button>

      {/* Trench and Bump Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          onClick={() => setCanTrench(!canTrench)}
          style={{
            flex: 1,
            height: "2.5rem",
            backgroundColor: '#d7b3fb',
            opacity: canTrench ? 0.6 : 1,
          }}
        >
          Trench
        </button>
        <button
          onClick={() => setCanBump(!canBump)}
          style={{
            flex: 1,
            height: "2.5rem",
            backgroundColor: '#d7b3fb',
            opacity: canBump ? 0.6 : 1,
          }}
        >
          Bump
        </button>
      </div>
      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap', width: '100%' }}>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/Prematch')}>Back</button>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/Endgame')}>Next</button>
      </div>
    </div>
  );
}
