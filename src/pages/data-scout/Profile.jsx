import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from "react";
import { canScoutUseAuto } from '../../utils/autoAccess';

function Profile() {
  const navigate = useNavigate();
  const storedSessionType = localStorage.getItem('profile_session_type') ?? "";
  const normalizedSessionType =
    storedSessionType.toLowerCase() === "test" ? "Test" : storedSessionType;
  const [sessionType, setSessionType] = useState(normalizedSessionType);
  const [sessionTypeTouched, setSessionTypeTouched] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(localStorage.getItem('profile_is_signed_in') === 'true');

  const handleSessionTypeChange = (value) => {
    setSessionType(value);
    localStorage.setItem('profile_session_type', value);
  };
  const handleSessionTypeToggle = (value) => {
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
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingTop: '20px', width: '100%', '--profile-row-width': 'min(84vw, 320px)'}}>
      <div className='maincontainer'>
        <h1 style={{display: 'inline', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'rgb(243, 246, 246)'}}>Profile</h1>
      </div>
      {localStorage.getItem('profile_is_signed_in') === 'true' ? (
        <h3>Hello {localStorage.getItem("profile_scout_name")}</h3>
      ) : null}
         <button style={{backgroundColor: 'rgb(225, 143, 172)', width: 'var(--profile-row-width)', maxWidth: '100%'}} onClick={() => login()}>Sign in</button>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: 'var(--profile-row-width)'}}>
        
        <button
          style={{fontSize: '14px', padding: '8px 10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: '0', textAlign: 'center', backgroundColor: '#eaddcd', opacity: sessionType === "Practice" ? 0.55 : 1, filter: sessionType === "Practice" ? 'saturate(0.7)' : 'none'}}
          onClick={() => handleSessionTypeToggle("Practice")}
          aria-pressed={sessionType === "Practice"}
        >
          Practice
        </button>
        <button
          style={{fontSize: '14px', padding: '8px 10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: '0', textAlign: 'center', backgroundColor: 'rgb(214, 192, 238)', opacity: sessionType === "Test" ? 0.55 : 1, filter: sessionType === "Test" ? 'saturate(0.7)' : 'none'}}
          onClick={() => handleSessionTypeToggle("Test")}
          aria-pressed={sessionType === "Test"}
        >
          Test
        </button>
        <button
          style={{fontSize: '14px', padding: '8px 10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: '0', textAlign: 'center', backgroundColor: 'rgb(214, 192, 238)', opacity: sessionType === "Rescout" ? 0.55 : 1, filter: sessionType === "Rescout" ? 'saturate(0.7)' : 'none'}}
          onClick={() => handleSessionTypeToggle("Rescout")}
          aria-pressed={sessionType === "Rescout"}
        >
          Rescout
        </button>
        <button
          style={{fontSize: '14px', padding: '8px 10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: '0', textAlign: 'center', backgroundColor: 'rgb(214, 192, 238)', opacity: sessionType === "Async" ? 0.55 : 1, filter: sessionType === "Async" ? 'saturate(0.7)' : 'none'}}
          onClick={() => handleSessionTypeToggle("Async")}
          aria-pressed={sessionType === "Async"}
        >
         Async
        </button>
     
      </div>
      <br></br>
      <button
        style={{backgroundColor: '#b4ebb4', width: '90%', maxWidth: '250px', height: '100px', borderRadius: '15px', fontSize: '20px', margin: '10px auto', display: 'block', opacity: window.location.hostname !== 'localhost' && !(sessionType === 'Practice' || isSignedIn || localStorage.getItem('profile_is_signed_in') === 'true') ? 0.6 : 1}}
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
      >
        next
      </button>
    </div>

  )
}
export default Profile;
