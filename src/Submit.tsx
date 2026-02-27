import './Submit.css'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Submit() {

  const navigate = useNavigate();
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<string>(localStorage.getItem('submit_review') ?? '');
  const selectReview = (value: string) => {
    setSelectedReview(value);
    localStorage.setItem('submit_review', value);
  };
  const resetTeleopData = () => {
    localStorage.removeItem('teleop_checked');
    localStorage.removeItem('teleop_pass_or_score');
    localStorage.removeItem('teleop_trench_count');
    localStorage.removeItem('teleop_bump_count');
    localStorage.removeItem('teleop_hub_state');
    localStorage.removeItem('teleop_hub_state_history');
    localStorage.removeItem('teleop_button_times');
    localStorage.removeItem('teleopv2_checked');
    localStorage.removeItem('teleopv2_intake_state');
    localStorage.removeItem('teleopv2_trench_count');
    localStorage.removeItem('teleopv2_bump_count');
    localStorage.removeItem('teleopv2_button_times');
  };

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
    const rawButtonTimesV2 = localStorage.getItem('teleopv2_button_times') ?? '{}';
    const buttonTimesV2 = (() => {
      try {
        return JSON.parse(rawButtonTimesV2) as Record<string, number>;
      } catch {
        return {};
      }
    })();
    const rawHubStateHistory = localStorage.getItem('teleop_hub_state_history') ?? '[]';
    const hubStateHistory = (() => {
      try {
        const parsed = JSON.parse(rawHubStateHistory);
        if (Array.isArray(parsed)) {
          return parsed.filter((value): value is string => typeof value === 'string');
        }
        return [];
      } catch {
        return [];
      }
    })();
    const fallbackHubState = localStorage.getItem('teleop_hub_state') ?? localStorage.getItem('teleopv2_intake_state') ?? 'Off';
    const teleopTrenchRaw = localStorage.getItem('teleop_trench_count');
    const teleopBumpRaw = localStorage.getItem('teleop_bump_count');
    const teleopV2TrenchRaw = localStorage.getItem('teleopv2_trench_count');
    const teleopV2BumpRaw = localStorage.getItem('teleopv2_bump_count');
    const extraConstData = {
      submit_review: selectedReview || localStorage.getItem('submit_review') || '',
      prematch_alliance: localStorage.getItem('prematch_alliance') ?? '',
      prematch_match_num: localStorage.getItem('prematch_match_num') ?? '',
      prematch_team_num: localStorage.getItem('prematch_team_num') ?? '',
      prematch_position: localStorage.getItem('prematch_position') ?? '',
      prematch_orient: localStorage.getItem('prematch_orient') ?? '',
      auto_climb_selection: localStorage.getItem('auto_climb_selection') ?? '',
      auto_pass_count: Number(localStorage.getItem('auto_pass_count') ?? '0'),
      auto_score_count: Number(localStorage.getItem('auto_score_count') ?? '0'),
      auto_pass_seconds: Number(localStorage.getItem('auto_pass_seconds') ?? '0'),
      auto_score_seconds: Number(localStorage.getItem('auto_score_seconds') ?? '0'),
      auto_human_player_count: Number(localStorage.getItem('auto_human_player_count') ?? '0'),
      auto_depot_count: Number(localStorage.getItem('auto_depot_count') ?? '0'),
      teleop_pass_time: Number(localStorage.getItem('teleop_pass_time') ?? '0'),
      teleop_score_time: Number(localStorage.getItem('teleop_score_time') ?? '0'),
      teleopv2_checked: localStorage.getItem('teleopv2_checked') === 'true',
      teleopv2_intake_state: localStorage.getItem('teleopv2_intake_state') ?? '',
      teleopv3_score_count: Number(localStorage.getItem('score_count') ?? '0'),
      teleopv3_pass_count: Number(localStorage.getItem('pass_count') ?? '0'),
      teleopv3_hoard_count: Number(localStorage.getItem('hoard_count') ?? '0'),
    };
    const mergedButtonTimes = {
      ...buttonTimes,
      ...Object.fromEntries(Object.entries(buttonTimesV2).map(([key, value]) => [`v2_${key}`, value])),
      ...extraConstData,
    };

    const payload = {
      scout_name: localStorage.getItem('profile_scout_name') ?? '',
      session_type: localStorage.getItem('profile_session_type') ?? '',
      is_signed_in: localStorage.getItem('profile_is_signed_in') === 'true',
      match_num: localStorage.getItem('prematch_match_num') ?? '',
      team_num: localStorage.getItem('prematch_team_num') ?? '',
      alliance: localStorage.getItem('prematch_alliance') ?? '',
      orientation: localStorage.getItem('prematch_orient') ?? '',
      position: localStorage.getItem('prematch_position') ?? '',
      review: selectedReview || localStorage.getItem('submit_review') || '',
      auto_climb_selection: localStorage.getItem('auto_climb_selection') ?? '',
      auto_pass_count: Number(localStorage.getItem('auto_pass_count') ?? '0'),
      auto_score_count: Number(localStorage.getItem('auto_score_count') ?? '0'),
      auto_pass_seconds: Number(localStorage.getItem('auto_pass_seconds') ?? '0'),
      auto_score_seconds: Number(localStorage.getItem('auto_score_seconds') ?? '0'),
      auto_human_player_count: Number(localStorage.getItem('auto_human_player_count') ?? '0'),
      auto_depot_count: Number(localStorage.getItem('auto_depot_count') ?? '0'),
      hub_on: (localStorage.getItem('teleop_checked') ?? localStorage.getItem('teleopv2_checked') ?? 'false') === 'true',
      pass_or_score: localStorage.getItem('teleop_pass_or_score') ?? 'Score',
      trench_count: Number(teleopTrenchRaw ?? teleopV2TrenchRaw ?? '0'),
      bump_count: Number(teleopBumpRaw ?? teleopV2BumpRaw ?? '0'),
      hub_state: hubStateHistory.length > 0 ? hubStateHistory.join(' | ') : fallbackHubState,
      button_times: mergedButtonTimes,
      climb: localStorage.getItem('endgame_climb') ?? 'None',
      shoot_while_climb: localStorage.getItem('endgame_shoot_while_climb') === 'true',
      buddy_climb: localStorage.getItem('endgame_buddy_climb') === 'true',
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

      resetTeleopData();
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
        <button className="badAutoBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReview === 'Bad Auto' ? 0.6 : 1 }} onClick={() => selectReview('Bad Auto')}>Bad Auto</button>
        <button className="goodTeleopBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReview === 'Good Teleop' ? 0.6 : 1 }} onClick={() => selectReview('Good Teleop')}>Good Teleop</button>
          <button className="badTeleopBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReview === 'Bad Teleop' ? 0.6 : 1 }} onClick={() => selectReview('Bad Teleop')}>Bad Teleop</button>
        <button className="submitBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem' }} onClick={handleSubmit}>Submit</button>
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
