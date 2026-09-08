/**
 * Profile domain store (single row) — hydrates from IProfileRepository.
 */
import { createProfileStore } from './createSingleRowStore';
import { getRepositories } from './registry';

export const useProfileStore = createProfileStore(() => getRepositories().profile);

export type ProfileStore = ReturnType<typeof createProfileStore>;
export default useProfileStore;