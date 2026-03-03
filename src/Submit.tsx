import './Submit.css'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Submit() {
  const parseStoredReviews = (): string[] => {
    const stored = localStorage.getItem('submit_review');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === 'string');
      }
    } catch {
      // Backward compatibility: previous versions stored a plain string.
    }
    return [stored].filter(Boolean);
  };
  const reviewsToText = (reviews: string[]) => reviews.join(' | ');

  const navigate = useNavigate();
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [selectedReviews, setSelectedReviews] = useState<string[]>(parseStoredReviews);
  const toggleReview = (value: string) => {
    setSelectedReviews((prev) => {
      const next = prev.includes(value) ? prev.filter((review) => review !== value) : [...prev, value];
      localStorage.setItem('submit_review', JSON.stringify(next));
      return next;
    });
  };
  const resetTeleopData = () => {
    localStorage.removeItem('teleop_checked');
    localStorage.removeItem('teleop_pass_or_score');
    localStorage.removeItem('teleop_pass_or_score_history');
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
    const rawPassOrScoreHistory = localStorage.getItem('teleop_pass_or_score_history') ?? '[]';
    const passOrScoreHistory = (() => {
      try {
        const parsed = JSON.parse(rawPassOrScoreHistory);
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
    const reviewText = reviewsToText(selectedReviews);
    const payload = {
      scout_name: localStorage.getItem('profile_scout_name') ?? '',
      session_type: localStorage.getItem('profile_session_type') ?? '',
      is_signed_in: localStorage.getItem('profile_is_signed_in') === 'true',
      match_num: localStorage.getItem('prematch_match_num') ?? '',
      team_num: localStorage.getItem('prematch_team_num') ?? '',
      alliance: localStorage.getItem('prematch_alliance') ?? '',
      orientation: localStorage.getItem('prematch_orient') ?? '',
      position: localStorage.getItem('prematch_position') ?? '',
      review: reviewText,
      auto_climb_selection: localStorage.getItem('auto_climb_selection') ?? '',
      auto_pass_count: Number(localStorage.getItem('auto_pass_count') ?? '0'),
      auto_score_count: Number(localStorage.getItem('auto_score_count') ?? '0'),
      auto_pass_seconds: Number(localStorage.getItem('auto_pass_seconds') ?? '0'),
      auto_score_seconds: Number(localStorage.getItem('auto_score_seconds') ?? '0'),
      auto_human_player_count: Number(localStorage.getItem('auto_human_player_count') ?? '0'),
      auto_depot_count: Number(localStorage.getItem('auto_depot_count') ?? '0'),
      hub_on: (localStorage.getItem('teleop_checked') ?? localStorage.getItem('teleopv2_checked') ?? 'false') === 'true',
      pass_or_score: passOrScoreHistory.length > 0 ? passOrScoreHistory.join(' | ') : (localStorage.getItem('teleop_pass_or_score') ?? 'Score'),
      trench_count: Number(teleopTrenchRaw ?? teleopV2TrenchRaw ?? '0'),
      bump_count: Number(teleopBumpRaw ?? teleopV2BumpRaw ?? '0'),
      hub_state: hubStateHistory.length > 0 ? hubStateHistory.join(' | ') : fallbackHubState,
      teleop_pass_time: Number(localStorage.getItem('teleop_pass_time') ?? '0'),
      teleop_score_time: Number(localStorage.getItem('teleop_score_time') ?? '0'),
      teleopv2_checked: localStorage.getItem('teleopv2_checked') === 'true',
      teleopv2_intake_state: localStorage.getItem('teleopv2_intake_state') ?? '',
      teleopv3_score_count: Number(localStorage.getItem('score_count') ?? '0'),
      teleopv3_pass_count: Number(localStorage.getItem('pass_count') ?? '0'),
      teleopv3_hoard_count: Number(localStorage.getItem('hoard_count') ?? '0'),
      oppAllianceTopPassButton: Number(buttonTimes.oppAllianceTopPassButton ?? 0),
      oppAllianceBottomPassButton: Number(buttonTimes.oppAllianceBottomPassButton ?? 0),
      neutralTopPassButton: Number(buttonTimes.neutralTopPassButton ?? 0),
      neutralBottomPassButton: Number(buttonTimes.neutralBottomPassButton ?? 0),
      myAllianceTopPassButton: Number(buttonTimes.myAllianceTopPassButton ?? 0),
      myAllianceBottomPassButton: Number(buttonTimes.myAllianceBottomPassButton ?? 0),
      topScoreButton: Number(buttonTimes.topScoreButton ?? 0),
      bottomScoreButton: Number(buttonTimes.bottomScoreButton ?? 0),
      v2_pass_neutral_zone: Number(buttonTimesV2.pass_neutral_zone ?? 0),
      v2_pass_other_alliance_zone: Number(buttonTimesV2.pass_other_alliance_zone ?? 0),
      v2_hoard: Number(buttonTimesV2.hoard ?? 0),
      v2_score: Number(buttonTimesV2.score ?? 0),
      v2_miss_count: Number(buttonTimesV2.miss_count ?? 0),
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
        <button className="badAutoBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReviews.includes('Bad Auto') ? 0.6 : 1 }} onClick={() => toggleReview('Bad Auto')}>Bad Auto</button>
        <button className="goodTeleopBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReviews.includes('Good Teleop') ? 0.6 : 1 }} onClick={() => toggleReview('Good Teleop')}>Good Teleop</button>
          <button className="badTeleopBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReviews.includes('Bad Teleop') ? 0.6 : 1 }} onClick={() => toggleReview('Bad Teleop')}>Bad Teleop</button>
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
