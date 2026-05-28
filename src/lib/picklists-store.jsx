import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SHARED_PICKLISTS, MY_PICKLISTS } from "@/pages/picklist/data";

/**
 * Single source of truth for the user's picklists across the Library and
 * Manager routes.
 *
 *  Items carry optional `starred` and `archived` flags. We keep two
 *  arrays (shared / my) because they're rendered in different sections,
 *  but expose a `kindOf(id)` helper so consumers don't have to plumb the
 *  "kind" around themselves.
 */

const PicklistsContext = createContext(null);

export function PicklistsProvider({ children }) {
  const [sharedLists, setSharedLists] = useState(SHARED_PICKLISTS);
  const [myLists, setMyLists] = useState(MY_PICKLISTS);

  const findKind = useCallback(
    (id) => {
      if (sharedLists.some((p) => p.id === id)) return "shared";
      if (myLists.some((p) => p.id === id)) return "my";
      return null;
    },
    [sharedLists, myLists]
  );

  const findPicklist = useCallback(
    (id) =>
      sharedLists.find((p) => p.id === id) ??
      myLists.find((p) => p.id === id) ??
      null,
    [sharedLists, myLists]
  );

  const setterFor = useCallback(
    (kind) => (kind === "shared" ? setSharedLists : setMyLists),
    []
  );

  const toggleStar = useCallback(
    (id, kind = null) => {
      const k = kind ?? findKind(id);
      if (!k) return;
      setterFor(k)((list) =>
        list.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
      );
    },
    [findKind, setterFor]
  );

  const setArchived = useCallback(
    (id, archived, kind = null) => {
      const k = kind ?? findKind(id);
      if (!k) return;
      setterFor(k)((list) =>
        list.map((p) => (p.id === id ? { ...p, archived } : p))
      );
    },
    [findKind, setterFor]
  );

  const rename = useCallback(
    (id, title, kind = null) => {
      const k = kind ?? findKind(id);
      if (!k) return;
      setterFor(k)((list) =>
        list.map((p) => (p.id === id ? { ...p, title } : p))
      );
    },
    [findKind, setterFor]
  );

  const remove = useCallback(
    (id, kind = null) => {
      const k = kind ?? findKind(id);
      if (!k) return;
      setterFor(k)((list) => list.filter((p) => p.id !== id));
    },
    [findKind, setterFor]
  );

  const createPicklist = useCallback(({ title, event }) => {
    const id = `p-${Date.now()}`;
    const picklist = {
      id,
      title,
      event,
      teamCount: 0,
      updatedLabel: "Just now",
    };
    setMyLists((prev) => [picklist, ...prev]);
    return id;
  }, []);

  const value = useMemo(
    () => ({
      sharedLists,
      myLists,
      findKind,
      findPicklist,
      toggleStar,
      setArchived,
      rename,
      remove,
      createPicklist,
    }),
    [
      sharedLists,
      myLists,
      findKind,
      findPicklist,
      toggleStar,
      setArchived,
      rename,
      remove,
      createPicklist,
    ]
  );

  return (
    <PicklistsContext.Provider value={value}>
      {children}
    </PicklistsContext.Provider>
  );
}

export function usePicklists() {
  const ctx = useContext(PicklistsContext);
  if (!ctx) {
    throw new Error("usePicklists must be used inside <PicklistsProvider>");
  }
  return ctx;
}
