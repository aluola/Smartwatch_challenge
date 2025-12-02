<template>
  <view class="questionnaire-container">
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progress + '%' }"></view>
    </view>
    
    <view class="content-wrapper">
      <view class="question-header">
        <text class="question-number">1 / 6</text>
        <text class="question-title">请输入您的年龄</text>
        <text class="question-hint">我们将根据您的年龄为您推荐合适的运动强度</text>
      </view>
      
      <view class="input-section">
        <view class="input-wrapper">
          <input 
            class="age-input" 
            type="number" 
            v-model="age"
            placeholder="请输入年龄"
            placeholder-class="input-placeholder"
            @input="onAgeInput"
            maxlength="3"
          />
          <text class="input-unit">岁</text>
        </view>
        <view class="input-hint" v-if="age">
          <text>您今年 {{ age }} 岁</text>
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
import { updateUserProfile } from '../../../utils/userData'

const age = ref('')
const progress = 16.67 // 1/6

const canNext = computed(() => {
  const ageNum = parseInt(age.value)
  return ageNum && ageNum >= 1 && ageNum <= 120
})

const onAgeInput = (e) => {
  age.value = e.detail.value
}

const handleNext = () => {
  if (!canNext.value) {
    uni.showToast({
      title: '请输入有效的年龄（1-120岁）',
      icon: 'none'
    })
    return
  }
  
  // 保存年龄数据
  updateUserProfile({
    age: parseInt(age.value)
  })
  
  // 跳转到下一个问卷页面
  uni.redirectTo({
    url: '/pages/questionnaire/gender/gender'
  })
}
</script>

<style lang="scss" scoped>
.questionnaire-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  margin-bottom: 100rpx;
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
  align-items: center;
  justify-content: center;
}

.input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 40rpx;
}

.age-input {
  font-size: 80rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  width: 300rpx;
  padding: 40rpx 0;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  backdrop-filter: blur(10px);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.input-placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-unit {
  font-size: 48rpx;
  color: #ffffff;
  margin-left: 20rpx;
  font-weight: 500;
}

.input-hint {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
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
    color: #667eea;
    border-color: #ffffff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>

