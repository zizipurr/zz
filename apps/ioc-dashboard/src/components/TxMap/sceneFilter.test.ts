import { describe, expect, it } from "vitest";
import { filterEventsForScene } from "./sceneFilter";

type Ev = { id: number; title?: string; location?: string };

describe("filterEventsForScene", () => {
  const events: Ev[] = [
    { id: 1, title: "路口拥堵告警", location: "南山" },
    { id: 2, title: "小区报修：漏水", location: "福田" },
    { id: 3, title: "消防应急：管网压力异常", location: "福田" },
    { id: 4, title: "政务大厅排队", location: "罗湖" },
  ];

  it("dashboard returns all events", () => {
    expect(filterEventsForScene("overview", events)).toHaveLength(4);
  });

  it("traffic returns only traffic-like events", () => {
    const r = filterEventsForScene("traffic", events);
    expect(r.map((e) => e.id)).toEqual([1]);
  });

  it("community returns only community-like events", () => {
    const r = filterEventsForScene("community", events);
    expect(r.map((e) => e.id)).toEqual([2]);
  });

  it("emergency returns only emergency-like events", () => {
    const r = filterEventsForScene("emergency", events);
    expect(r.map((e) => e.id)).toEqual([3]);
  });

  it("service returns only service-like events", () => {
    const r = filterEventsForScene("service", events);
    expect(r.map((e) => e.id)).toEqual([4]);
  });

  it("unknown text falls back to stable bucket mapping", () => {
    const unknown: Ev[] = [{ id: 10, title: "未知事件", location: "未知" }];
    // id 10 % 4 == 2 -> emergency bucket
    const r = filterEventsForScene("emergency", unknown);
    expect(r).toHaveLength(1);
    const r2 = filterEventsForScene("traffic", unknown);
    expect(r2).toHaveLength(0);
  });
});

