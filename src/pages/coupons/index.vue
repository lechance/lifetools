/**
 * 卡券页面
 * 展示可领取的卡券列表，包含使用说明
 */
<template>
  <view class="page-coupons">
    <!-- 卡券列表 -->
    <view class="page-coupons__list">
      <CouponCard
        v-for="(coupon, index) in couponList"
        :key="index"
        :coupon="coupon"
        @claim="handleClaim"
      />
    </view>

    <!-- 使用说明 -->
    <view class="page-coupons__notice">
      <view class="page-coupons__notice-header">
        <text class="page-coupons__notice-icon">💡</text>
        <text class="page-coupons__notice-title">使用说明</text>
      </view>
      <view class="page-coupons__notice-body">
        <text class="page-coupons__notice-text">
          1. 点击"立即领取"按钮即可领取对应卡券
        </text>
        <text class="page-coupons__notice-text">
          2. 领取后卡券将保存在"我的卡券"中
        </text>
        <text class="page-coupons__notice-text">
          3. 每个用户限领一次，不可重复领取
        </text>
        <text class="page-coupons__notice-text">
          4. 卡券有效期请查看具体卡券说明
        </text>
        <text class="page-coupons__notice-text">
          5. 如有任何问题，欢迎通过「我的 → 工具建议」反馈
        </text>
      </view>
    </view>

    <!-- 底部菜单栏 -->
    <TabBar current="coupons" @change="handleTabChange" />

    <!-- 底部占位 -->
    <view class="page-coupons__bottom-placeholder"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CouponCard from '@/components/CouponCard.vue'
import TabBar from '@/components/TabBar.vue'
import { showSuccess, showToast } from '@/utils/helpers'
import { switchToTab, hideNativeTabBar } from '@/utils/tab-nav'

// 卡券数据（第一阶段静态数据）
const couponList = ref([
  { logoText: '淘', title: '淘宝限时红包', desc: '满100减20，限新用户使用', claimed: false },
  { logoText: '京', title: '京东PLUS会员', desc: '7天免费体验，享专属优惠', claimed: false },
  { logoText: '美', title: '美团外卖红包', desc: '满30减5，全场通用', claimed: false },
  { logoText: '饿', title: '饿了么超级会员', desc: '30天体验，免配送费', claimed: false },
  { logoText: '拼', title: '拼多多大额券', desc: '满100减30，限特定商品', claimed: false },
  { logoText: '滴', title: '滴滴出行优惠券', desc: '立减10元，快车专车可用', claimed: false }
])

/** 领取卡券 */
function handleClaim(coupon) {
  // 标记已领取
  coupon.claimed = true
  showSuccess('领取成功！')
}

/** 底部Tab切换 - 微信原生 tabBar 保活，H5 reLaunch */
function handleTabChange(key) {
  if (key === 'coupons') return
  switchToTab(key)
}

onShow(() => {
  hideNativeTabBar()
})
</script>

<style lang="scss" scoped>
.page-coupons {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: $bg-color;
  padding-top: 16rpx;

  &__list {
    margin-bottom: 16rpx;
  }

  // 使用说明区域
  &__notice {
    margin: 8rpx 24rpx 24rpx;
    background: $card-bg;
    border-radius: $radius-md;
    padding: 24rpx;
    box-shadow: $shadow-sm;

    &-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
    }

    &-icon {
      font-size: 36rpx;
      margin-right: 12rpx;
    }

    &-title {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-primary;
    }

    &-body {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    &-text {
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.5;
    }
  }

  // 底部占位
  &__bottom-placeholder {
    height: 140rpx;
  }
}
</style>
