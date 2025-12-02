/**
 * 用户数据存储管理工具
 */

const STORAGE_KEY = 'user_profile_data'
const QUESTIONNAIRE_COMPLETED_KEY = 'questionnaire_completed'

/**
 * 获取用户完整资料
 */
export function getUserProfile() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    return data || null
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return null
  }
}

/**
 * 保存用户资料
 */
export function saveUserProfile(profile) {
  try {
    uni.setStorageSync(STORAGE_KEY, profile)
    return true
  } catch (error) {
    console.error('保存用户资料失败:', error)
    return false
  }
}

/**
 * 更新用户资料的部分字段
 */
export function updateUserProfile(updates) {
  try {
    const current = getUserProfile() || {}
    const updated = { ...current, ...updates }
    return saveUserProfile(updated)
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return false
  }
}

/**
 * 检查问卷是否已完成
 */
export function isQuestionnaireCompleted() {
  try {
    const completed = uni.getStorageSync(QUESTIONNAIRE_COMPLETED_KEY)
    return completed === true
  } catch (error) {
    console.error('检查问卷状态失败:', error)
    return false
  }
}

/**
 * 标记问卷已完成
 */
export function markQuestionnaireCompleted() {
  try {
    uni.setStorageSync(QUESTIONNAIRE_COMPLETED_KEY, true)
    return true
  } catch (error) {
    console.error('标记问卷完成失败:', error)
    return false
  }
}

/**
 * 重置用户数据（用于测试或重新填写）
 */
export function resetUserData() {
  try {
    uni.removeStorageSync(STORAGE_KEY)
    uni.removeStorageSync(QUESTIONNAIRE_COMPLETED_KEY)
    return true
  } catch (error) {
    console.error('重置用户数据失败:', error)
    return false
  }
}

/**
 * 计算BMI
 */
export function calculateBMI(height, weight) {
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null
  }
  // 身高单位：cm，体重单位：kg
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  return parseFloat(bmi.toFixed(2))
}

/**
 * 获取用户资料字段
 */
export function getUserField(fieldName, defaultValue = null) {
  const profile = getUserProfile()
  return profile && profile[fieldName] !== undefined ? profile[fieldName] : defaultValue
}

