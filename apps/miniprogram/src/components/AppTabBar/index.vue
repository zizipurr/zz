<script setup lang="ts">
defineProps<{ active: 'home' | 'profile' }>()

function go(page: 'home' | 'profile') {
  const urls = { home: '/pages/orders/index', profile: '/pages/profile/index' }
  uni.reLaunch({ url: urls[page] })
}
</script>

<template>
  <view class="tabbar">
    <view class="tab" :class="{ active: active === 'home' }" @tap="go('home')">
      <uni-icons type="home" size="24" :color="active === 'home' ? '#3482ff' : '#94a3b8'" />
      <text class="label" :class="{ active: active === 'home' }">首页</text>
    </view>
    <view class="tab" :class="{ active: active === 'profile' }" @tap="go('profile')">
      <uni-icons type="contact" size="24" :color="active === 'profile' ? '#3482ff' : '#94a3b8'" />
      <text class="label" :class="{ active: active === 'profile' }">我的</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding-top: 12rpx;

  &:active { opacity: 0.7; }
}

.label {
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1;

  &.active { color: #3482ff; font-weight: 600; }
}
</style>
