import './Submit.css'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Submit() {
  const parseStoredReview = (): string | null => {
    const stored = localStorage.getItem('submit_review');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'string') {
        return parsed;
      }
      if (Array.isArray(parsed)) {
        const firstReview = parsed.find((value): value is string => typeof value === 'string' && value.length > 0);
        return firstReview ?? null;
      }
    } catch {
      // Backward compatibility: previous versions stored a plain string.
    }
    return stored;
  };

  const navigate = useNavigate();
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<string | null>(parseStoredReview);
  const toggleReview = (value: string) => {
    setSelectedReview((prev) => {
      const next = prev === value ? null : value;
      if (next === null) {
        localStorage.removeItem('submit_review');
      } else {
        localStorage.setItem('submit_review', JSON.stringify(next));
      }
      return next;
    });
  };
  const resetScoutingData = () => {
    const keysToClear = [
      // Prematch
      'prematch_match_num',
      'prematch_team_num',
      'prematch_alliance',
      'prematch_orient',
      'prematch_position',
      // Auto
      'auto_climb_selection',
      'auto_pass_count',
      'auto_score_count',
      'auto_pass_seconds',
      'auto_score_seconds',
      'auto_human_player_count',
      'auto_depot_count',
      'auto_top_left_count',
      'auto_middle_left_count',
      'auto_bottom_left_count',
      'auto_top_right_count',
      'auto_middle_right_count',
      'auto_bottom_right_count',
      // Teleop (legacy + v2 + v3)
      'teleop_checked',
      'teleop_pass_or_score',
      'teleop_pass_or_score_history',
      'teleop_trench_count',
      'teleop_bump_count',
      'teleop_hub_state',
      'teleop_hub_state_history',
      'teleop_button_times',
      'teleop_pass_time',
      'teleop_score_time',
      'teleopv2_checked',
      'teleopv2_intake_state',
      'teleopv2_trench_count',
      'intake_teleopv2_trench_count',
      'teleopv2_bump_count',
      'intake_teleopv2_bump_count',
      'teleopv2_button_times',
      'teleopv2_miss_count',
      'intake_teleopv2_miss_count',
      'intake_pass_neutral_zone',
      'intake_pass_other_alliance_zone',
      'intake_hoard',
      'intake_score',
      'intake_miss_count',
      'intaking_pass_neutral_zone',
      'intaking_pass_other_alliance_zone',
      'intaking_hoard',
      'intaking_score',
      'score_count',
      'pass_count',
      'hoard_count',
      // Endgame
      'endgame_climb',
      'endgame_climb_status',
      'endgame_climb_level',
      'endgame_climb_type',
      'endgame_shoot_while_climb',
      'endgame_buddy_climb',
      // Submit page state
      'submit_review',
    ];

    keysToClear.forEach((key) => localStorage.removeItem(key));
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
    const intakeTeleopV2TrenchRaw = localStorage.getItem('intake_teleopv2_trench_count');
    const intakeTeleopV2BumpRaw = localStorage.getItem('intake_teleopv2_bump_count');
    const v2PassNeutralZone = Number(buttonTimesV2.pass_neutral_zone ?? 0);
    const v2PassOtherAllianceZone = Number(buttonTimesV2.pass_other_alliance_zone ?? 0);
    const v2Hoard = Number(buttonTimesV2.hoard ?? 0);
    const v2Score = Number(buttonTimesV2.score ?? 0);
    const v2MissCount = Number(buttonTimesV2.miss_count ?? 0);
    const v2IntakePassNeutralZone = Number(buttonTimesV2.intake_pass_neutral_zone ?? buttonTimesV2.intaking_pass_neutral_zone ?? 0);
    const v2IntakePassOtherAllianceZone = Number(buttonTimesV2.intake_pass_other_alliance_zone ?? buttonTimesV2.intaking_pass_other_alliance_zone ?? 0);
    const v2IntakeHoard = Number(buttonTimesV2.intake_hoard ?? buttonTimesV2.intaking_hoard ?? 0);
    const v2IntakeScore = Number(buttonTimesV2.intake_score ?? buttonTimesV2.intaking_score ?? 0);
    const v2IntakeMissCount = Number(buttonTimesV2.intake_miss_count ?? 0);
    const v2NonIntakeTrenchCount = Number(teleopV2TrenchRaw ?? '0');
    const v2NonIntakeBumpCount = Number(teleopV2BumpRaw ?? '0');
    const v2IntakeTrenchCount = Number(intakeTeleopV2TrenchRaw ?? '0');
    const v2IntakeBumpCount = Number(intakeTeleopV2BumpRaw ?? '0');
    const storedEndgameStatus = localStorage.getItem('endgame_climb_status') ?? 'None';
    const endgameResult =
      storedEndgameStatus === 'Success'
        ? 'Successful'
        : storedEndgameStatus === 'Failed'
          ? 'Failed'
          : 'Not Attempted';
    const endgameLevel = localStorage.getItem('endgame_climb_level') ?? '';
    const storedClimbType = localStorage.getItem('endgame_climb_type') ?? '';
    const endgameTowerPosition =
      storedClimbType === 'Center'
        ? 'Center of Tower'
        : storedClimbType === 'Side'
          ? 'Side of Tower'
          : '';
    const reviewText = selectedReview ?? '';
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
      auto_top_left_count: Number(localStorage.getItem('auto_top_left_count') ?? '0'),
      auto_middle_left_count: Number(localStorage.getItem('auto_middle_left_count') ?? '0'),
      auto_bottom_left_count: Number(localStorage.getItem('auto_bottom_left_count') ?? '0'),
      auto_top_right_count: Number(localStorage.getItem('auto_top_right_count') ?? '0'),
      auto_middle_right_count: Number(localStorage.getItem('auto_middle_right_count') ?? '0'),
      auto_bottom_right_count: Number(localStorage.getItem('auto_bottom_right_count') ?? '0'),
      hub_on: (localStorage.getItem('teleop_checked') ?? localStorage.getItem('teleopv2_checked') ?? 'false') === 'true',
      pass_or_score: passOrScoreHistory.length > 0 ? passOrScoreHistory.join(' | ') : (localStorage.getItem('teleop_pass_or_score') ?? 'Score'),
      trench_count: Number(teleopTrenchRaw ?? '0') + v2NonIntakeTrenchCount + v2IntakeTrenchCount,
      bump_count: Number(teleopBumpRaw ?? '0') + v2NonIntakeBumpCount + v2IntakeBumpCount,
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
      v2_pass_neutral_zone: v2PassNeutralZone,
      v2_pass_other_alliance_zone: v2PassOtherAllianceZone,
      v2_hoard: v2Hoard,
      v2_score: v2Score,
      v2_miss_count: v2MissCount,
      v2_intake_pass_neutral_zone: v2IntakePassNeutralZone,
      v2_intake_pass_other_alliance_zone: v2IntakePassOtherAllianceZone,
      v2_intake_hoard: v2IntakeHoard,
      v2_intake_score: v2IntakeScore,
      v2_intake_miss_count: v2IntakeMissCount,
      teleopv2_trench_count: v2NonIntakeTrenchCount,
      intake_teleopv2_trench_count: v2IntakeTrenchCount,
      teleopv2_bump_count: v2NonIntakeBumpCount,
      intake_teleopv2_bump_count: v2IntakeBumpCount,
      teleopv2_miss_count: v2MissCount,
      intake_teleopv2_miss_count: v2IntakeMissCount,
      // Backward compatibility for existing Supabase columns.
      intaking_pass_neutral_zone: v2IntakePassNeutralZone,
      intaking_pass_other_alliance_zone: v2IntakePassOtherAllianceZone,
      intaking_hoard: v2IntakeHoard,
      intaking_score: v2IntakeScore,
      climb: localStorage.getItem('endgame_climb') ?? 'None',
      endgame_result: endgameResult,
      endgame_level: endgameLevel,
      endgame_tower_position: endgameTowerPosition,
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

      resetScoutingData();
      setSelectedReview(null);
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
        <button className="badAutoBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReview === 'Bad Auto' ? 0.6 : 1 }} onClick={() => toggleReview('Bad Auto')}>Bad Auto</button>
        <button className="goodTeleopBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReview === 'Good Teleop' ? 0.6 : 1 }} onClick={() => toggleReview('Good Teleop')}>Good Teleop</button>
          <button className="badTeleopBtn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', opacity: selectedReview === 'Bad Teleop' ? 0.6 : 1 }} onClick={() => toggleReview('Bad Teleop')}>Bad Teleop</button>
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
