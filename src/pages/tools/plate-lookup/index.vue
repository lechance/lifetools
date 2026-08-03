<template>
  <view class="page">
    <view class="card">
      <view class="row">
        <text class="label">输入车牌</text>
        <input class="input" v-model="plate" placeholder="如 京A88888" @input="lookup" />
      </view>
    </view>

    <view v-if="result" class="card result-card">
      <text class="plate-text">{{ result.code }}</text>
      <text class="plate-place">{{ result.place }}</text>
      <text class="plate-province">{{ result.province }}</text>
    </view>
    <view v-if="searched && !result" class="card result-card">
      <text class="empty">未找到对应城市，请检查车牌前缀</text>
    </view>

    <view class="card">
      <text class="card-title">省份字母对照</text>
      <view class="province-list">
        <view v-for="(cities, province) in plateData" :key="province" class="province-item">
          <text class="province-name">{{ province }}</text>
          <text class="province-cities">{{ cities.join(' ') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 省份 → 各字母城市
const plateData = {
  '京': ['北京'],
  '津': ['天津'],
  '冀': ['石家庄A', '唐山B', '秦皇岛C', '邯郸D', '邢台E', '保定F', '张家口G', '承德H', '沧州J', '廊坊R', '衡水T'],
  '晋': ['太原A', '大同B', '阳泉C', '长治D', '晋城E', '朔州F', '忻州H', '吕梁J', '晋中K', '临汾L', '运城M'],
  '蒙': ['呼和浩特A', '包头B', '乌海C', '赤峰D', '通辽G', '鄂尔多斯K', '呼伦贝尔E'],
  '辽': ['沈阳A', '大连B', '鞍山C', '抚顺D', '本溪E', '丹东F', '锦州G', '营口H', '阜新J', '辽阳K', '盘锦L', '铁岭M', '朝阳N', '葫芦岛P'],
  '吉': ['长春A', '吉林B', '四平C', '辽源D', '通化E', '白山F', '松原G', '白城H', '延边J'],
  '黑': ['哈尔滨A', '齐齐哈尔B', '牡丹江C', '佳木斯D', '大庆E', '伊春F', '鸡西G', '鹤岗H', '双鸭山J', '七台河K', '绥化M', '黑河N', '大兴安岭P'],
  '沪': ['上海'],
  '苏': ['南京A', '无锡B', '徐州C', '常州D', '苏州E', '南通F', '连云港G', '淮安H', '盐城J', '扬州K', '镇江L', '泰州M', '宿迁N'],
  '浙': ['杭州A', '宁波B', '温州C', '绍兴D', '湖州E', '嘉兴F', '金华G', '衢州H', '台州J', '丽水K', '舟山L'],
  '皖': ['合肥A', '芜湖B', '蚌埠C', '淮南D', '马鞍山E', '淮北F', '铜陵G', '安庆H', '黄山J', '阜阳K', '宿州L', '滁州M', '六安N', '宣城P', '池州R', '亳州S'],
  '闽': ['福州A', '莆田B', '泉州C', '厦门D', '漳州E', '龙岩F', '三明G', '南平H', '宁德J'],
  '赣': ['南昌A', '九江G', '景德镇H', '萍乡J', '新余K', '鹰潭L', '赣州B', '宜春C', '上饶E', '吉安D', '抚州F'],
  '鲁': ['济南A', '青岛B', '淄博C', '枣庄D', '东营E', '烟台F', '潍坊G', '济宁H', '泰安J', '威海K', '日照L', '德州N', '聊城P', '滨州M', '临沂Q', '菏泽R'],
  '豫': ['郑州A', '开封B', '洛阳C', '平顶山D', '安阳E', '鹤壁F', '新乡G', '焦作H', '濮阳J', '许昌K', '漯河L', '三门峡M', '南阳R', '商丘N', '信阳S', '周口P', '驻马店Q', '济源U'],
  '鄂': ['武汉A', '黄石B', '十堰C', '荆州D', '宜昌E', '襄阳F', '鄂州G', '荆门H', '黄冈J', '孝感K', '咸宁L', '随州R', '恩施Q'],
  '湘': ['长沙A', '株洲B', '湘潭C', '衡阳D', '邵阳E', '岳阳F', '常德G', '张家界H', '益阳J', '郴州L', '永州M', '怀化N', '娄底K', '湘西U'],
  '粤': ['广州A', '深圳B', '珠海C', '汕头D', '佛山E', '韶关F', '湛江G', '肇庆H', '江门J', '茂名K', '惠州L', '梅州M', '汕尾N', '河源P', '阳江Q', '清远R', '东莞S', '中山T', '潮州U', '揭阳V', '云浮W'],
  '桂': ['南宁A', '柳州B', '桂林C', '梧州D', '北海E', '防城港P', '钦州N', '贵港R', '玉林K', '百色L', '贺州J', '河池M', '来宾G', '崇左F'],
  '琼': ['海口A', '三亚B'],
  '渝': ['重庆'],
  '川': ['成都A', '绵阳B', '自贡C', '攀枝花D', '泸州E', '德阳F', '广元H', '遂宁J', '内江K', '乐山L', '南充R', '眉山Z', '宜宾Q', '广安X', '达州S', '雅安T', '巴中Y', '资阳M'],
  '贵': ['贵阳A', '六盘水B', '遵义C', '铜仁D', '黔西南E', '毕节F', '安顺G', '黔东南H', '黔南J'],
  '云': ['昆明A', '曲靖D', '玉溪F', '昭通C', '保山M', '丽江P', '普洱J', '临沧S', '文山H', '红河G', '大理L', '楚雄E', '迪庆R', '怒江Q', '西双版纳K'],
  '藏': ['拉萨A', '昌都B', '山南C', '日喀则D', '那曲E', '阿里F', '林芝G'],
  '陕': ['西安A', '铜川B', '宝鸡C', '咸阳D', '渭南E', '汉中F', '安康G', '商洛H', '延安J', '榆林K'],
  '甘': ['兰州A', '嘉峪关B', '金昌C', '白银D', '天水E', '武威H', '张掖G', '平凉L', '酒泉F', '庆阳M', '定西J', '陇南K', '临夏N', '甘南P'],
  '青': ['西宁A', '海东B', '海北C', '黄南D', '海南E', '果洛F', '玉树G', '海西H'],
  '宁': ['银川A', '石嘴山B', '吴忠C', '固原D', '中卫E'],
  '新': ['乌鲁木齐A', '昌吉B', '克拉玛依J', '吐鲁番K', '哈密L', '博尔塔拉E', '巴音郭楞M', '阿克苏N', '克孜勒苏P', '喀什Q', '和田R', '伊犁F', '塔城G', '阿勒泰H'],
  '港': ['香港'],
  '澳': ['澳门'],
}

const plate = ref('')
const result = ref(null)
const searched = ref(false)

function lookup() {
  const val = plate.value.trim().toUpperCase()
  if (!val) { result.value = null; searched.value = false; return }
  searched.value = true
  result.value = null

  const province = val[0]
  if (!plateData[province]) return

  // 京/津/沪/渝/港/澳 无字母区分
  if (plateData[province].length === 1) {
    result.value = { code: val.slice(0, 2), province, place: plateData[province][0] }
    return
  }

  const letter = val[1]
  const match = plateData[province].find(c => c.includes(letter))
  if (match) {
    result.value = {
      code: province + letter,
      province,
      place: match.replace(letter, '')
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
}
.label { font-size: 28rpx; color: #1D1D1F; }
.input {
  background: #F5F5F7;
  border-radius: 12rpx;
  padding: 10rpx 24rpx;
  font-size: 30rpx;
  width: 280rpx;
  text-align: center;
  color: #1D1D1F;
}
.result-card { text-align: center; }
.plate-text {
  display: block;
  font-size: 72rpx;
  font-weight: 700;
  font-family: monospace;
  color: #1D1D1F;
  letter-spacing: 8rpx;
}
.plate-place {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #007AFF;
  padding: 12rpx 0 4rpx;
}
.plate-province { font-size: 24rpx; color: #86868B; }
.empty {
  font-size: 26rpx;
  color: #86868B;
  display: block;
  padding: 20rpx 0;
}
.card-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.province-item {
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F5F5F7;
  &:last-child { border-bottom: none; }
}
.province-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-right: 16rpx;
}
.province-cities {
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.8;
}
</style>
