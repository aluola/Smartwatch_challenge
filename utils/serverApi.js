const SERVER_IP = '47.93.210.224'
const SERVER_URL = `http://${SERVER_IP}/calculate`

export async function sendWithAck(flag, data) {
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

  if (ackResponse !== 'yes') {
    throw new Error('服务器未准备好接收数据，响应为: ' + ackResponse)
  }

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

export async function uploadInitialInfo(initialData) {
  return await sendWithAck(0, initialData)
}

export async function uploadStatusInfo(statusData) {
  const response = await sendWithAck(1, statusData)
  return response
}

export function uploadToServer(data) {
  return new Promise((resolve, reject) => {
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

export function formatDataForLog(data) {
  const lines = []
  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}：${value}`)
  }
  return lines.join('\n')
}