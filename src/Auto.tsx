import './Auto.css'
import image from './assets/rebuiltField.png';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Auto() {
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
    return (

      <div>
        <div className='ContainerTitle'>
          <h1 >Auto</h1>
        </div>

        <div className='ContainerTime'>
          <div>
            <button className='Pass'>
            Pass
          </button>
          </div>
      
         <div> 
            <button className='Score'>
            Score
          </button>
         </div>

         <button className='Timer' onClick ={handleClick}>
         {isActive ? `Stop (${seconds}s passed)` : 'Start'}
         </button>

        </div>
          <div>
            <img
            src={image} alt="rebuiltField"/>
        </div>

        <p>Climb</p>
        <div className='climbContainer'>
          <div>
            <button className='ClimbLeft'>
            Left
            </button>
          </div>
          
          <div>
            <button className='ClimbMiddle'>
            Middle
            </button>
          </div>

          <div>
            <button className='ClimbRight'>
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
  