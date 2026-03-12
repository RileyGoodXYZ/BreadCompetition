import './Profile.css'
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from "react";
import { canScoutUseAuto } from './autoAccess';

function Profile() {
  const navigate = useNavigate();
  const storedSessionType = localStorage.getItem('profile_session_type') ?? "";
  const normalizedSessionType =
    storedSessionType.toLowerCase() === "test" ? "Test" : storedSessionType;
  const [sessionType, setSessionType] = useState<string>(normalizedSessionType);
  const [sessionTypeTouched, setSessionTypeTouched] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(localStorage.getItem('profile_is_signed_in') === 'true');

  const handleSessionTypeChange = (value: string) => {
    setSessionType(value);
    localStorage.setItem('profile_session_type', value);
  };
  const handleSessionTypeToggle = (value: string) => {
    setSessionTypeTouched(true);
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
      if (typeof userInfo.name === 'string') {
        localStorage.setItem('profile_scout_name', userInfo.name);
        if (canScoutUseAuto(userInfo.name) && !sessionTypeTouched) {
          localStorage.setItem('profile_session_type', '');
          setSessionType('');
        }
      }
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
      {localStorage.getItem('profile_is_signed_in') === 'true' ? (
        <h3>Hello {localStorage.getItem("profile_scout_name")}</h3>
      ) : null}
         <button className='signinp' onClick={() => login()}>Sign in</button>
      <div className='threebuttons'>
        
        <button
          className={`practice ${sessionType === "Practice" ? "selected-session" : ""}`}
          onClick={() => handleSessionTypeToggle("Practice")}
          aria-pressed={sessionType === "Practice"}
        >
          Practice
        </button>
        <button
          className={`rescout ${sessionType === "Test" ? "selected-session" : ""}`}
          onClick={() => handleSessionTypeToggle("Test")}
          aria-pressed={sessionType === "Test"}
        >
          Test
        </button>
        <button
          className={`rescout ${sessionType === "Rescout" ? "selected-session" : ""}`}
          onClick={() => handleSessionTypeToggle("Rescout")}
          aria-pressed={sessionType === "Rescout"}
        >
          Rescout
        </button>
        <button
          className={`rescout ${sessionType === "Async" ? "selected-session" : ""}`}
          onClick={() => handleSessionTypeToggle("Async")}
          aria-pressed={sessionType === "Async"}
        >
         Async
        </button>
     
      </div>
      <br></br>
      <button
        className='nextprofile'
        onClick={() => {
          const canProceed =
            window.location.hostname === 'localhost' ||
            sessionType === 'Practice' ||
            isSignedIn ||
            localStorage.getItem('profile_is_signed_in') === 'true';
          if (!canProceed) {
            alert('Please sign in first.');
            return;
          }
          navigate('/Prematch');
        }}
        disabled={
          window.location.hostname !== 'localhost' &&
          !(sessionType === 'Practice' || isSignedIn || localStorage.getItem('profile_is_signed_in') === 'true')
        }
        style={{
          opacity:
            window.location.hostname !== 'localhost' &&
            !(sessionType === 'Practice' || isSignedIn || localStorage.getItem('profile_is_signed_in') === 'true')
              ? 0.6
              : 1,
        }}
      >
        next
      </button>
    </div>

  )
}
export default Profile;
