/**
 * Settings domain store (single row) — hydrates from ISettingsRepository.
 */
import { createSettingsStore } from './createSingleRowStore';
import { getRepositories } from './registry';

export const useSettingsStore = createSettingsStore(() => getRepositories().settings);

export type SettingsStore = ReturnType<typeof createSettingsStore>;
export default useSettingsStore;