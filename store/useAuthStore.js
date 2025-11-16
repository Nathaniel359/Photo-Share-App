import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (userData) => set({ user: userData, isAuthenticated: !!userData }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "authUser" }
  )
);

export default useAuthStore;
