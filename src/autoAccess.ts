const AUTO_ALLOWED_SCOUTS = new Set([
  'lenna yoon',
  'sonia bidlack',
  'kylie chan',
]);

const normalizeScoutName = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, ' ');

export const canScoutUseAuto = (name: string | null | undefined): boolean =>
  AUTO_ALLOWED_SCOUTS.has(normalizeScoutName(name ?? ''));

export const currentScoutCanUseAuto = (): boolean =>
  canScoutUseAuto(localStorage.getItem('profile_scout_name'));
