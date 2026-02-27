import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './teleopv3.css';

export default function TeleopV3() {
  const [scoreCount, setScoreCount] = useState<number>(Number(localStorage.getItem('score_count') ?? '0'));
  const [passCount, setPassCount] = useState<number>(Number(localStorage.getItem('pass_count') ?? '0'));
  const [hoardCount, setHoardCount] = useState<number>(Number(localStorage.getItem('hoard_count') ?? '0'));
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('score_count', String(scoreCount));
  }, [scoreCount]);

  useEffect(() => {
    localStorage.setItem('pass_count', String(passCount));
  }, [passCount]);

  useEffect(() => {
    localStorage.setItem('hoard_count', String(hoardCount));
  }, [hoardCount]);

  return (
    <div className="mainContainer">
      <div className="topHeader">
        <h1>TELEOP V3</h1>
      </div>

      {/* Score Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          data-button-id="score"
          onClick={() => setScoreCount(scoreCount + 1)}
          style={{
            flex: 1,
            height: '80px',
            fontSize: '1.25rem',
          }}
        >
          Score 1
        </button>
        <button
          data-button-id="score-5"
          onClick={() => setScoreCount(scoreCount + 5)}
          style={{
            flex: 1,
            height: '80px',
            fontSize: '1.25rem',
          }}
        >
          Score 5
        </button>
      </div>

      {/* Pass Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          data-button-id="pass"
          onClick={() => setPassCount(passCount + 1)}
          style={{
            flex: 1,
            height: '80px',
            fontSize: '1.25rem',
            backgroundColor: '#58b0b3',
          }}
        >
          Pass 1
        </button>
        <button
          data-button-id="pass-5"
          onClick={() => setPassCount(passCount + 5)}
          style={{
            flex: 1,
            height: '80px',
            fontSize: '1.25rem',
            backgroundColor: '#58b0b3',
          }}
        >
          Pass 5
        </button>
      </div>

      {/* Hoard Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          data-button-id="hoard"
          onClick={() => setHoardCount(hoardCount + 1)}
          style={{
            flex: 1,
            height: '80px',
            fontSize: '1.25rem',
            backgroundColor: '#c69ef0',
          }}
        >
          Hoard 1
        </button>
        <button
          data-button-id="hoard-5"
          onClick={() => setHoardCount(hoardCount + 5)}
          style={{
            flex: 1,
            height: '80px',
            fontSize: '1.25rem',
            backgroundColor: '#c69ef0',
          }}
        >
          Hoard 5
        </button>
      </div>

      {/* Trench and Bump Row
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', width: '100%', maxWidth: '600px' }}>
        <button
          onClick={() => setCanTrench(!canTrench)}
          style={{
            flex: 1,
            height: "2.5rem",
            backgroundColor: '#d7b3fb',
            opacity: canTrench ? 0.6 : 1,
          }}
        >
          Trench
        </button>
        <button
          onClick={() => setCanBump(!canBump)}
          style={{
            flex: 1,
            height: "2.5rem",
            backgroundColor: '#d7b3fb',
            opacity: canBump ? 0.6 : 1,
          }}
        >
          Bump
        </button>
      </div> */}
      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap', width: '100%' }}>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/teleopv2')}>Back</button>
        <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/Endgame')}>Next</button>
      </div>
    </div>
  );
}
