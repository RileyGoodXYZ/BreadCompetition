import './Prematch.css';
import image from './assets/rebuiltField.png';

function Prematch() {


  return (
    <div>
       <h2 className="PrematchTitle text-3xl text-white font-bold tracking-wide">
          PREMATCH
        </h2>
      <div>
        <textarea
        className='textbox1'
        placeholder='Match Number'
        content="center"
        />
      </div>

      <div>
        <textarea
        className='textbox2'
        placeholder='Team Number'
        content="center"
        />
      </div>
      <div className='container1'>
        <button className='orient'>
          Orientation
        </button>
        <button className='alliance'>
          Alliance
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
     
    </div>
  )
}

export default Prematch
