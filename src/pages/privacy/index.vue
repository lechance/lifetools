/**
 * 隐私政策页面
 * 展示治点工具箱小程序的隐私政策
 */
<template>
  <view class="doc-page">
    <view class="doc-page__title">治点工具箱隐私政策</view>
    <view class="doc-page__meta">生效日期：2026年1月1日</view>

    <view class="doc-page__section">
      <view class="doc-page__heading">一、概述</view>
      <view class="doc-page__para">
        我们非常重视您的个人信息和隐私保护。本隐私政策（以下简称"本政策"）旨在向您说明，在您使用「治点工具箱」微信小程序（以下简称"本小程序"）的过程中，我们如何收集、使用、存储和保护您的信息。
      </view>
      <view class="doc-page__para">
        请您在使用本小程序前仔细阅读并理解本政策的全部内容。您使用本小程序即视为您已充分理解并同意本政策。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">二、我们收集的信息</view>
      <view class="doc-page__para">
        本小程序收集的信息主要包括以下两类：
      </view>
      <view class="doc-page__para">
        1. 本地存储信息：您在使用过程中产生的收藏工具记录、使用记录、搜索历史等数据，均仅保存在您的设备本地，我们不会将其上传至服务器。
      </view>
      <view class="doc-page__para">
        2. 设备信息：为保障功能正常运行，部分工具（如海拔测量、计步器等）可能需要获取您的位置信息或传感器数据。此类信息仅用于即时计算，不会长期存储或上传。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">三、我们如何使用信息</view>
      <view class="doc-page__para">
        我们收集的信息仅用于以下目的：
      </view>
      <view class="doc-page__para">
        1. 为您提供各类工具的计算和查询功能；
      </view>
      <view class="doc-page__para">
        2. 根据您的收藏和使用记录，优化工具分类与展示；
      </view>
      <view class="doc-page__para">
        3. 改进小程序的功能和用户体验。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">四、信息的存储与安全</view>
      <view class="doc-page__para">
        您的本地存储信息（收藏、记录、搜索历史等）仅保存在您的设备上。当您卸载小程序或清除微信缓存时，这些数据将被删除。
      </view>
      <view class="doc-page__para">
        我们采取合理的措施保护您的信息安全，防止未经授权的访问、使用或泄露。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">五、信息共享与披露</view>
      <view class="doc-page__para">
        我们不会向任何第三方出售、出租或共享您的个人信息，但以下情形除外：
      </view>
      <view class="doc-page__para">
        1. 根据法律法规的要求或有权机关的指令；
      </view>
      <view class="doc-page__para">
        2. 为维护我们的合法权益所必需。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">六、第三方服务</view>
      <view class="doc-page__para">
        本小程序的部分功能（如天气查询、汇率换算、诗泉等）会调用第三方公开接口获取数据。在调用过程中，您的设备可能向第三方服务提供必要的请求信息（如查询关键词、设备基础信息等）。第三方服务将遵循其自身的隐私政策，我们建议您了解相关第三方服务商的隐私政策。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">七、未成年人保护</view>
      <view class="doc-page__para">
        我们非常重视未成年人个人信息的保护。若您是未满18周岁的未成年人，请在监护人指导下使用本小程序，并在监护人同意的前提下向我们提供相关信息。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">八、政策更新</view>
      <view class="doc-page__para">
        我们可能适时修订本政策。政策更新后将在本页面公布，修订后的政策自公布之日起生效。若您继续使用本小程序，即视为您接受修订后的政策。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">九、联系我们</view>
      <view class="doc-page__para">
        如您对本政策或个人信息保护有任何疑问、意见或建议，欢迎通过「我的 → 工具建议」与我们联系。我们将在收到反馈后尽快予以回复。
      </view>
    </view>

    <view class="doc-page__footer">治点工具箱 · 用心做好每一个工具</view>
  </view>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.doc-page {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: $card-bg;
  padding: 40rpx 32rpx 60rpx;

  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-primary;
    text-align: center;
    margin-bottom: 8rpx;
  }

  &__meta {
    font-size: $font-size-sm;
    color: $text-light;
    text-align: center;
    margin-bottom: 40rpx;
  }

  &__section {
    margin-bottom: 36rpx;
  }

  &__heading {
    font-size: $font-size-md;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16rpx;
  }

  &__para {
    font-size: $font-size-base;
    color: $text-secondary;
    line-height: 1.7;
    margin-bottom: 12rpx;
    text-align: justify;
  }

  &__footer {
    text-align: center;
    font-size: $font-size-sm;
    color: $text-light;
    margin-top: 40rpx;
    padding-top: 40rpx;
    border-top: 1rpx solid $border-color;
  }
}
</style>
