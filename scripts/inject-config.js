const fs = require('fs');
const path = require('path');

const apiBase = (process.env.BC_API_BASE || process.env.VITE_BC_API_BASE || '').trim();
const out = path.join(__dirname, '..', 'config.js');
const content = `/** Généré au build Vercel — BC_API_BASE */
window.BC_CONFIG = {
  apiBase: ${JSON.stringify(apiBase)},
};
`;
fs.writeFileSync(out, content, 'utf8');
console.log('[build] config.js — apiBase:', apiBase || '(même origine)');
