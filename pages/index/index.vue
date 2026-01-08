<template>
  <view class="watch-container">
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
      
      <view class="watch-time" v-if="isConnected">
        <view class="time-header">
          <text class="time-title">手表当前时间</text>
        </view>
        <view class="time-content">
          <text class="time-value">{{ sensorData.time || '--' }}</text>
        </view>
      </view>
      
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
            <text class="sensor-value">{{ sensorData.stepssteps ?? '--' }}</text>
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

const isConnected = ref(false)
const scanning = ref(false)
const batteryLevel = ref(100)
const connectedDeviceName = ref('')
const discoveredDevices = ref([])
let scanStopTimer = null

const stepHistory = ref([])
const CADENCE_TIME_WINDOW = 5000
let cadenceUpdateTimer = null

const dataList = ref([])

const sensorData = reactive({
  heartRate: null,
  spo2: null,
  stepssteps: null,
  temperature: null,
  time: null,
  cadence: null
})

const isPlaying = ref(false)
const currentTrackName = ref('')
const isLiked = ref(false)
const musicPlayTime = ref(0)
let musicPlayTimer = null
let musicStartTime = null

const MUSIC_FOLDER = '/static/music_new/music/'
const DEFAULT_TRACK = '010377.mp3'

const trackList = ref([])
const currentTrackIndex = ref(-1)

let audioCtx = null

let bluetoothDevice = null
let writeServiceId = null
let writeCharId = null
let notifyServiceId = null
let notifyCharId = null
let receiveBuffer = ''

onMounted(() => {
  initBluetooth()
  startBatteryMonitoring()
  setTimeout(() => {
    try {
      loadDefaultTrack()
    } catch (error) {
      console.error('初始化默认歌曲失败:', error)
    }
  }, 1000)
})

const loadTrackList = async () => {
  try {
    // #ifdef APP-PLUS
    return new Promise((resolve) => {
      const fs = uni.getFileSystemManager()
      
      const possiblePaths = [
        '_www/static/music_new/music_list.json',
        'static/music_new/music_list.json',
        '/static/music_new/music_list.json'
      ]
      
      const tryReadFile = (pathIndex) => {
        if (pathIndex >= possiblePaths.length) {
          console.error('所有路径都无法读取歌曲列表文件，尝试使用HTTP请求')
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

const loadDefaultTrack = async () => {
  try {
    const loaded = await loadTrackList()
    
    if (!loaded && trackList.value.length === 0) {
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
    
    const defaultIndex = trackList.value.indexOf(DEFAULT_TRACK)
    if (defaultIndex >= 0) {
      currentTrackIndex.value = defaultIndex
    } else {
      trackList.value.push(DEFAULT_TRACK)
      trackList.value.sort()
      currentTrackIndex.value = trackList.value.indexOf(DEFAULT_TRACK)
    }
    
    const fullPath = MUSIC_FOLDER + DEFAULT_TRACK
    console.log('默认歌曲已加载:', fullPath, '索引:', currentTrackIndex.value, '列表长度:', trackList.value.length)
    audioCtx.src = fullPath
    currentTrackName.value = DEFAULT_TRACK
  } catch (error) {
    console.error('加载默认歌曲失败:', error)
    currentTrackName.value = ''
  }
}
const canControlTrack = computed(() => {
  return trackList.value.length > 0 && currentTrackIndex.value >= 0
})

onUnmounted(() => {
  disconnect()
  stopMusicPlayTimer()
})

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



const scanDevices = async () => {
  if (scanning.value) return
  
  scanning.value = true
  addLog('系统', '开始扫描设备...', 'system')
  discoveredDevices.value = []
  
  try {
    try {
      await new Promise((resolve, reject) => {
        uni.openBluetoothAdapter({
          success: resolve,
          fail: (err) => {
            console.error('重新打开蓝牙适配器失败', err)
            resolve()
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
    
    saveConnectedDevice(device)
    
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
  stepHistory.value = []
  sensorData.cadence = null
  addLog('系统', '设备已断开', 'system')
  uni.showToast({
    title: '已断开',
    icon: 'none'
  })
}


const handleReceivedData = (data) => {
  if (!data) return
  
  receiveBuffer += String(data)
  
  let newlineIndex = receiveBuffer.indexOf('\n')
  
  while (newlineIndex !== -1) {
    let line = receiveBuffer.substring(0, newlineIndex).trim()
    receiveBuffer = receiveBuffer.substring(newlineIndex + 1)
    
    if (line) {
      addLog(line, 'received') 
      parseDeviceLine(line)
    }
    
    newlineIndex = receiveBuffer.indexOf('\n')
  }
}

const parseDeviceLine = (line) => {
  if (line.startsWith('MUSIC:PLAY')) {
    if (!isPlaying.value) {
      console.log('收到远程指令: 播放')
      togglePlayPause()
    }
    return
  }

  if (line.startsWith('MUSIC:PAUSE')) {
    if (isPlaying.value) {
      console.log('收到远程指令: 暂停')
      togglePlayPause()
    }
    return
  }

  if (line.startsWith('MUSIC:PREV')) {
    console.log('收到远程指令: 上一首')
    playPrevTrack()
    return
  }

  if (line.startsWith('MUSIC:NEXT')) {
    console.log('收到远程指令: 下一首')
    playNextTrack()
    return
  }

  if (line.trim().toLowerCase().startsWith('heartrate:')) {
    const parts = line.split(':', 2)
    if (parts.length === 2) {
      const hrStr = parts[1].trim()
      const hr = parseInt(hrStr, 10)
      if (!isNaN(hr)) {
        sensorData.heartRate = hr
      }
    }
    return
  }

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

  if (line.trim().toUpperCase().startsWith('STEPSSTEPS:')) {
    const colonCount = (line.match(/:/g) || []).length
    if (colonCount === 1) {
      const parts = line.split(':', 2)
      if (parts.length === 2) {
        const stepsStr = parts[1].trim()
        const newSteps = parseInt(stepsStr, 10)
        if (!isNaN(newSteps)) {
          sensorData.stepssteps = newSteps
          updateStepHistory(newSteps)
        }
      }
    }
    return
  }

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

const addLog = (content, type = 'received') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  dataList.value.unshift({
    content,
    type,
    time
  })
  
  if (dataList.value.length > 100) {
    dataList.value = dataList.value.slice(0, 100)
  }
}

const startBatteryMonitoring = () => {
  setInterval(() => {
    batteryLevel.value = Math.max(10, batteryLevel.value - 0.1)
  }, 60000)
}

const updateStepHistory = (stepssteps) => {
  const now = Date.now()
  
  stepHistory.value.push({ timestamp: now, stepssteps })
  
  const cutoffTime = now - CADENCE_TIME_WINDOW
  stepHistory.value = stepHistory.value.filter(item => item.timestamp >= cutoffTime)
  
  calculateCadence()
}

const calculateCadence = () => {
  if (stepHistory.value.length < 2) {
    return
  }
  
  const firstRecord = stepHistory.value[0]
  const lastRecord = stepHistory.value[stepHistory.value.length - 1]
  const timeDiff = lastRecord.timestamp - firstRecord.timestamp
  const stepDiff = lastRecord.stepssteps - firstRecord.stepssteps
  
  if (timeDiff <= 0 || stepDiff <= 0) {
    return
  }
  
  const cadence = Math.round((stepDiff * 60000) / timeDiff)
  sensorData.cadence = cadence
  
  console.log(`步频计算：${stepDiff}步 / ${timeDiff/1000}秒 = ${cadence}步/分钟`)
}

const uploadCurrentStatus = async () => {
  const statusData = {
    heartRate: sensorData.heartRate || '--',
    spo2: sensorData.spo2 || '--',
    steps: sensorData.stepssteps || '--',
    cadence: sensorData.cadence || '--',
    temperature: sensorData.temperature || '--',
    currentTrackName: currentTrackName.value || '未选择',
    musicCategory: '--',
    musicPlayTime: musicPlayTime.value,
    isLiked: isLiked.value ? '是' : '否'
  }
  
  console.log('========== 用户状态信息 ==========')
  console.log(formatDataForLog(statusData))
  console.log('================================')
  
  try {
    const response = await uploadStatusInfo(statusData)
    console.log('状态信息上传成功，服务器响应:', response)
    
    handleServerRecommendedSong(response)
  } catch (error) {
    console.error('状态信息上传失败:', error)
  }
}

const handleServerRecommendedSong = (response) => {
  let recommendedSong = null
  
  if (typeof response === 'string') {
    const trimmed = response.trim()
    if (/\.mp3$/i.test(trimmed)) {
      recommendedSong = trimmed
    }
  } else if (typeof response === 'object' && response !== null) {
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
  
  if (recommendedSong && recommendedSong !== currentTrackName.value) {
    console.log('收到服务器推荐的歌曲:', recommendedSong)
    
    const songIndex = trackList.value.indexOf(recommendedSong)
    if (songIndex >= 0) {
      currentTrackIndex.value = songIndex
      playTrack(recommendedSong, false)
    } else {
      playTrack(recommendedSong, true)
    }
  }
}

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

const onHeartRateUpdate = (hr) => {
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

const playTrack = async (trackFileName, updateIndex = true) => {
  if (!trackFileName || typeof trackFileName !== 'string') {
    console.error('无效的歌曲文件名:', trackFileName)
    return
  }
  
  if (currentTrackName.value && currentTrackName.value !== trackFileName) {
    await uploadCurrentStatus()
  }
  
  ensureAudioContext()
  
  if (!audioCtx) {
    console.error('音频上下文未创建')
    return
  }
  
  if (currentTrackName.value !== trackFileName) {
    stopMusicPlayTimer()
    musicPlayTime.value = 0
    isLiked.value = false
  }
  
  if (updateIndex) {
    const existingIndex = trackList.value.indexOf(trackFileName)
    if (existingIndex >= 0) {
      currentTrackIndex.value = existingIndex
    } else {
      trackList.value.push(trackFileName)
      trackList.value.sort()
      currentTrackIndex.value = trackList.value.indexOf(trackFileName)
      console.warn(`歌曲 ${trackFileName} 不在列表中，已添加`)
    }
  }
  
  const fullPath = MUSIC_FOLDER + trackFileName
  
  console.log('准备播放:', fullPath, '当前索引:', currentTrackIndex.value, '列表长度:', trackList.value.length)
  
  try {
    const wasPlaying = isPlaying.value
    if (wasPlaying) {
      audioCtx.pause()
    }
    
    audioCtx.src = fullPath
    currentTrackName.value = trackFileName
    addLog('系统', `播放：${trackFileName}`, 'system')
    
    if (wasPlaying) {
      setTimeout(() => {
        try {
          const playResult = audioCtx.play()
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
  
  const wasPlaying = isPlaying.value
  await playTrack(prevTrack, false)
  
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
  
  const wasPlaying = isPlaying.value
  await playTrack(nextTrack, false)
  
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

const startMusicPlayTimer = () => {
  stopMusicPlayTimer()
  musicStartTime = Date.now()
  musicPlayTimer = setInterval(() => {
    if (musicStartTime) {
      musicPlayTime.value = Math.floor((Date.now() - musicStartTime) / 1000)
    }
  }, 1000)
}

const stopMusicPlayTimer = () => {
  if (musicPlayTimer) {
    clearInterval(musicPlayTimer)
    musicPlayTimer = null
  }
  musicStartTime = null
}

const toggleLike = async () => {
  if (!currentTrackName.value) return
  isLiked.value = !isLiked.value
  await uploadCurrentStatus()
}

const togglePlayPause = async () => {
  if (!currentTrackName.value) {
    await playTrack(DEFAULT_TRACK)
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