<template>
  <view class="watch-container">
    <!-- 顶部状态栏 -->
    <view class="top-section">
      <view class="status-bar">
        <view class="bluetooth-status" :class="{ connected: isConnected }">
          <text class="status-icon">{{ isConnected ? '🔵' : '⚪' }}</text>
          <text class="status-text">
            {{ isConnected ? '已连接' : '未连接' }}
          </text>
          <text class="device-name" v-if="isConnected">{{ connectedDeviceName }}</text>
        </view>
        
        <view class="battery-indicator">
          <text class="battery-icon">🔋</text>
          <text class="battery-level">{{ batteryLevel }}%</text>
        </view>
      </view>
      
      <view class="action-buttons">
        <button class="btn btn-primary" @click="scanDevices" :disabled="scanning">
          {{ scanning ? '扫描中...' : '扫描设备' }}
        </button>
        <button class="btn btn-secondary" @click="disconnect" :disabled="!isConnected">
          断开连接
        </button>
      </view>
    </view>

    <!-- 中间数据显示区域 -->
    <view class="middle-section">
      <view class="data-display">
        <view class="data-header">
          <text class="section-title">数据通信</text>
          <text class="data-count">共 {{ dataList.length }} 条记录</text>
        </view>
        
        <scroll-view class="data-list" scroll-y="true">
          <view v-for="(item, index) in dataList" :key="index" 
                class="data-item" :class="item.type">
            <view class="data-meta">
              <text class="data-time">{{ item.time }}</text>
              <text class="data-type">{{ item.type === 'received' ? '接收' : '发送' }}</text>
            </view>
            <text class="data-content">{{ item.content }}</text>
          </view>
        </scroll-view>
      </view>
      
      <!-- 手表当前时间显示 -->
      <view class="watch-time" v-if="isConnected">
        <view class="time-header">
          <text class="time-title">手表当前时间</text>
        </view>
        <view class="time-content">
          <text class="time-value">{{ sensorData.time || '--' }}</text>
        </view>
      </view>
      
      <!-- 传感器数据显示 + 音乐控制 -->
      <view class="sensor-data" v-if="isConnected">
        <view class="sensor-grid">
          <view class="sensor-item">
            <text class="sensor-label">心率</text>
            <text class="sensor-value">{{ sensorData.heartRate ?? '--' }} BPM</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">血氧</text>
            <text class="sensor-value">{{ sensorData.spo2 ?? '--' }} %</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">步数</text>
            <text class="sensor-value">{{ sensorData.steps ?? '--' }}</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">步频</text>
            <text class="sensor-value">{{ sensorData.cadence ?? '--' }} 步/分钟</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">温度</text>
            <text class="sensor-value">{{ sensorData.temperature ?? '--' }} °C</text>
          </view>
        </view>

        <view class="music-panel">
          <view class="music-row">
            <view class="music-status">
              <text class="music-label">当前节奏</text>
              <text class="music-value">
                {{ currentMusicCategoryLabel }} 
                <text v-if="currentHeartRate">（HR {{ currentHeartRate }}）</text>
              </text>
            </view>
            <view class="music-status">
              <text class="music-label">自动适配</text>
              <switch :checked="!manualOverride" @change="toggleManualOverride" />
            </view>
          </view>

          <view class="music-row">
            <view class="music-status">
              <text class="music-label">当前曲目</text>
              <text class="music-value">
                {{ currentTrackName || '未选择' }}
              </text>
            </view>
            <view class="music-controls">
              <button class="like-btn" @click="toggleLike" :disabled="!currentTrackName">
                <text class="like-icon" :class="{ liked: isLiked }">{{ isLiked ? '❤️' : '🤍' }}</text>
              </button>
              <button class="music-btn" @click="playPrevTrack" :disabled="!canControlTrack">«</button>
              <button class="music-btn main" @click="togglePlayPause" :disabled="!canControlTrack && !canStartPlay">
                {{ isPlaying ? '暂停' : '播放' }}
              </button>
              <button class="music-btn" @click="playNextTrack" :disabled="!canControlTrack">»</button>
            </view>
          </view>

          <view class="music-row thresholds-row">
            <view class="threshold-item" v-for="item in thresholdDisplayList" :key="item.key">
              <text class="music-label">{{ item.label }}</text>
              <text class="music-value">{{ item.rangeText }}</text>
            </view>
          </view>

          <view class="music-row manual-row">
            <text class="music-label">手动节奏</text>
            <picker mode="selector" :range="musicCategoryOptions" range-key="label" @change="onManualCategoryChange">
              <view class="manual-picker">
                <text class="music-value">
                  {{ manualCategoryLabel }}
                </text>
              </view>
            </picker>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { saveConnectedDevice, getLastConnectedDevice } from '../../utils/bluetoothStorage'
import { uploadInitialInfo, uploadStatusInfo, formatDataForLog } from '../../utils/serverApi'

// 状态管理
const isConnected = ref(false)
const scanning = ref(false)
const batteryLevel = ref(100)
const connectedDeviceName = ref('')
const discoveredDevices = ref([])
let scanStopTimer = null
<<<<<<< HEAD

// 步频计算相关
const stepHistory = ref([]) // 存储最近5秒内的步数记录 [{timestamp: number, steps: number}]
const CADENCE_TIME_WINDOW = 5000 // 步频计算的时间窗口（毫秒）
let cadenceUpdateTimer = null
=======
>>>>>>> 46759be6cfa9bc7c24047878629ebe0bbf27e5a4

// 数据列表
const dataList = ref([])

// 传感器数据
const sensorData = reactive({
  heartRate: null,
  spo2: null,
  steps: null,
  temperature: null,
  time: null,
  cadence: null // 步频（步/分钟）
})

// 心率与音乐映射
const HR_TOLERANCE = 3 // 心率小幅波动阈值（bpm）
const CATEGORY_SWITCH_DELAY = 30000 // 连续跨区间30秒后切换

const currentHeartRate = ref(null)
const currentMusicCategory = ref('none') // slow / mid / midfast / fast / veryfast / none
const manualOverride = ref(false)
const manualCategory = ref('slow')
const isPlaying = ref(false)
const currentTrackName = ref('')
const isLiked = ref(false)
const musicPlayTime = ref(0) // 音乐播放时间（秒）
let musicPlayTimer = null
let musicStartTime = null

let lastHeartRate = null
let pendingCategory = null
let pendingStartTime = null

// 心率阈值，可根据个人调整并持久化
const hrThresholds = reactive({
  slow: { min: 60, max: 80 },
  mid: { min: 80, max: 96 },
  midfast: { min: 96, max: 120 },
  fast: { min: 120, max: 144 },
  veryfast: { min: 144, max: 999 }
})

// 1. 定义音乐数据库（手动录入或从外部 js 导入，替代 txt 文件读取）
// 请确保文件名与你 static 文件夹下的实际文件名一致
const musicDatabase = {
  slow: [
    { file: 'slow_song_1.mp3', bpm: 65 }
  ],
  mid: [
    { file: 'mid_song_1.mp3', bpm: 80 },
    { file: 'mid_song_2.mp3', bpm: 81 },
	{ file: 'mid_song_3.mp3', bpm: 82 },
	{ file: 'mid_song_4.mp3', bpm: 83 },
	{ file: 'mid_song_5.mp3', bpm: 84 },
	{ file: 'mid_song_6.mp3', bpm: 85 },
	{ file: 'mid_song_7.mp3', bpm: 86 },
	{ file: 'mid_song_8.mp3', bpm: 87 },
	{ file: 'mid_song_9.mp3', bpm: 88 },
	{ file: 'mid_song_10.mp3', bpm: 89 },
	{ file: 'mid_song_11.mp3', bpm: 90 },
	{ file: 'mid_song_12.mp3', bpm: 91 },
	{ file: 'mid_song_13.mp3', bpm: 92 },
	{ file: 'mid_song_14.mp3', bpm: 93 },
	{ file: 'mid_song_15.mp3', bpm: 94 },
	{ file: 'mid_song_16.mp3', bpm: 95 },
	{ file: 'mid_song_17.mp3', bpm: 96 },
	{ file: 'mid_song_18.mp3', bpm: 97 },
	{ file: 'mid_song_19.mp3', bpm: 98 },
	{ file: 'mid_song_20.mp3', bpm: 99 },
	{ file: 'mid_song_21.mp3', bpm: 99 },
	{ file: 'mid_song_22.mp3', bpm: 90 },
	{ file: 'mid_song_23.mp3', bpm: 90 },
	{ file: 'mid_song_24.mp3', bpm: 90 },
	{ file: 'mid_song_25.mp3', bpm: 90 },
	{ file: 'mid_song_26.mp3', bpm: 90 },
	{ file: 'mid_song_27.mp3', bpm: 90 },
	{ file: 'mid_song_28.mp3', bpm: 90 },
	{ file: 'mid_song_29.mp3', bpm: 90 },
	{ file: 'mid_song_30.mp3', bpm: 90 }
  ],
  midfast: [
    { file: 'midfast_song_1.mp3', bpm: 100 },
    { file: 'midfast_song_2.mp3', bpm: 101 },
	{ file: 'midfast_song_3.mp3', bpm: 102 },
	{ file: 'midfast_song_4.mp3', bpm: 103 },
	{ file: 'midfast_song_5.mp3', bpm: 104 },
	{ file: 'midfast_song_6.mp3', bpm: 105 },
	{ file: 'midfast_song_7.mp3', bpm: 106 },
	{ file: 'midfast_song_8.mp3', bpm: 107 },
	{ file: 'midfast_song_9.mp3', bpm: 108 },
	{ file: 'midfast_song_10.mp3', bpm: 109 },
	{ file: 'midfast_song_11.mp3', bpm: 110 },
	{ file: 'midfast_song_12.mp3', bpm: 111 },
	{ file: 'midfast_song_13.mp3', bpm: 112 },
	{ file: 'midfast_song_14.mp3', bpm: 113 },
	{ file: 'midfast_song_15.mp3', bpm: 114 },
	{ file: 'midfast_song_16.mp3', bpm: 115 },
	{ file: 'midfast_song_17.mp3', bpm: 116 },
	{ file: 'midfast_song_18.mp3', bpm: 117 },
	{ file: 'midfast_song_19.mp3', bpm: 118 },
	{ file: 'midfast_song_20.mp3', bpm: 119 },
	{ file: 'midfast_song_21.mp3', bpm: 119 },
	{ file: 'midfast_song_22.mp3', bpm: 119 },
	{ file: 'midfast_song_23.mp3', bpm: 119 },
	{ file: 'midfast_song_24.mp3', bpm: 119 },
	{ file: 'midfast_song_25.mp3', bpm: 119 },
	{ file: 'midfast_song_26.mp3', bpm: 119 },
  ],
  fast: [
    { file: 'fast_song_1.mp3', bpm: 120 },
    { file: 'fast_song_2.mp3', bpm: 121 },
	{ file: 'fast_song_3.mp3', bpm: 122 },
	{ file: 'fast_song_4.mp3', bpm: 123 },
	{ file: 'fast_song_5.mp3', bpm: 124 },
	{ file: 'fast_song_6.mp3', bpm: 125 },
	{ file: 'fast_song_7.mp3', bpm: 126 },
	{ file: 'fast_song_8.mp3', bpm: 127 },
	{ file: 'fast_song_9.mp3', bpm: 128 },
	{ file: 'fast_song_10.mp3', bpm: 129 },
	{ file: 'fast_song_11.mp3', bpm: 130 },
	{ file: 'fast_song_12.mp3', bpm: 131 },
	{ file: 'fast_song_13.mp3', bpm: 132 },
	{ file: 'fast_song_14.mp3', bpm: 133 },
	{ file: 'fast_song_15.mp3', bpm: 134 },
	{ file: 'fast_song_16.mp3', bpm: 135 }
  ],
  veryfast: [
    { file: 'veryfast_song_1.mp3', bpm: 140 },
    { file: 'veryfast_song_2.mp3', bpm: 141 },
	{ file: 'veryfast_song_3.mp3', bpm: 142 },
	{ file: 'veryfast_song_4.mp3', bpm: 143 },
	{ file: 'veryfast_song_5.mp3', bpm: 144 },
	{ file: 'veryfast_song_6.mp3', bpm: 145 },
	{ file: 'veryfast_song_7.mp3', bpm: 146 },
	{ file: 'veryfast_song_8.mp3', bpm: 147 },
	{ file: 'veryfast_song_9.mp3', bpm: 148 },
	{ file: 'veryfast_song_10.mp3', bpm: 149 },
	{ file: 'veryfast_song_11.mp3', bpm: 150 },
	{ file: 'veryfast_song_12.mp3', bpm: 151 },
	{ file: 'veryfast_song_13.mp3', bpm: 152 },
	{ file: 'veryfast_song_14.mp3', bpm: 153 },
	{ file: 'veryfast_song_15.mp3', bpm: 154 },
	{ file: 'veryfast_song_16.mp3', bpm: 155 },
	{ file: 'veryfast_song_17.mp3', bpm: 156 },
	{ file: 'veryfast_song_18.mp3', bpm: 157 },
	{ file: 'veryfast_song_19.mp3', bpm: 158 },
	{ file: 'veryfast_song_20.mp3', bpm: 159 },
	{ file: 'veryfast_song_21.mp3', bpm: 160 },
	{ file: 'veryfast_song_22.mp3', bpm: 161 },
	{ file: 'veryfast_song_23.mp3', bpm: 162 },
	{ file: 'veryfast_song_24.mp3', bpm: 163 },
	{ file: 'veryfast_song_25.mp3', bpm: 164 },
	{ file: 'veryfast_song_26.mp3', bpm: 165 },
	{ file: 'veryfast_song_27.mp3', bpm: 166 },
	{ file: 'veryfast_song_28.mp3', bpm: 167 }
  ]
}



// 音乐库配置（从各自 bpm_list.txt 动态读取）
// App 真机建议将 Music 文件夹放在 static 目录下，运行时通过 static/Music/... 访问
const musicLibrary = reactive({
  slow: {
    folder: '/static/Music/000-079_BPM_slow/', 
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  mid: {
    folder: '/static/Music/080-099_BPM_mid/',
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  midfast: {
    folder: '/static/Music/100-119_BPM_midfast/',
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  fast: {
    folder: '/static/Music/120-139_BPM_fast/',
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  veryfast: {
    folder: '/static/Music/140+_BPM_veryfast/',
    tracks: [],
    loaded: false,
    currentIndex: -1
  }
})

let audioCtx = null

const musicCategoryOptions = [
  { value: 'slow', label: '慢速 slow' },
  { value: 'mid', label: '中速 mid' },
  { value: 'midfast', label: '中快 midfast' },
  { value: 'fast', label: '快速 fast' },
  { value: 'veryfast', label: '超快 veryfast' }
]

const thresholdDisplayList = computed(() => [
  { key: 'slow', label: 'Slow', rangeText: `${hrThresholds.slow.min}-${hrThresholds.slow.max}` },
  { key: 'mid', label: 'Mid', rangeText: `${hrThresholds.mid.min}-${hrThresholds.mid.max}` },
  { key: 'midfast', label: 'Mid-fast', rangeText: `${hrThresholds.midfast.min}-${hrThresholds.midfast.max}` },
  { key: 'fast', label: 'Fast', rangeText: `${hrThresholds.fast.min}-${hrThresholds.fast.max}` },
  { key: 'veryfast', label: 'Very fast', rangeText: `${hrThresholds.veryfast.min}+` }
])

const currentMusicCategoryLabel = computed(() => {
  const map = {
    none: '未播放',
    slow: '慢速 slow',
    mid: '中速 mid',
    midfast: '中快 midfast',
    fast: '快速 fast',
    veryfast: '超快 veryfast'
  }
  return map[currentMusicCategory.value] || '未播放'
})

const manualCategoryLabel = computed(() => {
  const found = musicCategoryOptions.find(i => i.value === manualCategory.value)
  return found ? found.label : '请选择'
})

const canControlTrack = computed(() => {
  const cfg = musicLibrary[currentMusicCategory.value]
  return !!(cfg && cfg.tracks && cfg.tracks.length > 0 && cfg.currentIndex >= 0)
})

const canStartPlay = computed(() => {
  const cfg = musicLibrary[currentMusicCategory.value]
  return !!(cfg && cfg.tracks && cfg.tracks.length > 0)
})

// 蓝牙设备相关变量
let bluetoothDevice = null
let writeServiceId = null
let writeCharId = null
let notifyServiceId = null
let notifyCharId = null
let receiveBuffer = ''	//接收数据缓冲区

// 生命周期
onMounted(() => {
  initBluetooth()
  startBatteryMonitoring()
  autoConnectDevice()
})

onUnmounted(() => {
  disconnect()
  stopMusicPlayTimer()
})

// 初始化蓝牙
const initBluetooth = async () => {
  try {
    await new Promise((resolve, reject) => {
      uni.openBluetoothAdapter({
        success: resolve,
        fail: reject
      })
    })
    console.log('蓝牙适配器初始化成功')
    addLog('系统', '蓝牙适配器已就绪', 'system')
  } catch (error) {
    console.error('蓝牙初始化失败', error)
    uni.showToast({
      title: '蓝牙初始化失败',
      icon: 'none'
    })
  }
}

// 自动连接设备
const autoConnectDevice = async () => {
  const lastDevice = getLastConnectedDevice()
  if (!lastDevice || !lastDevice.deviceId) {
    return
  }
  
  // 延迟一下，确保蓝牙适配器已初始化
  setTimeout(async () => {
    try {
      await new Promise((resolve, reject) => {
        uni.openBluetoothAdapter({
          success: resolve,
          fail: reject
        })
      })
      
      // 开始扫描
      scanning.value = true
      discoveredDevices.value = []
      
      await new Promise((resolve, reject) => {
        uni.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
          success: resolve,
          fail: reject
        })
      })
      
      // 监听发现设备
      const foundDeviceHandler = (devices) => {
        const list = devices.devices || []
        const targetDevice = list.find(d => d.deviceId === lastDevice.deviceId)
        
        if (targetDevice) {
          uni.stopBluetoothDevicesDiscovery()
          uni.offBluetoothDeviceFound(foundDeviceHandler)
          scanning.value = false
          
          connectToDevice({
            deviceId: targetDevice.deviceId,
            name: targetDevice.name || targetDevice.localName || lastDevice.name
          })
        }
      }
      
      uni.onBluetoothDeviceFound(foundDeviceHandler)
      
      // 6秒后停止扫描
      scanStopTimer = setTimeout(() => {
        uni.stopBluetoothDevicesDiscovery()
        uni.offBluetoothDeviceFound(foundDeviceHandler)
        scanning.value = false
      }, 6000)
      
    } catch (error) {
      console.error('自动连接失败', error)
      scanning.value = false
    }
  }, 1000)
}

// 扫描设备
const scanDevices = async () => {
  if (scanning.value) return
  
  scanning.value = true
  addLog('系统', '开始扫描设备...', 'system')
  discoveredDevices.value = []
  
  try {
    // 确保蓝牙适配器已打开（多次调用 openBluetoothAdapter 是安全的）
    try {
      await new Promise((resolve, reject) => {
        uni.openBluetoothAdapter({
          success: resolve,
          fail: (err) => {
            console.error('重新打开蓝牙适配器失败', err)
            resolve() // 忽略错误，交由后续扫描报错提示
          }
        })
      })
    } catch (e) {}

    await new Promise((resolve, reject) => {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: resolve,
        fail: reject
      })
    })
    
    // 监听发现设备
    uni.onBluetoothDeviceFound((devices) => {
      const list = devices.devices || []
      list.forEach(d => {
        const name = d.name || d.localName || ''
        if (!name) return
        if (!discoveredDevices.value.find(x => x.deviceId === d.deviceId)) {
          discoveredDevices.value.push({ deviceId: d.deviceId, name })
        }
      })
    })
    
    // 6秒后停止扫描并选择设备
    scanStopTimer && clearTimeout(scanStopTimer)
    scanStopTimer = setTimeout(() => {
      try { uni.stopBluetoothDevicesDiscovery() } catch (e) {}
      scanning.value = false
      addLog('系统', `设备扫描完成，发现 ${discoveredDevices.value.length} 台`, 'system')
      if (discoveredDevices.value.length > 0) {
        uni.showActionSheet({
          itemList: discoveredDevices.value.map(d => d.name),
          success: (res) => {
            const idx = res.tapIndex
            const dev = discoveredDevices.value[idx]
            if (dev) connectToDevice(dev)
          }
        })
      } else {
        uni.showToast({ title: '未发现设备', icon: 'none' })
      }
    }, 6000)
    
  } catch (error) {
    console.error('扫描设备失败', error)
    scanning.value = false
    uni.showToast({
      title: '扫描失败',
      icon: 'none'
    })
  }
}

// 连接设备
const connectToDevice = async (device) => {
  try {
    addLog('系统', `尝试连接: ${device.name}`, 'system')
    
    await new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId: device.deviceId,
        timeout: 15000,
        success: resolve,
        fail: reject
      })
    })
    
    bluetoothDevice = device
    isConnected.value = true
    connectedDeviceName.value = device.name
    
    // 保存连接的设备信息
    saveConnectedDevice(device)
    
    // 获取服务
    const servicesRes = await new Promise((resolve, reject) => {
      uni.getBLEDeviceServices({
        deviceId: device.deviceId,
        success: resolve,
        fail: reject
      })
    })
    const services = servicesRes.services || []
    
    writeServiceId = null
    writeCharId = null
    notifyServiceId = null
    notifyCharId = null
    
    for (const svc of services) {
      const charsRes = await new Promise((resolve, reject) => {
        uni.getBLEDeviceCharacteristics({
          deviceId: device.deviceId,
          serviceId: svc.uuid,
          success: resolve,
          fail: reject
        })
      })
      const chars = charsRes.characteristics || []
      chars.forEach(ch => {
        const props = ch.properties || {}
        if (!writeCharId && (props.write || props.writeNoResponse)) {
          writeServiceId = svc.uuid
          writeCharId = ch.uuid
        }
        if (!notifyCharId && (props.notify || props.indicate)) {
          notifyServiceId = svc.uuid
          notifyCharId = ch.uuid
        }
      })
    }
    
    if (notifyServiceId && notifyCharId) {
      await new Promise((resolve, reject) => {
        uni.notifyBLECharacteristicValueChange({
          deviceId: device.deviceId,
          serviceId: notifyServiceId,
          characteristicId: notifyCharId,
          state: true,
          success: resolve,
          fail: reject
        })
      })
      uni.onBLECharacteristicValueChange((res) => {
        const data = ab2str(res.value)
        handleReceivedData(data)
      })
    } else {
      addLog('系统', '未找到可通知的特征，可能无法接收数据', 'system')
    }
    
    addLog('系统', '设备连接成功', 'system')
    uni.showToast({
      title: '连接成功',
      icon: 'success'
    })
    // 默认播放一段中速节奏音乐，作为正常心率的背景
    switchMusicCategory('mid')
    
  } catch (error) {
    console.error('连接设备失败', error)
    uni.showToast({
      title: '连接失败',
      icon: 'none'
    })
  }
}

// 断开连接
const disconnect = async () => {
  if (bluetoothDevice) {
    try {
      await new Promise((resolve) => {
        uni.closeBLEConnection({
          deviceId: bluetoothDevice.deviceId,
          complete: resolve
        })
      })
    } catch (error) {
      console.error('断开连接失败', error)
    }
  }
  
  isConnected.value = false
  connectedDeviceName.value = ''
  bluetoothDevice = null
  writeServiceId = null
  writeCharId = null
  notifyServiceId = null
  notifyCharId = null
<<<<<<< HEAD
  // 清空步数历史记录
  stepHistory.value = []
  // 重置步频数据
  sensorData.cadence = null
=======
>>>>>>> 46759be6cfa9bc7c24047878629ebe0bbf27e5a4
  addLog('系统', '设备已断开', 'system')
  uni.showToast({
    title: '已断开',
    icon: 'none'
  })
}


// 处理接收到的数据（已修复分包粘包问题）
const handleReceivedData = (data) => {
  if (!data) return
  
  // 1. 将新收到的数据拼接到缓冲区
  receiveBuffer += String(data)
  
  // 2. 检查缓冲区是否存在换行符（假设设备以 \n 或 \r\n 结尾）
  let newlineIndex = receiveBuffer.indexOf('\n')
  
  // 3. 循环处理所有完整的行
  while (newlineIndex !== -1) {
    // 截取完整的一行
    let line = receiveBuffer.substring(0, newlineIndex).trim()
    
    // 从缓冲区移除已处理的行（包括换行符）
    receiveBuffer = receiveBuffer.substring(newlineIndex + 1)
    
    // 如果行不为空，进行解析
    if (line) {
      // 在这里打印日志，这样看到的就是完整的 "heartRate:56" 而不是碎皮
      addLog(line, 'received') 
      parseDeviceLine(line)
    }
    
    // 继续查找下一行（防止一次收到多条指令粘连）
    newlineIndex = receiveBuffer.indexOf('\n')
  }
}

// 解析完整的一行数据
const parseDeviceLine = (line) => {
  // --- 1. 音乐控制指令区域 ---
  
  // 播放指令
  if (line.startsWith('MUSIC:PLAY')) {
    // 只有当前是暂停状态才执行播放，防止重复触发
    if (!isPlaying.value) {
      console.log('收到远程指令: 播放')
      togglePlayPause()
    }
    return
  }

  // 暂停指令
  if (line.startsWith('MUSIC:PAUSE')) {
    // 只有当前是播放状态才执行暂停
    if (isPlaying.value) {
      console.log('收到远程指令: 暂停')
      togglePlayPause()
    }
    return
  }

  // 下一首指令
  if (line.startsWith('MUSIC:NEXT')) {
    console.log('收到远程指令: 下一首')
    playNextTrack()
    return
  }

  // 上一首指令
  if (line.startsWith('MUSIC:PREV')) {
    console.log('收到远程指令: 上一首')
    playPrevTrack()
    return
  }

  // --- 2. 传感器数据解析区域 (保持原有逻辑) ---

    // 心率
  if (line.startsWith('HR:')) {
    const hrStr = line.split(':')[1]
    const hr = parseInt(hrStr, 10)
    if (!isNaN(hr)) {
      sensorData.heartRate = hr
      onHeartRateUpdate(hr)
    }
    return
  }
  
  // 兼容其他格式的心率
  if (/^Heart\s*Rate/i.test(line)) {
    const match = line.match(/(\d+)/)
    if (match) {
      const hr = parseInt(match[1], 10)
      if (!isNaN(hr)) {
        sensorData.heartRate = hr
        onHeartRateUpdate(hr)
      }
    }
    return
  }

  // 时间
  if (/TIME:/i.test(line) || /time:/i.test(line)) {
    const timeStr = line.split(':')[1]?.trim()
    if (timeStr) {
      sensorData.time = timeStr
    }
    return
  }

  // 血氧
  if (/SPO2/i.test(line)) {
    const match = line.match(/(\d+)/)
    if (match) {
      sensorData.spo2 = match[1]
      // 某些设备可能发送 SPO2:99%
      sensorData.spo2 = sensorData.spo2.replace('%', '') 
    }
    return
  }

  // 步数
  if (/STEPS/i.test(line) || /Step\s+today/i.test(line)) {
    const match = line.match(/(\d+)/)
    if (match) {
<<<<<<< HEAD
      const newSteps = parseInt(match[1], 10)
      if (!isNaN(newSteps)) {
        sensorData.steps = newSteps
        // 更新步数历史记录并计算步频
        updateStepHistory(newSteps)
      }
=======
      sensorData.steps = match[1]
>>>>>>> 46759be6cfa9bc7c24047878629ebe0bbf27e5a4
    }
    return
  }

  // 温度
  if (/TEMP/i.test(line) || /temperature/i.test(line)) {
    const match = line.match(/(\d+(\.\d+)?)/)
    if (match) {
      sensorData.temperature = match[1]
    }
    return
  }
}
// 添加日志
const addLog = (content, type = 'received') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  dataList.value.unshift({
    content,
    type,
    time
  })
  
  // 限制日志数量
  if (dataList.value.length > 100) {
    dataList.value = dataList.value.slice(0, 100)
  }
}

// 电池监控
const startBatteryMonitoring = () => {
  // 模拟电池电量变化
  setInterval(() => {
    batteryLevel.value = Math.max(10, batteryLevel.value - 0.1)
  }, 60000)
}

<<<<<<< HEAD
// 更新步数历史记录并计算步频
const updateStepHistory = (steps) => {
  const now = Date.now()
  
  // 添加新的步数记录
  stepHistory.value.push({ timestamp: now, steps })
  
  // 移除超过5秒时间窗口的记录
  const cutoffTime = now - CADENCE_TIME_WINDOW
  stepHistory.value = stepHistory.value.filter(item => item.timestamp >= cutoffTime)
  
  // 计算步频
  calculateCadence()
}

// 计算步频（步/分钟）
const calculateCadence = () => {
  if (stepHistory.value.length < 2) {
    // 数据不足，无法计算步频
    return
  }
  
  const firstRecord = stepHistory.value[0]
  const lastRecord = stepHistory.value[stepHistory.value.length - 1]
  const timeDiff = lastRecord.timestamp - firstRecord.timestamp // 毫秒
  const stepDiff = lastRecord.steps - firstRecord.steps
  
  if (timeDiff <= 0 || stepDiff <= 0) {
    // 时间差或步数差无效
    return
  }
  
  // 计算步频：(步数差 / 时间差) * 60000毫秒 = 步/分钟
  // 或简化为：(步数差 * 60) / (时间差 / 1000) = 步/分钟
  const cadence = Math.round((stepDiff * 60000) / timeDiff)
  sensorData.cadence = cadence
  
  // 打印步频信息（调试用）
  console.log(`步频计算：${stepDiff}步 / ${timeDiff/1000}秒 = ${cadence}步/分钟`)
}

=======
>>>>>>> 46759be6cfa9bc7c24047878629ebe0bbf27e5a4
// 上传当前状态信息到服务器
const uploadCurrentStatus = async () => {
  const statusData = {
    heartRate: sensorData.heartRate || '--',
    spo2: sensorData.spo2 || '--',
    steps: sensorData.steps || '--',
    cadence: sensorData.cadence || '--', // 添加步频数据
    temperature: sensorData.temperature || '--',
    currentTrackName: currentTrackName.value || '未选择',
    musicCategory: currentMusicCategoryLabel.value,
    musicPlayTime: musicPlayTime.value,
    isLiked: isLiked.value ? '是' : '否'
  }
  
  // 打印到控制台
  console.log('========== 用户状态信息 ==========')
  console.log(formatDataForLog(statusData))
  console.log('================================')
  
  // 上传到服务器
  try {
    await uploadStatusInfo(statusData)
    console.log('状态信息上传成功')
  } catch (error) {
    console.error('状态信息上传失败:', error)
  }
}

// 工具函数
const str2ab = (str) => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).buffer
  } else {
    const buffer = new ArrayBuffer(str.length)
    const dataView = new DataView(buffer)
    for (let i = 0; i < str.length; i++) {
      dataView.setUint8(i, str.charCodeAt(i))
    }
    return buffer
  }
}

const ab2str = (buffer) => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(new Uint8Array(buffer))
  } else {
    return String.fromCharCode.apply(null, new Uint8Array(buffer))
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 心率变化 -> 音乐类型决策
const onHeartRateUpdate = (hr) => {
  currentHeartRate.value = hr

  // 小幅波动，保持当前类型
  if (lastHeartRate !== null && Math.abs(hr - lastHeartRate) <= HR_TOLERANCE) {
    lastHeartRate = hr
    return
  }
  lastHeartRate = hr

  const targetCategory = getCategoryByHeartRate(hr)
  if (!targetCategory) return

  // 手动覆盖时不自动切换
  if (manualOverride.value) return

  const now = Date.now()

  if (targetCategory === currentMusicCategory.value) {
    // 已是当前类型，清除待切换状态
    pendingCategory = null
    pendingStartTime = null
    return
  }

  if (pendingCategory !== targetCategory) {
    pendingCategory = targetCategory
    pendingStartTime = now
    return
  }

  if (now - pendingStartTime >= CATEGORY_SWITCH_DELAY) {
    switchMusicCategory(targetCategory)
    pendingCategory = null
    pendingStartTime = null
  }
}

const getCategoryByHeartRate = (hr) => {
  if (hr < hrThresholds.slow.min) {
    return 'none'
  }
  if (hr >= hrThresholds.slow.min && hr < hrThresholds.slow.max) {
    return 'slow'
  }
  if (hr >= hrThresholds.mid.min && hr < hrThresholds.mid.max) {
    return 'mid'
  }
  if (hr >= hrThresholds.midfast.min && hr < hrThresholds.midfast.max) {
    return 'midfast'
  }
  if (hr >= hrThresholds.fast.min && hr < hrThresholds.fast.max) {
    return 'fast'
  }
  if (hr >= hrThresholds.veryfast.min) {
    return 'veryfast'
  }
  return 'none'
}

const ensureAudioContext = () => {
  if (!audioCtx) {
    audioCtx = uni.createInnerAudioContext()
    audioCtx.autoplay = false
    audioCtx.loop = true
    audioCtx.onPlay(() => {
      isPlaying.value = true
      startMusicPlayTimer()
    })
    audioCtx.onPause(() => {
      isPlaying.value = false
      stopMusicPlayTimer()
    })
    audioCtx.onStop(() => {
      isPlaying.value = false
      stopMusicPlayTimer()
      musicPlayTime.value = 0
    })
    audioCtx.onEnded(() => {
      isPlaying.value = false
      stopMusicPlayTimer()
      musicPlayTime.value = 0
    })
    audioCtx.onError((err) => {
      console.error('音乐播放错误', err)
      addLog('系统', '音乐播放出错', 'system')
      isPlaying.value = false
      stopMusicPlayTimer()
    })
  }
}

// 开始音乐播放时间计时
const startMusicPlayTimer = () => {
  stopMusicPlayTimer()
  musicStartTime = Date.now()
  musicPlayTimer = setInterval(() => {
    if (musicStartTime) {
      musicPlayTime.value = Math.floor((Date.now() - musicStartTime) / 1000)
    }
  }, 1000)
}

// 停止音乐播放时间计时
const stopMusicPlayTimer = () => {
  if (musicPlayTimer) {
    clearInterval(musicPlayTimer)
    musicPlayTimer = null
  }
  musicStartTime = null
}

// 切换喜欢状态
const toggleLike = async () => {
  if (!currentTrackName.value) return
  isLiked.value = !isLiked.value
  // 喜欢/取消喜欢时上传状态信息
  await uploadCurrentStatus()
}

// 上传状态信息到服务器（旧函数，已替换为uploadCurrentStatus）
const uploadStatusInfoOld = async () => {
  const statusData = {
    heartRate: sensorData.heartRate || '--',
    spo2: sensorData.spo2 || '--',
    steps: sensorData.steps || '--',
    temperature: sensorData.temperature || '--',
    currentTrackName: currentTrackName.value || '未选择',
    musicCategory: currentMusicCategoryLabel.value,
    musicPlayTime: musicPlayTime.value,
    isLiked: isLiked.value ? '是' : '否'
  }
  
  // 打印到控制台
  console.log('========== 用户状态信息 ==========')
  console.log(formatDataForLog(statusData))
  console.log('================================')
  
  // 上传到服务器
  try {
    await uploadToServer(statusData)
    console.log('状态信息上传成功')
  } catch (error) {
    console.error('状态信息上传失败:', error)
  }
}

// 从 bpm_list.txt 载入指定类型的曲目列表（App 真机走本地文件系统）
// 修改后的加载函数
const loadCategoryTracks = (category) => {
  return new Promise((resolve) => {
    const cfg = musicLibrary[category]
    // 从预定义的数据库中获取数据
    const tracks = musicDatabase[category] || []
    
    if (tracks.length > 0) {
      cfg.tracks = tracks
      cfg.loaded = true
      console.log(`分类 ${category} 加载了 ${tracks.length} 首歌曲`)
    } else {
      console.warn(`分类 ${category} 没有定义歌曲`)
      addLog('系统', `分类 ${category} 暂无歌曲配置`, 'system')
    }
    resolve()
  })
}

const switchMusicCategory = async (category) => {
  const cfg = musicLibrary[category]
  if (!cfg) {
    addLog('系统', `未知音乐类型: ${category}`, 'system')
    return
  }

  if (!cfg.loaded) {
    try {
      await loadCategoryTracks(category)
    } catch (e) {
      currentMusicCategory.value = 'none'
      return
    }
  }

  if (!cfg.tracks || cfg.tracks.length === 0) {
    addLog('系统', `当前类型(${category})暂无可用曲目`, 'system')
    currentMusicCategory.value = 'none'
    return
  }
  // 随机选择一首作为当前曲目
  const idx = Math.floor(Math.random() * cfg.tracks.length)
  await playTrackByIndex(category, idx)
}

const playTrackByIndex = async (category, index) => {
  const cfg = musicLibrary[category]
  if (!cfg || !cfg.tracks || cfg.tracks.length === 0) {
    return
  }
  const total = cfg.tracks.length
  let idx = index
  if (idx < 0) idx = total - 1
  if (idx >= total) idx = 0
  
  // 如果是切换歌曲，先上传当前状态信息
  if (currentTrackName.value) {
    await uploadCurrentStatus()
  }
  
  cfg.currentIndex = idx
  const track = cfg.tracks[idx]
  
  ensureAudioContext()
  
  // 重置播放时间和喜欢状态
  stopMusicPlayTimer()
  musicPlayTime.value = 0
  isLiked.value = false
  
  // 关键修正：确保路径拼接正确
  // cfg.folder 已经是 '/static/...'
  const fullPath = cfg.folder + track.file
  
  console.log('准备播放:', fullPath) // 调试用
  
  audioCtx.src = fullPath
  audioCtx.play()
  
  isPlaying.value = true // 强制设为 true，有时 onPlay 回调有延迟
  currentMusicCategory.value = category
  currentTrackName.value = track.file
  addLog('系统', `切换至 ${category}：${track.file} (${track.bpm} BPM)`, 'system')
}

// UI：自动/手动切换
const toggleManualOverride = (e) => {
  manualOverride.value = !e.detail.value ? true : false
  // switch 的 checked 表示“自动适配启用”，因此需要反转含义
  if (!manualOverride.value && currentHeartRate.value !== null) {
    // 恢复自动时立即按照当前心率校正一次
    const cat = getCategoryByHeartRate(currentHeartRate.value)
    if (cat && cat !== 'none') {
      switchMusicCategory(cat)
    }
  }
}

const onManualCategoryChange = (e) => {
  const idx = Number(e.detail.value)
  const item = musicCategoryOptions[idx]
  if (!item) return
  manualCategory.value = item.value
  manualOverride.value = true
  switchMusicCategory(item.value)
}

// 播放/暂停与上下曲
const togglePlayPause = async () => {
  ensureAudioContext()
  const cfg = musicLibrary[currentMusicCategory.value]
  if (!cfg || !cfg.tracks || cfg.tracks.length === 0) {
    // 若当前类型没有曲目，优先按心率推断类型，其次使用默认中速类型
    if (currentHeartRate.value != null) {
      const cat = getCategoryByHeartRate(currentHeartRate.value)
      if (cat && cat !== 'none') {
        await switchMusicCategory(cat)
        return
      }
    }
    // 没有心率数据时，默认播放中速 mid
    await switchMusicCategory('mid')
    return
  }

  if (!canControlTrack.value) {
    await playTrackByIndex(currentMusicCategory.value, 0)
    return
  }

  if (isPlaying.value) {
    audioCtx.pause()
  } else {
    audioCtx.play()
  }
}

const playNextTrack = async () => {
  const cfg = musicLibrary[currentMusicCategory.value]
  if (!cfg || !cfg.tracks || cfg.tracks.length === 0) return
  const nextIndex = (cfg.currentIndex >= 0 ? cfg.currentIndex + 1 : 0)
  await playTrackByIndex(currentMusicCategory.value, nextIndex)
}

const playPrevTrack = async () => {
  const cfg = musicLibrary[currentMusicCategory.value]
  if (!cfg || !cfg.tracks || cfg.tracks.length === 0) return
  const prevIndex = (cfg.currentIndex >= 0 ? cfg.currentIndex - 1 : cfg.tracks.length - 1)
  await playTrackByIndex(currentMusicCategory.value, prevIndex)
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>