import './Prematch.css';
import image from './assets/rebuiltField.png';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import { Checkbox } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession } from './autoAccess';

function Prematch() {
  const navigate = useNavigate();
  const [position, setPosition] = useState<string>(localStorage.getItem('prematch_position') ?? "");
  const [teamNum, setTeamNum] = useState<string>(localStorage.getItem('prematch_team_num') ?? "");
  const [matchNum, setMatchNum] = useState<string>(localStorage.getItem('prematch_match_num') ?? "");
  const [alliance, setAlliance] = useState<string>(localStorage.getItem('prematch_alliance') ?? "Red");
  const [orient, setOrient] = useState<string>(localStorage.getItem('prematch_orient') ?? "Normal");
  const [noShow, setNoShow] = useState<boolean>(localStorage.getItem('prematch_no_show') === 'true');
  
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
      navigate('/endgame');
      return;
    }
    if (currentScoutCanUseAuto() && !isAutoDisabledSession()) {
      navigate('/auto');
    } else {
      navigate('/teleopv2');
    }
  }

  return (
    <div className="mainContainer">
      <div >
        <h1 className="prematchTitle" >
          Prematch
        </h1>
        <div>
          <textarea
            className='textbox1'
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
            className='textbox2'
            placeholder='TEAM NUMBER'
            content="center"
            value={teamNum}
            onChange={(e) => {
              setTeamNum(e.target.value);
              localStorage.setItem('prematch_team_num', e.target.value);
            }}
          />
        </div>
        <div className='container1'>
          <button className='orient' onClick={() => {
            const nextOrient = orient === "Normal" ? "Flipped" : "Normal";
            setOrient(nextOrient);
            localStorage.setItem('prematch_orient', nextOrient);
          }}>
            ORIENTATION
          </button>
          <button
            className='alliance'
            onClick={toggleAlliance}
            data-orient={orient}
            style={{
              backgroundColor: alliance === "Red" ? 'rgb(203, 58, 58)' : 'rgb(53, 53, 176)',
              borderColor: alliance === "Red" ? 'rgb(129, 33, 33)' : 'rgb(32, 32, 90)',
            }}
          >
            ALLIANCE
          </button>
          <div>
            <img
              src={image}
              alt="rebuiltField.png"
              className={orient === "Flipped" ? "flipped-image" : ""}
            />
          </div>
        </div>
        <div className={`container2 ${alliance === "Blue" ? "flipped" : ""}`}>
          <button className='position1' onClick={() => {
            setPosition("1");
            localStorage.setItem('prematch_position', "1");
          }} style={{ opacity: position === "1" ? 0.6 : 1 }}>
            1
          </button>
          <button className='position2' onClick={() => {
            setPosition("2");
            localStorage.setItem('prematch_position', "2");
          }} style={{ opacity: position === "2" ? 0.6 : 1 }}>
            2
          </button>
          <button className='position3' onClick={() => {
            setPosition("3");
            localStorage.setItem('prematch_position', "3");
          }} style={{ opacity: position === "3" ? 0.6 : 1 }}>
            3
          </button>
          <button className='position4' onClick={() => {
            setPosition("4");
            localStorage.setItem('prematch_position', "4");
          }} style={{ opacity: position === "4" ? 0.6 : 1 }}>
            4
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: '-190px', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
        <br></br>
          <Checkbox.Root className="CheckboxRoot" id="prematch-no-show" onClick={() => {
            const next = !noShow;
            setNoShow(next);
            localStorage.setItem('prematch_no_show', String(next));
          }} checked={noShow}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label" htmlFor="prematch-no-show">
            No show
          </label>
          <br>
          </br>
       
        </div>
        <br></br>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', width: '100%', marginBottom:'50px' }}>
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/profile')}>Back</button>
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
