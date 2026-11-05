// Inter appears only in this comment, and "FOURTH WATCH" too: ctx.fillText('FOURTH WATCH') here draws nothing
const SERIF = '"Cinzel"', ITAL = '"Cormorant Garamond"';
const PARCH = '#F2E6CF', GOLD = '#E3B25C';
function wordmark(ctx, fs) {
  const track = 0.14 * fs;
  ctx.font = `600 ${fs}px "Cinzel"`; ctx.fillStyle = PARCH;
  spacedText(ctx, 'FOURTH WATCH', 540, 1400, track);
}
function wordmarkPx(ctx) { ctx.font = '600 100px "Cinzel"'; ctx.letterSpacing = '14px'; ctx.fillStyle = '#F2E6CF'; ctx.fillText('FOURTH WATCH', 540, 500); }
function title(ctx) { ctx.font = `700 80px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText('WHY', 540, 300); }
function verse(ctx) { ctx.font = `600 italic 50px ${ITAL}`; ctx.fillStyle = 'rgba(242,230,207,0.9)'; ctx.fillText('He came to them', 540, 700); }
