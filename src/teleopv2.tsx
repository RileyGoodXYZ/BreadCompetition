import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import './teleopv2.css';
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession, isTeleopV2Session } from './autoAccess';

export default function TeleopV1() {
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
  
  useEffect(() => {
    if (currentScoutCanUseAuto() && !isTeleopV2Session()) {
      navigate('/endgame', { replace: true });
    }
  }, [navigate]);

  // Timing logic for timer buttons
  type TimedButtonId = 'score' | 'pass' | 'defense' | 'herd';
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
  const [liveElapsedMs, setLiveElapsedMs] = useState<number | null>(null);
  const getTimedButtonStyle = (buttonId: TimedButtonId, baseStyle: CSSProperties): CSSProperties => ({
    ...baseStyle,
    transform: activeButton === buttonId ? 'translateY(1px)' : 'translateY(0)',
    boxShadow: activeButton === buttonId ? 'inset 0 3px 6px rgba(0, 0, 0, 0.35)' : 'none',
    opacity: activeButton === buttonId ? 0.7 : 1,
    width: '100%',
  });
  const formatSeconds = (ms: number) => (ms / 1000).toFixed(2);
  const getStoredMsForButton = (buttonId: TimedButtonId) =>
    Number(buttonTimes[buttonId] ?? 0);
  const getLiveMsForButton = (buttonId: TimedButtonId) =>
    activeButton === buttonId ? (liveElapsedMs ?? 0) : 0;
  const getDisplayedSecondsForButton = (buttonId: TimedButtonId) => {
    const storedMs = getStoredMsForButton(buttonId);
    const runningMs = getLiveMsForButton(buttonId);
    return formatSeconds(storedMs + runningMs);
  };
  const getTimerTextForButton = (buttonId: TimedButtonId) =>
    activeButton === buttonId
      ? `${Math.round(getLiveMsForButton(buttonId))}ms`
      : '';



  const stopTimer = (buttonId: TimedButtonId) => {
    if (startTimeRef.current === null) return;
    const elapsed = Math.round(performance.now() - startTimeRef.current);
    setButtonTimes((prev) => {
      const accumulated = Number(prev[buttonId] ?? 0) + elapsed;
      const next = {
        ...prev,
        [buttonId]: accumulated,
      };
      localStorage.setItem('teleopv2_button_times', JSON.stringify(next));
      return next;
    });
    console.log(`Button ${buttonId}: +${elapsed} ms`);
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
    navigate(currentScoutCanUseAuto() && !isAutoDisabledSession() ? '/auto' : '/prematch');
  };

  const handleNext = () => {
    stopAnyRunningTimer();
    navigate('/endgame');
  };

  return (
    <div className="mainContainer">
      <div className="topHeader">
        <h1>Teleop</h1>
      </div>
      <div className="teleop-content">
        {/* Score and Pass Row */}
        <div style={{ display: 'flex', gap: 'clamp(8px, 2.5vw, 20px)', marginBottom: '10px', width: '100%', alignItems: 'stretch' }}>
          <button
            onClick={() => toggleTimedButton('score')}
            title={`Total: ${getDisplayedSecondsForButton('score')}s`}
            style={getTimedButtonStyle('score', {
              width: '100%',
              minWidth: 0,
              minHeight: 'min(200px, 26vh)',
              fontSize: '1.4rem',
              background: '#b2c2f6',
              color: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <span style={{ display: 'inline-block', width: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTimerTextForButton('score') ? `(${getTimerTextForButton('score')})` : 'Score'}</span>
            </span>
          </button>
          <button
            onClick={() => toggleTimedButton('pass')}
            title={`Total: ${getDisplayedSecondsForButton('pass')}s`}
            style={getTimedButtonStyle('pass', {
              width: '100%',
              minWidth: 0,
              minHeight: 'min(200px, 26vh)',
              fontSize: '1.4rem',
              background: '#b2c2f6',
              color: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <span style={{ display: 'inline-block', width: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTimerTextForButton('pass') ? `(${getTimerTextForButton('pass')})` : 'Pass'}</span>
            </span>
          </button>
        </div>

        {/* Defense and Herd Row */}
        <div style={{ display: 'flex', gap: 'clamp(8px, 2.5vw, 20px)', marginBottom: '10px', width: '100%', alignItems: 'stretch' }}>
          <button
            onClick={() => toggleTimedButton('defense')}
            title={`Total: ${getDisplayedSecondsForButton('defense')}s`}
            style={getTimedButtonStyle('defense', {
              width: '100%',
              minWidth: 0,
              height: '70px',
              fontSize: '1rem',
              background: '#e08fb9',
              color: 'black',
              textAlign: 'center',
            })}
          >
            <span style={{ display: 'inline-block', width: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTimerTextForButton('defense') ? `(${getTimerTextForButton('defense')})` : 'Defense'}</span>
          </button>
          <button
            onClick={() => toggleTimedButton('herd')}
            title={`Total: ${getDisplayedSecondsForButton('herd')}s`}
            style={getTimedButtonStyle('herd', {
              width: '100%',
              minWidth: 0,
              height: '70px',
              fontSize: '1rem',
              background: '#e08fb9',
              color: 'black',
              textAlign: 'center',
            })}
          >
            <span style={{ display: 'inline-block', width: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTimerTextForButton('herd') ? `(${getTimerTextForButton('herd')})` : 'Herd'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '5rem', flexWrap: 'wrap', width: '100%' }}>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={handleBack}>Back</button>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={handleNext}>Next</button>
      </div>
    </div>
  );
} 
