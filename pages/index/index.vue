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
      
      <!-- 传感器数据显示 + 音乐控制 -->
      <view class="sensor-data" v-if="isConnected">
        <view class="sensor-grid">
          <view class="sensor-item">
            <text class="sensor-label">心率</text>
            <text class="sensor-value">{{ sensorData.heartRate || '--' }} BPM</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">血氧</text>
            <text class="sensor-value">{{ sensorData.spo2 || '--' }} %</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">步数</text>
            <text class="sensor-value">{{ sensorData.steps || '--' }}</text>
          </view>
          <view class="sensor-item">
            <text class="sensor-label">温度</text>
            <text class="sensor-value">{{ sensorData.temperature || '--' }} °C</text>
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

    <!-- 底部输入区域 -->
    <view class="bottom-section">
      <view class="input-container">
        <input class="input-field" v-model="inputMessage" 
               placeholder="输入要发送的数据..." 
               placeholder-class="input-placeholder"
               @confirm="sendData" />
        
        <button class="send-btn" @click="sendData" :disabled="!isConnected || !inputMessage">
          发送
        </button>
      </view>
      
      <view class="quick-commands">
        <text class="commands-title">快捷指令</text>
        <view class="command-buttons">
          <button v-for="cmd in quickCommands" :key="cmd.name"
                  class="cmd-btn" @click="sendQuickCommand(cmd)">
            {{ cmd.name }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'

// 状态管理
const isConnected = ref(false)
const scanning = ref(false)
const batteryLevel = ref(100)
const connectedDeviceName = ref('')
const inputMessage = ref('')
const discoveredDevices = ref([])
let scanStopTimer = null

// 数据列表
const dataList = ref([])

// 传感器数据
const sensorData = reactive({
  heartRate: null,
  spo2: null,
  steps: null,
  temperature: null
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

// 音乐库配置（从各自 bpm_list.txt 动态读取）
// 注意：Music 文件夹位于项目根目录，运行时通过 /Music/... 访问
const musicLibrary = {
  slow: {
    folder: '/Music/000-079_BPM_slow/',
    bpmList: '/Music/000-079_BPM_slow/bpm_list.txt',
    tracks: [], // { file, bpm }
    loaded: false,
    currentIndex: -1
  },
  mid: {
    folder: '/Music/080-099_BPM_mid/',
    bpmList: '/Music/080-099_BPM_mid/bpm_list.txt',
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  midfast: {
    folder: '/Music/100-119_BPM_midfast/',
    bpmList: '/Music/100-119_BPM_midfast/bpm_list.txt',
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  fast: {
    folder: '/Music/120-139_BPM_fast/',
    bpmList: '/Music/120-139_BPM_fast/bpm_list.txt',
    tracks: [],
    loaded: false,
    currentIndex: -1
  },
  veryfast: {
    folder: '/Music/140+_BPM_veryfast/',
    bpmList: '/Music/140+_BPM_veryfast/bpm_list.txt',
    tracks: [],
    loaded: false,
    currentIndex: -1
  }
}

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

// 快捷指令
const quickCommands = [
  { name: '获取心率', command: 'GET_HR' },
  { name: '获取步数', command: 'GET_STEPS' },
  { name: '同步时间', command: 'SYNC_TIME' },
  { name: '设备信息', command: 'GET_INFO' }
]

// 蓝牙设备相关变量
let bluetoothDevice = null
let writeServiceId = null
let writeCharId = null
let notifyServiceId = null
let notifyCharId = null

// 生命周期
onMounted(() => {
  initBluetooth()
  startBatteryMonitoring()
})

onUnmounted(() => {
  disconnect()
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

// 扫描设备
const scanDevices = async () => {
  if (scanning.value) return
  
  scanning.value = true
  addLog('系统', '开始扫描设备...', 'system')
  discoveredDevices.value = []
  
  try {
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
  addLog('系统', '设备已断开', 'system')
}

// 发送数据
const sendData = async () => {
  if (!inputMessage.value.trim() || !isConnected.value) return
  
  try {
    if (!writeServiceId || !writeCharId) {
      uni.showToast({ title: '未找到可写特征', icon: 'none' })
      return
    }
    const text = inputMessage.value
    const buffer = str2ab(text)
    const maxLen = 20
    const u8 = new Uint8Array(buffer)
    for (let i = 0; i < u8.length; i += maxLen) {
      const chunk = u8.slice(i, i + maxLen)
      await new Promise((resolve, reject) => {
        uni.writeBLECharacteristicValue({
          deviceId: bluetoothDevice.deviceId,
          serviceId: writeServiceId,
          characteristicId: writeCharId,
          value: chunk.buffer,
          success: resolve,
          fail: reject
        })
      })
      await delay(20)
    }
    
    addLog(text, 'sent')
    inputMessage.value = ''
    
  } catch (error) {
    console.error('发送数据失败', error)
    uni.showToast({
      title: '发送失败',
      icon: 'none'
    })
  }
}

// 发送快捷指令
const sendQuickCommand = (cmd) => {
  inputMessage.value = cmd.command
  sendData()
}

// 处理接收到的数据
const handleReceivedData = (data) => {
  addLog(data, 'received')
  
  // 解析传感器数据
  if (data.includes('HR:')) {
    // 兼容旧格式 HR:75
    const hrStr = data.split(':')[1]
    const hr = parseInt(hrStr, 10)
    if (!isNaN(hr)) {
      sensorData.heartRate = hr
      onHeartRateUpdate(hr)
    }
  } else if (/Heart\s*Rate/i.test(data)) {
    // 新格式：Heart Rate:75%
    const match = data.match(/Heart\s*Rate\s*:(\d+)/i)
    if (match) {
      const hr = parseInt(match[1], 10)
      if (!isNaN(hr)) {
        sensorData.heartRate = hr
        onHeartRateUpdate(hr)
      }
    }
  } else if (data.includes('SPO2:')) {
    sensorData.spo2 = data.split(':')[1]
  } else if (data.includes('STEPS:')) {
    sensorData.steps = data.split(':')[1]
  } else if (data.includes('TEMP:')) {
    sensorData.temperature = data.split(':')[1]
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
    })
    audioCtx.onPause(() => {
      isPlaying.value = false
    })
    audioCtx.onStop(() => {
      isPlaying.value = false
    })
    audioCtx.onEnded(() => {
      isPlaying.value = false
    })
    audioCtx.onError((err) => {
      console.error('音乐播放错误', err)
      addLog('系统', '音乐播放出错', 'system')
      isPlaying.value = false
    })
  }
}

// 从 bpm_list.txt 载入指定类型的曲目列表
const loadCategoryTracks = (category) => {
  const cfg = musicLibrary[category]
  if (!cfg || !cfg.bpmList) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    uni.request({
      url: cfg.bpmList,
      method: 'GET',
      success: (res) => {
        const text = typeof res.data === 'string' ? res.data : ''
        const lines = text.split(/\r?\n/).filter(l => l.trim())
        const tracks = []
        // 跳过首行表头“文件名\tBPM”
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          const parts = line.split(/\s+/)
          // 文件名中可能有空格，因此从右侧取最后一个作为 bpm，其余拼回文件名
          const bpmStr = parts[parts.length - 1]
          const bpm = parseFloat(bpmStr)
          const file = parts.slice(0, parts.length - 1).join(' ')
          if (file && !isNaN(bpm)) {
            tracks.push({ file, bpm })
          }
        }
        cfg.tracks = tracks
        cfg.loaded = true
        resolve()
      },
      fail: (err) => {
        console.error('加载 bpm_list 失败', category, err)
        addLog('系统', `加载 ${category} 的 bpm_list 失败`, 'system')
        reject(err)
      }
    })
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
  if (total === 0) return
  let idx = index
  if (idx < 0) idx = total - 1
  if (idx >= total) idx = 0
  cfg.currentIndex = idx
  const track = cfg.tracks[idx]
  ensureAudioContext()
  audioCtx.src = cfg.folder + track.file
  audioCtx.play()
  currentMusicCategory.value = category
  currentTrackName.value = track.file
  addLog('系统', `切换至 ${category} 类型音乐：${track.file}（${track.bpm} BPM）`, 'system')
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
    // 若当前类型没有曲目，尝试按当前心率推断类型并切换
    if (currentHeartRate.value != null) {
      const cat = getCategoryByHeartRate(currentHeartRate.value)
      if (cat && cat !== 'none') {
        await switchMusicCategory(cat)
        return
      }
    }
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