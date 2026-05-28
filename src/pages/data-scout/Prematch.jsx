import image from '../../assets/rebuiltField.png';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession } from '../../utils/autoAccess';

function Prematch() {
  const navigate = useNavigate();
  const [position, setPosition] = useState(localStorage.getItem('prematch_position') ?? "");
  const [teamNum, setTeamNum] = useState(localStorage.getItem('prematch_team_num') ?? "");
  const [matchNum, setMatchNum] = useState(localStorage.getItem('prematch_match_num') ?? "");
  const [alliance, setAlliance] = useState(localStorage.getItem('prematch_alliance') ?? "Red");
  const [orient, setOrient] = useState(localStorage.getItem('prematch_orient') ?? "Normal");
  const [noShow, setNoShow] = useState(localStorage.getItem('prematch_no_show') === 'true');
  
  useEffect(() => {
    if (
      window.location.hostname !== 'localhost' &&
      localStorage.getItem('profile_is_signed_in') !== 'true' &&
      !isPracticeSession()
    ) {
      navigate('/data-scout/profile');
    }
  }, [navigate]);
  useEffect(() => {
    if (!localStorage.getItem('prematch_alliance')) {
      localStorage.setItem('prematch_alliance', alliance);
    }
  }, [alliance]);
  
  const toggleAlliance = () => {
    const nextAlliance = alliance === "Red" ? "Blue" : "Red";
    setAlliance(nextAlliance);
    localStorage.setItem('prematch_alliance', nextAlliance);
  };

  const handleNext = () => {
    if (teamNum === "" || matchNum === "" || (!noShow && position === "")) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    if (noShow) {
      navigate('/data-scout/submit');
      return;
    }
    if (currentScoutCanUseAuto() && !isAutoDisabledSession()) {
      navigate('/data-scout/auto');
    } else {
      navigate('/data-scout/teleop');
    }
  }

  return (
    <div className="mainContainer">
      <div >
        <h1 style={{ whiteSpace: 'nowrap', fontFamily: 'Arial, Helvetica, sans-serif', background: 'none', marginTop: '1rem', marginBottom: '1rem' }}>
          Prematch
        </h1>
        <div>
          <textarea
            style={{ width: '85vw', border: '5px', textAlign: 'center', resize: 'none', margin: '5px', fontWeight: 'bold' }}
            placeholder='MATCH NUMBER'
            content="center"
            value={matchNum}
            onChange={(e) => {
              setMatchNum(e.target.value);
              localStorage.setItem('prematch_match_num', e.target.value);
            }}
          />
        </div>
        <div>
          <textarea
            style={{ width: '85vw', border: '5px', textAlign: 'center', resize: 'none', margin: '5px', fontWeight: 'bold' }}
            placeholder='TEAM NUMBER'
            content="center"
            value={teamNum}
            onChange={(e) => {
              setTeamNum(e.target.value);
              localStorage.setItem('prematch_team_num', e.target.value);
            }}
          />
        </div>
        <div >
          <button 
            style={{
              width: '40vw',
              height: '7vh',
              borderRadius: '9px',
              borderWidth: '4px',
              backgroundColor: 'rgb(49, 175, 161)',
              borderColor: 'rgb(33, 115, 105)',
              margin: '5px',
              color: 'rgb(241, 243, 245)',
              fontWeight: 'bold'
            }}
            onClick={() => {
              const nextOrient = orient === "Normal" ? "Flipped" : "Normal";
              setOrient(nextOrient);
              localStorage.setItem('prematch_orient', nextOrient);
            }}
          >
            ORIENTATION
          </button>
          <button
            style={{
              width: '40vw',
              height: '7vh',
              borderRadius: '9px',
              borderWidth: '4px',
              margin: '5px',
              color: 'rgb(241, 243, 245)',
              fontWeight: 'bold',
              backgroundColor: alliance === "Red" ? 'rgb(203, 58, 58)' : 'rgb(53, 53, 176)',
              borderColor: alliance === "Red" ? 'rgb(129, 33, 33)' : 'rgb(32, 32, 90)',
            }}
            onClick={toggleAlliance}
            data-orient={orient}
          >
            ALLIANCE
          </button>
          <div>
            <img
              src={image}
              alt="rebuiltField.png"
              style={{
                transform: orient === "Flipped" ? 'scaleX(-1)' : 'none',
                margin: '5px',
                height: '350px',
                marginTop: '40px'
              }}
            />
          </div>
        </div>
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            translate: alliance === "Blue" ? '400px -350px' : '10px -350px',
            transition: 'translate 150ms ease',
            gap: '20px',
            left: 'auto'
          }}
        >
          <button 
            style={{
              backgroundColor: 'rgb(243, 124, 185)',
              borderRadius: '9px',
              borderWidth: '4px',
              width: '14vw',
              height: '55px',
              margin: '5px',
              color: 'rgb(241, 243, 245)',
              fontWeight: 'bold',
              opacity: position === "1" ? 0.6 : 1
            }}
            onClick={() => {
              setPosition("1");
              localStorage.setItem('prematch_position', "1");
            }}
          >
            1
          </button>
          <button 
            style={{
              backgroundColor: 'rgb(243, 124, 185)',
              borderRadius: '9px',
              borderWidth: '4px',
              width: '14vw',
              height: '55px',
              margin: '5px',
              color: 'rgb(241, 243, 245)',
              fontWeight: 'bold',
              opacity: position === "2" ? 0.6 : 1
            }}
            onClick={() => {
              setPosition("2");
              localStorage.setItem('prematch_position', "2");
            }}
          >
            2
          </button>
          <button 
            style={{
              backgroundColor: 'rgb(243, 124, 185)',
              borderRadius: '9px',
              borderWidth: '4px',
              width: '14vw',
              height: '55px',
              margin: '5px',
              color: 'rgb(241, 243, 245)',
              fontWeight: 'bold',
              opacity: position === "3" ? 0.6 : 1
            }}
            onClick={() => {
              setPosition("3");
              localStorage.setItem('prematch_position', "3");
            }}
          >
            3
          </button>
          <button 
            style={{
              backgroundColor: 'rgb(243, 124, 185)',
              borderRadius: '9px',
              borderWidth: '4px',
              width: '14vw',
              height: '55px',
              margin: '5px',
              color: 'rgb(241, 243, 245)',
              fontWeight: 'bold',
              opacity: position === "4" ? 0.6 : 1
            }}
            onClick={() => {
              setPosition("4");
              localStorage.setItem('prematch_position', "4");
            }}
          >
            4
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: '-305px', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
        <br></br>
          <Checkbox.Root 
            style={{
              backgroundColor: 'white',
              width: 'clamp(1.75rem, 5vw, 2rem)',
              height: 'clamp(1.75rem, 5vw, 2rem)',
              minWidth: '30px',
              minHeight: '30px',
              borderRadius: '4px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            id="prematch-no-show" 
            onClick={() => {
              const next = !noShow;
              setNoShow(next);
              localStorage.setItem('prematch_no_show', String(next));
            }} 
            checked={noShow}
          >
            <Checkbox.Indicator 
              style={{
                color: '#2f1404'
              }}
            >
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label 
            style={{
              fontSize: '1rem',
              fontWeight: '600'
            }}
            htmlFor="prematch-no-show"
          >
            No show
          </label>
          <br>
          </br>
       
        </div>
        <br></br>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', width: '100%', marginBottom:'50px' }}>
          <button 
            className="navBtns" 
            style={{ flex: '1 1 auto', minWidth: '100px' }} 
            onClick={() => navigate('/data-scout/profile')}
          >
            Back
          </button>
          <button
            className="navBtns"
            style={{ flex: '1 1 auto', minWidth: '100px' }}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
export default Prematch;
