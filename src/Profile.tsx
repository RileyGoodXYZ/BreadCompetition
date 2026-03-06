import './Profile.css'
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from "react";
  // Remove scoutName, use Google account name only
function Profile() {
  const navigate = useNavigate();
  // Removed scoutName, only Google account name is used
  const [sessionType, setSessionType] = useState<string>(localStorage.getItem('profile_session_type') ?? "");
  // Removed scoutName handler
  const [isSignedIn, setIsSignedIn] = useState<boolean>(localStorage.getItem('profile_is_signed_in') === 'true');
  const [userName, setUserName] = useState<string>(localStorage.getItem('profile_user_name') ?? "");

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
      setUserName(userInfo.name);
      localStorage.setItem('profile_is_signed_in', 'true');
      localStorage.setItem('profile_user_name', userInfo.name);

    },
    onError: (error) => {
      console.log('Login Failed:', error)
      setIsSignedIn(false);
      localStorage.setItem('profile_is_signed_in', 'false');
    }
  });

  const logout = () => {
    setIsSignedIn(false);
    setUserName("");
    localStorage.setItem('profile_is_signed_in', 'false');
    localStorage.removeItem('profile_user_name');
  };

  return (
    <div className="wrapper">
      <div className='maincontainer'>
        <h1 className="titleprofile">Profile</h1>
        {isSignedIn && userName && <h2>Hello, {userName}</h2>}
      </div>
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
        {isSignedIn ? (
          <button className='signinp' onClick={logout}>Log out</button>
        ) : (
          <button className='signinp' onClick={() => login()}>Sign in</button>
        )}
      </div>
      <br></br>
      <button className='nextprofile' onClick={() => navigate('/Prematch')}>next</button>
    </div>
  )
}

export default Profile;
