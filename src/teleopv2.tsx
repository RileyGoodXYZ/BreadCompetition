import { useState, useRef, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import './teleopv2.css';
import { currentScoutCanUseAuto } from './autoAccess';

export default function TeleopV1() {
   // Timing logic for toggle
  const toggleStartTimeRef = useRef<number | null>(null);
  const getPrefixedKey = (baseKey: string, intakeOn: boolean) =>
    intakeOn ? `intake_${baseKey}` : baseKey;
  const readCount = (key: string) => Number(localStorage.getItem(key) ?? '0');

  const [checked, setChecked] = useState<boolean>(localStorage.getItem('teleopv2_checked') === 'true');
  const [intakeState, setIntakeState] = useState<string>(localStorage.getItem('teleopv2_intake_state') ?? "Off");
  const [bumpCount, setBumpCount] = useState<number>(readCount('teleopv2_bump_count'));
  const [intakeBumpCount, setIntakeBumpCount] = useState<number>(readCount('intake_teleopv2_bump_count'));
  const [trenchCount, setTrenchCount] = useState<number>(readCount('teleopv2_trench_count'));
  const [intakeTrenchCount, setIntakeTrenchCount] = useState<number>(readCount('intake_teleopv2_trench_count'));
  const navigate = useNavigate();

  // Timing logic for pass zone, hoard, and score buttons
  type TimedButtonId = 'pass_neutral_zone' | 'pass_other_alliance_zone' | 'hoard' | 'score';
  const [activeButton, setActiveButton] = useState<TimedButtonId | null>(null);
  const [buttonTimes, setButtonTimes] = useState<{ [key: string]: number }>(() => {
    const raw = localStorage.getItem('teleopv2_button_times');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as { [key: string]: number };
    } catch {
      return {};
    }
  });
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // const [liveElapsedMs, setLiveElapsedMs] = useState<number | null>(null); // Unused
  const getTimedButtonStyle = (buttonId: TimedButtonId, baseStyle: CSSProperties): CSSProperties => ({
    ...baseStyle,
    transform: activeButton === buttonId ? 'translateY(1px)' : 'translateY(0)',
    boxShadow: activeButton === buttonId ? 'inset 0 3px 6px rgba(0, 0, 0, 0.35)' : 'none',
    opacity: activeButton === buttonId ? 0.7 : 1,
    width: '100%',
  });
  const formatSeconds = (ms: number) => (ms / 1000).toFixed(2);
  const getCurrentButtonKey = (buttonId: TimedButtonId) => getPrefixedKey(buttonId, checked);
  const currentTrenchCount = checked ? intakeTrenchCount : trenchCount;
  const currentBumpCount = checked ? intakeBumpCount : bumpCount;

  const stopTimer = (buttonId: TimedButtonId) => {
    if (startTimeRef.current === null) return;
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    setButtonTimes((prev) => {
      const storageKey = getPrefixedKey(buttonId, checked);
      const accumulated = Number(prev[storageKey] ?? 0) + elapsed;
      const next = {
        ...prev,
        [storageKey]: accumulated,
      };
      localStorage.setItem('teleopv2_button_times', JSON.stringify(next));
      return next;
    });
    console.log(`Button ${buttonId}: +${elapsed} ms`);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // setLiveElapsedMs(null); // Removed unused
    startTimeRef.current = null;
  };

  const startTimer = (buttonId: TimedButtonId) => {
    setActiveButton(buttonId);
    startTimeRef.current = performance.now();
    // setLiveElapsedMs(0); // Removed unused
    const tick = () => {
      if (startTimeRef.current !== null) {
        // setLiveElapsedMs(Math.round(performance.now() - startTimeRef.current)); // Removed unused
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const toggleTimedButton = (buttonId: TimedButtonId) => {
    if (activeButton === buttonId) {
      stopTimer(buttonId);
      setActiveButton(null);
      return;
    }
    if (activeButton !== null) {
      stopTimer(activeButton);
    }
    startTimer(buttonId);
  };

  const stopAnyRunningTimer = () => {
    if (activeButton !== null) {
      stopTimer(activeButton);
      setActiveButton(null);
    }
  };

  const handleBack = () => {
    stopAnyRunningTimer();
    navigate(currentScoutCanUseAuto() ? '/auto' : '/prematch');
  };

  const handleNext = () => {
    stopAnyRunningTimer();
    navigate('/endgame');
  };

  return (
    <div className="mainContainer">
      <div className="topHeader">
        <h1>TELEOP V2</h1>
      </div>
      <div style={{ width: '100%', marginBottom: '1rem' }}>
        {/* Good switch :( :wilted}
        {/* <label
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
            stopAnyRunningTimer();
            setChecked(isChecked);
            localStorage.setItem('teleopv2_checked', String(isChecked));
            const nextIntakeState = isChecked ? "On" : "Off";
            setIntakeState(nextIntakeState);
            localStorage.setItem('teleopv2_intake_state', nextIntakeState);
            if (isChecked) {
              // Toggle turned ON, start timer
              toggleStartTimeRef.current = performance.now();
            } else {
              // Toggle turned OFF, stop timer and log
              if (toggleStartTimeRef.current !== null) {
                const elapsed = Math.round(performance.now() - toggleStartTimeRef.current);
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
        <span style={{ minWidth: '2.5rem', textAlign: 'left' }}>{intakeState}</span> */}
        {/* Intake toggle button (replaces switch) */}
        <button
          style={{ width: '100%' }}
          id="intakeMode"
          onClick={() => {
            stopAnyRunningTimer();
            const isChecked = !checked;
            setChecked(isChecked);
            localStorage.setItem('teleopv2_checked', String(isChecked));
            const nextIntakeState = isChecked ? "On" : "Off";
            setIntakeState(nextIntakeState);
            localStorage.setItem('teleopv2_intake_state', nextIntakeState);
            if (isChecked) {
              // Toggle turned ON, start timer
              toggleStartTimeRef.current = performance.now();
            } else {
              // Toggle turned OFF, stop timer and log
              if (toggleStartTimeRef.current !== null) {
                const elapsed = Math.round(performance.now() - toggleStartTimeRef.current);
                console.log(`Toggle ON duration: ${elapsed} ms`);
                toggleStartTimeRef.current = null;
              }
            }
          }}
        >
          Intake: {intakeState}
        </button>
      </div>

      {/* Pass and Score Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
          <button
            onClick={() => toggleTimedButton('pass_neutral_zone')}
            title={`Last: ${formatSeconds(buttonTimes[getCurrentButtonKey('pass_neutral_zone')] ?? 0)}s`}
            style={getTimedButtonStyle('pass_neutral_zone', {
              width: '100%',
              height: '70px',
              fontSize: '1rem',
              background: '#58b0b3'
            })}
          >
            Pass Neutral Zone
          </button>
          <button
            onClick={() => toggleTimedButton('pass_other_alliance_zone')}
            title={`Last: ${formatSeconds(buttonTimes[getCurrentButtonKey('pass_other_alliance_zone')] ?? 0)}s`}
            style={getTimedButtonStyle('pass_other_alliance_zone', {
              width: '100%',
              height: '70px',
              fontSize: '1rem',
              background: '#58b0b3'
            })}
          >
            Pass Other Alliance Zone
          </button>
          <button
            data-button-id="hoard"
            onClick={() => toggleTimedButton('hoard')}
            title={`Last: ${formatSeconds(buttonTimes[getCurrentButtonKey('hoard')] ?? 0)}s`}
            style={getTimedButtonStyle('hoard', {
              background: '#58b0b3',
              width: '100%',
              height: '70px',
              fontSize: '1.1rem',
            })}
          >
            Hoard
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
          <button
            onClick={() => toggleTimedButton('score')}
            title={`Last: ${formatSeconds(buttonTimes[getCurrentButtonKey('score')] ?? 0)}s`}
            style={getTimedButtonStyle('score', {
              width: '100%',
              height: '100%',
              minHeight: '220px',
              fontSize: '1.4rem',
            })}
          >
            Score
          </button>
        </div>
      </div>

      {/* Trench and Bump Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          onClick={() => {
            const isIntakeOn = checked;
            const next = currentTrenchCount + 1;
            if (isIntakeOn) {
              setIntakeTrenchCount(next);
            } else {
              setTrenchCount(next);
            }
            localStorage.setItem(getPrefixedKey('teleopv2_trench_count', isIntakeOn), String(next));
          }}
          style={{
            flex: 1,
            height: "2.5rem",
            backgroundColor: '#d7b3fb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            fontSize: '1rem',
          }}
        >
          Trench: {currentTrenchCount}
        </button>
        <button
          onClick={() => {
            const isIntakeOn = checked;
            const next = currentBumpCount + 1;
            if (isIntakeOn) {
              setIntakeBumpCount(next);
            } else {
              setBumpCount(next);
            }
            localStorage.setItem(getPrefixedKey('teleopv2_bump_count', isIntakeOn), String(next));
          }}
          style={{
            flex: 1,
            height: "2.5rem",
            backgroundColor: '#d7b3fb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            fontSize: '1rem',
          }}
        >
          Bump: {currentBumpCount}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', width: '100%' }}>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={handleBack}>Back</button>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}
