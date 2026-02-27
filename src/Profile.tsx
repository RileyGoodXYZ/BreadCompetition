import './Profile.css'
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from "react";

function Profile() {
  const navigate = useNavigate();
  const [scoutName, setScoutName] = useState<string>(localStorage.getItem('profile_scout_name') ?? "");
  const [sessionType, setSessionType] = useState<string>(localStorage.getItem('profile_session_type') ?? "");
  const [, setIsSignedIn] = useState<boolean>(localStorage.getItem('profile_is_signed_in') === 'true');

  const handleScoutNameChange = (value: string) => {
    setScoutName(value);
    localStorage.setItem('profile_scout_name', value);
  };

  const handleSessionTypeChange = (value: string) => {
    setSessionType(value);
    localStorage.setItem('profile_session_type', value);
  };
  const handleSessionTypeToggle = (value: string) => {
    const nextValue = sessionType === value ? "" : value;
    handleSessionTypeChange(nextValue);
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });

      const userInfo = await res.json();

      console.log("User Name:", userInfo.name);
      alert("Welcome, " + userInfo.name);
      setIsSignedIn(true);
      localStorage.setItem('profile_is_signed_in', 'true');

    },
    onError: (error) => {
      console.log('Login Failed:', error)
      setIsSignedIn(false);
      localStorage.setItem('profile_is_signed_in', 'false');
    }
  });

  return (
    <div className="wrapper">
      <div className='maincontainer'>
        <h1 className="titleprofile">Profile</h1>
      </div>
      <textarea className='textareaprofile' placeholder='Enter your name here' 
      value={scoutName} onChange={(e) => handleScoutNameChange(e.target.value)}></textarea>
      <div className='threebuttons'>
        <button
          className={`practice ${sessionType === "Practice" ? "selected-session" : ""}`}
          onClick={() => handleSessionTypeToggle("Practice")}
          aria-pressed={sessionType === "Practice"}
        >
          Practice
        </button>
        <button
          className={`rescout ${sessionType === "Rescout" ? "selected-session" : ""}`}
          onClick={() => handleSessionTypeToggle("Rescout")}
          aria-pressed={sessionType === "Rescout"}
        >
          Rescout
        </button>
        <button className='signinp' onClick={() => login()}>Sign in</button>
      </div>
      <br></br>
      <button className='nextprofile' onClick={() => navigate('/Prematch')}>next</button>
    </div>

  )
}

export default Profile;
