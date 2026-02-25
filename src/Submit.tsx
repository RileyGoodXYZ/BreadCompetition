import './Submit.css'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Submit() {

  const navigate = useNavigate();
  const [submitMessage, setSubmitMessage] = useState<string>('');

  const handleSubmit = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const tableName = import.meta.env.VITE_SUPABASE_TABLE ?? 'scouting_submissions';

    if (!supabaseUrl || !supabaseAnonKey) {
      setSubmitMessage('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    const rawButtonTimes = localStorage.getItem('teleop_button_times') ?? '{}';
    const buttonTimes = (() => {
      try {
        return JSON.parse(rawButtonTimes) as Record<string, number>;
      } catch {
        return {};
      }
    })();

    const payload = {
      scout_name: localStorage.getItem('profile_scout_name') ?? '',
      session_type: localStorage.getItem('profile_session_type') ?? '',
      is_signed_in: localStorage.getItem('profile_is_signed_in') === 'true',
      hub_on: localStorage.getItem('teleop_checked') === 'true',
      pass_or_score: localStorage.getItem('teleop_pass_or_score') ?? 'Score',
      trench_count: Number(localStorage.getItem('teleop_trench_count') ?? '0'),
      bump_count: Number(localStorage.getItem('teleop_bump_count') ?? '0'),
      hub_state: localStorage.getItem('teleop_hub_state') ?? 'Off',
      button_times: buttonTimes,
      climb: localStorage.getItem('endgame_climb') ?? 'None',
      shoot_while_climb: localStorage.getItem('endgame_shoot_while_climb') === 'true',
      buddy_climb: localStorage.getItem('endgame_buddy_climb') === 'true',
      created_at: new Date().toISOString(),
    };

    setSubmitMessage('Submitting...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setSubmitMessage(`Submit failed: ${errorText}`);
        return;
      }

      setSubmitMessage('Submitted to Supabase.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSubmitMessage(`Submit failed: ${message}`);
    }
  };

  return (
    <div className="mainContainer">
      <div className="topHeader">
        <h1>Submit</h1>
      </div>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <button className="badAutoBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem' }}>Bad Auto</button>
        <button className="submitBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem' }} onClick={handleSubmit}>Submit</button>
        <button className="signInBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem' }}>SIGN IN</button>
        {submitMessage ? <p style={{ margin: 0 }}>{submitMessage}</p> : null}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap', width: '100%' }}>
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/Endgame')}>Back</button>
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/Prematch')}>Next</button>
        </div>
      </div>
    </div>
  )

}
export default Submit
