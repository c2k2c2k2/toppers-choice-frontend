import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSessionPersistOptions } from "@/stores/persist-options";

interface NoteReaderSlice {
  focusMode: boolean;
  lastOpenedNoteId: string | null;
  preferredZoom: number;
}

interface NoteReaderActions {
  setFocusMode: (isEnabled: boolean) => void;
  setLastOpenedNoteId: (noteId: string | null) => void;
  setPreferredZoom: (zoom: number) => void;
  resetReaderUi: () => void;
  toggleFocusMode: () => void;
}

export type NoteReaderStore = NoteReaderSlice & NoteReaderActions;

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.4;

const initialNoteReaderState: NoteReaderSlice = {
  focusMode: false,
  lastOpenedNoteId: null,
  preferredZoom: 1,
};

function clampZoom(value: number) {
  if (!Number.isFinite(value)) {
    return initialNoteReaderState.preferredZoom;
  }

  return Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);
}

export const useNoteReaderStore = create<NoteReaderStore>()(
  persist(
    (set) => ({
      ...initialNoteReaderState,
      setFocusMode: (isEnabled) =>
        set({
          focusMode: isEnabled,
        }),
      setLastOpenedNoteId: (noteId) =>
        set({
          lastOpenedNoteId: noteId,
        }),
      setPreferredZoom: (zoom) =>
        set({
          preferredZoom: clampZoom(zoom),
        }),
      resetReaderUi: () => set(initialNoteReaderState),
      toggleFocusMode: () =>
        set((state) => ({
          focusMode: !state.focusMode,
        })),
    }),
    buildSessionPersistOptions<NoteReaderStore>(
      "note-reader",
      (state) => ({
        focusMode: state.focusMode,
        lastOpenedNoteId: state.lastOpenedNoteId,
        preferredZoom: state.preferredZoom,
      }),
    ),
  ),
);
