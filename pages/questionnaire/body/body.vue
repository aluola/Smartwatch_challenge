<template>
  <view class="questionnaire-container">
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progress + '%' }"></view>
    </view>
    
    <view class="content-wrapper">
      <view class="question-header">
        <text class="question-number">3 / 6</text>
        <text class="question-title">请输入您的身高和体重</text>
        <text class="question-hint">用于计算BMI指数，为您推荐更合适的运动强度</text>
      </view>
      
      <view class="input-section">
        <view class="input-group">
          <view class="input-wrapper">
            <text class="input-label">身高</text>
            <view class="input-box">
              <input 
                class="body-input" 
                type="digit" 
                v-model="height"
                placeholder="请输入身高"
                placeholder-class="input-placeholder"
                @input="onHeightInput"
                maxlength="3"
              />
              <text class="input-unit">cm</text>
            </view>
          </view>
          
          <view class="input-wrapper">
            <text class="input-label">体重</text>
            <view class="input-box">
              <input 
                class="body-input" 
                type="digit" 
                v-model="weight"
                placeholder="请输入体重"
                placeholder-class="input-placeholder"
                @input="onWeightInput"
                maxlength="3"
              />
              <text class="input-unit">kg</text>
            </view>
          </view>
        </view>
        
        <view class="bmi-display" v-if="bmi">
          <text class="bmi-label">您的BMI指数</text>
          <text class="bmi-value">{{ bmi }}</text>
          <text class="bmi-status">{{ bmiStatus }}</text>
        </view>
      </view>
      
      <view class="button-section">
        <button 
          class="next-button"
          :class="{ active: canNext }"
          @click="handleNext"
          :disabled="!canNext"
        >
          下一步
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { updateUserProfile, calculateBMI } from '../../../utils/userData'

const height = ref('')
const weight = ref('')
const progress = 50 // 3/6

const bmi = computed(() => {
  const h = parseFloat(height.value)
  const w = parseFloat(weight.value)
  if (h && w && h > 0 && w > 0) {
    return calculateBMI(h, w)
  }
  return null
})

const bmiStatus = computed(() => {
  if (!bmi.value) return ''
  
  if (bmi.value < 18.5) {
    return '偏瘦'
  } else if (bmi.value < 24) {
    return '正常'
  } else if (bmi.value < 28) {
    return '偏胖'
  } else {
    return '肥胖'
  }
})

const canNext = computed(() => {
  const h = parseFloat(height.value)
  const w = parseFloat(weight.value)
  return h && w && h >= 100 && h <= 250 && w >= 20 && w <= 200
})

const onHeightInput = (e) => {
  height.value = e.detail.value
}

const onWeightInput = (e) => {
  weight.value = e.detail.value
}

const handleNext = () => {
  if (!canNext.value) {
    uni.showToast({
      title: '请输入有效的身高和体重',
      icon: 'none'
    })
    return
  }
  
  const bmiValue = calculateBMI(parseFloat(height.value), parseFloat(weight.value))
  
  // 保存身高体重数据
  updateUserProfile({
    height: parseFloat(height.value),
    weight: parseFloat(weight.value),
    bmi: bmiValue
  })
  
  // 跳转到下一个问卷页面
  uni.redirectTo({
    url: '/pages/questionnaire/exercise-freq/exercise-freq'
  })
}
</script>

<style lang="scss" scoped>
.questionnaire-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 40rpx 60rpx;
  display: flex;
  flex-direction: column;
}

.progress-bar {
  width: 100%;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 60rpx;
}

.progress-fill {
  height: 100%;
  background: #ffffff;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.question-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 80rpx;
}

.question-number {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20rpx;
}

.question-title {
  font-size: 52rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 30rpx;
  line-height: 1.4;
}

.question-hint {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 60rpx;
  margin-bottom: 80rpx;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
}

.input-label {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  backdrop-filter: blur(10px);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  padding: 0 40rpx;
  height: 120rpx;
}

.body-input {
  flex: 1;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
}

.input-placeholder {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.input-unit {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 20rpx;
  font-weight: 500;
}

.bmi-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 30rpx;
  backdrop-filter: blur(10px);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.bmi-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20rpx;
}

.bmi-value {
  font-size: 80rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 15rpx;
}

.bmi-status {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.button-section {
  margin-top: auto;
  padding-bottom: 60rpx;
}

.next-button {
  width: 100%;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.3);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 48rpx;
  color: rgba(255, 255, 255, 0.6);
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &.active {
    background: #ffffff;
    color: #4facfe;
    border-color: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>

