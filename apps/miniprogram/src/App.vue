<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import '@dcloudio/uni-ui/lib/uni-icons/uniicons.css'

onLaunch(() => {
  const token = uni.getStorageSync('staff_token') as string
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
})
</script>

<template>
  <router-view />
</template>

<style lang="scss">
@font-face {
  font-family: 'uniicons';
  src: url('@dcloudio/uni-ui/lib/uni-icons/uniicons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.uni-icons {
  font-family: 'uniicons' !important;
  font-style: normal;
  font-weight: normal;
  speak: none;
  text-decoration: none;
  text-align: center;
}

@import './uni.scss';
</style>
