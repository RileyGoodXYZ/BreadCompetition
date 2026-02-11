import './Auto.css'
import image from './assets/rebuiltField.png';
import React, { useState, useEffect } from 'react';
function Auto() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    let interval = null;
    // If active, keep adding 1 every second
    if (isActive) {
      interval = setInterval(() => {
    setSeconds((prev) => prev + 1); }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
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
          <h2 className='Auto text -3xl'>AUTO</h2>
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

        <div className='ContainerTower'>
          <div>
            <button className='ClimbLeft'>
            Climb Left
            </button>
          </div>
          
          <div>
            <button className='ClimbMiddle'>
            Climb Middle
            </button>
          </div>

          <div>
            <button className='ClimbRight'>
            Climb Right
            </button>
          </div>
        </div>

          <div>
            <img
            src={image} alt="rebuiltField"/>
        </div>

      </div>
    )
  }
  
  export default Auto
  