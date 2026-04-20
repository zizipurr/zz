import styles from "./RightPanel.module.scss";

type PanelType = "governance" | "community" | "emergency" | "traffic" | "service";

type Props = {
  type: PanelType;
  title: string;
  // scene scoped stats
  pendingCount: number;
  doingCount: number;
  doneCount: number;
  highCount: number;
  midCount: number;
  lowCount: number;
};

export default function RightPanel({
  type,
  title,
  pendingCount,
  doingCount,
  doneCount,
  highCount,
  midCount,
  lowCount,
}: Props) {
  const total = pendingCount + doingCount + doneCount;
  const doneRate = total > 0 ? Math.round((doneCount / total) * 1000) / 10 : 0;

  if (type === "community") {
    return (
      <div className={styles.stack}>
        <div className="glassPanel glassPanelShrink">
        <div className={`panelHeader ${styles.headerRow}`}>
            <div className="panelTitle">{title}</div>
            <div className={styles.headerRight}>
              <span className={styles.enterLink}>进入 →</span>
            </div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>今日值班</div>
              <div className={styles.rowVal}>
                张经理 <span className={styles.tag}>在岗</span>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>平均响应</div>
              <div className={styles.rowVal}>28 min</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>超时预警</div>
              <div className={styles.rowVal}>{Math.max(0, highCount)}</div>
            </div>
          </div>
        </div>

        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">工单 SLA</div>
            <div className="panelActions" />
          </div>
          <div className={styles.panelBody}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>待处理</div>
              <div className={styles.rowVal}>{pendingCount}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>处理中</div>
              <div className={styles.rowVal}>{doingCount}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>24h 完结率</div>
              <div className={styles.rowVal}>{doneRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="glassPanel glassPanelGrow">
          <div className="panelHeader">
            <div className="panelTitle">楼栋热力（示意）</div>
            <div className="panelActions" />
          </div>
          <div className={`${styles.heat} ${styles.scrollBody}`}>
            {[
              { name: "1栋", tone: "green" },
              { name: "2栋", tone: "amber" },
              { name: "3栋", tone: "red" },
              { name: "4栋", tone: "green" },
              { name: "5栋", tone: "green" },
              { name: "6栋", tone: "amber" },
            ].map((b) => (
              <div key={b.name} className={styles.heatCell}>
                <div className={styles.heatTitle}>{b.name}</div>
                <div
                  className={`${styles.heatDot} ${
                    b.tone === "red"
                      ? styles.dotRed
                      : b.tone === "amber"
                        ? styles.dotAmber
                        : styles.dotGreen
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "emergency") {
    return (
      <div className={styles.stack}>
        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">{title}</div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>告警等级分布</div>
              <div className={styles.rowVal}>
                高危 {highCount}·中危 {midCount}·低危 {lowCount}
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>今日累计响应</div>
              <div className={styles.rowVal}>{total} 件</div>
            </div>
          </div>
        </div>

        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">应急资源</div>
            <div className="panelActions" />
          </div>
          <div className={styles.panelBody}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>消防车</div>
              <div className={styles.rowVal}>6 辆 · 待命</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>救护车</div>
              <div className={styles.rowVal}>4 辆 · 1 出勤</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>应急队员</div>
              <div className={styles.rowVal}>38 人 · 在岗</div>
            </div>
          </div>
        </div>

        <div className="glassPanel glassPanelGrow">
          <div className="panelHeader">
            <div className="panelTitle">指挥态势</div>
            <div className="panelActions" />
          </div>
          <div className={`${styles.panelBody} ${styles.scrollBody}`}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>平均到场</div>
              <div className={styles.rowVal}>8.3 min</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>处置完结率</div>
              <div className={styles.rowVal}>{doneRate.toFixed(1)}%</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>待处置</div>
              <div className={styles.rowVal}>{pendingCount}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "traffic") {
    return (
      <div className={styles.stack}>
        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">{title}</div>
            <div className="panelActions" />
          </div>
          <div className={styles.panelBody}>
            {[
              { name: "深南大道", tag: "畅通", color: "green" },
              { name: "滨海大道", tag: "拥堵", color: "red" },
              { name: "北环大道", tag: "缓行", color: "amber" },
            ].map((r) => (
              <div key={r.name} className={styles.row}>
                <div className={styles.rowLabel}>{r.name}</div>
                <div className={styles.rowVal}>
                  <span className={styles.tag}>{r.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">拥堵 Top5（示意）</div>
            <div className="panelActions" />
          </div>
          <div className={styles.panelBody}>
            {[
              { name: "福华路口", pct: 90 },
              { name: "科技园", pct: 72 },
              { name: "车公庙", pct: 61 },
              { name: "岗厦", pct: 54 },
              { name: "南山大道", pct: 48 },
            ].map((r) => (
              <div key={r.name} className={styles.barRow}>
                <div className={styles.barName}>{r.name}</div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${r.pct}%` }} />
                </div>
                <div className={styles.barPct}>{r.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glassPanel glassPanelGrow">
          <div className="panelHeader">
            <div className="panelTitle">异常处置进度</div>
            <div className="panelActions" />
          </div>
          <div className={`${styles.panelBody} ${styles.scrollBody}`}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>待处理</div>
              <div className={styles.rowVal}>{pendingCount} 件</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>处理中</div>
              <div className={styles.rowVal}>{doingCount} 件</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>已完结</div>
              <div className={styles.rowVal}>{doneCount} 件</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "service") {
    return (
      <div className={styles.stack}>
        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">{title}</div>
            <div className="panelActions" />
          </div>
          <div className={styles.panelBody}>
            {[
              { name: "户籍办理", val: "287件", hot: true },
              { name: "社保查询", val: "234件", hot: false },
              { name: "营业执照", val: "189件", hot: false },
            ].map((r) => (
              <div key={r.name} className={styles.row}>
                <div className={styles.rowLabel}>
                  {r.name} {r.hot ? <span className={styles.tag}>热门</span> : null}
                </div>
                <div className={styles.rowVal}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glassPanel glassPanelShrink">
          <div className="panelHeader">
            <div className="panelTitle">事项办理进度分布</div>
            <div className="panelActions" />
          </div>
          <div className={styles.barGroup}>
            {[
              { name: "待受理", pct: 23 },
              { name: "办理中", pct: 41 },
              { name: "已完结", pct: 36 },
            ].map((r) => (
              <div key={r.name} className={styles.barRow}>
                <div className={styles.barName}>{r.name}</div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${r.pct}%` }} />
                </div>
                <div className={styles.barPct}>{r.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glassPanel glassPanelGrow">
          <div className="panelHeader">
            <div className="panelTitle">民生服务指数</div>
            <div className="panelActions" />
          </div>
          <div className={`${styles.panelBody} ${styles.scrollBody}`}>
            <div className={styles.row}>
              <div className={styles.rowLabel}>市民满意度</div>
              <div className={styles.rowVal}>94.5 分</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>热线接通率</div>
              <div className={styles.rowVal}>99.1%</div>
            </div>
            <div className={styles.row}>
              <div className={styles.rowLabel}>平均等待</div>
              <div className={styles.rowVal}>8.2 s</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // overview：右侧继续使用原“基层治理端 + AI + 告警”组合，由 Dashboard 负责渲染
  return null;
}

