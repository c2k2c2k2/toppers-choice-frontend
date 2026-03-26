import {
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";

export function buildSessionPersistOptions<TState>(
  name: string,
  partialize: (state: TState) => Partial<TState>,
): PersistOptions<TState, Partial<TState>> {
  return {
    name: `toppers-choice.${name}`,
    storage: createJSONStorage(() => sessionStorage),
    partialize,
  };
}
