export function loadGoogleFont(fontFamily: string) {
  if (typeof window === 'undefined') return;

  // Extract font name (remove fallbacks)
  const fontName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');

  // Skip generic font families
  const genericFonts = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
  if (genericFonts.includes(fontName.toLowerCase())) return;

  // Skip common system fonts (NOT Google Fonts)
  const systemFonts = [
    'arial', 'helvetica', 'times new roman', 'courier new', 'georgia', 'verdana',
    'comic sans ms', 'trebuchet ms', 'impact', 'courier', 'helvetica neue',
    'segoe ui', '-apple-system', 'blinkmacsystemfont'
  ];
  if (systemFonts.includes(fontName.toLowerCase())) return;

  // Check if we already have a link for this font
  const linkId = `google-font-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(linkId)) return;

  // Create Google Fonts link
  // Request multiple common weights - Google Fonts will serve only what's available
  // Using display=swap to show fallback font while loading
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
