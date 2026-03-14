import './Auto.css'
import image from './assets/rebuiltField.png';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession, isTeleopV2Session } from './autoAccess';

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
      navigate('/teleopv2', { replace: true });
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
        <div className='ContainerTitle'>
          <h1 >Auto</h1>
        </div>

        <div className='ContainerTime'>
          <div>
          <button className='Pass' onClick ={handlePassClick} data-count={passCount}>
         {isPassActive ? `Stop (${passSeconds}s passed)` : 'Pass'}
         </button>
          </div>
      
         <div> 
          <button className='Score' onClick ={handleScoreClick} data-count={scoreCount}>
         {isScoreActive ? `Stop (${scoreSeconds}s passed)` : 'Score'}
         </button>
         </div>

        </div>
        <div className="mapContainer">
          <img src={image} alt="passMap" />

        <button className="topLeft" onClick={() => incrementCount(setTopLeftCount, AUTO_TOP_LEFT_COUNT_KEY)} data-count={topLeftCount}></button>
        <button className="middleLeft" onClick={() => incrementCount(setMiddleLeftCount, AUTO_MIDDLE_LEFT_COUNT_KEY)} data-count={middleLeftCount}></button>
        <button className="bottomLeft" onClick={() => incrementCount(setBottomLeftCount, AUTO_BOTTOM_LEFT_COUNT_KEY)} data-count={bottomLeftCount}></button>
        <button className="topRight" onClick={() => incrementCount(setTopRightCount, AUTO_TOP_RIGHT_COUNT_KEY)} data-count={topRightCount}></button>
        <button className="middleRight" onClick={() => incrementCount(setMiddleRightCount, AUTO_MIDDLE_RIGHT_COUNT_KEY)} data-count={middleRightCount}></button>
        <button className="bottomRight" onClick={() => incrementCount(setBottomRightCount, AUTO_BOTTOM_RIGHT_COUNT_KEY)} data-count={bottomRightCount}></button>
        <button className="humanPlayer" onClick={handleDepot} data-count={depotCount}></button>
        <button className="depot" onClick={handleHumanPlayer} data-count={humanPlayerCount}></button>
        </div>

        <p>Climb</p>
        <div className='climbContainer'>
          <div>
          <button
            className={`ClimbLeft ${climbSelection === "left" ? "selected" : ""}`}
            onClick={() => handleClimb(CLIMB_LEFT)}>
              Left
          </button>
          </div>
          
          <button
            className={`ClimbMiddle ${climbSelection === "middle" ? "selected" : ""}`}
            onClick={() => handleClimb(CLIMB_MIDDLE)}>
              Middle
          </button>

          <div>
          <button
            className={`ClimbRight ${climbSelection === "right" ? "selected" : ""}`}
            onClick={() => handleClimb(CLIMB_RIGHT)}>
              Right
          </button>
          </div>

        </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', width: '100%' }}>
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/prematch')}>Back</button>
          <button
            className="navBtns"
            style={{ flex: '1 1 auto', minWidth: '100px' }}
            onClick={() => navigate(isTeleopV2Session() ? '/teleopv2' : '/endgame')}
          >
            Next
          </button>
        </div>
      </div>
    )
  }
  
  export default Auto
  
