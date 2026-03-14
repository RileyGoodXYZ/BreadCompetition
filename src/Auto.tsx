import './Auto.css'
import image from './assets/rebuiltField.png';
import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto, isAutoDisabledSession, isPracticeSession, isTeleopV2Session } from './autoAccess';

const AUTO_CLIMB_SELECTION_KEY = 'auto_climb_selection';
const AUTO_PASS_COUNT_KEY = 'auto_pass_count';
const AUTO_SCORE_COUNT_KEY = 'auto_score_count';
const AUTO_PASS_SECONDS_KEY = 'auto_pass_seconds';
const AUTO_SCORE_SECONDS_KEY = 'auto_score_seconds';
const AUTO_HUMAN_PLAYER_COUNT_KEY = 'auto_human_player_count';
const AUTO_DEPOT_COUNT_KEY = 'auto_depot_count';
const AUTO_TOP_LEFT_COUNT_KEY = 'auto_top_left_count';
const AUTO_MIDDLE_LEFT_COUNT_KEY = 'auto_middle_left_count';
const AUTO_BOTTOM_LEFT_COUNT_KEY = 'auto_bottom_left_count';
const AUTO_TOP_RIGHT_COUNT_KEY = 'auto_top_right_count';
const AUTO_MIDDLE_RIGHT_COUNT_KEY = 'auto_middle_right_count';
const AUTO_BOTTOM_RIGHT_COUNT_KEY = 'auto_bottom_right_count';
const AUTO_BUTTON_TIMES_KEY = 'auto_button_times';
const AUTO_BUTTON_ORDER_KEY = 'auto_button_order';
const AUTO_COUNT_KEYS = [
  AUTO_HUMAN_PLAYER_COUNT_KEY,
  AUTO_DEPOT_COUNT_KEY,
  AUTO_TOP_LEFT_COUNT_KEY,
  AUTO_MIDDLE_LEFT_COUNT_KEY,
  AUTO_BOTTOM_LEFT_COUNT_KEY,
  AUTO_TOP_RIGHT_COUNT_KEY,
  AUTO_MIDDLE_RIGHT_COUNT_KEY,
  AUTO_BOTTOM_RIGHT_COUNT_KEY,
];
const CLIMB_LEFT = 'left';
const CLIMB_MIDDLE = 'middle';
const CLIMB_RIGHT = 'right';

const parseAutoButtonTimes = (raw: string | null): Record<string, number> => {
  const counts: Record<string, number> = {};
  AUTO_COUNT_KEYS.forEach((key) => {
    counts[key] = 0;
  });
  if (!raw) return counts;
  raw.split('\n').forEach((line) => {
    const [key, value] = line.split('\t');
    if (!key || !(key in counts)) return;
    const parsed = Number(value);
    counts[key] = Number.isFinite(parsed) ? parsed : 0;
  });
  return counts;
};

const parseAutoButtonOrder = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
};

const deriveOrderFromAutoButtonTimes = (raw: string | null): string[] => {
  if (!raw) return [];
  const ordered: string[] = [];
  raw.split('\n').forEach((line) => {
    const [key] = line.split('\t');
    if (!key || !AUTO_COUNT_KEYS.includes(key)) return;
    if (!ordered.includes(key)) {
      ordered.push(key);
    }
  });
  return ordered;
};

const getOrderedAutoKeys = (fallbackRaw?: string | null): string[] => {
  const storedOrder = parseAutoButtonOrder(localStorage.getItem(AUTO_BUTTON_ORDER_KEY));
  const baseOrder =
    storedOrder.length > 0
      ? storedOrder
      : deriveOrderFromAutoButtonTimes(
          fallbackRaw ?? localStorage.getItem(AUTO_BUTTON_TIMES_KEY),
        );
  const seen = new Set<string>();
  const ordered: string[] = [];
  baseOrder.forEach((key) => {
    if (!AUTO_COUNT_KEYS.includes(key) || seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
  });
  AUTO_COUNT_KEYS.forEach((key) => {
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
  });
  return ordered;
};

const recordAutoButtonOrder = (key: string, prevCount: number) => {
  if (prevCount > 0) return;
  const currentOrder = parseAutoButtonOrder(localStorage.getItem(AUTO_BUTTON_ORDER_KEY));
  if (currentOrder.includes(key)) return;
  currentOrder.push(key);
  localStorage.setItem(AUTO_BUTTON_ORDER_KEY, JSON.stringify(currentOrder));
};

const formatAutoButtonTimes = (counts: Record<string, number>, order: string[]): string =>
  order.map((key) => `${key}\t${counts[key] ?? 0}`).join('\n');

const readLegacyAutoCounts = (): Record<string, number> => ({
  [AUTO_HUMAN_PLAYER_COUNT_KEY]: Number(localStorage.getItem(AUTO_HUMAN_PLAYER_COUNT_KEY) ?? '0'),
  [AUTO_DEPOT_COUNT_KEY]: Number(localStorage.getItem(AUTO_DEPOT_COUNT_KEY) ?? '0'),
  [AUTO_TOP_LEFT_COUNT_KEY]: Number(localStorage.getItem(AUTO_TOP_LEFT_COUNT_KEY) ?? '0'),
  [AUTO_MIDDLE_LEFT_COUNT_KEY]: Number(localStorage.getItem(AUTO_MIDDLE_LEFT_COUNT_KEY) ?? '0'),
  [AUTO_BOTTOM_LEFT_COUNT_KEY]: Number(localStorage.getItem(AUTO_BOTTOM_LEFT_COUNT_KEY) ?? '0'),
  [AUTO_TOP_RIGHT_COUNT_KEY]: Number(localStorage.getItem(AUTO_TOP_RIGHT_COUNT_KEY) ?? '0'),
  [AUTO_MIDDLE_RIGHT_COUNT_KEY]: Number(localStorage.getItem(AUTO_MIDDLE_RIGHT_COUNT_KEY) ?? '0'),
  [AUTO_BOTTOM_RIGHT_COUNT_KEY]: Number(localStorage.getItem(AUTO_BOTTOM_RIGHT_COUNT_KEY) ?? '0'),
});

function Auto() {
  const [passCount, setPassCount] = useState<number>(Number(localStorage.getItem(AUTO_PASS_COUNT_KEY) ?? '0'));
  const [scoreCount, setScoreCount] = useState<number>(Number(localStorage.getItem(AUTO_SCORE_COUNT_KEY) ?? '0'));
  const [climbSelection, setClimbSelection] = useState<string | null>(localStorage.getItem(AUTO_CLIMB_SELECTION_KEY));
  const navigate = useNavigate();
  const [passSeconds, setPassSeconds] = useState<number>(Number(localStorage.getItem(AUTO_PASS_SECONDS_KEY) ?? '0'));
  const [scoreSeconds, setScoreSeconds] = useState<number>(Number(localStorage.getItem(AUTO_SCORE_SECONDS_KEY) ?? '0'));
  const initialCounts = useMemo(
    () => parseAutoButtonTimes(localStorage.getItem(AUTO_BUTTON_TIMES_KEY)),
    [],
  );
  
  useEffect(() => {
    if (
      window.location.hostname !== 'localhost' &&
      localStorage.getItem('profile_is_signed_in') !== 'true' &&
      !isPracticeSession()
    ) {
      navigate('/profile');
    }
  }, [navigate]);
  const [humanPlayerCount, setHumanPlayerCount] = useState<number>(initialCounts[AUTO_HUMAN_PLAYER_COUNT_KEY] ?? 0);
  const [depotCount, setDepotCount] = useState<number>(initialCounts[AUTO_DEPOT_COUNT_KEY] ?? 0);
  const [topLeftCount, setTopLeftCount] = useState<number>(initialCounts[AUTO_TOP_LEFT_COUNT_KEY] ?? 0);
  const [middleLeftCount, setMiddleLeftCount] = useState<number>(initialCounts[AUTO_MIDDLE_LEFT_COUNT_KEY] ?? 0);
  const [bottomLeftCount, setBottomLeftCount] = useState<number>(initialCounts[AUTO_BOTTOM_LEFT_COUNT_KEY] ?? 0);
  const [topRightCount, setTopRightCount] = useState<number>(initialCounts[AUTO_TOP_RIGHT_COUNT_KEY] ?? 0);
  const [middleRightCount, setMiddleRightCount] = useState<number>(initialCounts[AUTO_MIDDLE_RIGHT_COUNT_KEY] ?? 0);
  const [bottomRightCount, setBottomRightCount] = useState<number>(initialCounts[AUTO_BOTTOM_RIGHT_COUNT_KEY] ?? 0);
  const [isPassActive, setIsPassActive] = useState<boolean>(false);
  const [isScoreActive, setIsScoreActive] = useState<boolean>(false);

  useEffect(() => {
    if (isAutoDisabledSession() || !currentScoutCanUseAuto()) {
      navigate('/teleopv2', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const raw = localStorage.getItem(AUTO_BUTTON_TIMES_KEY);
    if (!raw || raw.trim().length === 0) {
      const legacyCounts = readLegacyAutoCounts();
      const hasLegacy = Object.values(legacyCounts).some((value) => value > 0);
      const nextCounts = hasLegacy ? legacyCounts : initialCounts;
      const orderedKeys = getOrderedAutoKeys(raw);
      localStorage.setItem(AUTO_BUTTON_TIMES_KEY, formatAutoButtonTimes(nextCounts, orderedKeys));
      if (hasLegacy) {
        setHumanPlayerCount(legacyCounts[AUTO_HUMAN_PLAYER_COUNT_KEY] ?? 0);
        setDepotCount(legacyCounts[AUTO_DEPOT_COUNT_KEY] ?? 0);
        setTopLeftCount(legacyCounts[AUTO_TOP_LEFT_COUNT_KEY] ?? 0);
        setMiddleLeftCount(legacyCounts[AUTO_MIDDLE_LEFT_COUNT_KEY] ?? 0);
        setBottomLeftCount(legacyCounts[AUTO_BOTTOM_LEFT_COUNT_KEY] ?? 0);
        setTopRightCount(legacyCounts[AUTO_TOP_RIGHT_COUNT_KEY] ?? 0);
        setMiddleRightCount(legacyCounts[AUTO_MIDDLE_RIGHT_COUNT_KEY] ?? 0);
        setBottomRightCount(legacyCounts[AUTO_BOTTOM_RIGHT_COUNT_KEY] ?? 0);
        AUTO_COUNT_KEYS.forEach((key) => localStorage.removeItem(key));
      }
    }
  }, [initialCounts]);

  const writeAutoButtonTimes = (overrides: Partial<Record<string, number>>) => {
    const counts: Record<string, number> = {
      [AUTO_HUMAN_PLAYER_COUNT_KEY]: overrides[AUTO_HUMAN_PLAYER_COUNT_KEY] ?? humanPlayerCount,
      [AUTO_DEPOT_COUNT_KEY]: overrides[AUTO_DEPOT_COUNT_KEY] ?? depotCount,
      [AUTO_TOP_LEFT_COUNT_KEY]: overrides[AUTO_TOP_LEFT_COUNT_KEY] ?? topLeftCount,
      [AUTO_MIDDLE_LEFT_COUNT_KEY]: overrides[AUTO_MIDDLE_LEFT_COUNT_KEY] ?? middleLeftCount,
      [AUTO_BOTTOM_LEFT_COUNT_KEY]: overrides[AUTO_BOTTOM_LEFT_COUNT_KEY] ?? bottomLeftCount,
      [AUTO_TOP_RIGHT_COUNT_KEY]: overrides[AUTO_TOP_RIGHT_COUNT_KEY] ?? topRightCount,
      [AUTO_MIDDLE_RIGHT_COUNT_KEY]: overrides[AUTO_MIDDLE_RIGHT_COUNT_KEY] ?? middleRightCount,
      [AUTO_BOTTOM_RIGHT_COUNT_KEY]: overrides[AUTO_BOTTOM_RIGHT_COUNT_KEY] ?? bottomRightCount,
    };
    const orderedKeys = getOrderedAutoKeys();
    localStorage.setItem(AUTO_BUTTON_TIMES_KEY, formatAutoButtonTimes(counts, orderedKeys));
  };

  useEffect(() => {
    if (!isPassActive) return;
    const interval = setInterval(() => {
      setPassSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_PASS_SECONDS_KEY, String(next));
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isPassActive]);

  useEffect(() => {
    if (!isScoreActive) return;
    const interval = setInterval(() => {
      setScoreSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_SCORE_SECONDS_KEY, String(next));
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isScoreActive]);

  const handlePassClick = () => {
    if (!isPassActive) {
      setPassCount((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_PASS_COUNT_KEY, String(next));
        return next;
      });
    }
    setIsPassActive((prev) => !prev);
  };

  const handleScoreClick = () => {
    if (!isScoreActive) {
      setScoreCount((prev) => {
        const next = prev + 1;
        localStorage.setItem(AUTO_SCORE_COUNT_KEY, String(next));
        return next;
      });
    }
    setIsScoreActive((prev) => !prev);
  };

  const handleClimb = (position: string) => {
    setClimbSelection(position);
    localStorage.setItem(AUTO_CLIMB_SELECTION_KEY, position);
  };
  const handleHumanPlayer = () => {
    setHumanPlayerCount((prev) => {
      const next = prev + 1;
      recordAutoButtonOrder(AUTO_HUMAN_PLAYER_COUNT_KEY, prev);
      writeAutoButtonTimes({ [AUTO_HUMAN_PLAYER_COUNT_KEY]: next });
      return next;
    });
  };
  const handleDepot = () => {
    setDepotCount((prev) => {
      const next = prev + 1;
      recordAutoButtonOrder(AUTO_DEPOT_COUNT_KEY, prev);
      writeAutoButtonTimes({ [AUTO_DEPOT_COUNT_KEY]: next });
      return next;
    });
  };
  const incrementCount = (
    setter: Dispatch<SetStateAction<number>>,
    key: string,
  ) => {
    setter((prev) => {
      const next = prev + 1;
      recordAutoButtonOrder(key, prev);
      writeAutoButtonTimes({ [key]: next });
      return next;
    });
  };

    return (

      <div>
        <div className='ContainerTitle'>
          <h1 >Auto</h1>
        </div>

        <div className='ContainerTime'>
          <div>
          <button className='Pass' onClick ={handlePassClick} data-count={passCount}>
         {isPassActive ? `Stop (${passSeconds}s passed)` : 'Pass'}
         </button>
          </div>
      
         <div> 
          <button className='Score' onClick ={handleScoreClick} data-count={scoreCount}>
         {isScoreActive ? `Stop (${scoreSeconds}s passed)` : 'Score'}
         </button>
         </div>

        </div>
        <div className="mapContainer">
          <img src={image} alt="passMap" />

        <button className="topLeft" onClick={() => incrementCount(setTopLeftCount, AUTO_TOP_LEFT_COUNT_KEY)} data-count={topLeftCount}></button>
        <button className="middleLeft" onClick={() => incrementCount(setMiddleLeftCount, AUTO_MIDDLE_LEFT_COUNT_KEY)} data-count={middleLeftCount}></button>
        <button className="bottomLeft" onClick={() => incrementCount(setBottomLeftCount, AUTO_BOTTOM_LEFT_COUNT_KEY)} data-count={bottomLeftCount}></button>
        <button className="topRight" onClick={() => incrementCount(setTopRightCount, AUTO_TOP_RIGHT_COUNT_KEY)} data-count={topRightCount}></button>
        <button className="middleRight" onClick={() => incrementCount(setMiddleRightCount, AUTO_MIDDLE_RIGHT_COUNT_KEY)} data-count={middleRightCount}></button>
        <button className="bottomRight" onClick={() => incrementCount(setBottomRightCount, AUTO_BOTTOM_RIGHT_COUNT_KEY)} data-count={bottomRightCount}></button>
        <button className="humanPlayer" onClick={handleDepot} data-count={depotCount}></button>
        <button className="depot" onClick={handleHumanPlayer} data-count={humanPlayerCount}></button>
        </div>

        <p>Climb</p>
        <div className='climbContainer'>
          <div>
          <button
            className={`ClimbLeft ${climbSelection === "left" ? "selected" : ""}`}
            onClick={() => handleClimb(CLIMB_LEFT)}>
              Left
          </button>
          </div>
          
          <button
            className={`ClimbMiddle ${climbSelection === "middle" ? "selected" : ""}`}
            onClick={() => handleClimb(CLIMB_MIDDLE)}>
              Middle
          </button>

          <div>
          <button
            className={`ClimbRight ${climbSelection === "right" ? "selected" : ""}`}
            onClick={() => handleClimb(CLIMB_RIGHT)}>
              Right
          </button>
          </div>

        </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', width: '100%' }}>
          <button className="navBtns" style={{ flex: '1 1 auto', minWidth: '100px' }} onClick={() => navigate('/prematch')}>Back</button>
          <button
            className="navBtns"
            style={{ flex: '1 1 auto', minWidth: '100px' }}
            onClick={() => navigate(isTeleopV2Session() ? '/teleopv2' : '/endgame')}
          >
            Next
          </button>
        </div>
      </div>
    )
  }
  
  export default Auto
  
