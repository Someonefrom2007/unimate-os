/**
 * Store registry — holds repository injection + module-level store singletons.
 * Stores talk ONLY to repositories; UI never touches IndexedDB directly.
 */
import type { RepositorySet } from '../repositories/interfaces';

let repositories: RepositorySet | null = null;

/** Registers the repository set (call once at bootstrap with your provider). */
export function setRepositories(repos: RepositorySet): void {
  repositories = repos;
}

/** Returns the registered repository set. */
export function getRepositories(): RepositorySet {
  if (!repositories) {
    throw new Error(
      'Store registry not initialized. Call setRepositories(...) before using stores.',
    );
  }
  return repositories;
}

export function hasRepositories(): boolean {
  return repositories !== null;
}