import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession, isTeleopV2Session } from '../autoAccess';

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
  const [runningButtons, setRunningButtons] = useState<Record<TimedButtonId, boolean>>({
    score: false,
    pass: false,
    defense: false,
    herd: false,
  });
  const [buttonTimes, setButtonTimes] = useState<{ [key: string]: number }>(() => {
    const raw = localStorage.getItem('teleopv2_button_times');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as { [key: string]: number };
    } catch {
      return {};
    }
  });
  const startTimesRef = useRef<Partial<Record<TimedButtonId, number>>>({});
  const animationFrameRef = useRef<number | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState<Partial<Record<TimedButtonId, number>>>({});
  const isRunning = (buttonId: TimedButtonId) => Boolean(runningButtons[buttonId]);
  const getTimedButtonStyle = (buttonId: TimedButtonId, baseStyle: CSSProperties): CSSProperties => ({
    ...baseStyle,
    transform: isRunning(buttonId) ? 'translateY(1px)' : 'translateY(0)',
    boxShadow: isRunning(buttonId) ? 'inset 0 3px 6px rgba(0, 0, 0, 0.35)' : 'none',
    opacity: isRunning(buttonId) ? 0.7 : 1,
    width: '100%',
  });
  const formatSeconds = (ms: number) => (ms / 1000).toFixed(2);
  const getStoredMsForButton = (buttonId: TimedButtonId) =>
    Number(buttonTimes[buttonId] ?? 0);
  const getLiveMsForButton = (buttonId: TimedButtonId) =>
    isRunning(buttonId) ? (liveElapsedMs[buttonId] ?? 0) : 0;
  const getDisplayedSecondsForButton = (buttonId: TimedButtonId) => {
    const storedMs = getStoredMsForButton(buttonId);
    const runningMs = getLiveMsForButton(buttonId);
    return formatSeconds(storedMs + runningMs);
  };
  const getTimerTextForButton = (buttonId: TimedButtonId) =>
    isRunning(buttonId)
      ? `${Math.round(getLiveMsForButton(buttonId))}ms`
      : '';

  const ensureAnimationFrame = () => {
    if (animationFrameRef.current !== null) return;
    const tick = () => {
      const now = performance.now();
      setLiveElapsedMs((prev) => {
        const next = { ...prev };
        (Object.keys(startTimesRef.current) as TimedButtonId[]).forEach((id) => {
          const start = startTimesRef.current[id];
          if (start !== undefined) {
            next[id] = Math.round(now - start);
          }
        });
        return next;
      });
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const stopAnimationFrameIfIdle = () => {
    if (Object.keys(startTimesRef.current).length !== 0) return;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const stopTimer = (buttonId: TimedButtonId) => {
    const start = startTimesRef.current[buttonId];
    if (start === undefined) return;
    const elapsed = Math.round(performance.now() - start);
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
    delete startTimesRef.current[buttonId];
    setRunningButtons((prev) => ({ ...prev, [buttonId]: false }));
    setLiveElapsedMs((prev) => ({ ...prev, [buttonId]: 0 }));
    stopAnimationFrameIfIdle();
  };

  const startTimer = (buttonId: TimedButtonId) => {
    if (startTimesRef.current[buttonId] !== undefined) return;
    startTimesRef.current[buttonId] = performance.now();
    setRunningButtons((prev) => ({ ...prev, [buttonId]: true }));
    setLiveElapsedMs((prev) => ({ ...prev, [buttonId]: 0 }));
    ensureAnimationFrame();
  };

  const toggleTimedButton = (buttonId: TimedButtonId) => {
    if (isRunning(buttonId)) {
      stopTimer(buttonId);
      return;
    }
    startTimer(buttonId);
  };

  const stopAnyRunningTimer = () => {
    const runningIds = Object.keys(startTimesRef.current) as TimedButtonId[];
    runningIds.forEach((id) => stopTimer(id));
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
    <div style={{margin: '2rem auto 0', padding: '0', boxSizing: 'border-box', maxWidth: 'none', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowX: 'hidden', overflowY: 'auto'}}>
      <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '1rem', padding: '0 0.5rem', width: '100%', flexWrap: 'wrap'}}>
        <h1 style={{fontSize: '2.5rem', margin: '0', lineHeight: '1'}}>Teleop</h1>
      </div>
      <div style={{width: 'min(92vw, 900px)', margin: '0 auto', padding: '0 min(2vw, 12px)', boxSizing: 'border-box'}}>
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