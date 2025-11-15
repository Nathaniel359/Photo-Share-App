import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAdvancedStore = create(
  persist(
    (set) => ({
      advancedMode: false,
      setAdvancedMode: (value) => set({ advancedMode: value }),
    }),
    { name: "advancedMode" } 
  )
);

export default useAdvancedStore;