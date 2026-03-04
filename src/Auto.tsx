import './Auto.css'
import image from './assets/rebuiltField.png';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto } from './autoAccess';

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
const CLIMB_LEFT = 'left';
const CLIMB_MIDDLE = 'middle';
const CLIMB_RIGHT = 'right';

function Auto() {
  const [passCount, setPassCount] = useState<number>(Number(localStorage.getItem(AUTO_PASS_COUNT_KEY) ?? '0'));
  const [scoreCount, setScoreCount] = useState<number>(Number(localStorage.getItem(AUTO_SCORE_COUNT_KEY) ?? '0'));
  const [climbSelection, setClimbSelection] = useState<string | null>(localStorage.getItem(AUTO_CLIMB_SELECTION_KEY));
  const navigate = useNavigate();
  const [passSeconds, setPassSeconds] = useState<number>(Number(localStorage.getItem(AUTO_PASS_SECONDS_KEY) ?? '0'));
  const [scoreSeconds, setScoreSeconds] = useState<number>(Number(localStorage.getItem(AUTO_SCORE_SECONDS_KEY) ?? '0'));
  const [humanPlayerCount, setHumanPlayerCount] = useState<number>(Number(localStorage.getItem(AUTO_HUMAN_PLAYER_COUNT_KEY) ?? '0'));
  const [depotCount, setDepotCount] = useState<number>(Number(localStorage.getItem(AUTO_DEPOT_COUNT_KEY) ?? '0'));
  const [topLeftCount, setTopLeftCount] = useState<number>(Number(localStorage.getItem(AUTO_TOP_LEFT_COUNT_KEY) ?? '0'));
  const [middleLeftCount, setMiddleLeftCount] = useState<number>(Number(localStorage.getItem(AUTO_MIDDLE_LEFT_COUNT_KEY) ?? '0'));
  const [bottomLeftCount, setBottomLeftCount] = useState<number>(Number(localStorage.getItem(AUTO_BOTTOM_LEFT_COUNT_KEY) ?? '0'));
  const [topRightCount, setTopRightCount] = useState<number>(Number(localStorage.getItem(AUTO_TOP_RIGHT_COUNT_KEY) ?? '0'));
  const [middleRightCount, setMiddleRightCount] = useState<number>(Number(localStorage.getItem(AUTO_MIDDLE_RIGHT_COUNT_KEY) ?? '0'));
  const [bottomRightCount, setBottomRightCount] = useState<number>(Number(localStorage.getItem(AUTO_BOTTOM_RIGHT_COUNT_KEY) ?? '0'));
  const [isPassActive, setIsPassActive] = useState<boolean>(false);
  const [isScoreActive, setIsScoreActive] = useState<boolean>(false);

  useEffect(() => {
    if (!currentScoutCanUseAuto()) {
      navigate('/teleopv2', { replace: true });
    }
  }, [navigate]);

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
    setHumanPlayerCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(AUTO_HUMAN_PLAYER_COUNT_KEY, String(next));
      return next;
    });
  };
  const handleDepot = () => {
    setDepotCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(AUTO_DEPOT_COUNT_KEY, String(next));
      return next;
    });
  };
  const incrementCount = (
    setter: Dispatch<SetStateAction<number>>,
    key: string,
  ) => {
    setter((prev) => {
      const next = prev + 1;
      localStorage.setItem(key, String(next));
      return next;
    });
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
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/teleopv2')}>Next</button>
        </div>
      </div>
    )
  }
  
  export default Auto
  
