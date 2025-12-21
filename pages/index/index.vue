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
              <button class="music-btn main" @click="togglePlayPause" :disabled="!currentTrackName">
                {{ isPlaying ? '暂停' : '播放' }}
              </button>
              <button class="music-btn" @click="playNextTrack" :disabled="!canControlTrack">»</button>
            </view>
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

// 步频计算相关
const stepHistory = ref([]) // 存储最近5秒内的步数记录 [{timestamp: number, steps: number}]
const CADENCE_TIME_WINDOW = 5000 // 步频计算的时间窗口（毫秒）
let cadenceUpdateTimer = null

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

// 音乐播放相关
const isPlaying = ref(false)
const currentTrackName = ref('')
const isLiked = ref(false)
const musicPlayTime = ref(0) // 音乐播放时间（秒）
let musicPlayTimer = null
let musicStartTime = null

// 音乐文件夹路径
const MUSIC_FOLDER = '/static/music_new/music/'
const DEFAULT_TRACK = '010377.mp3' // 默认播放的歌曲

// 歌曲列表管理
const trackList = ref([]) // 歌曲列表
const currentTrackIndex = ref(-1) // 当前歌曲索引

let audioCtx = null

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
  // 延迟加载默认歌曲，确保页面完全加载后再加载音频
  // 使用 nextTick 确保 DOM 完全渲染后再加载
  setTimeout(() => {
    try {
      loadDefaultTrack()
    } catch (error) {
      console.error('初始化默认歌曲失败:', error)
      // 即使加载失败也不影响应用运行
    }
  }, 1000)
})

// 加载歌曲列表
const loadTrackList = async () => {
  try {
    // #ifdef APP-PLUS
    // App端使用文件系统API读取JSON文件
    return new Promise((resolve) => {
      const fs = uni.getFileSystemManager()
      
      // App端的静态资源路径
      const possiblePaths = [
        '_www/static/music_new/music_list.json',
        'static/music_new/music_list.json',
        '/static/music_new/music_list.json'
      ]
      
      const tryReadFile = (pathIndex) => {
        if (pathIndex >= possiblePaths.length) {
          console.error('所有路径都无法读取歌曲列表文件，尝试使用HTTP请求')
          // 如果文件系统读取失败，尝试使用HTTP请求（适用于开发时的H5调试）
          uni.request({
            url: 'http://localhost:8080/static/music_new/music_list.json',
            method: 'GET',
            success: (res) => {
              if (res.statusCode === 200 && Array.isArray(res.data)) {
                trackList.value = res.data.sort()
                console.log(`成功通过HTTP加载 ${trackList.value.length} 首歌曲`)
                resolve(true)
              } else {
                console.error('HTTP请求返回格式不正确')
                resolve(false)
              }
            },
            fail: () => {
              console.error('所有方法都无法加载歌曲列表')
              resolve(false)
            }
          })
          return
        }
        
        const path = possiblePaths[pathIndex]
        fs.readFile({
          filePath: path,
          encoding: 'utf8',
          success: (res) => {
            try {
              const data = JSON.parse(res.data)
              if (Array.isArray(data)) {
                trackList.value = data.sort()
                console.log(`成功加载 ${trackList.value.length} 首歌曲 (使用路径: ${path})`)
                resolve(true)
              } else {
                console.error('JSON格式不正确')
                tryReadFile(pathIndex + 1)
              }
            } catch (parseErr) {
              console.error('JSON解析失败:', parseErr)
              tryReadFile(pathIndex + 1)
            }
          },
          fail: (err) => {
            console.log(`路径 ${path} 读取失败，尝试下一个路径:`, err.errMsg || err)
            tryReadFile(pathIndex + 1)
          }
        })
      }
      
      tryReadFile(0)
    })
    // #endif
    
    // #ifdef H5
    // H5端使用uni.request
    try {
      const res = await new Promise((resolve, reject) => {
        uni.request({
          url: '/static/music_new/music_list.json',
          method: 'GET',
          success: resolve,
          fail: reject
        })
      })
      
      if (res.statusCode === 200 && Array.isArray(res.data)) {
        trackList.value = res.data.sort()
        console.log(`成功加载 ${trackList.value.length} 首歌曲`)
        return true
      } else {
        console.warn('歌曲列表格式不正确')
        return false
      }
    } catch (error) {
      console.error('从 JSON 文件加载歌曲列表失败:', error)
      return false
    }
    // #endif
    
    // 默认情况（其他平台）
    console.warn('未识别的平台，尝试使用uni.request')
    try {
      const res = await new Promise((resolve, reject) => {
        uni.request({
          url: '/static/music_new/music_list.json',
          method: 'GET',
          success: resolve,
          fail: reject
        })
      })
      
      if (res.statusCode === 200 && Array.isArray(res.data)) {
        trackList.value = res.data.sort()
        console.log(`成功加载 ${trackList.value.length} 首歌曲`)
        return true
      }
    } catch (error) {
      console.error('加载歌曲列表失败:', error)
    }
    return false
  } catch (error) {
    console.error('加载歌曲列表失败:', error)
    return false
  }
}

// 加载默认歌曲
const loadDefaultTrack = async () => {
  try {
    // 先加载歌曲列表
    const loaded = await loadTrackList()
    
    if (!loaded && trackList.value.length === 0) {
      // 如果加载失败，至少添加默认歌曲
      trackList.value = [DEFAULT_TRACK]
      console.warn('无法加载完整歌曲列表，仅使用默认歌曲')
    }
    
    if (!audioCtx) {
      ensureAudioContext()
    }
    if (!audioCtx) {
      console.warn('音频上下文创建失败，跳过默认歌曲加载')
      return
    }
    
    // 查找默认歌曲在列表中的位置
    const defaultIndex = trackList.value.indexOf(DEFAULT_TRACK)
    if (defaultIndex >= 0) {
      currentTrackIndex.value = defaultIndex
    } else {
      // 如果默认歌曲不在列表中，添加到列表并排序
      trackList.value.push(DEFAULT_TRACK)
      trackList.value.sort()
      currentTrackIndex.value = trackList.value.indexOf(DEFAULT_TRACK)
    }
    
    const fullPath = MUSIC_FOLDER + DEFAULT_TRACK
    console.log('默认歌曲已加载:', fullPath, '索引:', currentTrackIndex.value, '列表长度:', trackList.value.length)
    // 只设置音频源，不自动播放（等用户点击播放按钮）
    audioCtx.src = fullPath
    currentTrackName.value = DEFAULT_TRACK
  } catch (error) {
    console.error('加载默认歌曲失败:', error)
    // 即使加载失败也不影响应用运行
    currentTrackName.value = ''
  }
}

// 计算是否可以控制切歌
const canControlTrack = computed(() => {
  return trackList.value.length > 0 && currentTrackIndex.value >= 0
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
  // 清空步数历史记录
  stepHistory.value = []
  // 重置步频数据
  sensorData.cadence = null
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

  // --- 2. 传感器数据解析区域 (更严格的格式匹配) ---

  // 心率 - 只匹配完整的 heartRate: 格式
  if (line.trim().toLowerCase().startsWith('heartrate:')) {
    const parts = line.split(':', 2)
    if (parts.length === 2) {
      const hrStr = parts[1].trim()
      const hr = parseInt(hrStr, 10)
      if (!isNaN(hr)) {
        sensorData.heartRate = hr
        // 心率数据只用于上传，不再用于自动切换音乐
      }
    }
    return
  }

  // 时间 - 只匹配完整的 time: 格式，排除 tempetime:
  if (line.trim().toLowerCase().startsWith('time:')) {
    const parts = line.split(':', 2)
    if (parts.length === 2) {
      const timeStr = parts[1].trim()
      if (timeStr) {
        sensorData.time = timeStr
      }
    }
    return
  }

  // 血氧 - 更严格地匹配 SPO2: 格式
  if (line.trim().toUpperCase().startsWith('SPO2:')) {
    const parts = line.split(':', 2)
    if (parts.length === 2) {
      const spo2Str = parts[1].trim().replace('%', '')
      const spo2 = parseInt(spo2Str, 10)
      if (!isNaN(spo2)) {
        sensorData.spo2 = spo2
      }
    }
    return
  }

  // 步数 - 更严格地匹配，排除错误格式
  if (line.trim().toUpperCase().startsWith('STEPS:')) {
    // 检查是否有多个冒号或格式错误
    const colonCount = (line.match(/:/g) || []).length
    if (colonCount === 1) {
      const parts = line.split(':', 2)
      if (parts.length === 2) {
        const stepsStr = parts[1].trim()
        const newSteps = parseInt(stepsStr, 10)
        if (!isNaN(newSteps)) {
          sensorData.steps = newSteps
          // 更新步数历史记录并计算步频
          updateStepHistory(newSteps)
        }
      }
    }
    return
  }

  // 温度 - 更严格地匹配 temperature: 格式，排除 heartRaterature:
  if (line.trim().toLowerCase().startsWith('temperature:')) {
    const parts = line.split(':', 2)
    if (parts.length === 2) {
      const tempStr = parts[1].trim()
      const temp = parseFloat(tempStr)
      if (!isNaN(temp)) {
        sensorData.temperature = temp
      }
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

// 上传当前状态信息到服务器
const uploadCurrentStatus = async () => {
  const statusData = {
    heartRate: sensorData.heartRate || '--',
    spo2: sensorData.spo2 || '--',
    steps: sensorData.steps || '--',
    cadence: sensorData.cadence || '--',
    temperature: sensorData.temperature || '--',
    currentTrackName: currentTrackName.value || '未选择',
    musicCategory: '--',
    musicPlayTime: musicPlayTime.value,
    isLiked: isLiked.value ? '是' : '否'
  }
  
  // 打印到控制台
  console.log('========== 用户状态信息 ==========')
  console.log(formatDataForLog(statusData))
  console.log('================================')
  
  // 上传到服务器，并接收推荐的歌曲
  try {
    const response = await uploadStatusInfo(statusData)
    console.log('状态信息上传成功，服务器响应:', response)
    
    // 处理服务器返回的推荐歌曲
    handleServerRecommendedSong(response)
  } catch (error) {
    console.error('状态信息上传失败:', error)
  }
}

// 处理服务器推荐的歌曲
const handleServerRecommendedSong = (response) => {
  // 服务器可能返回的格式：
  // 1. 直接是字符串: "010377.mp3"
  // 2. 对象: {recommendedSong: "010377.mp3"} 或 {song: "010377.mp3"}
  let recommendedSong = null
  
  if (typeof response === 'string') {
    // 检查是否是歌曲文件名格式（六个数字.mp3或其他.mp3格式）
    const trimmed = response.trim()
    if (/\.mp3$/i.test(trimmed)) {
      recommendedSong = trimmed
    }
  } else if (typeof response === 'object' && response !== null) {
    // 尝试从对象中提取歌曲名
    recommendedSong = response.recommendedSong || response.song || response.trackName || response.file
    if (recommendedSong && typeof recommendedSong === 'string') {
      recommendedSong = recommendedSong.trim()
      if (!/\.mp3$/i.test(recommendedSong)) {
        recommendedSong = null
      }
    } else {
      recommendedSong = null
    }
  }
  
  // 如果有推荐的歌曲且与当前歌曲不同，则在完整列表中找到并播放
  if (recommendedSong && recommendedSong !== currentTrackName.value) {
    console.log('收到服务器推荐的歌曲:', recommendedSong)
    
    // 在完整歌曲列表中查找推荐歌曲
    const songIndex = trackList.value.indexOf(recommendedSong)
    if (songIndex >= 0) {
      // 歌曲在列表中，直接使用索引播放
      currentTrackIndex.value = songIndex
      playTrack(recommendedSong, false) // false 表示不更新索引（已经手动更新了）
    } else {
      // 歌曲不在列表中，但应该播放（可能是新歌曲，但列表应该已经包含了）
      // 直接播放，playTrack 函数会处理
      playTrack(recommendedSong, true)
    }
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

// 心率更新（保留用于显示，但不再用于音乐切换）
const onHeartRateUpdate = (hr) => {
  // 心率数据只用于显示，不再用于自动切换音乐
  // 音乐切换由服务器推荐控制
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

// 播放指定的歌曲
const playTrack = async (trackFileName, updateIndex = true) => {
  if (!trackFileName || typeof trackFileName !== 'string') {
    console.error('无效的歌曲文件名:', trackFileName)
    return
  }
  
  // 如果正在播放其他歌曲，先上传当前状态
  if (currentTrackName.value && currentTrackName.value !== trackFileName) {
    await uploadCurrentStatus()
  }
  
  ensureAudioContext()
  
  if (!audioCtx) {
    console.error('音频上下文未创建')
    return
  }
  
  // 重置播放时间和喜欢状态（如果切换了歌曲）
  if (currentTrackName.value !== trackFileName) {
    stopMusicPlayTimer()
    musicPlayTime.value = 0
    isLiked.value = false
  }
  
  // 如果歌曲不在列表中，添加到列表（但这种情况不应该发生，因为列表应该已经完整）
  if (updateIndex) {
    const existingIndex = trackList.value.indexOf(trackFileName)
    if (existingIndex >= 0) {
      currentTrackIndex.value = existingIndex
    } else {
      // 如果歌曲不在列表中，添加并排序（虽然不应该发生）
      trackList.value.push(trackFileName)
      trackList.value.sort()
      currentTrackIndex.value = trackList.value.indexOf(trackFileName)
      console.warn(`歌曲 ${trackFileName} 不在列表中，已添加`)
    }
  }
  
  // 构建完整路径
  const fullPath = MUSIC_FOLDER + trackFileName
  
  console.log('准备播放:', fullPath, '当前索引:', currentTrackIndex.value, '列表长度:', trackList.value.length)
  
  try {
    // 先暂停当前播放（如果正在播放）
    const wasPlaying = isPlaying.value
    if (wasPlaying) {
      audioCtx.pause()
    }
    
    // 设置新的音频源
    audioCtx.src = fullPath
    currentTrackName.value = trackFileName
    addLog('系统', `播放：${trackFileName}`, 'system')
    
    // 如果之前正在播放，则播放新歌曲
    if (wasPlaying) {
      // 使用 setTimeout 确保音频源已设置
      setTimeout(() => {
        try {
          const playResult = audioCtx.play()
          // play() 可能返回 Promise 也可能不返回，需要检查
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(err => {
              console.error('播放失败:', err)
              addLog('系统', `播放失败：${trackFileName}`, 'system')
            })
          }
        } catch (playErr) {
          console.error('调用play()失败:', playErr)
          addLog('系统', `播放失败：${trackFileName}`, 'system')
        }
      }, 100)
    }
    
  } catch (error) {
    console.error('设置音频源失败:', error)
    addLog('系统', `播放失败：${trackFileName}`, 'system')
    uni.showToast({
      title: '播放失败',
      icon: 'none'
    })
  }
}

// 播放上一首
const playPrevTrack = async () => {
  if (trackList.value.length === 0) {
    console.warn('歌曲列表为空，无法切歌')
    return
  }
  
  let prevIndex = currentTrackIndex.value - 1
  if (prevIndex < 0) {
    prevIndex = trackList.value.length - 1 // 循环到最后一首
  }
  
  currentTrackIndex.value = prevIndex
  const prevTrack = trackList.value[prevIndex]
  console.log(`切歌到上一首: ${prevTrack} (索引: ${prevIndex}/${trackList.value.length - 1})`)
  
  // 记录之前是否在播放
  const wasPlaying = isPlaying.value
  await playTrack(prevTrack, false) // false 表示不更新索引（已经手动更新了）
  
  // 如果之前正在播放，确保新歌曲也开始播放
  if (wasPlaying && audioCtx) {
    setTimeout(() => {
      try {
        const playResult = audioCtx.play()
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(err => {
            console.error('播放上一首失败:', err)
          })
        }
      } catch (playErr) {
        console.error('调用play()失败:', playErr)
      }
    }, 150)
  }
}

// 播放下一首
const playNextTrack = async () => {
  if (trackList.value.length === 0) {
    console.warn('歌曲列表为空，无法切歌')
    return
  }
  
  let nextIndex = currentTrackIndex.value + 1
  if (nextIndex >= trackList.value.length) {
    nextIndex = 0 // 循环到第一首
  }
  
  currentTrackIndex.value = nextIndex
  const nextTrack = trackList.value[nextIndex]
  console.log(`切歌到下一首: ${nextTrack} (索引: ${nextIndex}/${trackList.value.length - 1})`)
  
  // 记录之前是否在播放
  const wasPlaying = isPlaying.value
  await playTrack(nextTrack, false) // false 表示不更新索引（已经手动更新了）
  
  // 如果之前正在播放，确保新歌曲也开始播放
  if (wasPlaying && audioCtx) {
    setTimeout(() => {
      try {
        const playResult = audioCtx.play()
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(err => {
            console.error('播放下一首失败:', err)
          })
        }
      } catch (playErr) {
        console.error('调用play()失败:', playErr)
      }
    }, 150)
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

// 播放/暂停
const togglePlayPause = async () => {
  if (!currentTrackName.value) {
    // 如果没有当前歌曲，播放默认歌曲
    await playTrack(DEFAULT_TRACK)
    // 播放默认歌曲后，需要手动触发播放
    setTimeout(() => {
      if (audioCtx) {
        try {
          const playResult = audioCtx.play()
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(err => {
              console.error('播放默认歌曲失败:', err)
            })
          }
        } catch (playErr) {
          console.error('调用play()失败:', playErr)
        }
      }
    }, 150)
    return
  }
  
  ensureAudioContext()
  
  if (!audioCtx) {
    console.error('音频上下文未创建')
    return
  }
  
  if (isPlaying.value) {
    audioCtx.pause()
  } else {
    // 确保音频源已设置
    if (!audioCtx.src) {
      const fullPath = MUSIC_FOLDER + currentTrackName.value
      audioCtx.src = fullPath
    }
    try {
      const playResult = audioCtx.play()
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(err => {
          console.error('播放失败:', err)
          uni.showToast({
            title: '播放失败',
            icon: 'none'
          })
        })
      }
    } catch (playErr) {
      console.error('调用play()失败:', playErr)
      uni.showToast({
        title: '播放失败',
        icon: 'none'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>