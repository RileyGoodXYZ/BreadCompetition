const AUTO_ALLOWED_SCOUTS = new Set([
  'lenna yoon',
  'sonia bidlack',
  'kylie chan',
  'test scout',
]);

const normalizeScoutName = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeSessionType = (sessionType: string | null | undefined): string =>
  (sessionType ?? '').trim().toLowerCase();

export const canScoutUseAuto = (name: string | null | undefined): boolean =>
  AUTO_ALLOWED_SCOUTS.has(normalizeScoutName(name ?? ''));

export const isPracticeSession = (): boolean =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'practice';

export const isTestSession = (): boolean =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'test';

export const isAsyncSession = (): boolean =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'async';

export const isRescoutSession = (): boolean =>
  normalizeSessionType(localStorage.getItem('profile_session_type')) === 'rescout';

export const isTeleopV2Session = (): boolean =>
  isPracticeSession() || isTestSession() || isAsyncSession() || isRescoutSession();

export const isAutoDisabledSession = (): boolean =>
  isPracticeSession() || isRescoutSession() || isAsyncSession();

export const currentScoutCanUseAuto = (): boolean =>
  !isAutoDisabledSession() &&
  (isTestSession() || canScoutUseAuto(localStorage.getItem('profile_scout_name')));
