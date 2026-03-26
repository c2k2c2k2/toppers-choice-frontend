import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSessionPersistOptions } from "@/stores/persist-options";

interface StudentShellSlice {
  isSidebarOpen: boolean;
  activeExamTrackCode: string | null;
  bottomNavVisible: boolean;
}

interface StudentShellActions {
  toggleSidebar: () => void;
  setActiveExamTrackCode: (examTrackCode: string | null) => void;
  setBottomNavVisible: (isVisible: boolean) => void;
  resetUiState: () => void;
}

export type StudentShellStore = StudentShellSlice & StudentShellActions;

const initialStudentShellState: StudentShellSlice = {
  isSidebarOpen: false,
  activeExamTrackCode: null,
  bottomNavVisible: true,
};

export const useStudentShellStore = create<StudentShellStore>()(
  persist(
    (set) => ({
      ...initialStudentShellState,
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),
      setActiveExamTrackCode: (examTrackCode) =>
        set({
          activeExamTrackCode: examTrackCode,
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
        bottomNavVisible: state.bottomNavVisible,
      }),
    ),
  ),
);
