import './Profile.css'
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

function Profile() {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });

      const userInfo = await res.json();

      console.log("User Name:", userInfo.name);
      alert("Welcome, " + userInfo.name);

    },
    onError: (error) => console.log('Login Failed:', error)
  });

  return (
    <div className="wrapper">
      <div className='maincontainer'>
        <h1 className="titleprofile">Profile</h1>
      </div>
      <textarea className='textareaprofile' placeholder='Enter your name here'></textarea>
      <div className='threebuttons'>
        <button className='practice'>Practice</button>
        <button className='rescout'>Rescout</button>
        <button className='signinp' onClick={() => login()}>Sign in</button>
      </div>
      <br></br>
      <button className='nextprofile' onClick={() => navigate('/Prematch')}>next</button>
    </div>

  )
}

export default Profile;
