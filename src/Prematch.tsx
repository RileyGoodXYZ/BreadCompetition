import './Prematch.css';
import image from './assets/rebuiltField.png';
import { useNavigate } from 'react-router-dom';
import { useState } from "react";

function Prematch() {
  const navigate = useNavigate();
  const [position, setPosition] = useState<string>("");
  
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
          />
        </div>
        <div>
          <textarea
            className='textbox2'
            placeholder='TEAM NUMBER'
            content="center"
          />
        </div>
        <div className='container1'>
          <button className='orient'>
            ORIENTATION
          </button>
          <button className='alliance'>
            ALLIANCE
          </button>
          <div>
            <img
              src={image} alt="rebuiltField.png"
            />
          </div>
        </div>
        <div className='container2'>
          <button className='position1' onClick={() => setPosition("1")} style={{ opacity: position === "1" ? 0.6 : 1 }}>
            1
          </button>
          <button className='position2' onClick={() => setPosition("2")} style={{ opacity: position === "2" ? 0.6 : 1 }}>
            2
          </button>
          <button className='position3' onClick={() => setPosition("3")} style={{ opacity: position === "3" ? 0.6 : 1 }}>
            3
          </button>
        </div>
        <button className='prematchNext' onClick={() => navigate('/Teleop')}>
          NEXT
        </button>
      </div>
    </div>
  )
}
export default Prematch;
