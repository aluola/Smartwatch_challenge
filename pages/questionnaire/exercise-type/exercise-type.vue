<template>
  <view class="questionnaire-container">
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progress + '%' }"></view>
    </view>
    
    <view class="content-wrapper">
      <view class="question-header">
        <text class="question-number">5 / 6</text>
        <text class="question-title">您的主要运动类型是？</text>
        <text class="question-hint">选择您最常进行的运动方式</text>
      </view>
      
      <view class="options-section">
        <view 
          class="option-card"
          v-for="(option, index) in options"
          :key="index"
          :class="{ selected: selectedType === option.value }"
          @click="selectType(option.value)"
        >
          <text class="option-icon">{{ option.icon }}</text>
          <text class="option-text">{{ option.label }}</text>
          <view class="check-mark" v-if="selectedType === option.value">✓</view>
        </view>
      </view>
      
      <view class="button-section">
        <button 
          class="next-button"
          :class="{ active: selectedType }"
          @click="handleNext"
          :disabled="!selectedType"
        >
          下一步
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { updateUserProfile } from '../../../utils/userData'

const selectedType = ref('')
const progress = 83.33 // 5/6

const options = [
  { value: 'running', label: '跑步', icon: '🏃' },
  { value: 'cycling', label: '骑行', icon: '🚴' },
  { value: 'strength', label: '力量训练/撸铁', icon: '🏋️' },
  { value: 'hiit', label: 'HIIT', icon: '⚡' },
  { value: 'yoga', label: '瑜伽/拉伸', icon: '🧘' }
]

const selectType = (value) => {
  selectedType.value = value
}

const handleNext = () => {
  if (!selectedType.value) {
    uni.showToast({
      title: '请选择主要运动类型',
      icon: 'none'
    })
    return
  }
  
  // 保存主要运动类型数据
  updateUserProfile({
    exerciseType: selectedType.value
  })
  
  // 跳转到最后一个问卷页面
  uni.redirectTo({
    url: '/pages/questionnaire/music-genre/music-genre'
  })
}
</script>

<style lang="scss" scoped>
.questionnaire-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
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
  margin-bottom: 60rpx;
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

.options-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  padding: 40rpx 0;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 50rpx 40rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 25rpx;
  backdrop-filter: blur(10px);
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.selected {
    background: #ffffff;
    border-color: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
    
    .option-icon {
      transform: scale(1.15);
    }
    
    .option-text {
      color: #330867;
      font-weight: bold;
    }
  }
}

.option-icon {
  font-size: 60rpx;
  margin-right: 30rpx;
  transition: transform 0.3s ease;
}

.option-text {
  flex: 1;
  font-size: 36rpx;
  color: #ffffff;
  font-weight: 500;
  transition: all 0.3s ease;
}

.check-mark {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 50rpx;
  height: 50rpx;
  background: #330867;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
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
    color: #330867;
    border-color: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>

