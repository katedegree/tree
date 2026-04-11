import { create } from "zustand";

interface DragState {
  activeId: string | null;
  targetId: string | null;
  ghostParentId: string | null;
  ghostInsertIndex: number | null;
  ghostKey: number; // ゴーストが移動するたびにインクリメント → 常に1つだけ存在を保証
  setDragState: (
    state: Partial<Omit<DragState, "setDragState" | "resetDragState">>,
  ) => void;
  resetDragState: () => void;
}

export const useDragStore = create<DragState>((set, get) => ({
  activeId: null,
  targetId: null,
  ghostParentId: null,
  ghostInsertIndex: null,
  ghostKey: 0,
  setDragState: (next) => {
    const prev = get();
    const ghostMoved =
      ("ghostParentId" in next && next.ghostParentId !== prev.ghostParentId) ||
      ("ghostInsertIndex" in next &&
        next.ghostInsertIndex !== prev.ghostInsertIndex);
    set({ ...next, ghostKey: ghostMoved ? prev.ghostKey + 1 : prev.ghostKey });
  },
  resetDragState: () =>
    set({
      activeId: null,
      targetId: null,
      ghostParentId: null,
      ghostInsertIndex: null,
    }),
}));
