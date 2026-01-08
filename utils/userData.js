const STORAGE_KEY = 'user_profile_data'
const QUESTIONNAIRE_COMPLETED_KEY = 'questionnaire_completed'

export function getUserProfile() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    return data || null
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return null
  }
}

export function saveUserProfile(profile) {
  try {
    uni.setStorageSync(STORAGE_KEY, profile)
    return true
  } catch (error) {
    console.error('保存用户资料失败:', error)
    return false
  }
}

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

export function isQuestionnaireCompleted() {
  try {
    const completed = uni.getStorageSync(QUESTIONNAIRE_COMPLETED_KEY)
    return completed === true
  } catch (error) {
    console.error('检查问卷状态失败:', error)
    return false
  }
}

export function markQuestionnaireCompleted() {
  try {
    uni.setStorageSync(QUESTIONNAIRE_COMPLETED_KEY, true)
    return true
  } catch (error) {
    console.error('标记问卷完成失败:', error)
    return false
  }
}

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

export function calculateBMI(height, weight) {
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null
  }
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  return parseFloat(bmi.toFixed(2))
}

export function getUserField(fieldName, defaultValue = null) {
  const profile = getUserProfile()
  return profile && profile[fieldName] !== undefined ? profile[fieldName] : defaultValue
}


