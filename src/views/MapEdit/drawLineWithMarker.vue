<template>
  <div class="box">
    <button @click="drawLine">画线</button>
    <!--    <button @click="drawMarker">打点</button>-->
    <button @click="continueDrawLine">continue</button>
    <div id="container"></div>

    <!--    <el-drawer-->
    <!--        title="我是标题"-->
    <!--        :visible.sync="drawer"-->
    <!--        :direction="direction"-->
    <!--        :append-to-body="true"-->
    <!--        :modal="false"-->
    <!--        :before-close="handleClose">-->
    <!--      <span>我来啦!</span>-->
    <!--    </el-drawer>-->
  </div>
</template>

<script>
const AMap = window.AMap
import AMapLoader from '@amap/amap-jsapi-loader';
export default {
  name: "mapEdit",
  data() {
    return {
      map: null,
      mouseTool: null,
      drawer: true,
      direction: 'left',
      // 所有地图上添加的点的集合
      allPointArray: [],
      // // 当前是否为继续画线的操作 默认false 点击 continue按钮后 变成true
      isContinue: false,
      allMarkerObject: [],
      curIndex: 0
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
        "plugins": ["AMap.MouseTool"],           // 需要使用的的插件列表，如比例尺'AMap.Scale'等
      }).then((AMap)=> {
        that.map = new AMap.Map('container', {
          viewMode: "2D",//是否为3D地图模式
          resizeEnable: true,
          zoom: 11,           //初始化地图级别
          zooms: [5, 18],
          center: [119.614192, 30.626411]//初始化地图中心点位置
        });

        that.map.on('click', function (ev) {
          // 触发事件的对象
          // var target = ev.target;
          // 触发事件的地理坐标，AMap.LngLat 类型
          var lnglat = ev.lnglat;
          // 触发事件的像素坐标，AMap.Pixel 类型
          // var pixel = ev.pixel;
          // 触发事件类型
          // var type = ev.type;
          console.log( lnglat)

          that.allPointArray.push({lng: lnglat.lng, lat: lnglat.lat, index: that.curIndex})
          that.curIndex += 1

          console.log('markerlist', that.allPointArray)
          if(!that.isContinue) { // 如果isContinue为false 则正常打点
            // 在鼠标左键点击过的地方打点

            var marker = new AMap.Marker({
              position: new AMap.LngLat(lnglat.lng, lnglat.lat),
              title:'name',
              // 设置是否可以拖拽
              draggable: true,
            })
            that.map.add(marker)

          }else { // 如果isContinue为true 则该位置不打点

            that.isContinue = !that.isContinue
          }
        });

      }).catch((e)=>{
        console.error(e);  //加载错误提示
      });
    },

    // 开始画线
    drawLine() {
      let that = this
      that.isContinue = false
      let mouseTool = new AMap.MouseTool(that.map);
      mouseTool.polyline({
        strokeColor: "#d0670a",
        strokeOpacity: 1,
        strokeWeight: 6,
        strokeStyle: "solid",
        showDir:true,
        dirColor:'white',
      });
    },

    // 继续画线
    continueDrawLine() {
      let that = this
      that.isContinue = true
      let mouseTool = new AMap.MouseTool(that.map);
      console.log('mousetoolConsole.log', mouseTool)

      mouseTool.polyline({
        strokeColor: "#d0670a",
        strokeOpacity: 1,
        strokeWeight: 6,
        strokeStyle: "solid",
        showDir:true,
        dirColor:'pink',
      });
    },

    handleClose() { }
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
}
</style>