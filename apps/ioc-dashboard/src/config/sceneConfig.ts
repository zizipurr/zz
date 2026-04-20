export type SceneKey = "overview" | "community" | "emergency" | "traffic" | "service";
// Back-compat aliases used across the app
export type SceneId = SceneKey;

export type KpiConfig = {
  label: string;
  value?: string;
  trend?: string;
  trendField?: string;
  field?: string;
  unit: string;
  icon?: string;
  alert?: boolean;
  staticValue?: number;
};
// Back-compat alias
export type SceneKpi = KpiConfig;

export type SceneConfig = {
  key: SceneKey;
  label: string;
  accentColor: string;
  sceneParam?: string;
  kpis: KpiConfig[];
  rightPanel: { type: "governance" | "community" | "emergency" | "traffic" | "service" };
  mapLayer: { markerType: "all" | "community" | "emergency" | "traffic" | "service"; color?: string };
  chartConfig: { type: "trend7d" | "workorderTrend" | "alertTrend" | "trafficFlow" | "serviceVolume" };
};

export const SCENE_CONFIG: Record<SceneKey, SceneConfig> = {
  overview: {
    key: "overview",
    label: "总览",
    accentColor: "#00e5ff",
    sceneParam: undefined,
    kpis: [
      { label: "监控网格节点", field: "nodes", unit: "", icon: "grid", trend: "+12 今日" },
      { label: "智能路灯节点", field: "lights", unit: "", icon: "lamp", trend: "+4 在线" },
      { label: "智慧社区住户", field: "residents", unit: "户", icon: "home", trend: "+38 本周" },
      { label: "交通监控接口", field: "traffic", unit: "", icon: "traffic", trend: "152 在线" },
      { label: "应急事件", field: "alerts", unit: "件", icon: "alert", alert: true, trend: "实时处置中" },
    ],
    rightPanel: { type: "governance" },
    mapLayer: { markerType: "all" },
    chartConfig: { type: "trend7d" },
  },
  community: {
    key: "community",
    label: "智慧社区",
    accentColor: "#00c896",
    sceneParam: "community",
    kpis: [
      { label: "住户总数", field: "residents", unit: "户", trend: "+38 本周" },
      { label: "今日报修", field: "events.total", unit: "件", trend: "较昨日 +3" },
      { label: "处理中工单", field: "events.doing", unit: "件", trend: "平均响应 28min" },
      { label: "已完结", field: "events.done", unit: "件", trend: "闭环追踪" },
      { label: "处置满意度", unit: "%", staticValue: 96.8, trend: "本月评分" },
    ],
    rightPanel: { type: "community" },
    mapLayer: { markerType: "community", color: "#00c896" },
    chartConfig: { type: "workorderTrend" },
  },
  emergency: {
    key: "emergency",
    label: "城安应急",
    accentColor: "#ff4d4f",
    sceneParam: "emergency",
    kpis: [
      { label: "高危告警", field: "events.pending", unit: "件", alert: true, trend: "实时监控中" },
      { label: "处置中", field: "events.doing", unit: "件", trend: "已派单" },
      { label: "今日处置率", unit: "%", staticValue: 91.2, trend: "较昨日 +2.1%" },
      { label: "平均响应", unit: "min", staticValue: 8.3, trend: "目标 <10min" },
      { label: "在岗网格员", unit: "人", staticValue: 138, trend: "全区覆盖" },
    ],
    rightPanel: { type: "emergency" },
    mapLayer: { markerType: "emergency", color: "#ff4d4f" },
    chartConfig: { type: "alertTrend" },
  },
  traffic: {
    key: "traffic",
    label: "智慧交通",
    accentColor: "#1890ff",
    sceneParam: "traffic",
    kpis: [
      { label: "路口在线", field: "trafficOnline", unit: "个", trendField: "trafficAnomalyLabel" },
      { label: "拥堵路段", unit: "处", staticValue: 3, trend: "轻度拥堵" },
      { label: "停车占用率", unit: "%", staticValue: 73.5, trend: "峰值预警" },
      { label: "路口异常数", field: "events.pending", unit: "件", trend: "实时监测" },
      { label: "今日流量", unit: "万辆", staticValue: 84.7, trend: "持续监控" },
    ],
    rightPanel: { type: "traffic" },
    mapLayer: { markerType: "traffic", color: "#1890ff" },
    chartConfig: { type: "trafficFlow" },
  },
  service: {
    key: "service",
    label: "城市服务",
    accentColor: "#faad14",
    sceneParam: "service",
    kpis: [
      { label: "今日办件量", field: "events.total", unit: "件", trend: "数据接入中（7月）" },
      { label: "在线办理率", unit: "%", staticValue: 78.3, trend: "目标 >80%" },
      { label: "缴费笔数", unit: "笔", staticValue: 326, trend: "水电气" },
      { label: "热线响应率", unit: "%", staticValue: 99.1, trend: "平均 8.2s" },
      { label: "民生满意度", unit: "%", staticValue: 94.5, trend: "季度评分" },
    ],
    rightPanel: { type: "service" },
    mapLayer: { markerType: "service", color: "#faad14" },
    chartConfig: { type: "serviceVolume" },
  },
};

export function getSceneKeyByPath(pathname: string): SceneKey {
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/emergency")) return "emergency";
  if (pathname.startsWith("/traffic")) return "traffic";
  if (pathname.startsWith("/service")) return "service";
  return "overview";
}

// Back-compat exports
export const sceneConfig = SCENE_CONFIG;
export const getSceneIdByPath = getSceneKeyByPath;

