import * as Switch from '@radix-ui/react-switch';
import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import './teleopv2.css';
import { currentScoutCanUseAuto } from './autoAccess';

export default function TeleopV1() {
    // Timing logic for toggle
  const toggleStartTimeRef = useRef<number | null>(null);

  const [checked, setChecked] = useState<boolean>(localStorage.getItem('teleopv2_checked') === 'true');
  const [intakeState, setIntakeState] = useState<string>(localStorage.getItem('teleopv2_intake_state') ?? "Off");
  const [bumpCount, setBumpCount] = useState<number>(Number(localStorage.getItem('teleopv2_bump_count') ?? '0'));
  const [trenchCount, setTrenchCount] = useState<number>(Number(localStorage.getItem('teleopv2_trench_count') ?? '0'));
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
  const [missCount, setMissCount] = useState<number>(() => {
    const stored = localStorage.getItem('teleopv2_miss_count');
    if (stored !== null) return Number(stored);
    const raw = localStorage.getItem('teleopv2_button_times');
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw) as { [key: string]: number };
      return Number(parsed.miss_count ?? 0);
    } catch {
      return 0;
    }
  });
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState<number | null>(null);
  const getTimedButtonStyle = (buttonId: TimedButtonId, baseStyle: CSSProperties): CSSProperties => ({
    ...baseStyle,
    backgroundColor: activeButton === buttonId ? 'rgba(0, 0, 0, 0.25)' : baseStyle.backgroundColor,
    transform: activeButton === buttonId ? 'translateY(1px)' : 'translateY(0)',
    boxShadow: activeButton === buttonId ? 'inset 0 3px 6px rgba(0, 0, 0, 0.35)' : 'none',
  });
  const formatSeconds = (ms: number) => (ms / 1000).toFixed(2);
  const getPressedTimerText = (buttonId: TimedButtonId) =>
    activeButton === buttonId && liveElapsedMs !== null ? ` (${formatSeconds(liveElapsedMs)}s)` : '';

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const stopTimer = (buttonId: TimedButtonId) => {
    if (startTimeRef.current === null) return;
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    setButtonTimes((prev) => {
      const next = {
        ...prev,
        [buttonId]: elapsed,
      };
      localStorage.setItem('teleopv2_button_times', JSON.stringify(next));
      return next;
    });
    console.log(`Button ${buttonId}: ${elapsed} ms`);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setLiveElapsedMs(null);
    startTimeRef.current = null;
  };

  const startTimer = (buttonId: TimedButtonId) => {
    setActiveButton(buttonId);
    startTimeRef.current = performance.now();
    setLiveElapsedMs(0);
    const tick = () => {
      if (startTimeRef.current !== null) {
        setLiveElapsedMs(Math.round(performance.now() - startTimeRef.current));
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
  const handleMissClick = () => {
    const nextCount = missCount + 1;
    setMissCount(nextCount);
    localStorage.setItem('teleopv2_miss_count', String(nextCount));
    setButtonTimes((prev) => {
      const next = {
        ...prev,
        miss_count: nextCount,
      };
      localStorage.setItem('teleopv2_button_times', JSON.stringify(next));
      return next;
    });
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
        <span style={{ minWidth: '2.5rem', textAlign: 'left' }}>{intakeState}</span>
      </div>

      {/* Pass and Score Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px', alignItems: 'stretch' }}>
        <div className="passHoardColumn">
          <button
            onClick={() => toggleTimedButton('pass_neutral_zone')}
            title={`Last: ${formatSeconds(buttonTimes.pass_neutral_zone ?? 0)}s`}
            style={getTimedButtonStyle('pass_neutral_zone', {
              flex: 1,
              height: '90px',
              fontSize: '1rem',
            })}
          >
            Pass Neutral Zone{getPressedTimerText('pass_neutral_zone')}
          </button>

          <button
            onClick={() => toggleTimedButton('pass_other_alliance_zone')}
            title={`Last: ${formatSeconds(buttonTimes.pass_other_alliance_zone ?? 0)}s`}
            style={getTimedButtonStyle('pass_other_alliance_zone', {
              flex: 1,
              height: '90px',
              fontSize: '1rem',
            })}
          >
            Pass Other Alliance Zone{getPressedTimerText('pass_other_alliance_zone')}
          </button>

          <button
            data-button-id="hoard"
            onClick={() => toggleTimedButton('hoard')}
            title={`Last: ${formatSeconds(buttonTimes.hoard ?? 0)}s`}
            style={getTimedButtonStyle('hoard', {
              flex: 1,
              height: '90px',
              fontSize: '1.1rem',
            })}
          >
            Hoard{getPressedTimerText('hoard')}
          </button>
        </div>
        <button
          onClick={() => toggleTimedButton('score')}
          title={`Last: ${formatSeconds(buttonTimes.score ?? 0)}s`}
          style={getTimedButtonStyle('score', {
            flex: 1.2,
            height: 'auto',
            minHeight: '290px',
            fontSize: '1.4rem',
          })}
        >
          Score{getPressedTimerText('score')}
        </button>
      </div>

      {/* Miss Row */}
      <button
        onClick={handleMissClick}
        title={`Count: ${missCount}`}
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '60px',
          marginBottom: '14px',
          fontSize: '1rem',
        }}
      >
        Miss: {missCount}
      </button>

      {/* Trench and Bump Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          onClick={() => {
            const next = trenchCount + 1;
            setTrenchCount(next);
            localStorage.setItem('teleopv2_trench_count', String(next));
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
          Trench: {trenchCount}
        </button>
        <button
          onClick={() => {
            const next = bumpCount + 1;
            setBumpCount(next);
            localStorage.setItem('teleopv2_bump_count', String(next));
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
          Bump: {bumpCount}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', width: '100%' }}>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={handleBack}>Back</button>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}
