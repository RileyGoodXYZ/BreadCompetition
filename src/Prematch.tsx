import './Prematch.css';
import image from './assets/rebuiltField.png';
import { useNavigate } from 'react-router-dom';

function Prematch() {
  const navigate = useNavigate();

  return (
    <div>
       <h2 className="prematchTitle" text-3xl text-white font-bold tracking-wide>
          PREMATCH
        </h2>
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
        <button className='position1'>
          1
        </button>
        <button className='position2'>
          2
        </button>
        <button className='position3'>
          3
        </button>
      </div>
      <button className='prematchNext' onClick={() => navigate('/Teleop')}>
        NEXT
      </button>
     
    </div>
  )
}

export default Prematch
