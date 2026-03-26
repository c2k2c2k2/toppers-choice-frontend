import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSessionPersistOptions } from "@/stores/persist-options";

interface StudentShellSlice {
  isSidebarOpen: boolean;
  activeExamTrackCode: string | null;
  activeMediumCode: string | null;
  lastCatalogSubjectSlug: string | null;
  bottomNavVisible: boolean;
}

interface StudentShellActions {
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveExamTrackCode: (examTrackCode: string | null) => void;
  setActiveMediumCode: (mediumCode: string | null) => void;
  setLastCatalogSubjectSlug: (subjectSlug: string | null) => void;
  setBottomNavVisible: (isVisible: boolean) => void;
  resetUiState: () => void;
}

export type StudentShellStore = StudentShellSlice & StudentShellActions;

const initialStudentShellState: StudentShellSlice = {
  isSidebarOpen: false,
  activeExamTrackCode: null,
  activeMediumCode: null,
  lastCatalogSubjectSlug: null,
  bottomNavVisible: true,
};

export const useStudentShellStore = create<StudentShellStore>()(
  persist(
    (set) => ({
      ...initialStudentShellState,
      closeSidebar: () =>
        set({
          isSidebarOpen: false,
        }),
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),
      setActiveExamTrackCode: (examTrackCode) =>
        set({
          activeExamTrackCode: examTrackCode,
        }),
      setActiveMediumCode: (mediumCode) =>
        set({
          activeMediumCode: mediumCode,
        }),
      setLastCatalogSubjectSlug: (subjectSlug) =>
        set({
          lastCatalogSubjectSlug: subjectSlug,
        }),
      setBottomNavVisible: (isVisible) =>
        set({
          bottomNavVisible: isVisible,
        }),
      resetUiState: () => set(initialStudentShellState),
    }),
    buildSessionPersistOptions<StudentShellStore>(
      "student-shell",
      (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        activeExamTrackCode: state.activeExamTrackCode,
        activeMediumCode: state.activeMediumCode,
        lastCatalogSubjectSlug: state.lastCatalogSubjectSlug,
        bottomNavVisible: state.bottomNavVisible,
      }),
    ),
  ),
);
