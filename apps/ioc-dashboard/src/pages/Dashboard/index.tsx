import AiModal from "@/components/AiModal";
import DemoConsole from "@/components/DemoConsole";
import DispatchModal from "@/components/DispatchModal";
import KpiBar from "@/components/KpiBar";
import TxMap from "@/components/TxMap";
import { useSocket } from "@/hooks/useSocket";
import { useEventStore } from "@/store/eventStore";
import { useKpiStore } from "@/store/kpiStore";
import { useMessageStore } from "@/store/messageStore";
import * as echarts from "echarts";
import { CheckCircle2, Inbox, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./Dashboard.module.scss";

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  doing: "处理中",
  done: "已完结",
};

type EventLike = { status?: string };
type ScenePill = { key: string; name: string; value: string; icon: string };

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

// ===== 事件趋势折线图 =====
function TrendChart({ events }: { events: EventLike[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const renderChart = useCallback((isDark: boolean) => {
    const chart = chartRef.current;
    if (!chart) return;
    
    const accentColor = getVar('--accent-color', isDark);
    const textColor = getVar('--text-secondary', isDark);
    const borderColor = getVar('--border-glass', isDark);
    const days = ["4/2", "4/3", "4/4", "4/5", "4/6", "4/7", "今天"];

    chart.setOption({
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 24, left: 30 },
      xAxis: {
        type: "category",
        data: days,
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
          data: [8, 12, 7, 15, 10, 18, events.length],
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
  }, [events.length]);

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
function DisposeChart({ events }: { events: EventLike[] }) {
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
    const total = events.length || 1;
    const rate = Math.round((done / total) * 100);

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
      tooltip: {
        backgroundColor: isDark ? "rgba(10,20,40,0.9)" : "rgba(255,255,255,0.9)",
        borderColor: getVar('--border-glass', isDark),
        textStyle: { color: isDark ? '#e8f4f8' : '#1e293b', fontSize: 12 },
      },
    }, true);
  }, [events]);

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
  const { events, fetchEvents, selectEvent, selectedEvent, loading: eventsLoading } = useEventStore();
  const kpi = useKpiStore((s) => s.kpi);
  const fetchKpi = useKpiStore((s) => s.fetchKpi);
  const {
    messages,
    unreadCount,
    fetchMessages,
    fetchUnreadCount,
    markRead,
    markAllRead,
    loading: messagesLoading,
  } = useMessageStore();
  const { toastVisible } = useSocket();
  const [activeScene, setActiveScene] = useState("智慧交通");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiToastVisible, setAiToastVisible] = useState(false);
  
  const pendingAlerts = useMemo(() => events.filter((e) => e.status !== "done"), [events]);
  const pendingEventCount = useMemo(() => events.filter((e) => e.status === "pending").length, [events]);
  const criticalAlerts = useMemo(() => events.filter((e) => e.level === "high" && e.status !== "done"), [events]);
  const highEvent = useMemo(() => events.find((e) => e.level === "high" && e.status === "pending"), [events]);
  
  const aiModalSummary = useMemo(() => {
    if (!highEvent) return "🤖 当前无高危待处理事件，系统运行正常。";
    return `🤖 已同步当前告警：${highEvent.location} · ${highEvent.title}，建议立即派遣处置。`;
  }, [highEvent]);

  const scenePills: ScenePill[] = useMemo(() => [
    { key: "traffic", name: "智慧交通", value: kpi.traffic.toLocaleString("zh-CN"), icon: "🚗" },
    { key: "community", name: "智慧社区", value: kpi.residents.toLocaleString("zh-CN"), icon: "🏘" },
    { key: "emergency", name: "城安应急", value: `${kpi.alerts}件`, icon: "🚨" },
    { key: "service", name: "城市服务", value: "在线", icon: "🏛" },
  ], [kpi.traffic, kpi.residents, kpi.alerts]);

  const fetchEventsRef = useRef(fetchEvents);
  const fetchMessagesRef = useRef(fetchMessages);
  const fetchUnreadCountRef = useRef(fetchUnreadCount);
  const fetchKpiRef = useRef(fetchKpi);

  useEffect(() => { fetchEventsRef.current = fetchEvents; }, [fetchEvents]);
  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);
  useEffect(() => { fetchUnreadCountRef.current = fetchUnreadCount; }, [fetchUnreadCount]);
  useEffect(() => { fetchKpiRef.current = fetchKpi; }, [fetchKpi]);

  useEffect(() => {
    function syncDashboard() {
      fetchEventsRef.current();
      fetchMessagesRef.current();
      fetchUnreadCountRef.current();
      void fetchKpiRef.current();
    }
    syncDashboard();
    function onRefresh() { syncDashboard(); }
    window.addEventListener("refresh_events", onRefresh);
    // 租户切换时刷新所有数据
    window.addEventListener("tenant_changed", onRefresh);
    function onVisible() { if (!document.hidden) syncDashboard(); }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", syncDashboard);
    return () => {
      window.removeEventListener("refresh_events", onRefresh);
      window.removeEventListener("tenant_changed", onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", syncDashboard);
    };
  }, []);

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

  return (
    <div className={styles.dashboardPage}>
      <KpiBar />

      <div className={styles.body}>
        {/* ===== 左侧面板 ===== */}
        <div className={styles.sidePanelLeft}>
          <div className={styles.glassPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>事件聚合中心</div>
              <div className={styles.panelActions}>
                <span className={styles.panelAction}>全部 →</span>
              </div>
            </div>
            <div className={styles.eventList}>
              {eventsLoading && events.length === 0 ? (
                <div className={styles.listEmpty} aria-busy="true">
                  <div className={styles.listEmptyPulse} />
                  <div className={styles.listEmptyTitle}>正在同步事件</div>
                  <div className={styles.listEmptyHint}>请稍候，工单列表加载完成后将显示在此处</div>
                </div>
              ) : events.length === 0 ? (
                <div className={styles.listEmpty}>
                  <Inbox className={styles.listEmptyIcon} strokeWidth={1.25} aria-hidden />
                  <div className={styles.listEmptyTitle}>暂无事件</div>
                  <div className={styles.listEmptyHint}>当前租户下没有工单数据</div>
                </div>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`${styles.eventItem} ${selectedEvent?.id === ev.id ? styles.active : ""} ${ev.status === "done" ? styles.done : ""}`}
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
                <span className={styles.panelAction} onClick={() => markAllRead()}>全部已读</span>
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
        <div className={styles.center}>
          <div className={styles.scenePills}>
            {scenePills.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.scenePill} ${activeScene === item.name ? styles.active : ""}`}
                onClick={() => setActiveScene(item.name)}
              >
                <span className={styles.scenePillIcon}>{item.icon}</span>
                <div className={styles.scenePillName}>{item.name}</div>
                <div className={styles.scenePillVal}>{item.value}</div>
              </button>
            ))}
          </div>

          <TxMap />

          <div className={styles.charts}>
            <div className={styles.chartBox}>
              <div className={styles.panelTitle}>事件趋势（近7日）</div>
              <TrendChart events={events} />
            </div>
            <div className={styles.chartBox}>
              <div className={styles.panelTitle}>工单处置率</div>
              <DisposeChart events={events} />
            </div>
          </div>
        </div>

        {/* ===== 右侧面板 ===== */}
        <div className={styles.sidePanelRight}>
          <div className={`${styles.glassPanel} ${styles.glassPanelShrink}`}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>基层治理端</div>
              <div className={styles.panelActions}><span className={styles.panelAction}>进入 →</span></div>
            </div>
            <div className={styles.govGrid}>
              {[
                { val: "24", label: "网格数", tone: "cyan" as const },
                { val: "138", label: "网格员", tone: "green" as const },
                { val: String(pendingEventCount), label: "待处理事件", tone: "amber" as const },
                { val: "96%", label: "满意度", tone: "text" as const },
              ].map((row) => (
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

          <div className={`${styles.glassPanel} ${styles.glassPanelGrow}`}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>实时告警</div>
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
                  <div key={ev.id} className={styles.alertItem} onClick={() => openDispatchModal(ev)}>
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