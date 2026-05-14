/**
 * Developer-only debug flag. Enable in DevTools console:
 *   localStorage.setItem('pokerank-debug', '1')
 * or visit any URL with ?debug=1.
 */
export const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem('pokerank-debug') === '1') return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  } catch {
    return false;
  }
};
