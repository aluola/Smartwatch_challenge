<template>
  <view class="welcome-container">
    <view class="welcome-content">
      <view class="logo-section">
        <text class="logo-icon">🎵</text>
        <text class="app-name">智音随行</text>
        <text class="app-slogan">让音乐随心率而动</text>
      </view>
      
      <view class="loading-section" v-if="checking">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在加载...</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { isQuestionnaireCompleted } from '../../utils/userData'

const checking = ref(true)

onMounted(() => {
  checkQuestionnaireStatus()
})

const checkQuestionnaireStatus = () => {
  setTimeout(() => {
    const completed = isQuestionnaireCompleted()
    
    if (completed) {
      // 问卷已完成，跳转到主页面
      uni.reLaunch({
        url: '/pages/index/index'
      })
    } else {
      // 问卷未完成，跳转到第一个问卷页面
      uni.redirectTo({
        url: '/pages/questionnaire/age/age'
      })
    }
  }, 1500) // 1.5秒延迟，展示欢迎界面
}
</script>

<style lang="scss" scoped>
.welcome-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 1s ease-in;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.logo-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  animation: pulse 2s ease-in-out infinite;
}

.app-name {
  font-size: 64rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20rpx;
  letter-spacing: 4rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2rpx;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30rpx;
}

.loading-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

