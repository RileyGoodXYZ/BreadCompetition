import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as api from "@/lib/api/strategies";
import { TIMELINE_COLUMNS as DEFAULT_COLUMNS } from "@/pages/match-strategy/data";

const MatchStrategyContext = createContext(null);

const SAVE_DEBOUNCE_MS = 500;

function defaultScenarios(ourAlliance, opponentAlliance) {
  const stamp = Date.now();
  return [
    {
      id: `win-auto-${stamp}`,
      title: "Win Auto",
      tone: "ours",
      teams: ourAlliance,
      cells: {},
    },
    {
      id: `lose-auto-${stamp + 1}`,
      title: "Lose Auto",
      tone: "ours",
      teams: ourAlliance,
      cells: {},
    },
    {
      id: `opponent-${stamp + 2}`,
      title: "Opponent Strategy",
      tone: "opponent",
      teams: opponentAlliance,
      cells: {},
    },
  ];
}

export function MatchStrategyProvider({ children }) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const strategiesRef = useRef(strategies);
  strategiesRef.current = strategies;

  const pendingTimers = useRef(new Map());
  const pendingData = useRef(new Map());

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listStrategies();
      setStrategies(list);
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

  useEffect(
    () => () => {
      for (const t of pendingTimers.current.values()) clearTimeout(t);
      pendingTimers.current.clear();
      pendingData.current.clear();
    },
    []
  );

  const findStrategy = useCallback(
    (id) => strategies.find((s) => s.id === id) ?? null,
    [strategies]
  );

  const loadStrategy = useCallback(async (id) => {
    const cached = strategiesRef.current.find((s) => s.id === id);
    if (cached) return cached;
    try {
      const record = await api.getStrategy(id);
      setStrategies((prev) =>
        prev.some((s) => s.id === record.id) ? prev : [record, ...prev]
      );
      return record;
    } catch {
      return null;
    }
  }, []);

  const flushSave = useCallback(async (id) => {
    const data = pendingData.current.get(id);
    pendingData.current.delete(id);
    pendingTimers.current.delete(id);
    if (data === undefined) return;
    try {
      const record = await api.updateStrategy(id, { data });
      setStrategies((prev) => prev.map((s) => (s.id === id ? record : s)));
    } catch (e) {
      console.error("strategy save failed", id, e);
    }
  }, []);

  const queueSave = useCallback(
    (id, data) => {
      pendingData.current.set(id, data);
      const existing = pendingTimers.current.get(id);
      if (existing) clearTimeout(existing);
      pendingTimers.current.set(
        id,
        setTimeout(() => flushSave(id), SAVE_DEBOUNCE_MS)
      );
    },
    [flushSave]
  );

  const updateData = useCallback(
    (id, updater) => {
      setStrategies((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const nextData = updater(s.data ?? {});
          queueSave(id, nextData);
          return { ...s, data: nextData };
        })
      );
    },
    [queueSave]
  );

  const patchStrategy = useCallback(async (id, patch) => {
    const before = strategiesRef.current.find((s) => s.id === id);
    if (!before) return null;
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
    try {
      const next = await api.updateStrategy(id, patch);
      setStrategies((prev) => prev.map((s) => (s.id === id ? next : s)));
      return next;
    } catch (e) {
      setStrategies((prev) => prev.map((s) => (s.id === id ? before : s)));
      throw e;
    }
  }, []);

  const createStrategy = useCallback(
    async ({ title, event, matchNumber, ourAlliance, opponentAlliance }) => {
      const record = await api.createStrategy({
        title,
        event_key: event || null,
        match_number: matchNumber ?? null,
        favored: "even",
        data: {
          ourAlliance,
          opponentAlliance,
          scenarios: defaultScenarios(ourAlliance, opponentAlliance),
          columns: DEFAULT_COLUMNS.slice(),
        },
      });
      setStrategies((prev) => [record, ...prev]);
      return record.id;
    },
    []
  );

  const remove = useCallback(async (id) => {
    const before = strategiesRef.current;
    setStrategies((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.deleteStrategy(id);
    } catch (e) {
      setStrategies(before);
      console.error("strategy delete failed", e);
      throw e;
    }
  }, []);

  const setCell = useCallback(
    (strategyId, scenarioId, teamNum, columnId, value) => {
      updateData(strategyId, (data) => ({
        ...data,
        scenarios: (data.scenarios ?? []).map((sc) =>
          sc.id !== scenarioId
            ? sc
            : {
                ...sc,
                cells: {
                  ...sc.cells,
                  [teamNum]: {
                    ...(sc.cells?.[teamNum] ?? {}),
                    [columnId]: value,
                  },
                },
              }
        ),
      }));
    },
    [updateData]
  );

  const addScenario = useCallback(
    (strategyId, { title, tone = "ours" }) => {
      updateData(strategyId, (data) => {
        const teams =
          tone === "opponent"
            ? data.opponentAlliance ?? []
            : data.ourAlliance ?? [];
        return {
          ...data,
          scenarios: [
            ...(data.scenarios ?? []),
            {
              id: `sc-${Date.now()}`,
              title,
              tone,
              teams,
              cells: {},
            },
          ],
        };
      });
    },
    [updateData]
  );

  const removeScenario = useCallback(
    (strategyId, scenarioId) => {
      updateData(strategyId, (data) => ({
        ...data,
        scenarios: (data.scenarios ?? []).filter((sc) => sc.id !== scenarioId),
      }));
    },
    [updateData]
  );

  const addColumn = useCallback(
    (strategyId, label) => {
      updateData(strategyId, (data) => ({
        ...data,
        columns: [
          ...(data.columns ?? []),
          { id: `col-${Date.now()}`, label, custom: true },
        ],
      }));
    },
    [updateData]
  );

  const removeColumn = useCallback(
    (strategyId, columnId) => {
      updateData(strategyId, (data) => ({
        ...data,
        columns: (data.columns ?? []).filter((c) => c.id !== columnId),
      }));
    },
    [updateData]
  );

  const value = useMemo(
    () => ({
      strategies,
      loading,
      error,
      reload,
      findStrategy,
      loadStrategy,
      createStrategy,
      remove,
      patchStrategy,
      setCell,
      addScenario,
      removeScenario,
      addColumn,
      removeColumn,
    }),
    [
      strategies,
      loading,
      error,
      reload,
      findStrategy,
      loadStrategy,
      createStrategy,
      remove,
      patchStrategy,
      setCell,
      addScenario,
      removeScenario,
      addColumn,
      removeColumn,
    ]
  );

  return (
    <MatchStrategyContext.Provider value={value}>
      {children}
    </MatchStrategyContext.Provider>
  );
}

export function useMatchStrategy() {
  const ctx = useContext(MatchStrategyContext);
  if (!ctx) {
    throw new Error(
      "useMatchStrategy must be used inside <MatchStrategyProvider>"
    );
  }
  return ctx;
}
