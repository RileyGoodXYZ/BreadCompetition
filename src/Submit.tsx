import './Submit.css'
import { useNavigate } from 'react-router-dom';

function Submit() {

  const navigate = useNavigate();

    return (
     <div>
      <center>
        <div className='container'>
             <button className='button1' onClick={() => navigate('/Endgame')}>
        Back
        </button> 
      <h1 className='title'>Submit</h1>
      </div>
      
    <button className= 'button7'>
            Bad Auto 
         </button> 

        <div className='container1'>
        <button className= 'Button'>
          SIGN IN
        </button>
        <button className= 'button4'> 
         Submit
        </button>
        
        </div> 

        <button className= 'nextprofile'>
      next
     </button>

        </center>
     </div>

    )

  }
  export default Submit
  