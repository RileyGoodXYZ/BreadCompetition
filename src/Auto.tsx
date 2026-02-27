import './Auto.css'
import image from './assets/passMap.png';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Auto() {
  const [passCount, setPassCount] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [climbSelection, setClimbSelection] = useState<string | null>(null);
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    // If active, keep adding 1 every second
    if (isActive) {
      interval = setInterval(() => {
    setSeconds((prev) => prev + 1); }, 1000);
    } else {
      if (interval !== null) clearInterval(interval);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isActive]); // Only depend on isActive now
  const handleClick = () => {
    if (!isActive) {
      setSeconds(0); // Resets to 0
      setIsActive(true);
    } else {
      setIsActive(false); // Stop timing when clicked again
    }
  };
//button handles
  const handlePass = () => () => {
    setPassCount(prev => prev + 1);
  };

  const handleScore = () => {
    setScoreCount(prev => prev + 1);
  };

  const handleClimb = (position: string) => {
    setClimbSelection(position);
  };

    return (

      <div>
        <div className='ContainerTitle'>
          <h1 >Auto</h1>
        </div>

        <div className='ContainerTime'>
          <div>
          <button className='Pass' onClick ={handleClick}>
         {isActive ? `Stop (${seconds}s passed)` : 'Pass'}
         </button>
          </div>
      
         <div> 
          <button className='Score' onClick ={handleClick}>
         {isActive ? `Stop (${seconds}s passed)` : 'Score'}
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
        <button className="humanPlayer"></button>
        <button className="depot"></button>
        </div>

        <p>Climb</p>
        <div className='climbContainer'>
          <div>
          <button
            className={`ClimbLeft ${climbSelection === "left" ? "selected" : ""}`}
            onClick={() => handleClimb("left")}>
              Left
          </button>
          </div>
          
          <button
            className={`ClimbMiddle ${climbSelection === "middle" ? "selected" : ""}`}
            onClick={() => handleClimb("middle")}>
              Middle
          </button>

          <div>
          <button
            className={`ClimbRight ${climbSelection === "right" ? "selected" : ""}`}
            onClick={() => handleClimb("right")}>
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
  