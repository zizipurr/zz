import AiModal from "@/components/AiModal";
import DemoConsole from "@/components/DemoConsole";
import DispatchModal from "@/components/DispatchModal";
import KpiBar from "@/components/KpiBar";
import TxMap from "@/components/TxMap";
import RightPanel from "@/components/RightPanel";
import { useSocket } from "@/hooks/useSocket";
import { useEventStore } from "@/store/eventStore";
import { useKpiStore } from "@/store/kpiStore";
import { useMessageStore } from "@/store/messageStore";
import { sceneConfig, getSceneIdByPath, type SceneId } from "@/config/sceneConfig";
import * as echarts from "echarts";
import { CheckCircle2, Inbox, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSceneStore } from "@/stores/sceneStore";
import { getSceneKeyByPath } from "@/config/sceneConfig";
import { useSceneData } from "@/hooks/useSceneData";
import request from "@/api/request";
import styles from "./Dashboard.module.scss";

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  doing: "处理中",
  done: "已完结",
};

type EventLike = { status?: string; level?: string };
function fmtNum(val: unknown) {
  const n = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("zh-CN");
}
// 辅助 Hook：监听 html 的 dark class 变化，通知图表重新渲染
function useThemeObserver(callback: (isDark: boolean) => void) {
  useEffect(() => {
    const root = document.documentElement;
    const checkTheme = () => callback(root.classList.contains("dark"));
    
    // 初始化执行一次
    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });

    observer.observe(root, { attributes: true });
    return () => observer.disconnect();
  }, [callback]);
}

// 获取计算后的 CSS 变量值 (图表需要具体颜色值)
const getVar = (name: string, isDark: boolean) => {
  // 简单回退机制，确保初次渲染有颜色
  const fallback = isDark 
    ? { accent: '#0ea5e9', text: '#8ba3b8', border: 'rgba(34,211,238,0.2)' }
    : { accent: '#f97316', text: '#64748b', border: 'rgba(0,0,0,0.1)' };
    
  if (name === '--accent-color') return fallback.accent;
  if (name === '--text-secondary') return fallback.text;
  if (name === '--border-glass') return fallback.border;
  return '#ccc';
};

type ChartType = "trend7d" | "workorderTrend" | "alertTrend" | "trafficFlow" | "serviceVolume";

function buildTrendData(chartType: ChartType, events: EventLike[]) {
  if (chartType === "workorderTrend") {
    const pending = events.filter((e) => e.status === "pending").length;
    const doing = events.filter((e) => e.status === "doing").length;
    const done = events.filter((e) => e.status === "done").length;
    return {
      x: ["周一", "周二", "周三", "周四", "周五", "周六", "今天"],
      y: [pending + 6, pending + 4, doing + 3, doing + 5, done + 2, done + 3, pending + doing + done],
      seriesName: "社区工单趋势",
    };
  }
  if (chartType === "alertTrend") {
    const high = events.filter((e) => e.level === "high").length;
    const mid = events.filter((e) => e.level === "mid").length;
    return {
      x: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "现在"],
      y: [2, 1, 3, mid + 2, high + 2, high + mid + 1, high + mid],
      seriesName: "应急告警趋势",
    };
  }
  if (chartType === "trafficFlow") {
    return {
      x: ["06", "08", "10", "12", "14", "16", "18", "20", "22"],
      y: [24, 56, 72, 64, 58, 77, 84, 63, 40],
      seriesName: "交通流量曲线",
    };
  }
  if (chartType === "serviceVolume") {
    return {
      x: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      y: [210, 248, 233, 286, 302, 190, 178],
      seriesName: "办件量曲线",
    };
  }
  return {
    x: ["4/2", "4/3", "4/4", "4/5", "4/6", "4/7", "今天"],
    y: [8, 12, 7, 15, 10, 18, events.length],
    seriesName: "全域事件趋势",
  };
}

// ===== 场景趋势图（按 cfg.chartConfig.type 切换） =====
function TrendChart({ events, chartType }: { events: EventLike[]; chartType: ChartType }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const renderChart = useCallback((isDark: boolean) => {
    const chart = chartRef.current;
    if (!chart) return;
    
    const accentColor = getVar('--accent-color', isDark);
    const textColor = getVar('--text-secondary', isDark);
    const borderColor = getVar('--border-glass', isDark);
    const { x, y, seriesName } = buildTrendData(chartType, events);

    chart.setOption({
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 24, left: 30 },
      xAxis: {
        type: "category",
        data: x,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: textColor, fontSize: 10, fontFamily: 'Rajdhani, sans-serif' },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: borderColor, type: "dashed" } },
        axisLabel: { color: textColor, fontSize: 10, fontFamily: 'Rajdhani, sans-serif' },
      },
      series: [
        {
          name: seriesName,
          data: y,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            color: accentColor,
            width: 2,
            shadowColor: accentColor,
            shadowBlur: isDark ? 10 : 4,
          },
          itemStyle: { color: accentColor, borderColor: isDark ? '#000' : '#fff', borderWidth: 1 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: isDark ? 'rgba(14,165,233,0.3)' : 'rgba(249,115,22,0.2)' },
              { offset: 1, color: 'rgba(0,0,0,0)' }
            ])
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "rgba(10,20,40,0.9)" : "rgba(255,255,255,0.9)",
        borderColor: borderColor,
        textStyle: { color: isDark ? '#e8f4f8' : '#1e293b', fontSize: 12 },
      },
    }, true);
  }, [chartType, events]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    chartRef.current = echarts.init(el);
    const observer = new ResizeObserver(() => chartRef.current?.resize());
    observer.observe(el);
    return () => { observer.disconnect(); chartRef.current?.dispose(); chartRef.current = null; };
  }, []);

  useThemeObserver(renderChart);

  return <div ref={ref} className={styles.chartCanvas} />;
}

// ===== 工单处置率环形图 =====
function DisposeChart({ events, chartType }: { events: EventLike[]; chartType: ChartType }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const renderChart = useCallback((isDark: boolean) => {
    const chart = chartRef.current;
    if (!chart) return;

    const textColor = getVar('--text-secondary', isDark);
    const accentColor = getVar('--accent-color', isDark);
    const done = events.filter((e) => e.status === "done").length;
    const doing = events.filter((e) => e.status === "doing").length;
    const pending = events.filter((e) => e.status === "pending").length;
    const high = events.filter((e) => e.level === "high").length;
    const mid = events.filter((e) => e.level === "mid").length;
    const low = events.filter((e) => e.level === "low").length;
    const total = events.length || 1;
    const rate = Math.round((done / total) * 100);
    const commonTooltip = {
      backgroundColor: isDark ? "rgba(10,20,40,0.9)" : "rgba(255,255,255,0.9)",
      borderColor: getVar('--border-glass', isDark),
      textStyle: { color: isDark ? '#e8f4f8' : '#1e293b', fontSize: 12 },
    };

    if (chartType === "workorderTrend") {
      chart.setOption({
        backgroundColor: "transparent",
        grid: { top: 24, right: 10, bottom: 20, left: 28 },
        xAxis: {
          type: "category",
          data: ["待处理", "处理中", "已完结"],
          axisLabel: { color: textColor, fontSize: 11 },
          axisLine: { lineStyle: { color: getVar('--border-glass', isDark) } },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: getVar('--border-glass', isDark), type: "dashed" } },
          axisLabel: { color: textColor, fontSize: 10 },
        },
        series: [
          {
            type: "bar",
            barWidth: 18,
            data: [
              { value: pending, itemStyle: { color: "#ef4444" } },
              { value: doing, itemStyle: { color: "#f59e0b" } },
              { value: done, itemStyle: { color: "#10b981" } },
            ],
          },
        ],
        tooltip: commonTooltip,
      }, true);
      return;
    }

    if (chartType === "alertTrend") {
      chart.setOption({
        backgroundColor: "transparent",
        series: [
          {
            type: "pie",
            radius: ["52%", "72%"],
            center: ["40%", "50%"],
            data: [
              { value: high, name: "高危", itemStyle: { color: "#ef4444" } },
              { value: mid, name: "中危", itemStyle: { color: "#f59e0b" } },
              { value: low, name: "低危", itemStyle: { color: "#22d3ee" } },
            ],
            label: { show: false },
          },
        ],
        legend: {
          orient: "vertical",
          right: "0%",
          top: "center",
          textStyle: { color: textColor, fontSize: 11 },
          formatter: (name: string) => `${name}  ${name === "高危" ? high : name === "中危" ? mid : low}`,
        },
        tooltip: commonTooltip,
      }, true);
      return;
    }

    if (chartType === "trafficFlow") {
      chart.setOption({
        backgroundColor: "transparent",
        grid: { top: 18, right: 6, bottom: 18, left: 40 },
        xAxis: {
          type: "value",
          axisLabel: { color: textColor, fontSize: 10 },
          splitLine: { lineStyle: { color: getVar('--border-glass', isDark), type: "dashed" } },
        },
        yAxis: {
          type: "category",
          data: ["高危", "中危", "低危"],
          axisLabel: { color: textColor, fontSize: 11 },
          axisLine: { lineStyle: { color: getVar('--border-glass', isDark) } },
          axisTick: { show: false },
        },
        series: [
          {
            type: "bar",
            barWidth: 14,
            data: [
              { value: high, itemStyle: { color: "#ef4444" } },
              { value: mid, itemStyle: { color: "#f59e0b" } },
              { value: low, itemStyle: { color: "#38bdf8" } },
            ],
          },
        ],
        tooltip: commonTooltip,
      }, true);
      return;
    }

    if (chartType === "serviceVolume") {
      const p1 = Math.round((pending / total) * 100);
      const p2 = Math.round((doing / total) * 100);
      const p3 = Math.round((done / total) * 100);
      chart.setOption({
        backgroundColor: "transparent",
        grid: { top: 20, right: 8, bottom: 20, left: 32 },
        xAxis: {
          type: "category",
          data: ["待受理", "办理中", "已完结"],
          axisLabel: { color: textColor, fontSize: 10 },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: getVar('--border-glass', isDark) } },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: textColor, fontSize: 10 },
          splitLine: { lineStyle: { color: getVar('--border-glass', isDark), type: "dashed" } },
        },
        series: [
          {
            type: "line",
            smooth: true,
            data: [p1, p2, p3],
            symbolSize: 6,
            lineStyle: { color: accentColor, width: 2 },
            itemStyle: { color: accentColor },
          },
        ],
        tooltip: commonTooltip,
      }, true);
      return;
    }

    // overview 默认：处置率环图
    chart.setOption({
      backgroundColor: "transparent",
      series: [
        {
          type: "pie",
          radius: ["50%", "70%"],
          center: ["40%", "50%"],
          data: [
            { value: done, name: "已完结", itemStyle: { color: "#10b981" } },
            { value: doing, name: "处理中", itemStyle: { color: "#f59e0b" } },
            { value: pending, name: "待处理", itemStyle: { color: "#ef4444" } },
          ],
          label: { show: false },
          emphasis: { scale: true, scaleSize: 4 },
        },
      ],
      graphic: [
        {
          type: "text",
          left: "calc(40% - 18px)",
          top: "center",
          style: {
            text: `${rate}%`,
            font: "600 16px 'Rajdhani', sans-serif",
            fill: accentColor,
          },
        },
      ],
      legend: {
        orient: "vertical",
        right: "0%",
        top: "center",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: textColor, fontSize: 11, fontFamily: 'Noto Sans SC, sans-serif' },
        formatter: (name: string) => {
          const map: Record<string, number> = { 已完结: done, 处理中: doing, 待处理: pending };
          return `${name}  ${map[name]}`;
        },
      },
      tooltip: commonTooltip,
    }, true);
  }, [chartType, events]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    chartRef.current = echarts.init(el);
    const observer = new ResizeObserver(() => chartRef.current?.resize());
    observer.observe(el);
    return () => { observer.disconnect(); chartRef.current?.dispose(); chartRef.current = null; };
  }, []);

  useThemeObserver(renderChart);

  return <div ref={ref} className={styles.chartCanvas} />;
}

export default function Dashboard() {
  const {
    events,
    selectEvent,
    selectedEvent,
    loading: eventsLoading,
  } = useEventStore();
  const {
    messages,
    unreadCount,
    fetchMessages,
    fetchUnreadCount,
    markRead,
    loading: messagesLoading,
  } = useMessageStore();
  const kpi = useKpiStore((s) => s.kpi);
  const { toastVisible } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const setSceneSilent = useSceneStore((s) => s.setSceneSilent);
  const { activeScene, cfg, kpis, events: sceneEvents } = useSceneData();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiToastVisible, setAiToastVisible] = useState(false);
  const [sceneFadeFlip, setSceneFadeFlip] = useState(false);
  
  const pendingAlerts = useMemo(() => sceneEvents.filter((e) => e.status !== "done"), [sceneEvents]);
  const pendingEventCount = useMemo(() => sceneEvents.filter((e) => e.status === "pending").length, [sceneEvents]);
  const doingEventCount = useMemo(() => sceneEvents.filter((e) => e.status === "doing").length, [sceneEvents]);
  const doneEventCount = useMemo(() => sceneEvents.filter((e) => e.status === "done").length, [sceneEvents]);
  const criticalAlerts = useMemo(() => sceneEvents.filter((e) => e.level === "high" && e.status !== "done"), [sceneEvents]);
  const highEvent = useMemo(() => sceneEvents.find((e) => e.level === "high" && e.status === "pending"), [sceneEvents]);
  const highCount = useMemo(() => criticalAlerts.length, [criticalAlerts]);
  const midCount = useMemo(() => sceneEvents.filter((e) => e.level === "mid" && e.status !== "done").length, [sceneEvents]);
  const lowCount = useMemo(() => sceneEvents.filter((e) => e.level === "low" && e.status !== "done").length, [sceneEvents]);
  const currentSceneId = useMemo<SceneId>(
    () => getSceneIdByPath(location.pathname),
    [location.pathname]
  );
  const currentScene = sceneConfig[currentSceneId];

  const aiModalSummary = useMemo(() => {
    if (!highEvent) return `🤖 ${cfg.label}当前无高危待处理事件，系统运行正常。`;
    return `🤖 已同步${cfg.label}告警：${highEvent.location} · ${highEvent.title}，建议立即派遣处置。`;
  }, [highEvent, cfg.label]);

  // 已移除中间“关键指标条”（与顶部 KPI 重复）

  const sceneGovRows = useMemo(() => {
    const rowsByScene: Record<
      SceneId,
      Array<{ val: string; label: string; tone: "cyan" | "green" | "amber" | "text" }>
    > = {
      overview: [
        { val: "24", label: "网格数", tone: "cyan" },
        { val: "138", label: "网格员", tone: "green" },
        { val: String(pendingEventCount), label: "待处理事件", tone: "amber" },
        { val: "96%", label: "满意度", tone: "text" },
      ],
      community: [
        { val: fmtNum(kpi.residents), label: "住户数", tone: "green" },
        { val: String(sceneEvents.length), label: "社区事件", tone: "cyan" },
        { val: String(sceneEvents.filter((e) => e.status === "pending").length), label: "待处理", tone: "amber" },
        { val: "95%", label: "工单满意度", tone: "text" },
      ],
      emergency: [
        { val: String(sceneEvents.length), label: "应急事件", tone: "amber" },
        { val: String(sceneEvents.filter((e) => e.level === "high").length), label: "高危告警", tone: "green" },
        { val: String(sceneEvents.filter((e) => e.status === "pending").length), label: "待处置", tone: "cyan" },
        { val: "8m", label: "平均响应", tone: "text" },
      ],
      traffic: [
        { val: fmtNum(kpi.trafficCams ?? 0), label: "监控接口", tone: "cyan" },
        { val: String(sceneEvents.length), label: "交通事件", tone: "amber" },
        { val: "23%", label: "拥堵指数", tone: "green" },
        { val: "88%", label: "设备在线率", tone: "text" },
      ],
      service: [
        { val: "1,204", label: "办件总量", tone: "text" },
        { val: "82%", label: "在线办理率", tone: "green" },
        { val: "530", label: "缴费笔数", tone: "cyan" },
        { val: String(sceneEvents.length), label: "服务事件", tone: "amber" },
      ],
    };
    return rowsByScene[currentSceneId];
  }, [currentSceneId, kpi.residents, kpi.trafficCams, pendingEventCount, sceneEvents]);

  const fetchMessagesRef = useRef(fetchMessages);
  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);
  useEffect(() => { fetchUnreadCountRef.current = fetchUnreadCount; }, [fetchUnreadCount]);

  useEffect(() => {
    // 路由 -> 场景（单一数据源：sceneStore）
    const key = getSceneKeyByPath(location.pathname);
    setSceneSilent(key);
  }, [location.pathname, setSceneSilent]);

  useEffect(() => {
    const openEventId = Number((location.state as { openEventId?: number } | null)?.openEventId ?? 0);
    if (!openEventId) return;
    void request
      .get(`/events/${openEventId}`)
      .then(({ data }) => {
        if (data?.id) selectEvent(data);
      })
      .finally(() => {
        navigate(location.pathname, { replace: true, state: null });
      });
  }, [location.pathname, location.state, navigate, selectEvent]);

  useEffect(() => {
    function onRefresh() {
      // useSceneData 内部已经按 activeScene 拉取 events/kpi
      fetchMessagesRef.current();
      fetchUnreadCountRef.current();
    }
    window.addEventListener("refresh_events", onRefresh);
    window.addEventListener("tenant_changed", onRefresh);
    return () => {
      window.removeEventListener("refresh_events", onRefresh);
      window.removeEventListener("tenant_changed", onRefresh);
    };
  }, []);

  // 切换场景时：动态写入主题色，让大屏“换场景立刻换氛围”
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-color", currentScene.accentColor);
    root.style.setProperty("--accent-hover", currentScene.accentColor);
  }, [currentScene.accentColor]);

  useEffect(() => {
    // 切场景时仅重播淡入动画，不 remount 中心区（避免地图重建）
    setSceneFadeFlip((v) => !v);
  }, [activeScene]);

  useEffect(() => {
    const openAlertCenter = () => setAlertModalOpen(true);
    window.addEventListener("open_alert_center", openAlertCenter);
    return () => window.removeEventListener("open_alert_center", openAlertCenter);
  }, []);

  function handleAiSendComingSoon() {
    setAiToastVisible(true);
    window.setTimeout(() => setAiToastVisible(false), 1800);
  }

  // 映射颜色类名 (直接在 SCSS 中使用 var(--color-xxx))
  const govTintMap = useMemo(() => ({
    cyan: styles.govTintCyan,
    green: styles.govTintGreen,
    amber: styles.govTintAmber,
    text: styles.govTintText,
  }), []);

  function openDispatchModal(ev: (typeof events)[number]) {
    // 已完结事件不可再次派单：不触发弹窗
    if (ev.status === "done") return;
    selectEvent(ev);
  }

  const trendTitle = useMemo(() => {
    const map: Record<ChartType, string> = {
      trend7d: "全域事件趋势（近7日）",
      workorderTrend: "社区工单趋势",
      alertTrend: "应急告警趋势",
      trafficFlow: "交通流量曲线（静态）",
      serviceVolume: "办件量趋势（静态）",
    };
    return map[cfg.chartConfig.type as ChartType] ?? "事件趋势（近7日）";
  }, [cfg.chartConfig.type]);

  const secondaryChartTitle = useMemo(() => {
    const map: Record<ChartType, string> = {
      trend7d: "工单处置率",
      workorderTrend: "社区处置结构",
      alertTrend: "告警等级占比",
      trafficFlow: "路口异常分布",
      serviceVolume: "服务转化效率（%）",
    };
    return map[cfg.chartConfig.type as ChartType] ?? "工单处置率";
  }, [cfg.chartConfig.type]);

  return (
    <div className={styles.dashboardPage}>
      <KpiBar kpis={kpis.map(k => ({
        label: k.label,
        value: String(k.value ?? "--"),
        trend: k.trend ?? "",
        unit: k.unit,
        alert: k.alert,
      }))} />

      <div className={styles.body}>
        {/* ===== 左侧面板 ===== */}
        <div className={styles.sidePanelLeft}>
          <div className={styles.glassPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>事件聚合中心</div>
              <div className={styles.panelActions}>
                <span className={styles.panelAction}>
                  {currentSceneId === "overview" ? "全部 →" : `${currentScene.label} →`}
                </span>
              </div>
            </div>
            <div className={styles.eventList}>
              {eventsLoading && sceneEvents.length === 0 ? (
                <div className={styles.listEmpty} aria-busy="true">
                  <div className={styles.listEmptyPulse} />
                  <div className={styles.listEmptyTitle}>正在同步事件</div>
                  <div className={styles.listEmptyHint}>请稍候，工单列表加载完成后将显示在此处</div>
                </div>
              ) : sceneEvents.length === 0 ? (
                <div className={styles.listEmpty}>
                  <Inbox className={styles.listEmptyIcon} strokeWidth={1.25} aria-hidden />
                  <div className={styles.listEmptyTitle}>当前场景暂无事件</div>
                  <div className={styles.listEmptyHint}>可切换到总览查看全部工单数据</div>
                </div>
              ) : (
                sceneEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={[
                      styles.eventItem,
                      selectedEvent?.id === ev.id ? styles.active : "",
                      ev.status === "done" ? styles.done : "",
                      ev.level === "high" && ev.status === "pending" ? styles.breatheDanger : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => openDispatchModal(ev)}
                  >
                    <div className={`${styles.levelBar} ${styles[ev.level]}`}></div>
                    <div className={styles.eventInfo}>
                      <div className={styles.eventTitle}>{ev.title}</div>
                      <div className={styles.secondaryText}>
                        {ev.location} · {new Date(ev.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className={`${styles.statusTag} ${styles[ev.status]}`}>{STATUS_LABELS[ev.status]}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.glassPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>消息中心</div>
              <div className={styles.panelActions}>
                {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} 未读</span>}
                {/* <button type="button" className={styles.panelActionIconBtn} onClick={() => markAllRead()}>
                  <CheckCheck size={12} strokeWidth={1.8} />
                  <span>全部已读</span>
                </button> */}
                <button type="button" className={styles.panelActionIconBtn} onClick={() => navigate("/messages")}>
                  {/* <Eye size={12} strokeWidth={1.8} /> */}
                  <span>查看全部 →</span>
                </button>
              </div>
            </div>
            <div className={styles.msgList}>
              {messagesLoading && (messages?.length ?? 0) === 0 ? (
                <div className={styles.listEmpty} aria-busy="true">
                  <div className={styles.listEmptyPulse} />
                  <div className={styles.listEmptyTitle}>正在拉取消息</div>
                  <div className={styles.listEmptyHint}>系统通知与派单提醒加载中</div>
                </div>
              ) : (messages?.length ?? 0) === 0 ? (
                <div className={styles.listEmpty}>
                  <MessageSquare className={styles.listEmptyIcon} strokeWidth={1.25} aria-hidden />
                  <div className={styles.listEmptyTitle}>暂无消息</div>
                  <div className={styles.listEmptyHint}>暂无系统通知，派单与告警消息将在此集中展示</div>
                </div>
              ) : (
                (messages ?? []).map((msg) => (
                  <div key={msg.id} className={styles.msgItem} onClick={() => markRead(msg.id)}>
                    <div className={`${styles.msgDot} ${msg.isRead ? styles.read : styles.unread}`}></div>
                    <div className={styles.msgContent}>{msg.content}</div>
                    <div className={styles.msgTime}>
                      {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===== 中间核心区 ===== */}
        <div className={`${styles.center} ${sceneFadeFlip ? styles.sceneFadeInA : styles.sceneFadeInB}`}>
          <TxMap
            sceneId={activeScene}
            events={sceneEvents}
            markerColor={cfg.mapLayer.color ?? cfg.accentColor}
          />

          <div className={styles.charts}>
            <div className={styles.chartBox}>
              <div className={styles.panelTitle}>{trendTitle}</div>
              <TrendChart events={sceneEvents} chartType={cfg.chartConfig.type as ChartType} />
            </div>
            <div className={styles.chartBox}>
              <div className={styles.panelTitle}>{secondaryChartTitle}</div>
              <DisposeChart events={sceneEvents} chartType={cfg.chartConfig.type as ChartType} />
            </div>
          </div>
        </div>

        {/* ===== 右侧面板 ===== */}
        <div className={styles.sidePanelRight}>
          {cfg.rightPanel.type === "governance" ? (
            <>
              <div className={`${styles.glassPanel} ${styles.glassPanelShrink}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>{currentScene.label}</div>
                  <div className={styles.panelActions}><span className={styles.panelAction}>进入 →</span></div>
                </div>
                <div className={styles.govGrid}>
                  {sceneGovRows.map((row) => (
                    <div key={row.label} className={styles.govCard}>
                      <div className={`${styles.govVal} ${govTintMap[row.tone]}`}>{row.val}</div>
                      <div className={styles.govLabel}>{row.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.glassPanel} ${styles.glassPanelShrink}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>AI 智能助手</div>
                  <div className={styles.panelActions}>
                    <span className={styles.aiOnline}><span className={styles.aiDot}>●</span> 在线</span>
                  </div>
                </div>
                <div className={styles.aiBubble}>
                {highEvent ? (
                    <div className={styles.clampedText} title={`🤖 检测到 ${highEvent.location} 发生 ${highEvent.title}，建议立即派遣处置。`}>
                      🤖 检测到 <span className={styles.hlAmber}>{highEvent.location}</span> 发生 <span className={styles.hlRed}>{highEvent.title}</span>，建议立即派单。
                    </div>
                  ) : (
                    <div className={styles.clampedText} title="🤖 当前区域无高危告警，系统运行正常。">
                      🤖 当前区域无高危告警，系统运行正常。
                    </div>
                  )}
                </div>
                <div className={styles.aiActions}>
                  <button type="button" className={styles.aiBtnPrimary} onClick={() => highEvent && openDispatchModal(highEvent)} disabled={!highEvent}>立即派单</button>
                  <button type="button" className={styles.aiBtnOutline} onClick={() => setAiModalOpen(true)}>问 AI</button>
                </div>
              </div>

              <div className={`${styles.glassPanel} ${styles.glassPanelGrow} ${criticalAlerts.length > 0 ? styles.alertPanel : styles.alertPanelSafe}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>实时告警</div>
                  {criticalAlerts.length > 0 && (
                    <div className={styles.panelActions}>
                      <span className={styles.alertCount}>{criticalAlerts.length} 条高危</span>
                    </div>
                  )}
                </div>
                <div className={styles.alertStack}>
                  {eventsLoading && criticalAlerts.length === 0 ? (
                    <div className={styles.listEmpty} aria-busy="true">
                      <div className={styles.listEmptyPulse} />
                      <div className={styles.listEmptyTitle}>正在同步告警</div>
                      <div className={styles.listEmptyHint}>高危待处置事件加载中</div>
                    </div>
                  ) : criticalAlerts.length > 0 ? (
                    criticalAlerts.map((ev) => (
                      <div
                        key={ev.id}
                        className={[
                          styles.alertItem,
                          ev.level === "high" && ev.status === "pending" ? styles.breatheDanger : "",
                        ].filter(Boolean).join(" ")}
                        onClick={() => openDispatchModal(ev)}
                      >
                        <div className={`${styles.levelBar} ${styles[ev.level]}`}></div>
                        <div className={styles.alertContent}>
                          <div className={styles.alertTitle}>{ev.title}</div>
                          <div className={styles.alertLocation}>{ev.location}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`${styles.listEmpty} ${styles.listEmptySafe}`}>
                      <div className={styles.listEmptyTitle}>暂无高危告警</div>
                      <div className={styles.listEmptyHint}>当前无待处置的高危事件</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <RightPanel
              type={cfg.rightPanel.type}
              title={cfg.label}
              pendingCount={pendingEventCount}
              doingCount={doingEventCount}
              doneCount={doneEventCount}
              highCount={highCount}
              midCount={midCount}
              lowCount={lowCount}
            />
          )}
        </div>
      </div>

      {selectedEvent && <DispatchModal event={selectedEvent} onClose={() => selectEvent(null)} />}
      {toastVisible && <div className={styles.toast}>收到新消息</div>}
      {aiToastVisible && <div className={styles.toast}>功能开发中，敬请期待</div>}

      {alertModalOpen && (
        <div className={styles.overlay} onClick={() => setAlertModalOpen(false)}>
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>告警中心 · 待处置</div>
              <button type="button" className={styles.popupClose} onClick={() => setAlertModalOpen(false)}>✕</button>
            </div>
            <div className={styles.popupBody}>
              {eventsLoading && pendingAlerts.length === 0 ? (
                <div className={styles.listEmpty} aria-busy="true">
                  <div className={styles.listEmptyPulse} />
                  <div className={styles.listEmptyTitle}>正在加载待处置列表</div>
                  <div className={styles.listEmptyHint}>请稍候</div>
                </div>
              ) : pendingAlerts.length > 0 ? (
                pendingAlerts.slice(0, 6).map((ev) => (
                  <div key={ev.id} className={styles.popupAlertItem} onClick={() => { setAlertModalOpen(false); openDispatchModal(ev); }}>
                    <div className={`${styles.levelBar} ${styles[ev.level]}`}></div>
                    <div className={styles.alertContent}>
                      <div className={styles.alertTitle}>{ev.title}</div>
                      <div className={styles.alertLocation}>{ev.location}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`${styles.listEmpty} ${styles.listEmptySafe}`}>
                  <CheckCircle2 className={styles.listEmptyIcon} strokeWidth={1.25} aria-hidden />
                  <div className={styles.listEmptyTitle}>暂无待处置告警</div>
                  <div className={styles.listEmptyHint}>当前没有未完结工单，处置中的事件可在事件聚合中心查看</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {aiModalOpen && <AiModal onClose={() => setAiModalOpen(false)} summary={aiModalSummary} onSendComingSoon={handleAiSendComingSoon} />}

      <DemoConsole />
    </div>
  );
}