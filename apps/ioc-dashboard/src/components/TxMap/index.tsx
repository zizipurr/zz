import { useEffect, useRef } from 'react'
import { useEventStore } from '@/store/eventStore'
import styles from './TxMap.module.scss'

/**
 * 区域配置
 */
const DISTRICTS = [
  { name: '福田区', lat: 22.5431, lng: 114.0579, key: 'futian' },
  { name: '南山区', lat: 22.5333, lng: 113.9305, key: 'nanshan' },
  { name: '罗湖区', lat: 22.5486, lng: 114.1315, key: 'luohu' },
  { name: '宝安区', lat: 22.5547, lng: 113.883, key: 'baoan' },
  { name: '龙华区', lat: 22.6369, lng: 114.0425, key: 'longhua' },
] as const

/**
 * 状态视觉配置
 */
const STATUS_UI = {
  high: {
    color: '#ff2d55', // 亮红色
    glow: 'rgba(255, 45, 85, 0.6)',
    label: '紧急告警',
    bg: 'rgba(255, 45, 85, 0.15)'
  },
  mid: {
    color: '#ffb800', // 橙黄色
    glow: 'rgba(255, 184, 0, 0.6)',
    label: '风险预警',
    bg: 'rgba(255, 184, 0, 0.15)'
  },
  normal: {
    color: '#00e5ff', // 科技青
    glow: 'rgba(0, 229, 255, 0.4)',
    label: '运行正常',
    bg: 'rgba(0, 229, 255, 0.1)'
  }
}

type TMapWindow = Window & { TMap?: any }

/**
 * 获取区域状态逻辑
 */
function getDistrictStatus(
  districtName: string,
  list: { location?: string; level?: string; status?: string }[]
) {
  const short = districtName.replace('区', '')
  const districtEvents = list.filter(
    (e) => e.location?.includes(short) && e.status !== 'done'
  )
  const hasHigh = districtEvents.some((e) => e.level === 'high')
  const hasMid = districtEvents.some((e) => e.level === 'mid')
  
  return {
    level: (hasHigh ? 'high' : hasMid ? 'mid' : 'normal') as keyof typeof STATUS_UI,
    count: districtEvents.length,
    events: districtEvents,
  }
}

export default function TxMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const overlays = useRef<any[]>([])
  const infoWindow = useRef<any>(null)
  
  // 订阅 store，当 events 变化时触发重新渲染 marker
  const events = useEventStore((s) => s.events)

  /**
   * 核心渲染函数
   */
  function renderMarkers() {
    const TMap = (window as TMapWindow).TMap
    if (!TMap || !mapInstance.current) return

    const list = useEventStore.getState().events

    // 1. 清理旧图层
    overlays.current.forEach((o) => {
      try {
        if (typeof o?.destroy === 'function') o.destroy()
        else if (typeof o?.setMap === 'function') o.setMap(null)
      } catch (e) { console.error('Clear error', e) }
    })
    overlays.current = []

    // 2. 遍历区域绘制
    DISTRICTS.forEach((district) => {
      const status = getDistrictStatus(district.name, list)
      const ui = STATUS_UI[status.level]
      const isAlert = status.level !== 'normal'

      // --- 高级霓虹动效 SVG ---
      // 紧急状态：三重扩散涟漪 + 霓虹滤镜
      const svgHigh = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="15" fill="${ui.color}" opacity="0.3">
            <animate attributeName="r" from="15" to="45" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="50" r="15" fill="${ui.color}" opacity="0.5">
            <animate attributeName="r" from="15" to="30" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="50" r="11" fill="${ui.color}" filter="url(#blur)" opacity="0.8" />
          <circle cx="50" cy="50" r="8" fill="${ui.color}" />
          <circle cx="50" cy="50" r="3" fill="#fff" />
        </svg>
      `

      // 正常状态：柔和呼吸点
      const svgNormal = `
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="8" fill="${ui.color}" opacity="0.3">
            <animate attributeName="r" from="8" to="22" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="30" r="6" fill="${ui.color}" />
          <circle cx="30" cy="30" r="2" fill="#fff" opacity="0.7" />
        </svg>
      `

      const svgSize = isAlert ? 100 : 60
      const anchorSize = svgSize / 2

      // 3. 绘制 Marker (图标)
      const marker = new TMap.MultiMarker({
        map: mapInstance.current,
        styles: {
          dot: new TMap.MarkerStyle({
            width: svgSize,
            height: svgSize,
            anchor: { x: anchorSize, y: anchorSize },
            src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(isAlert ? svgHigh : svgNormal)}`,
          }),
        },
        geometries: [{ id: district.key, styleId: 'dot', position: new TMap.LatLng(district.lat, district.lng) }],
      })

      // 4. 绘制 Label (立体文字标签)
      const labelLayer = new TMap.MultiLabel({
        map: mapInstance.current,
        styles: {
          txt: new TMap.LabelStyle({
            color: ui.color,
            size: 15,
            fontWeight: 'bold',
            offset: { x: 0, y: -(anchorSize / 2 + 5) },
            alignment: 'center',
            verticalAlignment: 'middle',
            strokeColor: '#020c18', // 极深描边产生悬浮感
            strokeWidth: 4,
          }),
        },
        geometries: [
          {
            id: `${district.key}_label`,
            styleId: 'txt',
            position: new TMap.LatLng(district.lat, district.lng),
            content: status.count > 0 ? `${district.name}  ⚠${status.count}` : district.name,
          },
        ],
      })

      // 5. 点击交互：科技感信息窗
      marker.on('click', () => {
        const fresh = useEventStore.getState().events
        const st = getDistrictStatus(district.name, fresh)
        
        if (infoWindow.current) infoWindow.current.destroy()

        const highCount = st.events.filter(e => e.level === 'high').length
        const midCount = st.events.filter(e => e.level === 'mid').length

        infoWindow.current = new TMap.InfoWindow({
          map: mapInstance.current,
          position: new TMap.LatLng(district.lat, district.lng),
          offset: { x: 0, y: -(anchorSize / 2 + 10) },
          content: `
            <div style="
              background: rgba(7, 18, 36, 0.9);
              border: 1px solid ${ui.color};
              border-radius: 8px;
              padding: 12px;
              color: #fff;
              box-shadow: 0 0 20px ${ui.glow};
              backdrop-filter: blur(8px);
              min-width: 180px;
              font-family: sans-serif;
            ">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                <span style="font-weight:bold; font-size:16px; color:#fff">${district.name}</span>
                <span style="font-size:11px; background:${ui.color}; padding:2px 6px; border-radius:4px; color:#000; font-weight:bold;">
                  ${ui.label}
                </span>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size:13px;">
                <div style="color:rgba(255,255,255,0.6)">待处理事件</div>
                <div style="text-align:right; font-weight:bold; color:#fff">${st.count}</div>
                
                ${highCount > 0 ? `
                  <div style="color:rgba(255,255,255,0.6)">紧急告警</div>
                  <div style="text-align:right; font-weight:bold; color:#ff4060">${highCount}</div>
                ` : ''}
                
                ${midCount > 0 ? `
                  <div style="color:rgba(255,255,255,0.6)">风险预警</div>
                  <div style="text-align:right; font-weight:bold; color:#ffb800">${midCount}</div>
                ` : ''}
              </div>
              ${st.count > 0 ? `
                <div style="margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); font-size:11px; color:${ui.color}; text-align:right; cursor:pointer;">
                  详情分析 →
                </div>
              ` : '<div style="margin-top:8px; font-size:12px; color:#00e5ff; text-align:center;">✓ 区域运行良好</div>'}
            </div>
          `,
        })

        // 5秒后自动关闭
        window.setTimeout(() => {
          if (infoWindow.current) infoWindow.current.destroy()
          infoWindow.current = null
        }, 5000)
      })

      overlays.current.push(marker, labelLayer)
    })
  }

  /**
   * 初始化地图
   */
  useEffect(() => {
    const el = mapRef.current
    if (!el) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled || !el || !(window as TMapWindow).TMap) return
      
      const TMap = (window as TMapWindow).TMap
      mapInstance.current = new TMap.Map(el, {
        center: new TMap.LatLng(22.5431, 114.0579),
        zoom: 11,
        pitch: 0,
        rotation: 0,
        // 这里可以根据需要添加地图样式映射 ID
        // mapStyleId: 'style1' 
      })

      renderMarkers()
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (infoWindow.current) infoWindow.current.destroy()
      overlays.current.forEach(o => o.destroy?.() || o.setMap?.(null))
      mapInstance.current?.destroy()
    }
  }, [])

  /**
   * 响应数据变化
   */
  useEffect(() => {
    if (mapInstance.current) renderMarkers()
  }, [events])

  return (
    <div className={styles.mapFrame}>
      {/* 四角边框线样式保持 */}
      <div className={styles.cornerTL} />
      <div className={styles.cornerTR} />
      <div className={styles.cornerBL} />
      <div className={styles.cornerBR} />
      <div ref={mapRef} className={styles.map} />
    </div>
  )
}