import './Auto.css'
import image from './assets/rebuiltField.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTO_CLIMB_SELECTION_KEY = 'auto_climb_selection';
const AUTO_PASS_COUNT_KEY = 'auto_pass_count';
const AUTO_SCORE_COUNT_KEY = 'auto_score_count';
const AUTO_PASS_SECONDS_KEY = 'auto_pass_seconds';
const AUTO_SCORE_SECONDS_KEY = 'auto_score_seconds';
const AUTO_HUMAN_PLAYER_COUNT_KEY = 'auto_human_player_count';
const AUTO_DEPOT_COUNT_KEY = 'auto_depot_count';
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
  const [isPassActive, setIsPassActive] = useState<boolean>(false);
  const [isScoreActive, setIsScoreActive] = useState<boolean>(false);

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

        <button className="topLeft"></button>
        <button className="middleLeft"></button>
        <button className="bottomLeft"></button>
        <button className="topRight"></button>
        <button className="middleRight"></button>
        <button className="bottomRight"></button>
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
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/teleop')}>Next</button>
        </div>
      </div>
    )
  }
  
  export default Auto
  
