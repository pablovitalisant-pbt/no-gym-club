export type Theme = 'light' | 'dark' | 'system';

export const THEME_KEY = 'ngc-theme';

export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

export function readTheme(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const resolved = resolveTheme(theme, prefersDark);
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    resolved === 'dark' ? '#0a0a0a' : '#f7f7f5',
  );
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage bloqueado (modo privado): el tema igual se aplica
  }
}

// ponytail: script inline antes del paint; duplica resolveTheme a propósito para no depender del bundle
export const THEME_INIT_SCRIPT = `(function(){var t='dark';try{var s=window.localStorage.getItem('ngc-theme');if(s==='light'||s==='dark'||s==='system')t=s;}catch(e){}var d=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=d?'dark':'light';var el=document.documentElement;el.setAttribute('data-theme',r);el.style.colorScheme=r;try{var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}if(m.removeAttribute)m.removeAttribute('media');m.setAttribute('content',d?'#0a0a0a':'#f7f7f5');}catch(e){}})();`;
