import '@onigam/lab-kit/styles.css';
import { mountLab } from '@onigam/lab-kit/ui';
import { lab } from './lab';
import { showEntryNotice } from './panels/entry';

const mounted = mountLab(lab, {
  app: document.getElementById('app')!,
  viewport: document.getElementById('viewport')!,
  expose: import.meta.env.DEV, // window.__lab = { stage, engine, store } for debugging and tests
});

// the warning on the way in (research Q5), once per browser: a safety notice is not left to the visitor's finding
if (mounted) showEntryNotice();
