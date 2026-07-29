/**
 * 卡券卡片组件 - CouponCard
 * 展示卡券信息（App logo、标题、说明、领取按钮）
 * 使用：<CouponCard :coupon="coupon" @claim="onClaim" />
 */
<template>
  <view class="coupon-card" @tap="handleTap">
    <!-- 左侧：App Logo -->
    <view class="coupon-card__logo-wrapper">
      <view class="coupon-card__logo">
        <text class="coupon-card__logo-text">{{ coupon.logoText }}</text>
      </view>
    </view>

    <!-- 中间：标题和说明 -->
    <view class="coupon-card__info">
      <text class="coupon-card__title">{{ coupon.title }}</text>
      <text class="coupon-card__desc">{{ coupon.desc }}</text>
    </view>

    <!-- 右侧：立即领取按钮 -->
    <view
      class="coupon-card__claim-btn"
      :class="{ 'coupon-card__claim-btn--claimed': coupon.claimed }"
      @tap.stop="handleClaim"
    >
      <text>{{ coupon.claimed ? '已领取' : '立即领取' }}</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  coupon: {
    type: Object,
    default: () => ({
      logoText: '券',
      title: '优惠券',
      desc: '描述信息',
      claimed: false
    })
  }
})

const emit = defineEmits(['claim', 'tap'])

function handleClaim() {
  if (!props.coupon.claimed) {
    emit('claim', props.coupon)
  }
}

function handleTap() {
  emit('tap', props.coupon)
}
</script>

<style lang="scss" scoped>
.coupon-card {
  display: flex;
  align-items: center;
  background: $card-bg;
  border-radius: $radius-md;
  padding: 24rpx 20rpx;
  margin: 12rpx 24rpx;
  box-shadow: $shadow-sm;

  &__logo-wrapper {
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  &__logo {
    width: 80rpx;
    height: 80rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $primary-bg;
  }

  &__logo-text {
    font-size: 36rpx;
    color: $text-primary;
    font-weight: 700;
  }

  &__info {
    flex: 1;
    min-width: 0;
    padding-right: 16rpx;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $text-primary;
    display: block;
    margin-bottom: 4rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $text-light;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__claim-btn {
    flex-shrink: 0;
    padding: 14rpx 28rpx;
    border-radius: 40rpx;
    background: $text-primary;
    color: #fff;
    font-size: $font-size-sm;
    font-weight: 500;
    white-space: nowrap;

    &--claimed {
      background: $border-color;
      color: $text-light;
    }
  }
}
</style>
