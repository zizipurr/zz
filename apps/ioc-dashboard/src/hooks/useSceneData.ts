import { useEffect, useMemo, useRef } from "react";
import { SCENE_CONFIG } from "@/config/sceneConfig";
import { useSceneStore } from "@/stores/sceneStore";
import { useEventStore } from "@/store/eventStore";
import { useKpiStore } from "@/store/kpiStore";

function getByPath(obj: unknown, path: string) {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function useSceneData() {
  const activeScene = useSceneStore((s) => s.activeScene);
  const cfg = SCENE_CONFIG[activeScene];

  const events = useEventStore((s) => s.events);
  const eventsLoading = useEventStore((s) => s.loading);
  const fetchEvents = useEventStore((s) => s.fetchEvents);

  const kpi = useKpiStore((s) => s.kpi);
  const kpiLoading = useKpiStore((s) => s.loading);
  const fetchKpi = useKpiStore((s) => s.fetchKpi);
  const fetchEventsRef = useRef(fetchEvents);
  const fetchKpiRef = useRef(fetchKpi);

  useEffect(() => {
    fetchEventsRef.current = fetchEvents;
  }, [fetchEvents]);

  useEffect(() => {
    fetchKpiRef.current = fetchKpi;
  }, [fetchKpi]);

  useEffect(() => {
    void fetchEvents({ scene: cfg.sceneParam });
    void fetchKpi({ scene: cfg.key });
  }, [cfg.sceneParam, fetchEvents, fetchKpi]);

  useEffect(() => {
    function onRefresh() {
      void fetchEventsRef.current({ scene: cfg.sceneParam });
      void fetchKpiRef.current({ scene: cfg.key });
    }
    window.addEventListener("refresh_events", onRefresh);
    window.addEventListener("tenant_changed", onRefresh);
    return () => {
      window.removeEventListener("refresh_events", onRefresh);
      window.removeEventListener("tenant_changed", onRefresh);
    };
  }, [cfg.sceneParam]);

  const scopedEvents = useMemo(() => {
    // overview（sceneParam undefined）展示全部事件
    if (!cfg.sceneParam) return events;
    // 非 overview 场景：客户端再过滤一层，防止 store 被无 scene 参数的请求污染
    return events.filter((e) => e.scene === cfg.sceneParam);
  }, [events, cfg.sceneParam]);

  const kpis = useMemo(() => {
    return cfg.kpis.map((k) => {
      const raw = k.field ? getByPath(kpi, k.field) : undefined;
      const val = raw ?? "--";
      const trendRaw = k.trendField ? getByPath(kpi, k.trendField) : undefined;
      const trend = trendRaw !== undefined ? String(trendRaw) : (k.trend ?? "");
      return {
        label: k.label,
        value: val,
        unit: k.unit,
        alert: k.alert,
        trend,
      };
    });
  }, [cfg.kpis, kpi]);

  return {
    activeScene,
    cfg,
    events: scopedEvents,
    eventsLoading,
    kpi,
    kpiRaw: kpi,
    kpiLoading,
    kpis,
  };
}

