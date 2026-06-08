import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as api from "@/lib/api/picklists";

const PicklistsContext = createContext(null);

export function PicklistsProvider({ children }) {
  const [picklists, setPicklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const picklistsRef = useRef(picklists);
  picklistsRef.current = picklists;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listPicklists();
      setPicklists(list);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const sharedLists = useMemo(
    () => picklists.filter((p) => p.kind === "shared"),
    [picklists]
  );
  const myLists = useMemo(
    () => picklists.filter((p) => p.kind === "my"),
    [picklists]
  );

  const findPicklist = useCallback(
    (id) => picklists.find((p) => p.id === id) ?? null,
    [picklists]
  );
  const findKind = useCallback(
    (id) => findPicklist(id)?.kind ?? null,
    [findPicklist]
  );

  const loadPicklist = useCallback(async (id) => {
    const cached = picklistsRef.current.find((p) => p.id === id);
    if (cached) return cached;
    try {
      const record = await api.getPicklist(id);
      setPicklists((prev) =>
        prev.some((p) => p.id === record.id) ? prev : [record, ...prev]
      );
      return record;
    } catch {
      return null;
    }
  }, []);

  const patchPicklist = useCallback(async (id, patch) => {
    const before = picklistsRef.current.find((p) => p.id === id);
    if (!before) return null;
    setPicklists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
    try {
      const next = await api.updatePicklist(id, patch);
      setPicklists((prev) => prev.map((p) => (p.id === id ? next : p)));
      return next;
    } catch (e) {
      setPicklists((prev) => prev.map((p) => (p.id === id ? before : p)));
      throw e;
    }
  }, []);

  const toggleStar = useCallback(
    (id) => {
      const current = picklistsRef.current.find((p) => p.id === id);
      if (!current) return Promise.resolve(null);
      return patchPicklist(id, { starred: !current.starred }).catch((e) =>
        console.error("toggleStar failed", e)
      );
    },
    [patchPicklist]
  );

  const setArchived = useCallback(
    (id, archived) =>
      patchPicklist(id, { archived }).catch((e) =>
        console.error("setArchived failed", e)
      ),
    [patchPicklist]
  );

  const rename = useCallback(
    (id, title) =>
      patchPicklist(id, { title }).catch((e) =>
        console.error("rename failed", e)
      ),
    [patchPicklist]
  );

  const remove = useCallback(async (id) => {
    const before = picklistsRef.current;
    setPicklists((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.deletePicklist(id);
    } catch (e) {
      setPicklists(before);
      console.error("delete failed", e);
      throw e;
    }
  }, []);

  const createPicklist = useCallback(async ({ title, event, kind = "my" }) => {
    const record = await api.createPicklist({
      title,
      event_key: event || null,
      kind,
      data: {},
    });
    setPicklists((prev) => [record, ...prev]);
    return record.id;
  }, []);

  const saveData = useCallback(
    (id, data) =>
      patchPicklist(id, { data }).catch((e) =>
        console.error("saveData failed", e)
      ),
    [patchPicklist]
  );

  const setLocked = useCallback(
    (id, locked) => {
      const current = picklistsRef.current.find((p) => p.id === id);
      if (!current) return Promise.resolve(null);
      const nextData = { ...(current.data ?? {}), locked: !!locked };
      return patchPicklist(id, { data: nextData }).catch((e) =>
        console.error("setLocked failed", e)
      );
    },
    [patchPicklist]
  );

  const setKind = useCallback(
    (id, kind) =>
      patchPicklist(id, { kind }).catch((e) =>
        console.error("setKind failed", e)
      ),
    [patchPicklist]
  );

  const value = useMemo(
    () => ({
      picklists,
      sharedLists,
      myLists,
      loading,
      error,
      reload,
      findKind,
      findPicklist,
      loadPicklist,
      toggleStar,
      setArchived,
      rename,
      remove,
      createPicklist,
      saveData,
      setLocked,
      setKind,
    }),
    [
      picklists,
      sharedLists,
      myLists,
      loading,
      error,
      reload,
      findKind,
      findPicklist,
      loadPicklist,
      toggleStar,
      setArchived,
      rename,
      remove,
      createPicklist,
      saveData,
      setLocked,
      setKind,
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
