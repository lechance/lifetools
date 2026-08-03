/**
 * 历史上的今天 - 展示历史上今天发生的重要事件
 * 内置30+条中西方历史事件数据，按年份排序显示
 */
<template>
  <view class="history">
    <!-- 顶部标题与刷新 -->
    <view class="history__header">
      <view class="history__date">
        <text class="history__month">{{ month }}月</text>
        <text class="history__day">{{ day }}日</text>
      </view>
      <view class="history__actions">
        <view class="history__btn" @tap="refreshWithRandom">
          <text class="history__btn-icon">🔄</text>
          <text>随机看看</text>
        </view>
      </view>
    </view>

    <!-- 事件统计 -->
    <view class="history__stats">
      <text class="history__stats-text">历史上 {{ month }} 月 {{ day }} 日共发生 {{ filteredEvents.length }} 件大事</text>
    </view>

    <!-- 事件列表 -->
    <scroll-view
      class="history__list"
      scroll-y
      show-scrollbar
      :scroll-top="scrollTop"
      @scroll="onListScroll"
      @scrolltolower="loadMore"
    >
      <view
        v-for="(evt, idx) in displayEvents"
        :key="idx"
        class="history__item"
      >
        <view class="history__item-year">
          <text class="history__year-text">{{ evt.year }}年</text>
          <view class="history__year-line" />
        </view>
        <view class="history__item-body">
          <text class="history__item-title">{{ evt.title }}</text>
          <text class="history__item-desc">{{ evt.desc }}</text>
        </view>
      </view>

      <view v-if="loading" class="history__loading">
        <text>加载中...</text>
      </view>
      <view v-if="!loading && displayEvents.length === 0" class="history__empty">
        <text>今天没有历史事件记录</text>
      </view>
    </scroll-view>

    <!-- 回到顶部 -->
    <view
      v-if="showTopBtn"
      class="history__top"
      @tap="scrollToTop"
    >
      <text>⬆</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// ==================================================================
//  内置历史事件数据（至少30条，中西方混编）
// ==================================================================
const allEvents = [
  // ---- 1月 ----
  { month: 1, day: 1, year: 1863, title: '林肯签署《解放黑人奴隶宣言》', desc: '美国总统林肯签署《解放宣言》，宣布叛乱州的奴隶获得自由，成为美国废除奴隶制的重要里程碑。' },
  { month: 1, day: 12, year: 1945, title: '二战苏军解放华沙', desc: '苏联红军发动维斯瓦河-奥得河攻势，成功解放被德军占领的波兰首都华沙。' },
  { month: 1, day: 27, year: 1945, title: '奥斯维辛集中营解放', desc: '苏联红军解放波兰奥斯维辛集中营，揭露纳粹德国大屠杀的恐怖真相。' },
  { month: 1, day: 28, year: 1986, title: '美国挑战者号航天飞机失事', desc: '挑战者号航天飞机在升空73秒后爆炸解体，7名宇航员全部遇难，成为航天史上最惨痛的灾难之一。' },

  // ---- 2月 ----
  { month: 2, day: 12, year: 1809, title: '达尔文诞辰', desc: '英国博物学家、进化论奠基人查尔斯·达尔文出生，其著作《物种起源》奠定了现代生物进化理论的基础。' },
  { month: 2, day: 15, year: 1564, title: '伽利略诞辰', desc: '意大利天文学家、物理学家伽利略出生，他被誉为"观测天文学之父"，为近代科学革命做出了巨大贡献。' },
  { month: 2, day: 27, year: 1933, title: '德国国会大厦纵火案', desc: '德国国会大厦发生火灾，纳粹利用此事件镇压政治对手，进一步巩固希特勒的权力。' },

  // ---- 3月 ----
  { month: 3, day: 8, year: 1910, title: '国际妇女节确立', desc: '在哥本哈根召开的国际妇女会议上，确定3月8日为国际妇女节，旨在促进女性权益和性别平等。' },
  { month: 3, day: 14, year: 1879, title: '爱因斯坦诞辰', desc: '物理学家阿尔伯特·爱因斯坦出生，他提出的相对论彻底改变了人类对时间和空间的认知。' },
  { month: 3, day: 20, year: 2003, title: '伊拉克战争爆发', desc: '美国领导的多国联军以"伊拉克拥有大规模杀伤性武器"为由发动伊拉克战争，推翻萨达姆政权。' },

  // ---- 4月 ----
  { month: 4, day: 12, year: 1961, title: '加加林首次进入太空', desc: '苏联宇航员尤里·加加林乘坐东方一号飞船进入太空，成为人类历史上第一个进入太空的人。' },
  { month: 4, day: 15, year: 1452, title: '达·芬奇诞辰', desc: '意大利文艺复兴时期天才艺术家、科学家列奥纳多·达·芬奇出生，代表作有《蒙娜丽莎》《最后的晚餐》。' },
  { month: 4, day: 20, year: 1889, title: '希特勒诞辰', desc: '德国纳粹党领袖阿道夫·希特勒出生，他发动了第二次世界大战并推行大屠杀政策，给世界带来深重灾难。' },

  // ---- 5月 ----
  { month: 5, day: 4, year: 1919, title: '五四运动爆发', desc: '北京学生举行抗议游行，反对北洋政府在巴黎和会上签订不平等条约，标志着中国新民主主义革命的开端。' },
  { month: 5, day: 7, year: 1945, title: '德国无条件投降', desc: '纳粹德国在兰斯签署无条件投降书，标志着二战欧洲战场的正式结束。' },
  { month: 5, day: 29, year: 1953, title: '人类首次登顶珠峰', desc: '新西兰登山家埃德蒙·希拉里和夏尔巴向导丹增·诺尔盖首次成功登顶珠穆朗玛峰。' },

  // ---- 6月 ----
  { month: 6, day: 4, year: 1989, title: '天安门广场事件', desc: '中国发生天安门广场抗议活动，后被武力镇压，成为当代中国史上的重要事件。' },
  { month: 6, day: 6, year: 1944, title: '诺曼底登陆（D-Day）', desc: '盟军在法国诺曼底海滩发动大规模两栖登陆，开辟了欧洲第二战场，加速了纳粹德国的灭亡。' },
  { month: 6, day: 28, year: 1914, title: '萨拉热窝事件', desc: '奥匈帝国皇储斐迪南大公在萨拉热窝被塞尔维亚民族主义者刺杀，成为第一次世界大战的导火索。' },

  // ---- 7月 ----
  { month: 7, day: 1, year: 1921, title: '中国共产党成立', desc: '中国共产党第一次全国代表大会在上海召开，标志着中国共产党的正式成立，深刻改变了中国历史的进程。' },
  { month: 7, day: 14, year: 1789, title: '法国大革命爆发（攻占巴士底狱）', desc: '巴黎人民攻占巴士底狱，标志着法国大革命的爆发，推翻了君主专制统治。' },
  { month: 7, day: 20, year: 1969, title: '阿波罗11号登月', desc: '美国宇航员阿姆斯特朗和奥尔德林乘坐阿波罗11号成功登月，阿姆斯特朗留下"这是我的一小步，却是人类的一大步"的名言。' },
  { month: 7, day: 29, year: 1981, title: '查尔斯王子和戴安娜王妃结婚', desc: '英国王储查尔斯王子与戴安娜·斯宾塞在伦敦圣保罗大教堂举行盛大婚礼，全球约7.5亿人通过电视观看了这场婚礼。' },
  { month: 7, day: 29, year: 1958, title: '美国国家航空航天局（NASA）成立', desc: '美国国会通过《国家航空航天法》，正式成立NASA，负责美国的民用航天计划与太空探索。' },
  { month: 7, day: 29, year: 1836, title: '巴黎凯旋门落成', desc: '为纪念拿破仑军队的胜利而修建的巴黎凯旋门正式落成，成为法国最具象征意义的建筑之一。' },

  // ---- 8月 ----
  { month: 8, day: 6, year: 1945, title: '广岛原子弹爆炸', desc: '美国在日本广岛投下原子弹"小男孩"，造成约14万人死亡，加速了第二次世界大战的结束。' },
  { month: 8, day: 15, year: 1945, title: '日本宣布无条件投降', desc: '日本天皇裕仁通过广播宣布接受《波茨坦公告》，无条件投降，第二次世界大战正式结束。' },
  { month: 8, day: 28, year: 1963, title: '马丁·路德·金发表《我有一个梦想》演讲', desc: '美国民权运动领袖马丁·路德·金在林肯纪念堂前发表著名演讲《我有一个梦想》，呼吁种族平等。' },

  // ---- 9月 ----
  { month: 9, day: 1, year: 1939, title: '德国入侵波兰（二战爆发）', desc: '纳粹德国闪击波兰，英法随后对德宣战，第二次世界大战全面爆发。' },
  { month: 9, day: 9, year: 1976, title: '毛泽东逝世', desc: '中国共产党中央委员会主席毛泽东逝世，他是中华人民共和国的主要创立者之一。' },
  { month: 9, day: 11, year: 2001, title: '9·11恐怖袭击事件', desc: '恐怖分子劫持四架客机撞击美国世贸中心双子塔和五角大楼，造成近3000人死亡，深刻改变了全球反恐格局。' },
  { month: 9, day: 25, year: 1959, title: '大庆油田发现', desc: '中国在黑龙江省发现大庆油田，一举摘掉了"贫油国"的帽子，对中国工业发展意义重大。' },

  // ---- 10月 ----
  { month: 10, day: 1, year: 1949, title: '中华人民共和国成立', desc: '毛泽东在天安门城楼宣告中华人民共和国中央人民政府成立，标志着中国进入新纪元。' },
  { month: 10, day: 12, year: 1492, title: '哥伦布发现新大陆', desc: '哥伦布率领西班牙船队抵达巴哈马群岛，开启了欧洲对美洲的殖民时代，改变了世界历史进程。' },
  { month: 10, day: 16, year: 1964, title: '中国第一颗原子弹爆炸成功', desc: '中国在新疆罗布泊成功爆炸第一颗原子弹，成为世界上第五个拥有核武器的国家。' },

  // ---- 11月 ----
  { month: 11, day: 9, year: 1989, title: '柏林墙倒塌', desc: '在持续数周的抗议活动后，东德政府宣布开放柏林墙，数万市民涌入西柏林，标志着冷战的终结。' },
  { month: 11, day: 12, year: 1866, title: '孙中山诞辰', desc: '中国近代民主革命的伟大先行者孙中山出生，他领导辛亥革命推翻了清朝统治。' },
  { month: 11, day: 22, year: 1963, title: '美国总统肯尼迪遇刺', desc: '美国总统约翰·F·肯尼迪在德克萨斯州达拉斯市遇刺身亡，成为美国历史上最具争议的事件之一。' },

  // ---- 12月 ----
  { month: 12, day: 7, year: 1941, title: '日本偷袭珍珠港', desc: '日本海军偷袭美国珍珠港海军基地，造成重大伤亡，美国随后对日宣战，正式加入二战。' },
  { month: 12, day: 17, year: 1903, title: '莱特兄弟首次飞行', desc: '莱特兄弟驾驶"飞行者一号"在北卡罗来纳州基蒂霍克成功完成了人类历史上首次有动力飞行。' },
  { month: 12, day: 26, year: 2004, title: '印度洋海啸', desc: '印度尼西亚苏门答腊岛附近发生9.1级地震，引发巨大海啸，波及14个国家，造成约23万人死亡。' },
  { month: 12, day: 31, year: 1999, title: '巴拿马运河回归', desc: '美国将巴拿马运河的管理权正式移交给巴拿马政府，结束了美国对这条重要水道近一个世纪的控制。' },
]

// ==================================================================
//  状态
// ==================================================================
const now = new Date()
const month = now.getMonth() + 1
const day = now.getDate()

const loading = ref(false)
const showTopBtn = ref(false)
const scrollTop = ref(0)
const pageSize = 10
const currentPage = ref(1)
const randomSeed = ref(0)

// 按当前日期筛选
const filteredEvents = computed(() => {
  let list = allEvents.filter(e => e.month === month && e.day === day)
  // 按年份降序排列
  list.sort((a, b) => b.year - a.year)

  // 随机模式：基于 randomSeed 做伪随机打乱
  if (randomSeed.value > 0) {
    const seed = randomSeed.value
    list = [...list].sort((a, b) => {
      const ha = (a.year * 31 + a.month * 7 + seed * 13) % 100
      const hb = (b.year * 31 + b.month * 7 + seed * 13) % 100
      return ha - hb
    })
  }

  return list
})

// 分页显示
const displayEvents = computed(() => {
  return filteredEvents.value.slice(0, currentPage.value * pageSize)
})

// ==================================================================
//  操作
// ==================================================================

/** 刷新 - 随机打乱展示 */
function refreshWithRandom() {
  randomSeed.value = Date.now()
  currentPage.value = 1
  loading.value = true
  setTimeout(() => { loading.value = false }, 300)
}

/** 加载更多（滚动分页） */
function loadMore() {
  if (displayEvents.value.length >= filteredEvents.value.length) return
  currentPage.value++
}

/** 回到顶部（scroll-view 内部滚动） */
function scrollToTop() {
  scrollTop.value = 0
  showTopBtn.value = false
}

/** 监听列表滚动，控制回到顶部按钮显示 */
function onListScroll(e) {
  showTopBtn.value = (e.detail.scrollTop || 0) > 600
}
</script>

<style lang="scss" scoped>
.history {
  min-height: 100vh;
  background: #F5F5F7;

  // ====== 顶部 ======
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 28rpx 20rpx;
    background: linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%);
    border-radius: 0 0 32rpx 32rpx;
  }
  &__date {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
  }
  &__month {
    font-size: 56rpx;
    font-weight: 700;
    color: #FFFFFF;
  }
  &__day {
    font-size: 80rpx;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1;
  }
  &__actions {
    display: flex;
    gap: 16rpx;
  }
  &__btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: rgba(255, 255, 255, 0.2);
    padding: 12rpx 24rpx;
    border-radius: 40rpx;
    font-size: 24rpx;
    color: #FFFFFF;

    &:active {
      background: rgba(255, 255, 255, 0.35);
    }
  }
  &__btn-icon {
    font-size: 28rpx;
  }

  // ====== 统计 ======
  &__stats {
    padding: 20rpx 28rpx 8rpx;
  }
  &__stats-text {
    font-size: 24rpx;
    color: #86868B;
  }

  // ====== 事件列表 ======
  &__list {
    padding: 0 24rpx 32rpx;
    max-height: calc(100vh - 260rpx);
    overflow-y: auto;
  }

  &__item {
    display: flex;
    gap: 24rpx;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #E5E5EA;

    &:last-child {
      border-bottom: none;
    }
  }

  // ---- 年份列 ----
  &__item-year {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 100rpx;
    flex-shrink: 0;
    padding-top: 4rpx;
  }
  &__year-text {
    font-size: 28rpx;
    font-weight: 700;
    color: #1D1D1F;
    white-space: nowrap;
  }
  &__year-line {
    width: 2rpx;
    flex: 1;
    background: linear-gradient(to bottom, #C7C7CC, transparent);
    margin-top: 8rpx;
    min-height: 24rpx;
  }

  // ---- 内容列 ----
  &__item-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }
  &__item-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1D1D1F;
    line-height: 1.4;
  }
  &__item-desc {
    font-size: 26rpx;
    color: #86868B;
    line-height: 1.6;
  }

  // ====== 底部状态 ======
  &__loading,
  &__empty {
    text-align: center;
    padding: 40rpx 0;
    font-size: 26rpx;
    color: #86868B;
  }

  // ====== 回到顶部 ======
  &__top {
    position: fixed;
    right: 32rpx;
    bottom: 80rpx;
    width: 80rpx;
    height: 80rpx;
    background: #FFFFFF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
    z-index: 100;

    &:active {
      transform: scale(0.92);
    }
  }
}
</style>
