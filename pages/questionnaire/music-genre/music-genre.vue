<template>
  <view class="questionnaire-container">
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progress + '%' }"></view>
    </view>
    
    <view class="content-wrapper">
      <view class="question-header">
        <text class="question-number">6 / 6</text>
        <text class="question-title">您喜欢的音乐流派？</text>
        <text class="question-hint">可选择多个选项，帮助我们更好地为您推荐音乐</text>
      </view>
      
      <view class="options-section">
        <view 
          class="option-card"
          v-for="(option, index) in options"
          :key="index"
          :class="{ selected: selectedGenres.includes(option.value) }"
          @click="toggleGenre(option.value)"
        >
          <text class="option-icon">{{ option.icon }}</text>
          <text class="option-text">{{ option.label }}</text>
          <text class="option-en">{{ option.en }}</text>
          <view class="check-mark" v-if="selectedGenres.includes(option.value)">✓</view>
        </view>
      </view>
      
      <view class="button-section">
        <button 
          class="next-button"
          :class="{ active: canNext }"
          @click="handleComplete"
          :disabled="!canNext"
        >
          完成
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { updateUserProfile, markQuestionnaireCompleted, getUserProfile } from '../../../utils/userData'
import { uploadInitialInfo, formatDataForLog } from '../../../utils/serverApi'

const selectedGenres = ref([])
const progress = 100 // 6/6

const options = [
  { value: 'pop', label: '流行', en: 'Pop', icon: '🎵' },
  { value: 'edm', label: '电子舞曲', en: 'EDM', icon: '🎧' },
  { value: 'hiphop', label: '嘻哈', en: 'Hip-Hop', icon: '🎤' },
  { value: 'rock', label: '摇滚', en: 'Rock', icon: '🎸' },
  { value: 'classical', label: '古典', en: 'Classical', icon: '🎹' }
]

const canNext = computed(() => {
  return selectedGenres.value.length > 0
})

const toggleGenre = (value) => {
  const index = selectedGenres.value.indexOf(value)
  if (index > -1) {
    selectedGenres.value.splice(index, 1)
  } else {
    selectedGenres.value.push(value)
  }
}

const handleComplete = async () => {
  if (!canNext.value) {
    uni.showToast({
      title: '请至少选择一个音乐流派',
      icon: 'none'
    })
    return
  }
  
  updateUserProfile({
    musicGenres: selectedGenres.value
  })
  
  const userProfile = getUserProfile()
  
  console.log('========== 用户问卷信息 ==========')
  console.log(formatDataForLog(userProfile))
  console.log('================================')
  
  try {
    await uploadInitialInfo(userProfile)
    console.log('用户信息上传成功')
  } catch (error) {
    console.error('用户信息上传失败:', error)
  }
  
  markQuestionnaireCompleted()
  
  uni.showToast({
    title: '问卷完成！',
    icon: 'success',
    duration: 1500
  })
  
  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }, 1500)
}
</script>

<style lang="scss" scoped>
.questionnaire-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
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
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 20rpx;
}

.question-title {
  font-size: 52rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
  line-height: 1.4;
}

.question-hint {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.6;
}

.options-section {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
  padding: 40rpx 0;
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50rpx 30rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 25rpx;
  backdrop-filter: blur(10px);
  border: 3rpx solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  position: relative;
  min-height: 220rpx;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.selected {
    background: #ffffff;
    border-color: #fed6e3;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
    
    .option-icon {
      transform: scale(1.2);
    }
    
    .option-text {
      color: #ff6b9d;
      font-weight: bold;
    }
  }
}

.option-icon {
  font-size: 70rpx;
  margin-bottom: 20rpx;
  transition: transform 0.3s ease;
}

.option-text {
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 8rpx;
  transition: all 0.3s ease;
  text-align: center;
}

.option-en {
  font-size: 24rpx;
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
}

.check-mark {
  position: absolute;
  top: 15rpx;
  right: 15rpx;
  width: 45rpx;
  height: 45rpx;
  background: #ff6b9d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
}

.button-section {
  margin-top: auto;
  padding-bottom: 60rpx;
}

.next-button {
  width: 100%;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.6);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 48rpx;
  color: rgba(0, 0, 0, 0.5);
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &.active {
    background: #ff6b9d;
    color: #ffffff;
    border-color: #ff6b9d;
    box-shadow: 0 8rpx 24rpx rgba(255, 107, 157, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>