const AUTO_ALLOWED_SCOUTS = new Set([
  'lenna yoon',
  'sonia bidlack',
  'kylie chan',
  'test scout',
]);

const normalizeScoutName = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeSessionType = (sessionType) =>
  (sessionType ?? '').trim().toLowerCase();

export const canScoutUseAuto = (name) =>
  AUTO_ALLOWED_SCOUTS.has(normalizeScoutName(name ?? ''));

export const isPracticeSession = () =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'practice';

export const isTestSession = () =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'test';

export const isAsyncSession = () =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'async';

export const isRescoutSession = () =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'rescout';

export const isTeleopV2Session = () =>
  isPracticeSession() || isTestSession() || isAsyncSession() || isRescoutSession();

export const isAutoDisabledSession = () =>
  isPracticeSession() || isRescoutSession() || isAsyncSession();

export const currentScoutCanUseAuto = () =>
  !isAutoDisabledSession() &&
  (isTestSession() || canScoutUseAuto(localStorage.getItem('profile_scout_name')));
