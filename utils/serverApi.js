/**
 * 服务器通信工具
 */

const SERVER_IP = '39.107.190.29'
const SERVER_URL = `http://${SERVER_IP}/calculate`

/**
 * 上传数据到服务器
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

