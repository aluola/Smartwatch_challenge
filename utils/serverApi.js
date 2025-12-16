/**
 * 服务器通信工具
 */

const SERVER_IP = '47.93.210.224'
const SERVER_URL = `http://${SERVER_IP}/calculate`

/**
 * 发送带ACK确认的数据
 * @param {number} flag - 标志位，0表示初始化信息，1表示状态信息
 * @param {Object} data - 要发送的数据
 * @returns {Promise} 返回Promise
 */
export async function sendWithAck(flag, data) {
  // 第一步：发送标志位并等待服务器ACK响应
  const ackResponse = await new Promise((resolve, reject) => {
    uni.request({
      url: SERVER_URL,
      method: 'POST',
      data: { flag },
      header: {
        'Content-Type': 'application/json'
      },
      timeout: 5000,
      success: (res) => {
        console.log('标志位发送成功，服务器响应:', res)
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`服务器错误: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('发送标志位失败:', err)
        reject(err)
      }
    })
  })

  // 检查服务器是否准备好接收数据
  if (ackResponse !== 'yes') {
    throw new Error('服务器未准备好接收数据，响应为: ' + ackResponse)
  }

  // 第二步：发送实际数据
  const formattedData = {}
  for (const [key, value] of Object.entries(data)) {
    formattedData[key] = `${key}：${value}`
  }

  const dataResponse = await new Promise((resolve, reject) => {
    uni.request({
      url: SERVER_URL,
      method: 'POST',
      data: formattedData,
      header: {
        'Content-Type': 'application/json'
      },
      timeout: 5000,
      success: (res) => {
        console.log('数据发送成功，服务器响应:', res)
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`服务器错误: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('发送数据失败:', err)
        reject(err)
      }
    })
  })

  return dataResponse
}

/**
 * 上传初始化信息到服务器（flag=0）
 * @param {Object} initialData - 初始化信息数据
 * @returns {Promise} 返回Promise
 */
export async function uploadInitialInfo(initialData) {
  return await sendWithAck(0, initialData)
}

/**
 * 上传状态信息到服务器（flag=1）
 * @param {Object} statusData - 状态信息数据
 * @returns {Promise} 返回Promise
 */
export async function uploadStatusInfo(statusData) {
  return await sendWithAck(1, statusData)
}

/**
 * 上传数据到服务器（旧版，兼容用）
 * @param {Object} data - 要上传的数据对象，格式为 {变量名: 变量值}
 * @returns {Promise} 返回Promise
 */
export function uploadToServer(data) {
  return new Promise((resolve, reject) => {
    // 将数据转换为服务器要求的格式：变量名：变量值
    const formattedData = {}
    for (const [key, value] of Object.entries(data)) {
      formattedData[key] = `${key}：${value}`
    }
    
    uni.request({
      url: SERVER_URL,
      method: 'POST',
      data: formattedData,
      header: {
        'Content-Type': 'application/json'
      },
      timeout: 5000,
      success: (res) => {
        console.log('服务器响应:', res)
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`服务器错误: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('上传数据失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 格式化数据为字符串（用于控制台打印）
 * @param {Object} data - 数据对象
 * @returns {String} 格式化后的字符串
 */
export function formatDataForLog(data) {
  const lines = []
  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}：${value}`)
  }
  return lines.join('\n')
}