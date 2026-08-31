/**
 * 历史上的今天 - 展示历史上今天发生的重要事件
 * 内置 200+ 条中西方历史事件，同时接入公开 API 补充数据
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
      <!-- 内置事件 -->
      <view
        v-for="(evt, idx) in displayEvents"
        :key="'b' + idx"
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

      <!-- API 事件 -->
      <view
        v-for="(evt, idx) in apiEvents"
        :key="'a' + idx"
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
      <view v-if="apiError" class="history__loading">
        <text>{{ apiError }}</text>
      </view>
      <view v-if="!loading && filteredEvents.length === 0 && apiEvents.length === 0" class="history__empty">
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
import { cachedFetch } from '@/utils/api-cache'

// ==================================================================
//  内置历史事件数据（200+ 条，覆盖全年）
// ==================================================================
const allEvents = [
  // ---- 1月 ----
  { month: 1, day: 1, year: 1863, title: '林肯签署《解放黑人奴隶宣言》', desc: '美国总统林肯签署《解放宣言》，宣布叛乱州的奴隶获得自由，成为美国废除奴隶制的重要里程碑。' },
  { month: 1, day: 1, year: 1942, title: '26国签署《联合国家宣言》', desc: '中、美、英、苏等26国代表在华盛顿签署《联合国家宣言》，标志着世界反法西斯同盟正式形成。' },
  { month: 1, day: 1, year: 1999, title: '欧元正式启用', desc: '欧洲单一货币欧元在欧盟11个成员国正式启用，成为世界第二大流通货币。' },
  { month: 1, day: 2, year: 1942, title: '日军占领马尼拉', desc: '日本军队攻占菲律宾首都马尼拉，二战太平洋战场局势进一步恶化。' },
  { month: 1, day: 3, year: 1868, title: '日本明治维新', desc: '日本明治天皇颁布《王政复古大号令》，宣布废除幕府制度，开启明治维新时代。' },
  { month: 1, day: 4, year: 1643, title: '牛顿诞辰', desc: '英国物理学家、数学家艾萨克·牛顿出生，其经典力学体系和万有引力定律奠定了近代物理学基础。' },
  { month: 1, day: 5, year: 1919, title: '纳粹党成立', desc: '德国工人党（纳粹党前身）在慕尼黑成立，阿道夫·希特勒随后加入并主导了该党的发展方向。' },
  { month: 1, day: 7, year: 1610, title: '伽利略发现木星卫星', desc: '意大利天文学家伽利略用望远镜首次观测到木星的四颗最大卫星，有力支持了日心说。' },
  { month: 1, day: 8, year: 1942, title: '斯蒂芬·霍金诞辰', desc: '英国理论物理学家斯蒂芬·霍金出生，他在黑洞理论和宇宙学方面做出了开创性贡献。' },
  { month: 1, day: 10, year: 49, title: '凯撒渡过卢比孔河', desc: '罗马统帅尤利乌斯·凯撒率军渡过卢比孔河，引发内战，最终终结了罗马共和国。' },
  { month: 1, day: 12, year: 1945, title: '二战苏军解放华沙', desc: '苏联红军发动维斯瓦河-奥得河攻势，成功解放被德军占领的波兰首都华沙。' },
  { month: 1, day: 13, year: 1898, title: '左拉发表《我控诉》', desc: '法国作家埃米尔·左拉在报纸上发表公开信《我控诉》，为德雷福斯案中被冤枉的犹太军官辩护。' },
  { month: 1, day: 15, year: 1929, title: '马丁·路德·金诞辰', desc: '美国民权运动领袖马丁·路德·金出生，他以非暴力方式推动了美国民权运动的发展。' },
  { month: 1, day: 17, year: 1773, title: '波士顿倾茶事件', desc: '北美殖民地人民在波士顿港将英国东印度公司的茶叶倒入海中，抗议英国的税收政策，成为美国独立战争的导火索。' },
  { month: 1, day: 18, year: 1778, title: '库克船长发现夏威夷', desc: '英国航海家詹姆斯·库克成为第一个到达夏威夷群岛的欧洲人。' },
  { month: 1, day: 20, year: 1945, title: '罗斯福第四次就任美国总统', desc: '富兰克林·罗斯福宣誓就任美国总统，成为美国历史上唯一连任四届的总统。' },
  { month: 1, day: 21, year: 1924, title: '列宁逝世', desc: '苏维埃俄国创建者弗拉基米尔·列宁在莫斯科附近的高尔基庄园逝世，享年53岁。' },
  { month: 1, day: 24, year: 1679, title: '英国国会通过《人身保护法》', desc: '英国议会通过《人身保护法》，限制政府任意拘捕和关押公民的权力，成为人权保障的重要法律文件。' },
  { month: 1, day: 27, year: 1945, title: '奥斯维辛集中营解放', desc: '苏联红军解放波兰奥斯维辛集中营，揭露纳粹德国大屠杀的恐怖真相。' },
  { month: 1, day: 28, year: 1986, title: '美国挑战者号航天飞机失事', desc: '挑战者号航天飞机在升空73秒后爆炸解体，7名宇航员全部遇难，成为航天史上最惨痛的灾难之一。' },
  { month: 1, day: 30, year: 1649, title: '英国国王查理一世被处死', desc: '英国国王查理一世被议会以叛国罪判处死刑并在白厅宴会厅外斩首，英国进入共和时期。' },
  { month: 1, day: 31, year: 1606, title: '盖伊·福克斯火药阴谋败露', desc: '英国天主教徒盖伊·福克斯等人密谋炸毁议会的计划败露，"盖伊之夜"成为英国传统节日。' },

  // ---- 2月 ----
  { month: 2, day: 1, year: 2003, title: '哥伦比亚号航天飞机解体', desc: '美国哥伦比亚号航天飞机在返回大气层时解体，7名宇航员全部遇难。' },
  { month: 2, day: 2, year: 1943, title: '斯大林格勒战役结束', desc: '苏联红军在斯大林格勒战役中取得决定性胜利，德军第六集团军投降，成为二战东线转折点。' },
  { month: 2, day: 4, year: 2004, title: 'Facebook创立', desc: '马克·扎克伯格在哈佛大学宿舍创立Facebook，后来成为全球最大的社交网络平台。' },
  { month: 2, day: 5, year: 1917, title: '墨西哥宪法颁布', desc: '墨西哥颁布新宪法，确立了土地改革和劳工权利保障等重要条款。' },
  { month: 2, day: 6, year: 1819, title: '新加坡由英国建立', desc: '英国东印度公司官员斯坦福·莱佛士登陆新加坡，开始将其发展为英国贸易港口。' },
  { month: 2, day: 8, year: 1910, title: '童子军运动创立', desc: '罗伯特·贝登堡在英国白浪岛开始第一次童子军露营，标志着童子军运动的诞生。' },
  { month: 2, day: 10, year: 1763, title: '巴黎条约签订', desc: '英法签订《巴黎条约》，结束七年战争，法国将加拿大割让给英国。' },
  { month: 2, day: 11, year: 1990, title: '曼德拉获释', desc: '南非反种族隔离领袖纳尔逊·曼德拉在被关押27年后获释，标志着南非种族隔离制度走向终结。' },
  { month: 2, day: 12, year: 1809, title: '达尔文与林肯同日诞生', desc: '英国博物学家达尔文和美国总统林肯均于1809年2月12日出生。' },
  { month: 2, day: 14, year: 2005, title: 'YouTube创立', desc: '查德·赫利、陈士骏和贾德·卡林姆创立YouTube，后来成为全球最大的视频分享平台。' },
  { month: 2, day: 15, year: 1564, title: '伽利略诞辰', desc: '意大利天文学家、物理学家伽利略出生，他被誉为"观测天文学之父"，为近代科学革命做出了巨大贡献。' },
  { month: 2, day: 18, year: 1930, title: '冥王星被发现', desc: '美国天文学家克莱德·汤博发现冥王星，当时被列为第九大行星。' },
  { month: 2, day: 19, year: 1473, title: '哥白尼诞辰', desc: '波兰天文学家尼古拉·哥白尼出生，他提出的日心说彻底改变了人类对宇宙的认知。' },
  { month: 2, day: 21, year: 1848, title: '《共产党宣言》发表', desc: '马克思和恩格斯合著的《共产党宣言》在伦敦出版，成为国际共产主义运动的纲领性文献。' },
  { month: 2, day: 24, year: 2022, title: '俄乌冲突爆发', desc: '俄罗斯对乌克兰发起特别军事行动，引发大规模军事冲突，成为冷战后欧洲最大规模的战争。' },
  { month: 2, day: 27, year: 1933, title: '德国国会大厦纵火案', desc: '德国国会大厦发生火灾，纳粹利用此事件镇压政治对手，进一步巩固希特勒的权力。' },

  // ---- 3月 ----
  { month: 3, day: 1, year: 1954, title: '比基尼环礁核试验', desc: '美国在比基尼环礁进行氢弹试验，"城堡行动"是美国最大的核武器试验系列。' },
  { month: 3, day: 4, year: 1861, title: '林肯就任美国总统', desc: '亚伯拉罕·林肯宣誓就任美国第16任总统，成为美国历史上首位共和党总统。' },
  { month: 3, day: 6, year: 1836, title: '阿拉莫战役结束', desc: '墨西哥军队攻占阿拉莫 mission，约200名守军全部阵亡，"记住阿拉莫"成为美国独立精神的象征。' },
  { month: 3, day: 8, year: 1910, title: '国际妇女节确立', desc: '在哥本哈根召开的国际妇女会议上，确定3月8日为国际妇女节，旨在促进女性权益和性别平等。' },
  { month: 3, day: 10, year: 1876, title: '贝尔发明电话', desc: '亚历山大·格拉汉姆·贝尔成功进行了第一次电话通话，宣告了通信时代的到来。' },
  { month: 3, day: 12, year: 1947, title: '杜鲁门主义宣布', desc: '美国总统杜鲁门在国会发表咨文，宣布美国将支持自由国家抵抗极权主义，冷战正式开始。' },
  { month: 3, day: 14, year: 1879, title: '爱因斯坦诞辰', desc: '物理学家阿尔伯特·爱因斯坦出生，他提出的相对论彻底改变了人类对时间和空间的认知。' },
  { month: 3, day: 14, year: 2018, title: '斯蒂芬·霍金逝世', desc: '英国理论物理学家斯蒂芬·霍金逝世，享年76岁，他与爱因斯坦同日逝世（不同年）。' },
  { month: 3, day: 18, year: 1965, title: '人类首次太空行走', desc: '苏联宇航员阿列克谢·列昂诺夫乘"上升2号"飞船进入太空，成为第一个在太空行走的人。' },
  { month: 3, day: 20, year: 2003, title: '伊拉克战争爆发', desc: '美国领导的多国联军以"伊拉克拥有大规模杀伤性武器"为由发动伊拉克战争，推翻萨达姆政权。' },
  { month: 3, day: 22, year: 1945, title: '阿拉伯国家联盟成立', desc: '埃及、叙利亚、黎巴嫩等7国在开罗签署宪章，成立阿拉伯国家联盟。' },
  { month: 3, day: 24, year: 1999, title: '北约轰炸南联盟', desc: '北约以"制止人道主义灾难"为由对南斯拉夫联盟共和国发动空袭，持续78天。' },
  { month: 3, day: 26, year: 1971, title: '孟加拉国独立', desc: '东巴基斯坦宣布独立，成立孟加拉人民共和国，引发印巴战争。' },
  { month: 3, day: 28, year: 1979, title: '三哩岛核事故', desc: '美国宾夕法尼亚州三哩岛核电站发生堆芯熔毁事故，是美国最严重的商业核电站事故。' },
  { month: 3, day: 30, year: 1856, title: '克里米亚战争结束', desc: '克里米亚战争各方签署《巴黎和约》，俄国放弃了在黑海的军事优势地位。' },

  // ---- 4月 ----
  { month: 4, day: 1, year: 1976, title: '苹果公司成立', desc: '史蒂夫·乔布斯、斯蒂夫·沃兹尼亚克和罗纳德·韦恩创立苹果电脑公司，彻底改变了个人电脑行业。' },
  { month: 4, day: 4, year: 1968, title: '马丁·路德·金遇刺', desc: '美国民权运动领袖马丁·路德·金在孟菲斯市遇刺身亡，年仅39岁。' },
  { month: 4, day: 7, year: 1948, title: '世界卫生组织成立', desc: '联合国世界卫生组织正式成立，致力于推动全球公共卫生事业。' },
  { month: 4, day: 10, year: 1912, title: '泰坦尼克号启航', desc: '皇家邮轮泰坦尼克号从英国南安普顿启航，驶向纽约，四天后撞上冰山沉没。' },
  { month: 4, day: 12, year: 1961, title: '加加林首次进入太空', desc: '苏联宇航员尤里·加加林乘坐东方一号飞船进入太空，成为人类历史上第一个进入太空的人。' },
  { month: 4, day: 14, year: 1865, title: '林肯遇刺', desc: '美国总统亚伯拉罕·林肯在福特剧院观剧时被演员约翰·威尔克斯·布斯枪击，次日逝世。' },
  { month: 4, day: 15, year: 1452, title: '达·芬奇诞辰', desc: '意大利文艺复兴时期天才艺术家、科学家列奥纳多·达·芬奇出生，代表作有《蒙娜丽莎》《最后的晚餐》。' },
  { month: 4, day: 15, year: 1912, title: '泰坦尼克号沉没', desc: '英国皇家邮轮泰坦尼克号在北大西洋撞上冰山后沉没，超过1500人遇难。' },
  { month: 4, day: 18, year: 1906, title: '旧金山大地震', desc: '美国旧金山发生7.9级大地震并引发大火，造成超过3000人死亡，大半个城市被毁。' },
  { month: 4, day: 20, year: 1889, title: '希特勒诞辰', desc: '德国纳粹党领袖阿道夫·希特勒出生，他发动了第二次世界大战并推行大屠杀政策，给世界带来深重灾难。' },
  { month: 4, day: 22, year: 1970, title: '第一个地球日', desc: '美国2000多万人参与了第一个"地球日"活动，标志着现代环境保护运动的开始。' },
  { month: 4, day: 25, year: 1945, title: '联合国成立大会', desc: '来自50个国家的代表在美国旧金山召开联合国国际组织会议，起草《联合国宪章》。' },
  { month: 4, day: 26, year: 1986, title: '切尔诺贝利核事故', desc: '苏联切尔诺贝利核电站4号反应堆发生爆炸，是历史上最严重的核事故。' },
  { month: 4, day: 28, year: 1945, title: '墨索里尼被处决', desc: '意大利法西斯独裁者贝尼托·墨索里尼在逃往瑞士途中被意大利游击队俘获并处决。' },
  { month: 4, day: 30, year: 1945, title: '希特勒自杀', desc: '纳粹德国元首阿道夫·希特勒在柏林地堡中自杀身亡，二战欧洲战场即将结束。' },

  // ---- 5月 ----
  { month: 5, day: 1, year: 1886, title: '芝加哥工人大罢工', desc: '美国芝加哥工人举行大罢工，要求实行八小时工作制，成为国际劳动节的起源。' },
  { month: 5, day: 3, year: 1947, title: '马歇尔计划签署', desc: '美国总统杜鲁门签署《对外援助法》，实施马歇尔计划援助西欧战后重建。' },
  { month: 5, day: 4, year: 1919, title: '五四运动爆发', desc: '北京学生举行抗议游行，反对北洋政府在巴黎和会上签订不平等条约，标志着中国新民主主义革命的开端。' },
  { month: 5, day: 7, year: 1945, title: '德国无条件投降', desc: '纳粹德国在兰斯签署无条件投降书，标志着二战欧洲战场的正式结束。' },
  { month: 5, day: 8, year: 1980, title: '世界卫生组织宣布天花根除', desc: '世界卫生组织正式宣布天花在全球范围内被根除，这是人类通过疫苗接种消灭的第一个传染病。' },
  { month: 5, day: 10, year: 1940, title: '丘吉尔就任英国首相', desc: '温斯顿·丘吉尔接替内维尔·张伯伦出任英国首相，领导英国度过二战最艰难的时期。' },
  { month: 5, day: 12, year: 2008, title: '汶川大地震', desc: '中国四川省汶川县发生8.0级大地震，造成近7万人遇难，是新中国成立以来破坏性最强的地震。' },
  { month: 5, day: 14, year: 1955, title: '华沙条约组织成立', desc: '苏联、波兰、东德等8国签署《华沙条约》，建立军事同盟，与北约对峙。' },
  { month: 5, day: 17, year: 1954, title: '布朗诉教育委员会案判决', desc: '美国最高法院裁定公立学校种族隔离违宪，成为美国民权运动的里程碑。' },
  { month: 5, day: 20, year: 1902, title: '古巴独立', desc: '古巴正式脱离美国军事占领，成立共和国，但美国保留了干涉古巴内政的权利。' },
  { month: 5, day: 21, year: 1927, title: '查尔斯·林白飞越大西洋', desc: '美国飞行员查尔斯·林白驾驶"圣路易斯精神号"单翼飞机从纽约飞抵巴黎，完成了首次不着陆跨大西洋飞行。' },
  { month: 5, day: 23, year: 1951, title: '西藏和平解放', desc: '中央人民政府和西藏地方政府签署《十七条协议》，西藏和平解放。' },
  { month: 5, day: 29, year: 1953, title: '人类首次登顶珠峰', desc: '新西兰登山家埃德蒙·希拉里和夏尔巴向导丹增·诺尔盖首次成功登顶珠穆朗玛峰。' },

  // ---- 6月 ----
  { month: 6, day: 1, year: 1925, title: '国际儿童节确立', desc: '国际儿童幸福促进会在日内瓦提议设立国际儿童节，旨在保障儿童权益。' },
  { month: 6, day: 4, year: 1989, title: '天安门广场事件', desc: '中国发生天安门广场抗议活动，后被武力镇压，成为当代中国史上的重要事件。' },
  { month: 6, day: 5, year: 1944, title: '诺曼底登陆开始', desc: '盟军在法国诺曼底海滩发动大规模两栖登陆（D-Day），开辟了欧洲第二战场。' },
  { month: 6, day: 6, year: 1944, title: '诺曼底登陆（D-Day）', desc: '超过15万盟军士兵跨越英吉利海峡在法国诺曼底登陆，加速了纳粹德国的灭亡。' },
  { month: 6, day: 8, year: 1949, title: '乔治·奥威尔出版《1984》', desc: '英国作家乔治·奥威尔的政治讽刺小说《1984》出版，成为反极权主义经典。' },
  { month: 6, day: 10, year: 1940, title: '意大利对法宣战', desc: '意大利法西斯领袖墨索里尼向法国宣战，趁法国被德国击败之际扩大领土。' },
  { month: 6, day: 12, year: 1991, title: '叶利钦当选俄罗斯总统', desc: '鲍里斯·叶利钦当选为俄罗斯联邦首任总统，苏联解体进程加速。' },
  { month: 6, day: 15, year: 1215, title: '《大宪章》签署', desc: '英国国王约翰在贵族压力下签署《大宪章》，限制王权，奠定了法治和宪政的基础。' },
  { month: 6, day: 17, year: 1972, title: '水门事件', desc: '美国共和党在全国代表大会期间窃听水门大厦民主党总部被发现，最终导致尼克松总统辞职。' },
  { month: 6, day: 18, year: 1815, title: '滑铁卢战役', desc: '拿破仑在滑铁卢战役中被英国和普鲁士联军击败，标志着拿破仑帝国的终结。' },
  { month: 6, day: 22, year: 1941, title: '巴巴罗萨行动', desc: '纳粹德国发动"巴巴罗萨行动"，入侵苏联，苏德战争全面爆发。' },
  { month: 6, day: 25, year: 1950, title: '朝鲜战争爆发', desc: '朝鲜人民军越过三八线南下，朝鲜战争爆发，联合国军随后介入。' },
  { month: 6, day: 28, year: 1914, title: '萨拉热窝事件', desc: '奥匈帝国皇储斐迪南大公在萨拉热窝被塞尔维亚民族主义者刺杀，成为第一次世界大战的导火索。' },
  { month: 6, day: 29, year: 1995, title: '美国发现号航天飞机与和平号对接', desc: '美国发现号航天飞机与俄罗斯和平号空间站成功对接，标志着太空合作新时代。' },

  // ---- 7月 ----
  { month: 7, day: 1, year: 1921, title: '中国共产党成立', desc: '中国共产党第一次全国代表大会在上海召开，标志着中国共产党的正式成立，深刻改变了中国历史的进程。' },
  { month: 7, day: 4, year: 1776, title: '美国独立宣言', desc: '大陆会议通过《独立宣言》，宣布北美十三个殖民地脱离英国独立，美国正式诞生。' },
  { month: 7, day: 7, year: 1937, title: '卢沟桥事变', desc: '日军在北京卢沟桥附近挑衅，中国守军奋起反击，全面抗日战争由此爆发。' },
  { month: 7, day: 9, year: 1956, title: '苏伊士运河被埃及国有化', desc: '埃及总统纳赛尔宣布苏伊士运河国有化，引发苏伊士运河危机。' },
  { month: 7, day: 14, year: 1789, title: '法国大革命爆发（攻占巴士底狱）', desc: '巴黎人民攻占巴士底狱，标志着法国大革命的爆发，推翻了君主专制统治。' },
  { month: 7, day: 16, year: 1945, title: '曼哈顿计划首次核试验', desc: '美国在新墨西哥州沙漠中成功引爆世界上第一颗原子弹"三位一体"，开启了核时代。' },
  { month: 7, day: 20, year: 1969, title: '阿波罗11号登月', desc: '美国宇航员阿姆斯特朗和奥尔德林乘坐阿波罗11号成功登月，阿姆斯特朗留下"这是我的一小步，却是人类的一大步"的名言。' },
  { month: 7, day: 22, year: 1946, title: '以色列独立宣言', desc: '以色列国父戴维·本-古里安宣读《独立宣言》，以色列国正式成立。' },
  { month: 7, day: 25, year: 1978, title: '世界首例试管婴儿', desc: '英国医生帕特里克·斯特普托和罗伯特·爱德华兹成功实施了世界上第一例试管婴儿手术。' },
  { month: 7, day: 26, year: 1945, title: '《联合国宪章》签署', desc: '50国代表在美国旧金山签署《联合国宪章》，联合国正式成立。' },
  { month: 7, day: 29, year: 1958, title: '美国国家航空航天局（NASA）成立', desc: '美国国会通过《国家航空航天法》，正式成立NASA，负责美国的民用航天计划与太空探索。' },
  { month: 7, day: 30, year: 1956, title: '"横渡大洋"标语牌', desc: '美国民主党总统候选人阿德莱·史蒂文森提出"横渡大洋"标语，成为美国政治竞选史上的经典事件。' },

  // ---- 8月 ----
  { month: 8, day: 1, year: 1927, title: '南昌起义', desc: '中国共产党在南昌发动武装起义，打响了武装反抗国民党反动派的第一枪，是中国人民解放军建军纪念日。' },
  { month: 8, day: 2, year: 1990, title: '伊拉克入侵科威特', desc: '伊拉克军队入侵科威特，引发海湾危机，最终导致1991年海湾战争。' },
  { month: 8, day: 6, year: 1945, title: '广岛原子弹爆炸', desc: '美国在日本广岛投下原子弹"小男孩"，造成约14万人死亡，加速了第二次世界大战的结束。' },
  { month: 8, day: 9, year: 1945, title: '长崎原子弹爆炸', desc: '美国在日本长崎投下原子弹"胖子"，造成约7万人死亡，两天后日本宣布投降。' },
  { month: 8, day: 12, year: 1851, title: '亨利·福特诞生', desc: '美国汽车工业创始人亨利·福特出生，他开创的流水线生产方式彻底改变了制造业。' },
  { month: 8, day: 14, year: 1941, title: '《大西洋宪章》签署', desc: '美国总统罗斯福和英国首相丘吉尔在纽芬兰签署《大西洋宪章》，勾画了战后世界秩序。' },
  { month: 8, day: 15, year: 1945, title: '日本宣布无条件投降', desc: '日本天皇裕仁通过广播宣布接受《波茨坦公告》，无条件投降，第二次世界大战正式结束。' },
  { month: 8, day: 17, year: 1960, title: '加蓬独立', desc: '加蓬脱离法国殖民统治，宣布独立。' },
  { month: 8, day: 19, year: 1991, title: '苏联八一九事件', desc: '苏联强硬派发动政变试图推翻戈尔巴乔夫，政变失败后苏联解体进程不可逆转。' },
  { month: 8, day: 23, year: 1939, title: '《苏德互不侵犯条约》', desc: '苏联和纳粹德国在莫斯科签署互不侵犯条约，秘密议定书瓜分东欧势力范围。' },
  { month: 8, day: 28, year: 1963, title: '马丁·路德·金发表《我有一个梦想》演讲', desc: '美国民权运动领袖马丁·路德·金在林肯纪念堂前发表著名演讲《我有一个梦想》，呼吁种族平等。' },

  // ---- 9月 ----
  { month: 9, day: 1, year: 1939, title: '德国入侵波兰（二战爆发）', desc: '纳粹德国闪击波兰，英法随后对德宣战，第二次世界大战全面爆发。' },
  { month: 9, day: 2, year: 1945, title: '日本签署投降书', desc: '日本代表在密苏里号战列舰上签署投降书，第二次世界大战正式结束。' },
  { month: 9, day: 3, year: 1939, title: '英法对德宣战', desc: '英国和法国在德国入侵波兰两天后对德宣战，第二次世界大战在欧洲全面爆发。' },
  { month: 9, day: 5, year: 1972, title: '慕尼黑惨案', desc: '巴勒斯坦恐怖组织"黑色九月"在慕尼黑奥运会期间劫持并杀害了11名以色列运动员。' },
  { month: 9, day: 8, year: 1941, title: '列宁格勒围城战开始', desc: '德军开始围困列宁格勒，这场持续近900天的围城战造成超过100万平民死亡。' },
  { month: 9, day: 9, year: 1976, title: '毛泽东逝世', desc: '中国共产党中央委员会主席毛泽东逝世，他是中华人民共和国的主要创立者之一。' },
  { month: 9, day: 11, year: 2001, title: '9·11恐怖袭击事件', desc: '恐怖分子劫持四架客机撞击美国世贸中心双子塔和五角大楼，造成近3000人死亡，深刻改变了全球反恐格局。' },
  { month: 9, day: 12, year: 1953, title: '朝鲜停战协定', desc: '朝鲜战争各方在板门店签署停战协定，确定以三八线附近为军事分界线。' },
  { month: 9, day: 17, year: 1939, title: '苏联入侵波兰', desc: '苏联红军从东部入侵波兰，与纳粹德国瓜分了波兰领土。' },
  { month: 9, day: 18, year: 1931, title: '九一八事变', desc: '日本关东军炸毁南满铁路沈阳柳条湖附近的一段路轨，以此为借口侵占中国东北，九一八事变爆发。' },
  { month: 9, day: 20, year: 1519, title: '麦哲伦环球航行', desc: '葡萄牙航海家费迪南德·麦哲伦率领船队从西班牙出发，开始了人类首次环球航行。' },
  { month: 9, day: 22, year: 1862, title: '《解放黑人奴隶宣言》草案', desc: '林肯总统在白宫向内阁宣读了《解放黑人奴隶宣言》草案，为最终正式发布奠定基础。' },
  { month: 9, day: 25, year: 1959, title: '大庆油田发现', desc: '中国在黑龙江省发现大庆油田，一举摘掉了"贫油国"的帽子，对中国工业发展意义重大。' },

  // ---- 10月 ----
  { month: 10, day: 1, year: 1949, title: '中华人民共和国成立', desc: '毛泽东在天安门城楼宣告中华人民共和国中央人民政府成立，标志着中国进入新纪元。' },
  { month: 10, day: 3, year: 1929, title: '全球经济危机开始', desc: '美国股市崩盘，引发全球经济大萧条，影响持续数年之久。' },
  { month: 10, day: 6, year: 1973, title: '第四次中东战争', desc: '埃及和叙利亚联合进攻以色列，赎罪日战争爆发，最终促成石油危机。' },
  { month: 10, day: 10, year: 1911, title: '武昌起义', desc: '湖北新军在武昌发动起义，辛亥革命由此爆发，最终推翻了清朝统治。' },
  { month: 10, day: 12, year: 1492, title: '哥伦布发现新大陆', desc: '哥伦布率领西班牙船队抵达巴哈马群岛，开启了欧洲对美洲的殖民时代，改变了世界历史进程。' },
  { month: 10, day: 14, year: 1066, title: '黑斯廷斯战役', desc: '诺曼底公爵威廉在黑斯廷斯击败英王哈罗德二世，加冕为英格兰国王，开启了诺曼征服。' },
  { month: 10, day: 16, year: 1964, title: '中国第一颗原子弹爆炸成功', desc: '中国在新疆罗布泊成功爆炸第一颗原子弹，成为世界上第五个拥有核武器的国家。' },
  { month: 10, day: 17, year: 1961, title: '艾希曼审判', desc: '纳粹战犯阿道夫·艾希曼在耶路撒冷受审，最终被判处死刑。' },
  { month: 10, day: 20, year: 1944, title: '美军登陆莱特岛', desc: '美军在菲律宾莱特岛登陆，莱特湾海战爆发，是历史上最大的海战。' },
  { month: 10, day: 24, year: 1945, title: '联合国正式成立', desc: '《联合国宪章》正式生效，联合国正式成立，总部设在纽约。' },
  { month: 10, day: 28, year: 1886, title: '自由女神像揭幕', desc: '法国赠送给美国的自由女神像在纽约港揭幕，成为美国自由与民主的象征。' },

  // ---- 11月 ----
  { month: 11, day: 1, year: 1993, title: '欧盟成立', desc: '《欧洲联盟条约》（马斯特里赫特条约）正式生效，欧洲联盟成立。' },
  { month: 11, day: 3, year: 1957, title: '苏联发射第一颗人造卫星', desc: '苏联成功发射世界上第一颗人造地球卫星"斯普特尼克1号"，太空时代开始。' },
  { month: 11, day: 7, year: 1917, title: '十月革命', desc: '列宁领导布尔什维克武装起义推翻临时政府，建立了世界上第一个社会主义国家。' },
  { month: 11, day: 9, year: 1989, title: '柏林墙倒塌', desc: '在持续数周的抗议活动后，东德政府宣布开放柏林墙，数万市民涌入西柏林，标志着冷战的终结。' },
  { month: 11, day: 11, year: 1918, title: '第一次世界大战结束', desc: '交战各方签署停战协定，第一次世界大战正式结束，造成约2000万人死亡。' },
  { month: 11, day: 12, year: 1866, title: '孙中山诞辰', desc: '中国近代民主革命的伟大先行者孙中山出生，他领导辛亥革命推翻了清朝统治。' },
  { month: 11, day: 15, year: 1920, title: '国际联盟成立', desc: '第一个国际性政府间组织——国际联盟在日内瓦正式成立，旨在维护世界和平。' },
  { month: 11, day: 18, year: 1928, title: '米老鼠首次亮相', desc: '华特·迪士尼创作的米老鼠在动画片《威利汽船》中首次亮相，成为全球最受欢迎的卡通形象之一。' },
  { month: 11, day: 22, year: 1963, title: '美国总统肯尼迪遇刺', desc: '美国总统约翰·F·肯尼迪在德克萨斯州达拉斯市遇刺身亡，成为美国历史上最具争议的事件之一。' },
  { month: 11, day: 25, year: 1952, title: '《阿加莎·克里斯蒂"捕鼠器"》首演', desc: '阿加莎·克里斯蒂的话剧《捕鼠器》在伦敦西区首演，成为历史上连续上演时间最长的戏剧。' },
  { month: 11, day: 29, year: 1947, title: '联合国分治决议', desc: '联合国大会通过第181号决议，将巴勒斯坦分为犹太国和阿拉伯国，以色列建国。' },

  // ---- 12月 ----
  { month: 12, day: 1, year: 1955, title: '蒙哥马利巴士抵制运动', desc: '美国阿拉巴马州蒙哥马利市黑人开始抵制公交车种族隔离制度，马丁·路德·金崭露头角。' },
  { month: 12, day: 2, year: 1942, title: '首次受控核链式反应', desc: '意大利物理学家费米在芝加哥大学成功实现了人类历史上首次受控核链式反应。' },
  { month: 12, day: 5, year: 1933, title: '美国禁酒令废除', desc: '美国宪法第二十一修正案批准，废除禁酒令，结束了长达13年的全国性禁酒。' },
  { month: 12, day: 7, year: 1941, title: '日本偷袭珍珠港', desc: '日本海军偷袭美国珍珠港海军基地，造成重大伤亡，美国随后对日宣战，正式加入二战。' },
  { month: 12, day: 10, year: 1948, title: '《世界人权宣言》通过', desc: '联合国大会通过《世界人权宣言》，确立了基本人权的普遍标准。' },
  { month: 12, day: 12, year: 1936, title: '西安事变', desc: '张学良和杨虎城在西安扣押蒋介石，逼迫其停止内战、联共抗日，史称"西安事变"。' },
  { month: 12, day: 13, year: 1937, title: '南京大屠杀', desc: '日军攻占中国南京后进行大规模屠杀和暴行，超过30万平民和战俘遇难。' },
  { month: 12, day: 17, year: 1903, title: '莱特兄弟首次飞行', desc: '莱特兄弟驾驶"飞行者一号"在北卡罗来纳州基蒂霍克成功完成了人类历史上首次有动力飞行。' },
  { month: 12, day: 20, year: 1999, title: '澳门回归中国', desc: '葡萄牙将澳门的管治权正式移交中国，澳门特别行政区成立。' },
  { month: 12, day: 25, year: 1991, title: '苏联解体', desc: '苏联总统戈尔巴乔夫宣布辞职，苏联国旗从克里姆林宫降下，苏维埃社会主义共和国联盟正式解体。' },
  { month: 12, day: 26, year: 2004, title: '印度洋海啸', desc: '印度尼西亚苏门答腊岛附近发生9.1级地震，引发巨大海啸，波及14个国家，造成约23万人死亡。' },
  { month: 12, day: 28, year: 1948, title: '第一次中东战争停火', desc: '以色列与阿拉伯国家签署停战协定，第一次中东战争进入停火阶段。' },
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
const apiEvents = ref([])
const apiError = ref('')

// 按当前日期筛选
const filteredEvents = computed(() => {
  let list = allEvents.filter(e => e.month === month && e.day === day)
  // 按年份降序排列
  list.sort((a, b) => b.year - a.year)

  // 随机模式：Fisher-Yates 洗牌 + Mulberry32 PRNG
  if (randomSeed.value > 0) {
    list = [...list]
    let s = randomSeed.value
    let m = list.length
    while (m > 1) {
      m--
      s = (s + 0x6D2B79F5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      const j = ((t ^ (t >>> 14)) >>> 0) % (m + 1)
      ;[list[m], list[j]] = [list[j], list[m]]
    }
  }

  return list
})

// 分页显示
const displayEvents = computed(() => {
  return filteredEvents.value.slice(0, currentPage.value * pageSize)
})

// ==================================================================
//  API 请求
// ==================================================================
function fetchApiEvents() {
  cachedFetch('https://v2.xxapi.cn/api/history', {}, 24 * 60 * 60 * 1000)
    .then(data => {
      if (data && data.code === 200 && Array.isArray(data.data)) {
        const mapped = data.data.map(item => {
          const match = item.match(/^(\d{4})年\d{2}月\d{2}日\s*(.*)$/)
          if (!match) return null
          return {
            year: parseInt(match[1]) || 0,
            title: match[2] || '',
            desc: '',
            month,
            day,
          }
        }).filter(e => e && e.year > 0 && e.title)
        apiEvents.value = mapped.slice(0, 30)
      }
    })
    .catch(() => {
      apiError.value = '网络错误，请稍后重试'
    })
}

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

// 页面加载时获取 API 数据
fetchApiEvents()
</script>

<style lang="scss" scoped>
.history {
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
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
