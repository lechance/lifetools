/**
 * 用户协议页面
 * 展示治点工具箱小程序的用户协议
 */
<template>
  <view class="doc-page">
    <view class="doc-page__title">治点工具箱用户协议</view>
    <view class="doc-page__meta">生效日期：2026年1月1日</view>

    <view class="doc-page__section">
      <view class="doc-page__heading">一、协议的接受</view>
      <view class="doc-page__para">
        欢迎使用「治点工具箱」微信小程序（以下简称"本小程序"）。在使用本小程序前，请您仔细阅读并理解本用户协议（以下简称"本协议"）的全部内容。您使用本小程序即视为您已阅读、理解并同意本协议的全部条款。
      </view>
      <view class="doc-page__para">
        如您不同意本协议的任何条款，请停止使用本小程序。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">二、服务说明</view>
      <view class="doc-page__para">
        本小程序致力于为用户提供日常生活、娱乐、计算、图片处理等方面的便捷工具集合，包括但不限于：科学计算、手电筒、倒计时、天气查询、汇率换算、图片处理等功能。
      </view>
      <view class="doc-page__para">
        本小程序提供的全部功能均为免费服务，我们保留根据业务发展需要调整、变更或终止部分或全部服务的权利。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">三、用户行为规范</view>
      <view class="doc-page__para">
        在使用本小程序过程中，您承诺遵守以下行为规范：
      </view>
      <view class="doc-page__para">
        1. 不利用本小程序从事任何违反法律法规、损害他人合法权益的活动；
      </view>
      <view class="doc-page__para">
        2. 不尝试破解、反向工程或破坏本小程序的正常功能；
      </view>
      <view class="doc-page__para">
        3. 不利用本小程序收集、存储或传播他人隐私信息；
      </view>
      <view class="doc-page__para">
        4. 不以任何形式干扰本小程序的正常运营。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">四、知识产权</view>
      <view class="doc-page__para">
        本小程序的全部内容，包括但不限于文字、图标、界面设计、代码、算法等，均受中华人民共和国著作权法及其他相关法律法规的保护。未经我们书面许可，任何单位和个人不得以任何形式复制、传播、修改或用于商业用途。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">五、免责声明</view>
      <view class="doc-page__para">
        本小程序提供的所有工具及其计算结果仅供参考，不构成任何专业建议。对于因使用本小程序提供的工具、数据或信息而产生的任何直接或间接损失，我们不承担任何责任。
      </view>
      <view class="doc-page__para">
        本小程序可能调用第三方接口获取数据（如天气、汇率等），我们不对第三方数据的准确性、完整性及及时性作出保证。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">六、服务变更与终止</view>
      <view class="doc-page__para">
        我们有权根据业务发展需要，随时变更、中断或终止本小程序的全部或部分服务。对于服务变更、中断或终止给用户造成的损失，我们不承担任何责任。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">七、协议修改</view>
      <view class="doc-page__para">
        我们有权随时修改本协议的任何条款。协议修改后将在本页面公布，修改后的协议自公布之日起生效。如您继续使用本小程序，即视为您接受修改后的协议。
      </view>
    </view>

    <view class="doc-page__section">
      <view class="doc-page__heading">八、法律适用与争议解决</view>
      <view class="doc-page__para">
        本协议的订立、执行与解释均适用中华人民共和国法律。因本协议产生的争议，双方应友好协商解决；协商不成的，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
      </view>
    </view>

    <view class="doc-page__footer">治点工具箱 · 用心做好每一个工具</view>
  </view>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.doc-page {
  min-height: 100vh;
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
