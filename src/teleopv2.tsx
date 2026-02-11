import React, { useState } from 'react';

export default function TeleopV1() {
  const [shiftToggled, setShiftToggled] = useState(false);

  const handleButtonClick = (buttonName) => {
    console.log(`${buttonName} clicked`);
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '20px',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '48px', 
        fontWeight: 'normal',
        marginBottom: '40px',
        letterSpacing: '2px'
      }}>
        TELEOP V1
      </h1>

      {/* Shift Toggle */}
      <button
        onClick={() => {
          setShiftToggled(!shiftToggled);
          handleButtonClick('shift toggle');
        }}
        style={{
          width: '100px',
          height: '70px',
          border: '2px solid black',
          borderRadius: '50%',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: '1.3'
        }}
      >
        <span>shift</span>
        <span>toggle</span>
      </button>

      {/* Pass and Score Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
        <button
          onClick={() => handleButtonClick('pass')}
          style={{
            flex: 1,
            height: '120px',
            border: '2px solid black',
            borderRadius: '20px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          pass
        </button>
        <button
          onClick={() => handleButtonClick('score')}
          style={{
            flex: 1,
            height: '120px',
            border: '2px solid black',
            borderRadius: '20px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          score
        </button>
      </div>

      {/* Miss Row */}
      <button
        onClick={() => handleButtonClick('miss')}
        style={{
          width: '100%',
          height: '60px',
          border: '2px solid black',
          borderRadius: '15px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '30px'
        }}
      >
        miss
      </button>

      {/* Trench and Bump Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
        <button
          onClick={() => handleButtonClick('trench')}
          style={{
            flex: 1,
            height: '100px',
            border: '2px solid black',
            borderRadius: '20px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          trench
        </button>
        <button
          onClick={() => handleButtonClick('bump')}
          style={{
            flex: 1,
            height: '100px',
            border: '2px solid black',
            borderRadius: '20px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          bump
        </button>
      </div>

      {/* Large Bottom Section with Intake and Neutral */}
      <div style={{
        width: '100%',
        height: '300px',
        border: '2px solid black',
        borderRadius: '20px',
        background: 'white',
        position: 'relative',
        cursor: 'pointer'
      }}
        onClick={() => handleButtonClick('neutral')}
      >
        {/* Intake Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleButtonClick('intake');
          }}
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '160px',
            height: '80px',
            border: '2px solid black',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          intake
        </button>

        {/* Neutral Label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '16px',
          pointerEvents: 'none'
        }}>
          neutral
        </div>
      </div>
    </div>
  );
}
