import image from '../assets/rebuiltField.png';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession, isTeleopV2Session } from '../utils/autoAccess';

const AUTO_CLIMB_SELECTION_KEY = 'auto_climb_selection';
const AUTO_PASS_COUNT_KEY = 'auto_pass_count';
const AUTO_SCORE_COUNT_KEY = 'auto_score_count';
const AUTO_PASS_SECONDS_KEY = 'auto_pass_seconds';
const AUTO_SCORE_SECONDS_KEY = 'auto_score_seconds';
const AUTO_HUMAN_PLAYER_COUNT_KEY = 'auto_human_player_count';
const AUTO_DEPOT_COUNT_KEY = 'auto_depot_count';
const AUTO_TOP_LEFT_COUNT_KEY = 'auto_top_left_count';
const AUTO_MIDDLE_LEFT_COUNT_KEY = 'auto_middle_left_count';
const AUTO_BOTTOM_LEFT_COUNT_KEY = 'auto_bottom_left_count';
const AUTO_TOP_RIGHT_COUNT_KEY = 'auto_top_right_count';
const AUTO_MIDDLE_RIGHT_COUNT_KEY = 'auto_middle_right_count';
const AUTO_BOTTOM_RIGHT_COUNT_KEY = 'auto_bottom_right_count';
const AUTO_BUTTON_TIMES_KEY = 'auto_button_times';
const AUTO_SEQUENCE_KEYS = [
  AUTO_HUMAN_PLAYER_COUNT_KEY,
  AUTO_DEPOT_COUNT_KEY,
  AUTO_TOP_LEFT_COUNT_KEY,
  AUTO_MIDDLE_LEFT_COUNT_KEY,
  AUTO_BOTTOM_LEFT_COUNT_KEY,
  AUTO_TOP_RIGHT_COUNT_KEY,
  AUTO_MIDDLE_RIGHT_COUNT_KEY,
  AUTO_BOTTOM_RIGHT_COUNT_KEY,
];
const CLIMB_LEFT = 'left';
const CLIMB_MIDDLE = 'middle';
const CLIMB_RIGHT = 'right';

const normalizeAutoButtonTimes = (raw: string | null): string => {
  if (!raw) return '';
  const normalized = raw
    .split('\n')
    .map((line) => line.split('\t')[0]?.trim())
    .filter((key): key is string => Boolean(key) && AUTO_SEQUENCE_KEYS.includes(key));
  return normalized.join('\n');
};

const appendAutoButtonTime = (key: string) => {
  const existing = normalizeAutoButtonTimes(localStorage.getItem(AUTO_BUTTON_TIMES_KEY));
  const nextValue = existing && existing.trim().length > 0 ? `${existing}\n${key}` : key;
  localStorage.setItem(AUTO_BUTTON_TIMES_KEY, nextValue);
};

const readAutoCount = (key: string) => Number(localStorage.getItem(key) ?? '0');

function Auto() {
  const [passCount, setPassCount] = useState<number>(Number(localStorage.getItem(AUTO_PASS_COUNT_KEY) ?? '0'));
  const [scoreCount, setScoreCount] = useState<number>(Number(localStorage.getItem(AUTO_SCORE_COUNT_KEY) ?? '0'));
  const [climbSelection, setClimbSelection] = useState<string | null>(localStorage.getItem(AUTO_CLIMB_SELECTION_KEY));
  const navigate = useNavigate();
  const [passSeconds, setPassSeconds] = useState<number>(Number(localStorage.getItem(AUTO_PASS_SECONDS_KEY) ?? '0'));
  const [scoreSeconds, setScoreSeconds] = useState<number>(Number(localStorage.getItem(AUTO_SCORE_SECONDS_KEY) ?? '0'));
  
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
    const normalized = normalizeAutoButtonTimes(localStorage.getItem(AUTO_BUTTON_TIMES_KEY));
    const existing = localStorage.getItem(AUTO_BUTTON_TIMES_KEY) ?? '';
    if (normalized !== existing) {
      localStorage.setItem(AUTO_BUTTON_TIMES_KEY, normalized);
    }
  }, []);
  const [humanPlayerCount, setHumanPlayerCount] = useState<number>(readAutoCount(AUTO_HUMAN_PLAYER_COUNT_KEY));
  const [depotCount, setDepotCount] = useState<number>(readAutoCount(AUTO_DEPOT_COUNT_KEY));
  const [topLeftCount, setTopLeftCount] = useState<number>(readAutoCount(AUTO_TOP_LEFT_COUNT_KEY));
  const [middleLeftCount, setMiddleLeftCount] = useState<number>(readAutoCount(AUTO_MIDDLE_LEFT_COUNT_KEY));
  const [bottomLeftCount, setBottomLeftCount] = useState<number>(readAutoCount(AUTO_BOTTOM_LEFT_COUNT_KEY));
  const [topRightCount, setTopRightCount] = useState<number>(readAutoCount(AUTO_TOP_RIGHT_COUNT_KEY));
  const [middleRightCount, setMiddleRightCount] = useState<number>(readAutoCount(AUTO_MIDDLE_RIGHT_COUNT_KEY));
  const [bottomRightCount, setBottomRightCount] = useState<number>(readAutoCount(AUTO_BOTTOM_RIGHT_COUNT_KEY));
  const [isPassActive, setIsPassActive] = useState<boolean>(false);
  const [isScoreActive, setIsScoreActive] = useState<boolean>(false);

  useEffect(() => {
    if (isAutoDisabledSession() || !currentScoutCanUseAuto()) {
      navigate('/teleop', { replace: true });
    }
  }, [navigate]);
  const incrementAutoCount = (
    key: string,
    setter: Dispatch<SetStateAction<number>>,
  ) => {
    const next = readAutoCount(key) + 1;
    localStorage.setItem(key, String(next));
    appendAutoButtonTime(key);
    setter(next);
  };

  useEffect(() => {
    if (!isPassActive) return;
    const interval = setInterval(() => {
      setPassSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_PASS_SECONDS_KEY, String(next));
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isPassActive]);

  useEffect(() => {
    if (!isScoreActive) return;
    const interval = setInterval(() => {
      setScoreSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_SCORE_SECONDS_KEY, String(next));
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isScoreActive]);

  const handlePassClick = () => {
    if (!isPassActive) {
      setPassCount((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_PASS_COUNT_KEY, String(next));
        return next;
      });
    }
    setIsPassActive((prev) => !prev);
  };

  const handleScoreClick = () => {
    if (!isScoreActive) {
      setScoreCount((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_SCORE_COUNT_KEY, String(next));
        return next;
      });
    }
    setIsScoreActive((prev) => !prev);
  };
  const handleClimb = (position: string) => {
    setClimbSelection(position);
    localStorage.setItem(AUTO_CLIMB_SELECTION_KEY, position);
  };
  const handleHumanPlayer = () => {
    incrementAutoCount(AUTO_HUMAN_PLAYER_COUNT_KEY, setHumanPlayerCount);
  };
  const handleDepot = () => {
    incrementAutoCount(AUTO_DEPOT_COUNT_KEY, setDepotCount);
  };
  const incrementCount = (
    setter: Dispatch<SetStateAction<number>>,
    key: string,
  ) => {
    incrementAutoCount(key, setter);
  };

    return (

      <div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', gap: '0.5rem', width: '100%', maxWidth: '800px', boxSizing: 'border-box'}}>
          <h1>Auto</h1>
        </div>

        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', width: '100%', flexWrap: 'wrap', maxWidth: '100vw', boxSizing: 'border-box'}}>
          <div>
          <button style={{width: '90px', height: '60px', backgroundColor: '#58b0b3', color: 'white', fontSize: '1rem', padding: '0.25rem 0.5rem', borderRadius: '8px', boxSizing: 'border-box'}} onClick={handlePassClick} data-count={passCount}>
         {isPassActive ? `Stop (${passSeconds}s passed)` : 'Pass'}
         </button>
          </div>
      
         <div> 
          <button style={{width: '90px', height: '60px', backgroundColor: '#c69ef0', color: 'white', fontSize: '1rem', padding: '0.25rem 0.5rem', borderRadius: '8px', boxSizing: 'border-box'}} onClick={handleScoreClick} data-count={scoreCount}>
         {isScoreActive ? `Stop (${scoreSeconds}s passed)` : 'Score'}
         </button>
         </div>

        </div>
        <div style={{position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto'}}>
          <img src={image} alt="passMap" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px', display: 'block', margin: '0 auto'}} />

        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', top: '0%', left: '18%', width: '32%', height: '33.5%', opacity: '0.5'}} onClick={() => incrementCount(setTopLeftCount, AUTO_TOP_LEFT_COUNT_KEY)} data-count={topLeftCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', top: '33.5%', left: '18%', width: '32%', height: '33.5%', opacity: '0.5'}} onClick={() => incrementCount(setMiddleLeftCount, AUTO_MIDDLE_LEFT_COUNT_KEY)} data-count={middleLeftCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', top: '67%', left: '18%', width: '32%', height: '33.5%', opacity: '0.5'}} onClick={() => incrementCount(setBottomLeftCount, AUTO_BOTTOM_LEFT_COUNT_KEY)} data-count={bottomLeftCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', top: '0%', left: '50%', width: '32%', height: '33.5%', opacity: '0.5'}} onClick={() => incrementCount(setTopRightCount, AUTO_TOP_RIGHT_COUNT_KEY)} data-count={topRightCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', top: '33.5%', left: '50%', width: '32%', height: '33.5%', opacity: '0.5'}} onClick={() => incrementCount(setMiddleRightCount, AUTO_MIDDLE_RIGHT_COUNT_KEY)} data-count={middleRightCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', top: '67%', left: '50%', width: '32%', height: '33.5%', opacity: '0.5'}} onClick={() => incrementCount(setBottomRightCount, AUTO_BOTTOM_RIGHT_COUNT_KEY)} data-count={bottomRightCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', backgroundColor: '#c69ef0', top: '67%', left: '95%', width: '0.5%', height: '13%'}} onClick={handleDepot} data-count={depotCount}></button>
        <button style={{position: 'absolute', borderRadius: '0', minWidth: '0', minHeight: '0', border: '2px solid black', backgroundColor: '#c69ef0', top: '-9%', left: '92%'}} onClick={handleHumanPlayer} data-count={humanPlayerCount}></button>
        </div>

        <p>Climb</p>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap', marginBottom: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', maxWidth: '100vw', boxSizing: 'border-box'}}>
          <div>
          <button style={{width: '85px', height: '55px', textAlign: 'center'}} className={`ClimbLeft ${climbSelection === "left" ? "selected" : ""}`} onClick={() => handleClimb(CLIMB_LEFT)}>
              Left
          </button>
          </div>
          
          <button style={{width: '85px', height: '55px', textAlign: 'center'}} className={`ClimbMiddle ${climbSelection === "middle" ? "selected" : ""}`} onClick={() => handleClimb(CLIMB_MIDDLE)}>
              Middle
          </button>

          <div>
          <button style={{width: '85px', height: '55px', textAlign: 'center'}} className={`ClimbRight ${climbSelection === "right" ? "selected" : ""}`} onClick={() => handleClimb(CLIMB_RIGHT)}>
              Right
          </button>
          </div>

        </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', width: '100%' }}>
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/prematch')}>Back</button>
          <button
            className="navBtns"
            style={{ flex: '1 1 auto', minWidth: '100px' }}
            onClick={() => navigate(isTeleopV2Session() ? '/teleop' : '/endgame')}
          >
            Next
          </button>
        </div>
      </div>
    )
  }
  
  export default Auto