<template>
  <view class="questionnaire-container">
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progress + '%' }"></view>
    </view>
    
    <view class="content-wrapper">
      <view class="question-header">
        <text class="question-number">2 / 6</text>
        <text class="question-title">请选择您的性别</text>
        <text class="question-hint">这将帮助我们更好地为您定制运动建议</text>
      </view>
      
      <view class="options-section">
        <view 
          class="option-card"
          :class="{ selected: selectedGender === 'male' }"
          @click="selectGender('male')"
        >
          <text class="option-icon">👨</text>
          <text class="option-text">男</text>
          <view class="check-mark" v-if="selectedGender === 'male'">✓</view>
        </view>
        
        <view 
          class="option-card"
          :class="{ selected: selectedGender === 'female' }"
          @click="selectGender('female')"
        >
          <text class="option-icon">👩</text>
          <text class="option-text">女</text>
          <view class="check-mark" v-if="selectedGender === 'female'">✓</view>
        </view>
      </view>
      
      <view class="button-section">
        <button 
          class="next-button"
          :class="{ active: selectedGender }"
          @click="handleNext"
          :disabled="!selectedGender"
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

const selectedGender = ref('')
const progress = 33.33 // 2/6

const selectGender = (gender) => {
  selectedGender.value = gender
}

const handleNext = () => {
  if (!selectedGender.value) {
    uni.showToast({
      title: '请选择性别',
      icon: 'none'
    })
    return
  }
  
  // 保存性别数据
  updateUserProfile({
    gender: selectedGender.value
  })
  
  // 跳转到下一个问卷页面
  uni.redirectTo({
    url: '/pages/questionnaire/body/body'
  })
}
</script>

<style lang="scss" scoped>
.questionnaire-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

.options-section {
  flex: 1;
  display: flex;
  gap: 40rpx;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.option-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 30rpx;
  backdrop-filter: blur(10px);
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  min-height: 400rpx;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.selected {
    background: #ffffff;
    border-color: #ffffff;
    box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.2);
    
    .option-icon {
      transform: scale(1.1);
    }
    
    .option-text {
      color: #f5576c;
      font-weight: bold;
    }
  }
}

.option-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  transition: transform 0.3s ease;
}

.option-text {
  font-size: 40rpx;
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
  background: #f5576c;
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
    color: #f5576c;
    border-color: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>

