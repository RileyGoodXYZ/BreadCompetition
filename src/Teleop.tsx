import './Teleop.css';
import * as Switch from '@radix-ui/react-switch';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import passMap from './assets/passMap.png';
import scoreMap from './assets/scoreMap.png';


function Teleop() {
  const navigate = useNavigate();
  // Data useState
  const [checked, setChecked] = useState<boolean>(localStorage.getItem('teleop_checked') === 'true');
  const [passOrScore, handlePassScoreToggle] = useState<string>(localStorage.getItem('teleop_pass_or_score') ?? "Score");
  const [trenchCount, setTrenchCount] = useState<number>(Number(localStorage.getItem('teleop_trench_count') ?? '0'));
  const [bumpCount, setBumpCount] = useState<number>(Number(localStorage.getItem('teleop_bump_count') ?? '0'));
  const [hubState, setHubState] = useState<string>(localStorage.getItem('teleop_hub_state') ?? "Off");
  const [, setScoreTime] = useState<number>(Number(localStorage.getItem('teleop_score_time') ?? '0'));
  const [, setPassTime] = useState<number>(Number(localStorage.getItem('teleop_pass_time') ?? '0'));
  const [, setHubStateHistory] = useState<string[]>(() => {
    const raw = localStorage.getItem('teleop_hub_state_history');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === 'string');
      }
      return [];
    } catch {
      return [];
    }
  });
  const topMargin = passOrScore === "Pass" ? "8vh" : "2vh";
  const getMapButtonClassName = (baseClassName: string, buttonId: string) =>
    `${baseClassName}${activeButton === buttonId ? ' active-zone' : ''}`;

  // Time button presses
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentDragButton, setCurrentDragButton] = useState<string | null>(null);
  const [, setButtonTimes] = useState<{ [key: string]: number }>(() => {
    const raw = localStorage.getItem('teleop_button_times');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as { [key: string]: number };
    } catch {
      return {};
    }
  });
  const dragStartTimeRef = useRef<number | null>(null);
  const PASS_BUTTON_IDS = ['oppAllianceTopPassButton', 'oppAllianceBottomPassButton', 'neutralTopPassButton', 'neutralBottomPassButton', 'myAllianceTopPassButton', 'myAllianceBottomPassButton'];
  const SCORE_BUTTON_IDS = ['topScoreButton', 'bottomScoreButton'];

  const updateButtonTime = (buttonId: string, elapsed: number) => {
    if (PASS_BUTTON_IDS.includes(buttonId)) {
      setPassTime((prev) => {
        const next = prev + elapsed;
        localStorage.setItem('teleop_pass_time', String(next));
        return next;
      });
    } else if (SCORE_BUTTON_IDS.includes(buttonId)) {
      setScoreTime((prev) => {
        const next = prev + elapsed;
        localStorage.setItem('teleop_score_time', String(next));
        return next;
      });
    }
  };

  useEffect(() => {
    const handlePointerDown = () => {
      setIsPointerDown(true);
    };

    const handlePointerUp = () => {
      setIsPointerDown(false);
      if (currentDragButton && dragStartTimeRef.current !== null) {
        const elapsed = Math.round(performance.now() - dragStartTimeRef.current);
        setButtonTimes((prev) => {
          const next = {
            ...prev,
            [currentDragButton]: elapsed,
          };
          localStorage.setItem('teleop_button_times', JSON.stringify(next));
          return next;
        });
        updateButtonTime(currentDragButton, elapsed);
      }
      setActiveButton(null);
      setCurrentDragButton(null);
      dragStartTimeRef.current = null;
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [currentDragButton]);

  const handleMapButtonPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const buttonId = (e.currentTarget as HTMLButtonElement).getAttribute('data-button-id');
    if (buttonId) {
      setActiveButton(buttonId);
      setCurrentDragButton(buttonId);
      dragStartTimeRef.current = performance.now();
    }
  };

  const handleMapButtonPointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isPointerDown) {
      const buttonId = (e.currentTarget as HTMLButtonElement).getAttribute('data-button-id');
      if (buttonId && buttonId !== currentDragButton) {
        // Record time for previous button
        if (currentDragButton && dragStartTimeRef.current !== null) {
          const elapsed = Math.round(performance.now() - dragStartTimeRef.current);
          console.log(`Button ${currentDragButton}: ${elapsed} ms`);
        updateButtonTime(currentDragButton, elapsed);
        }
        // Switch to new button
        setCurrentDragButton(buttonId);
        dragStartTimeRef.current = performance.now();
      }
    }
  };

  return (
    <div className="mainContainer">
      {/* Top header */}
      <div className="topHeader">
        <Switch.Root
          checked={checked}
          onCheckedChange={(checked) => {
            setChecked(checked);
            localStorage.setItem('teleop_checked', String(checked));
            const nextHubState = checked ? "On" : "Off";
            setHubState(nextHubState);
            localStorage.setItem('teleop_hub_state', nextHubState);
            setHubStateHistory((prev) => {
              const next = [...prev, nextHubState];
              localStorage.setItem('teleop_hub_state_history', JSON.stringify(next));
              return next;
            });
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
        <button onClick={() => {
          const next = trenchCount + 1;
          setTrenchCount(next);
          localStorage.setItem('teleop_trench_count', String(next));
        }} style={{ flex: '1 1 auto', minWidth: '85px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Trench: {trenchCount}</button>
        {(passOrScore === "Score") ? (
          <button onClick={() => {
            handlePassScoreToggle("Pass");
            localStorage.setItem('teleop_pass_or_score', 'Pass');
          }} style={{ flex: '1 1 auto', minWidth: '70px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Pass</button>
        ) : (
          <button onClick={() => {
            handlePassScoreToggle("Score");
            localStorage.setItem('teleop_pass_or_score', 'Score');
          }} style={{ flex: '1 1 auto', minWidth: '70px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Score</button>
        )}
        <button onClick={() => {
          const next = bumpCount + 1;
          setBumpCount(next);
          localStorage.setItem('teleop_bump_count', String(next));
        }} style={{ flex: '1 1 auto', minWidth: '85px', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>Bump: {bumpCount}</button>
      </div>

      {/* Field map */}
      <div className="fieldMap">
        <p>{passOrScore} Mode</p>
        {(passOrScore === "Pass") ? (
          <div style={{ position: 'relative', width: '100%', paddingBottom: '85%' }}>
            <img src={passMap} onError={(e) => { e.currentTarget.src = '/passMap.png'; }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto' }} />
            <div className="passOverlay">
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="oppAllianceTopPassButton" className={getMapButtonClassName('oppAllianceTopPassButton', 'oppAllianceTopPassButton')} />
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="oppAllianceBottomPassButton" className={getMapButtonClassName('oppAllianceBottomPassButton', 'oppAllianceBottomPassButton')} />
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="neutralTopPassButton" className={getMapButtonClassName('neutralTopPassButton', 'neutralTopPassButton')} />
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="neutralBottomPassButton" className={getMapButtonClassName('neutralBottomPassButton', 'neutralBottomPassButton')} />
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="myAllianceTopPassButton" className={getMapButtonClassName('myAllianceTopPassButton', 'myAllianceTopPassButton')} />
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="myAllianceBottomPassButton" className={getMapButtonClassName('myAllianceBottomPassButton', 'myAllianceBottomPassButton')} />
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
            <img src={scoreMap} onError={(e) => { e.currentTarget.src = '/scoreMap.png'; }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            <div className="scoreOverlay">
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="topScoreButton" className={getMapButtonClassName('topScoreButton', 'topScoreButton')} />
              <button onPointerDown={handleMapButtonPointerDown} onPointerEnter={handleMapButtonPointerEnter} data-button-id="bottomScoreButton" className={getMapButtonClassName('bottomScoreButton', 'bottomScoreButton')} />
            </div>
          </div>
        )}
      </div>


      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: topMargin, flexWrap: 'wrap', width: '100%' }}>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/auto')}>Back</button>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/teleopv2')}>Next</button>
      </div>
    </div>
  );
}

export default Teleop
