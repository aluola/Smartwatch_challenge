/**
 * 蓝牙设备存储管理工具
 */

const BLUETOOTH_DEVICE_KEY = 'last_connected_bluetooth_device'

/**
 * 保存已连接的蓝牙设备信息
 */
export function saveConnectedDevice(device) {
  try {
    const deviceInfo = {
      deviceId: device.deviceId,
      name: device.name || device.localName || '',
      timestamp: Date.now()
    }
    uni.setStorageSync(BLUETOOTH_DEVICE_KEY, deviceInfo)
    return true
  } catch (error) {
    console.error('保存蓝牙设备信息失败:', error)
    return false
  }
}

/**
 * 获取上次连接的蓝牙设备信息
 */
export function getLastConnectedDevice() {
  try {
    const device = uni.getStorageSync(BLUETOOTH_DEVICE_KEY)
    return device || null
  } catch (error) {
    console.error('获取蓝牙设备信息失败:', error)
    return null
  }
}

/**
 * 清除保存的蓝牙设备信息
 */
export function clearSavedDevice() {
  try {
    uni.removeStorageSync(BLUETOOTH_DEVICE_KEY)
    return true
  } catch (error) {
    console.error('清除蓝牙设备信息失败:', error)
    return false
  }
}

