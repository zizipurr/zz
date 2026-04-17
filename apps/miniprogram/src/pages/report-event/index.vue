<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { http } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import { reverseGeocode } from '@/utils/map'

type Level = 'high' | 'mid' | 'low'

const LEVEL_OPTIONS: Array<{ value: Level; label: string }> = [
  { value: 'high', label: '高危' },
  { value: 'mid',  label: '中危' },
  { value: 'low',  label: '低危' },
]

const auth = useAuthStore()
const title = ref('')
const level = ref<Level>('mid')
const remark = ref('')
const submitting = ref(false)
const focusField = ref('')
const isH5 = typeof window !== 'undefined'
const showH5MapPicker = ref(false)
const h5Picking = ref(false)
const h5PickerError = ref('')
const tempLat = ref<number | null>(null)
const tempLng = ref<number | null>(null)

const DEFAULT_LAT = 22.543096
const DEFAULT_LNG = 114.057865

let leafletMap: any = null
let leafletMarker: any = null
let leafletScriptLoading: Promise<void> | null = null

// 位置相关
const districts = ref<string[]>([])
const streets = ref<string[]>([])
const districtIndex = ref(0)
const streetIndex = ref(0)
const locationDetail = ref('')
const lat = ref<number | null>(null)
const lng = ref<number | null>(null)
const locating = ref(false)

const errors = ref<{ title?: string; district?: string }>({})

onMounted(async () => {
  // 加载区县列表
  const tenantId = auth.userInfo?.tenantId || 'shenzhen'
  try {
    const data = await http.get<string[]>(`/locations/districts?tenantId=${tenantId}`)
    districts.value = data ?? []
  } catch {
    districts.value = []
  }

  // 默认选中网格员所属区县
  const userDistrict = auth.userInfo?.district
  if (userDistrict && districts.value.includes(userDistrict)) {
    districtIndex.value = districts.value.indexOf(userDistrict)
  }

  // 加载对应街道
  if (districts.value.length > 0) {
    await loadStreets(districts.value[districtIndex.value])
  }
})

async function loadStreets(district: string) {
  try {
    const data = await http.get<string[]>(`/locations/streets?district=${encodeURIComponent(district)}`)
    streets.value = data ?? []
  } catch {
    streets.value = []
  }
  streetIndex.value = 0
}

async function onDistrictChange(e: any) {
  districtIndex.value = Number(e.detail.value)
  locationDetail.value = ''
  lat.value = null
  lng.value = null
  if (errors.value.district) errors.value = { ...errors.value, district: undefined }
  await loadStreets(districts.value[districtIndex.value])
}

function onStreetChange(e: any) {
  streetIndex.value = Number(e.detail.value)
}

// GPS 一键定位
async function locateByGPS() {
  locating.value = true
  try {
    const pos = await new Promise<UniApp.GetLocationSuccess>((resolve, reject) => {
      uni.getLocation({ type: 'gcj02', success: resolve, fail: reject })
    })
    lat.value = pos.latitude
    lng.value = pos.longitude

    const addr = await reverseGeocode(pos.latitude, pos.longitude)
    if (addr.detail) locationDetail.value = addr.detail

    // 回填区县
    if (addr.district && districts.value.includes(addr.district)) {
      districtIndex.value = districts.value.indexOf(addr.district)
      await loadStreets(addr.district)
      // 回填街道
      if (addr.street && streets.value.includes(addr.street)) {
        streetIndex.value = streets.value.indexOf(addr.street)
      }
    }
    uni.showToast({ title: '定位成功', icon: 'success', duration: 1500 })
  } catch {
    uni.showToast({ title: '定位失败，请手动选择', icon: 'none' })
  } finally {
    locating.value = false
  }
}

// 地图选点
function openMapPicker() {
  if (isH5) {
    openH5MapPicker()
    return
  }

  uni.chooseLocation({
    success: async (res) => {
      lat.value = res.latitude
      lng.value = res.longitude
      locationDetail.value = res.name || res.address || ''

      // 优先从 res.address（"广东省深圳市福田区..."）直接匹配区县，
      // 避免依赖额外的逆地理编码 API 请求（小程序需配置域名白名单）
      const address = res.address || ''
      let matched = districts.value.find(d => address.includes(d)) ?? null
      if (!matched) {
        // 降级：调用逆地理编码
        const addr = await reverseGeocode(res.latitude, res.longitude)
        matched = (addr.district && districts.value.includes(addr.district)) ? addr.district : null
      }
      if (matched) {
        districtIndex.value = districts.value.indexOf(matched)
        await loadStreets(matched)
      }
    },
    fail: () => {},
  })
}

function loadLeafletAssets() {
  if (!isH5) return Promise.resolve()
  if ((window as any).L) return Promise.resolve()
  if (leafletScriptLoading) return leafletScriptLoading

  leafletScriptLoading = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('地图资源加载失败'))
    document.head.appendChild(script)
  })

  return leafletScriptLoading
}

async function openH5MapPicker() {
  showH5MapPicker.value = true
  h5PickerError.value = ''
  await nextTick()

  try {
    await loadLeafletAssets()
    const L = (window as any).L
    if (!L) throw new Error('地图初始化失败')

    const container = document.getElementById('h5-map-picker')
    if (!container) throw new Error('地图容器不存在')

    if (!leafletMap) {
      leafletMap = L.map(container).setView([lat.value ?? DEFAULT_LAT, lng.value ?? DEFAULT_LNG], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap)

      leafletMap.on('click', (e: any) => {
        tempLat.value = e.latlng.lat
        tempLng.value = e.latlng.lng
        updateLeafletMarker()
      })
    } else {
      leafletMap.invalidateSize()
      leafletMap.setView([lat.value ?? DEFAULT_LAT, lng.value ?? DEFAULT_LNG], 15)
    }

    tempLat.value = lat.value
    tempLng.value = lng.value
    updateLeafletMarker()
  } catch (err: any) {
    h5PickerError.value = err?.message || '地图加载失败'
  }
}

function destroyLeafletMap() {
  if (leafletMap) {
    leafletMap.off()
    leafletMap.remove()
    leafletMap = null
  }
  leafletMarker = null
}

function updateLeafletMarker() {
  const L = (window as any).L
  if (!leafletMap || !L || tempLat.value === null || tempLng.value === null) return
  if (leafletMarker) {
    leafletMarker.setLatLng([tempLat.value, tempLng.value])
  } else {
    leafletMarker = L.marker([tempLat.value, tempLng.value]).addTo(leafletMap)
  }
}

function closeH5MapPicker() {
  destroyLeafletMap()
  showH5MapPicker.value = false
}

async function confirmH5MapPicker() {
  if (h5Picking.value) return
  if (tempLat.value === null || tempLng.value === null) {
    uni.showToast({ title: '请先点击地图选择位置', icon: 'none' })
    return
  }

  h5Picking.value = true
  try {
    lat.value = tempLat.value
    lng.value = tempLng.value
    const addr = await reverseGeocode(tempLat.value, tempLng.value)
    if (addr.detail) locationDetail.value = addr.detail
    if (addr.district && districts.value.includes(addr.district)) {
      districtIndex.value = districts.value.indexOf(addr.district)
      await loadStreets(addr.district)
      if (addr.street && streets.value.includes(addr.street)) {
        streetIndex.value = streets.value.indexOf(addr.street)
      }
    }
    closeH5MapPicker()
  } finally {
    h5Picking.value = false
  }
}

onUnmounted(() => {
  destroyLeafletMap()
})

function onTitleInput() {
  if (errors.value.title) errors.value = { ...errors.value, title: undefined }
}

async function handleSubmit() {
  if (submitting.value) return
  const newErrors: typeof errors.value = {}
  if (!title.value.trim()) newErrors.title = '请填写事件标题'
  if (districts.value.length === 0) newErrors.district = '区县数据加载失败，请重试'
  if (Object.keys(newErrors).length > 0) {
    errors.value = newErrors
    return
  }

  submitting.value = true
  errors.value = {}
  try {
    await http.post('/events', {
      title: title.value.trim(),
      district: districts.value[districtIndex.value],
      street: streets.value[streetIndex.value] ?? null,
      location: locationDetail.value.trim() || null,
      lat: lat.value ?? null,
      lng: lng.value ?? null,
      level: level.value,
      status: 'pending',
      remark: remark.value.trim(),
      tenantId: auth.userInfo?.tenantId ?? 'shenzhen',
    } as Record<string, unknown>)
    uni.showToast({ title: '上报成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 300)
  } catch (err: any) {
    uni.showToast({ title: err.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

</script>

<template>
  <view class="page-aura">
    <view class="container">
      <view class="form-card animate-fade-up">

        <!-- 事件标题 -->
        <view class="field-group" :class="{ 'is-focus': focusField === 'title' }">
          <view class="field-label">
            <text class="required-label">事件标题</text>
          </view>
          <view class="input-block" :class="{ 'has-error': errors.title }">
            <input
              class="input-inner"
              placeholder="简要描述现场核心问题"
              placeholder-class="ph-style"
              v-model="title"
              @input="onTitleInput"
              @focus="focusField = 'title'"
              @blur="focusField = ''"
            />
          </view>
          <text v-if="errors.title" class="field-error">{{ errors.title }}</text>
        </view>

        <!-- 位置信息区域 -->
        <view class="field-group">
          <view class="field-label">
            <text class="required-label">位置信息</text>
          </view>

          <!-- 快捷定位按钮 -->
          <view class="locate-bar">
            <!-- <view class="locate-btn" :class="{ loading: locating }" @tap="locateByGPS">
              <text class="locate-icon">📍</text>
              <text>{{ locating ? '定位中...' : 'GPS定位' }}</text>
            </view> -->
            <view class="locate-btn" @tap="openMapPicker">
              <text class="locate-icon">🗺</text>
              <text>地图选点</text>
            </view>
          </view>

          <!-- 区县下拉 -->
          <view class="sub-label">区县</view>
          <picker mode="selector" :range="districts" :value="districtIndex" @change="onDistrictChange">
            <view class="input-block picker-trigger" :class="{ 'has-error': errors.district }">
              <text :class="['p-val', { 'p-placeholder': districts.length === 0 }]">
                {{ districts.length > 0 ? districts[districtIndex] : '加载中...' }}
              </text>
              <uni-icons type="arrow-right" size="14" color="#cbd5e1" />
            </view>
          </picker>
          <text v-if="errors.district" class="field-error">{{ errors.district }}</text>

          <!-- 街道下拉 -->
          <view class="sub-label" style="margin-top: 20rpx;">街道</view>
          <picker mode="selector" :range="streets" :value="streetIndex" @change="onStreetChange">
            <view class="input-block picker-trigger">
              <text :class="['p-val', { 'p-placeholder': streets.length === 0 }]">
                {{ streets.length > 0 ? streets[streetIndex] : '请先选择区县' }}
              </text>
              <uni-icons type="arrow-right" size="14" color="#cbd5e1" />
            </view>
          </picker>

          <!-- 详细位置 -->
          <view class="sub-label" style="margin-top: 20rpx;">详细位置</view>
          <view class="input-block" :class="{ 'is-focus': focusField === 'location' }">
            <input
              class="input-inner"
              placeholder="地图选点/GPS定位后自动填入，或手动输入"
              placeholder-class="ph-style"
              v-model="locationDetail"
              @focus="focusField = 'location'"
              @blur="focusField = ''"
            />
          </view>
        </view>

        <!-- 告警等级 -->
        <view class="field-group">
          <view class="field-label">
            <text class="required-label">告警等级</text>
          </view>
          <view class="level-tabs">
            <view
              v-for="opt in LEVEL_OPTIONS"
              :key="opt.value"
              class="tab-item"
              :class="[opt.value, { active: level === opt.value }]"
              @tap="level = opt.value"
            >
              <text>{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <!-- 详细备注 -->
        <view class="field-group" :class="{ 'is-focus': focusField === 'remark' }">
          <view class="field-label">详细情况补充</view>
          <view class="textarea-block">
            <textarea
              class="textarea-inner"
              placeholder="如有具体受损情况、人员伤亡等请补充..."
              placeholder-class="ph-style"
              v-model="remark"
              @focus="focusField = 'remark'"
              @blur="focusField = ''"
            />
          </view>
        </view>

        <!-- 操作区 -->
        <view class="footer-action">
          <button
            class="btn-aura-main"
            :loading="submitting"
            :disabled="submitting"
            @tap="handleSubmit"
          >
            {{ submitting ? '上报中...' : '确认上报' }}
          </button>
        </view>

      </view>
    </view>

    <view v-if="showH5MapPicker" class="h5-map-mask">
      <view class="h5-map-panel">
        <view class="h5-map-header">
          <text class="h5-map-title">地图选点</text>
          <text class="h5-map-close" @tap="closeH5MapPicker">关闭</text>
        </view>
        <view id="h5-map-picker" class="h5-map-container" />
        <text v-if="h5PickerError" class="h5-map-error">{{ h5PickerError }}</text>
        <view class="h5-map-actions">
          <button class="h5-map-btn ghost" @tap="closeH5MapPicker">取消</button>
          <button class="h5-map-btn primary" :loading="h5Picking" :disabled="h5Picking" @tap="confirmH5MapPicker">确认选点</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$radius-card: 48rpx;
$radius-comp: 24rpx;
$primary: #3482ff;

.page-aura {
  min-height: 100vh;
  background: var(--aura-bg);
  padding: 40rpx 0;
}

.container { padding: 40rpx; }

.form-card {
  background: var(--card-bg);
  border-radius: $radius-card;
  padding: 50rpx 40rpx;
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.field-group {
  margin-bottom: 44rpx;
  transition: all 0.3s ease;

  .field-label {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 20rpx;
    padding-left: 4rpx;
  }
}

.sub-label {
  font-size: 24rpx;
  color: var(--text-sub);
  margin-bottom: 12rpx;
  padding-left: 4rpx;
}

/* 快捷定位按钮 */
.locate-bar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.locate-btn {
  flex: 1;
  height: 80rpx;
  background: var(--input-bg);
  border-radius: $radius-comp;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  font-size: 26rpx;
  color: var(--text-sub);
  font-weight: 600;
  transition: all 0.2s;
  border: 2rpx solid transparent;

  &:active { transform: scale(0.97); }

  &.loading {
    opacity: 0.6;
    pointer-events: none;
  }

  .locate-icon { font-size: 28rpx; }
}

/* 块状输入 */
.input-block, .textarea-block {
  background: var(--input-bg);
  border-radius: $radius-comp;
  border: 2rpx solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-block {
  height: 104rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  .input-inner { flex: 1; font-size: 28rpx; color: var(--text-main); }
}

.picker-trigger {
  justify-content: space-between;
  .p-val { font-size: 28rpx; color: var(--text-main); }
  .p-placeholder { color: var(--text-muted); }
}

.textarea-block {
  padding: 24rpx 32rpx;
  .textarea-inner { width: 100%; height: 200rpx; font-size: 28rpx; line-height: 1.6; }
}

.is-focus {
  .input-block, .textarea-block {
    background: #fff;
    border-color: rgba(52, 130, 255, 0.3);
    box-shadow: 0 0 0 8rpx rgba(52, 130, 255, 0.05);
  }
}

.has-error {
  background: #fff !important;
  border-color: #e11d48 !important;
  box-shadow: 0 0 0 8rpx rgba(225, 29, 72, 0.06) !important;
}

.field-error {
  display: block;
  color: #e11d48;
  font-size: 22rpx;
  margin-top: 8rpx;
  padding-left: 4rpx;
}

/* 告警等级 */
.level-tabs {
  display: flex;
  gap: 16rpx;
  .tab-item {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--input-bg);
    border-radius: $radius-comp;
    font-size: 26rpx;
    color: var(--text-sub);
    font-weight: 600;
    transition: all 0.3s;

    &.active {
      transform: translateY(-4rpx);
      box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.04);
      &.high { background: #fff1f2; color: #e11d48; }
      &.mid  { background: #fff7ed; color: #ea580c; }
      &.low  { background: #f0f9ff; color: #0284c7; }
    }
  }
}

.footer-action { margin-top: 60rpx; }

.btn-aura-main {
  width: 100%;
  height: 108rpx;
  background: var(--primary-gradient);
  border-radius: 36rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 16rpx 32rpx rgba(52, 130, 255, 0.2);
  letter-spacing: 4rpx;

  &[disabled] { background: var(--primary-sub); opacity: 0.6; box-shadow: none; }
  &:active:not([disabled]) { transform: scale(0.98); }
}

.h5-map-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.h5-map-panel {
  width: 100%;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding: 24rpx;
  box-sizing: border-box;
}

.h5-map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.h5-map-title {
  font-size: 30rpx;
  color: #0f172a;
  font-weight: 700;
}

.h5-map-close {
  font-size: 24rpx;
  color: #64748b;
}

.h5-map-container {
  width: 100%;
  height: 480rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #f8fafc;
}

.h5-map-error {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #ef4444;
}

.h5-map-actions {
  margin-top: 20rpx;
  display: flex;
  gap: 16rpx;
}

.h5-map-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 14rpx;
  border: 0;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.h5-map-btn.ghost {
  background: #f1f5f9;
  color: #334155;
}

.h5-map-btn.primary {
  background: #3b82f6;
  color: #fff;
}
</style>
