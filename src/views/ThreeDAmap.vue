<template>
  <div class="box">
    <div id="container"></div>
  </div>
</template>

<!--<script src="http://webapi.amap.com/maps?v=v2.1Beta&key=adf74d4d0b2c6ba04589f1e79183c3e4"></script>-->
<script>
import AMapLoader from '@amap/amap-jsapi-loader';
export default {
  name: "ThreeDAmap",
  data() {
    return {
      map: null
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      let that = this
      window._AMapSecurityConfig = { securityJsCode: '0295a40cdfa87f135af49203300acc42' };
      AMapLoader.load({
        "key": "adf74d4d0b2c6ba04589f1e79183c3e4",   // 申请好的Web端开发者Key，首次调用 load 时必填
        "version": "2.0",   // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        "plugins": [],           // 需要使用的的插件列表，如比例尺'AMap.Scale'等
      }).then((AMap)=>{
        that.map = new AMap.Map('container',{
          pitch:75, // 地图俯仰角度，有效范围 0 度- 83 度
          viewMode:'3D', // 地图模式
          terrain: true, // 开启地形
        });
      }).catch((e)=>{
        console.error(e);  //加载错误提示
      });
    }
  }
}
</script>

<style scoped>
  .box {
    width: 100%;
    height: 800px;
    background: #999;
  }
  #container {
    width: 100%;
    height: 100%;
    background: yellow;
  }
</style>