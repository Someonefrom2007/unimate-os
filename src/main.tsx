import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { createIndexedDbRepositories } from '@/core/repositories/indexeddb';
import { seedIfEmpty } from '@/core/repositories/indexeddb/seeder';
import { setRepositories, hydrateAllStores } from '@/core/store';
import './index.css';

/**
 * Local-first bootstrap: open IndexedDB, register the repository set, seed
 * demo data on first run, then hydrate every domain store BEFORE the first
 * React render. The UI therefore consumes stores only — never the database
 * directly.
 */
async function bootstrap() {
  const repositories = await createIndexedDbRepositories();
  setRepositories(repositories);

  // Seed realistic demo data the first time the app is opened.
  await seedIfEmpty(repositories);

  await hydrateAllStores();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
