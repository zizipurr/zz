import type { SceneId } from "@/config/sceneConfig";

export type EventLike = { id: number; title?: string; location?: string };

function guessSceneName(ev: EventLike): "智慧交通" | "智慧社区" | "城安应急" | "城市服务" | null {
  const text = `${ev.title ?? ""} ${ev.location ?? ""}`.trim();
  if (!text) return null;
  if (/交通|路口|停车|拥堵|违停|车/.test(text)) return "智慧交通";
  if (/社区|小区|住户|物业|门禁|楼|报修|投诉|求助/.test(text)) return "智慧社区";
  if (/应急|告警|报警|风险|隐患|消防|溢出|事故/.test(text)) return "城安应急";
  if (/政务|服务|缴费|办事|大厅|民生/.test(text)) return "城市服务";
  return null;
}

function stableBucket(ev: EventLike) {
  const idx = Math.abs(ev.id) % 4;
  return idx === 0 ? "traffic" : idx === 1 ? "community" : idx === 2 ? "emergency" : "service";
}

export function filterEventsForScene(sceneId: SceneId, events: EventLike[]) {
  if (sceneId === "overview") return events;
  return events.filter((ev) => {
    const guessed = guessSceneName(ev);
    if (guessed) {
      const map: Record<string, SceneId> = {
        智慧交通: "traffic",
        智慧社区: "community",
        城安应急: "emergency",
        城市服务: "service",
      };
      return map[guessed] === sceneId;
    }
    return stableBucket(ev) === sceneId;
  });
}

