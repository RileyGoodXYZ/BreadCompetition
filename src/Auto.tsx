import './Auto.css'

function Auto() {


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
      </div>
    )
  }
  
  export default Auto
  