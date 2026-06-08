import { create } from 'zustand'

export const useLogStore = create((set) => ({
  todayLog: null,
  allLogs: [],
  setTodayLog: (log) => set({ todayLog: log }),
  updateTodayLog: (updates) => set((state) => ({
    todayLog: state.todayLog ? { ...state.todayLog, ...updates } : updates
  })),
  setAllLogs: (logs) => set({ allLogs: logs }),
}))
