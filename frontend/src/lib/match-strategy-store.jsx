import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  STRATEGIES,
  TIMELINE_COLUMNS as DEFAULT_COLUMNS,
} from "@/pages/match-strategy/data";

const MatchStrategyContext = createContext(null);

function defaultScenarios(ourAlliance, opponentAlliance) {
  return [
    {
      id: `win-auto-${Date.now()}`,
      title: "Win Auto",
      tone: "ours",
      teams: ourAlliance,
      cells: {},
    },
    {
      id: `lose-auto-${Date.now() + 1}`,
      title: "Lose Auto",
      tone: "ours",
      teams: ourAlliance,
      cells: {},
    },
    {
      id: `opponent-${Date.now() + 2}`,
      title: "Opponent Strategy",
      tone: "opponent",
      teams: opponentAlliance,
      cells: {},
    },
  ];
}

export function MatchStrategyProvider({ children }) {
  const [strategies, setStrategies] = useState(() =>
    STRATEGIES.map((s) => ({ ...s, columns: DEFAULT_COLUMNS.slice() }))
  );

  const findStrategy = useCallback(
    (id) => strategies.find((s) => s.id === id) ?? null,
    [strategies]
  );

  const createStrategy = useCallback(
    ({ title, event, ourAlliance, opponentAlliance }) => {
      const id = `s-${Date.now()}`;
      const newStrategy = {
        id,
        title,
        event,
        updatedLabel: "Just now",
        favored: "even",
        ourAlliance,
        opponentAlliance,
        scenarios: defaultScenarios(ourAlliance, opponentAlliance),
        columns: DEFAULT_COLUMNS.slice(),
      };
      setStrategies((prev) => [newStrategy, ...prev]);
      return id;
    },
    []
  );

  const updateStrategy = useCallback((id, updater) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? updater(s) : s))
    );
  }, []);

  const setCell = useCallback(
    (strategyId, scenarioId, teamNum, columnId, value) => {
      updateStrategy(strategyId, (s) => ({
        ...s,
        scenarios: s.scenarios.map((sc) =>
          sc.id !== scenarioId
            ? sc
            : {
                ...sc,
                cells: {
                  ...sc.cells,
                  [teamNum]: {
                    ...(sc.cells[teamNum] ?? {}),
                    [columnId]: value,
                  },
                },
              }
        ),
      }));
    },
    [updateStrategy]
  );

  const addScenario = useCallback(
    (strategyId, { title, tone = "ours" }) => {
      updateStrategy(strategyId, (s) => {
        const teams = tone === "opponent" ? s.opponentAlliance : s.ourAlliance;
        return {
          ...s,
          scenarios: [
            ...s.scenarios,
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
    [updateStrategy]
  );

  const removeScenario = useCallback(
    (strategyId, scenarioId) => {
      updateStrategy(strategyId, (s) => ({
        ...s,
        scenarios: s.scenarios.filter((sc) => sc.id !== scenarioId),
      }));
    },
    [updateStrategy]
  );

  const addColumn = useCallback(
    (strategyId, label) => {
      updateStrategy(strategyId, (s) => ({
        ...s,
        columns: [
          ...s.columns,
          { id: `col-${Date.now()}`, label, custom: true },
        ],
      }));
    },
    [updateStrategy]
  );

  const removeColumn = useCallback(
    (strategyId, columnId) => {
      updateStrategy(strategyId, (s) => ({
        ...s,
        columns: s.columns.filter((c) => c.id !== columnId),
      }));
    },
    [updateStrategy]
  );

  const value = useMemo(
    () => ({
      strategies,
      findStrategy,
      createStrategy,
      setCell,
      addScenario,
      removeScenario,
      addColumn,
      removeColumn,
    }),
    [
      strategies,
      findStrategy,
      createStrategy,
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
