<template>
  <div class="box">
    <button @click="draw('polyline')">画线</button>
<!--    <button @click="draw('marker')">打点</button>-->
    <button @click="drawMarker">打点</button>
    <button @click="end">结束</button>
<!--    <button @click="continueDrawLine">continue</button>-->
    <div id="container">
      <div class="left-drawer" :style="{ display: isShowDrawer }">
        <el-form ref="form" :model="form" label-width="80px">
          <el-form-item label="标签名称">
            <el-input v-model="form.markerName"></el-input>
          </el-form-item>
          <el-form-item label="坐标经度">
            <el-input v-model="form.markerLng" placeholder="例：129.12345"></el-input>
          </el-form-item>
          <el-form-item label="坐标纬度">
            <el-input v-model="form.markerLat" placeholder="例：129.12345"></el-input>
          </el-form-item>
          <el-form-item label="标签类型">
            <el-select v-model="form.markerType" placeholder="请选择">
              <el-option label="里程控制点" value="1"></el-option>
              <el-option label="构筑物" value="2"></el-option>
              <el-option label="标段分割点" value="3"></el-option>
              <el-option label="事件点" value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>

            <el-button type="primary" @click="closeDrawer">取消</el-button>
            <el-button type="primary" @click="savePointInfo">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

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

      allPointArray: [], // 所有地图上添加的marker的经纬度的集合
      allPolylineArray: [], // 所有地图上添加的polyline的线段的起始位置的经纬度的集合  本身是一个数组 数组中的每项也是一个数组（保存这一条连续的线段的关键点）
      // // 当前是否为继续画线的操作 默认false 点击 continue按钮后 变成true
      // isContinue: false,
      allMarkerObject: [],
      curIndex: 0,
      isDrawMarker: false, // 当前是否为打点 默认为false（画线）
      isDrawPolyline: false, // 当前是否为画线
      curMarkerPosition: {}, // 当前打点的marker的位置
      isShowDrawer: 'none', // 是否展示左侧drawer
      form: {
        markerName: '',
        markerLng: '',
        markerLat: '',
        markerType: ''
      },
      curEditPoint: [],
      curEditIndex: [], // 当前正在编辑的marker的点的inidex
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
        that.mouseTool = new AMap.MouseTool(that.map); // 创建鼠标工具实例

        // 监听鼠标双击事件 如果在画线过程中 双击代表这一条线画完 此时往 allPolylineArray中添加一个新的线段空数组
        that.map.on('dblclick',function(e) {
          console.log('dbclick',e)
          // that.allPolylineArray.push([])
          that.mouseTool.close()
          that.isDrawMarker = false
          that.isDrawPolyline = false
        })

        // 监听鼠标右键单击事件 点击后退出当前的画线或者画点操作
        that.map.on('rightclick',function(e) {
          console.log('rightclick',e)
          that.isDrawMarker = false
          that.isDrawPolyline = false
          that.mouseTool.close()

        })

        // 监听鼠标绘制覆盖物事件
        that.mouseTool.on('draw', function(event) {
          console.log('为绘制出来的覆盖物对象', event.obj)
          // event.obj 为绘制出来的覆盖物对象
          console.log('覆盖物对象绘制完成')
        })

        that.map.on('click', function (ev) {
          console.log('click')
          var lnglat = ev.lnglat;
          if(that.isDrawMarker) {
            that.curMarkerPosition = {lng: lnglat.lng, lat: lnglat.lat} // 当前打的marker的位置
            // console.log('curpointposition', that.curMarkerPosition)
            that.allPointArray.push({lng: lnglat.lng, lat: lnglat.lat, name: '', type: ''})
            console.log('当前所有的marker的点的经纬度的集合', that.allPointArray)


            console.log(that.curMarkerPosition.lng, that.curMarkerPosition.lat)
            let marker = new AMap.Marker({
              position: new AMap.LngLat(that.curMarkerPosition.lng, that.curMarkerPosition.lat),
              title:'name',
              // 设置是否可以拖拽
              draggable: false,
            })

            console.log('mm', marker)
            let title = ''
            that.allPointArray.forEach(item=> {
              if(item.lng == marker._position.lng && item.lat == marker._position.lat) {
                title = item.name
              }
            })
            let text = marker._position.lng + ',' + marker._position.lat
            marker.setTitle(title)
            marker.setLabel({
              offset: new AMap.Pixel(20, 20),  //设置文本标注偏移量
              content: `<div class='info'>${text}</div>`, //设置文本标注内容
              direction: 'right' //设置文本标注方位
            });
            // 给每个marker添加点击事件
            marker.on('click', clickMarker)

            that.map.add(marker)
            // console.log('markerobj', marker)
            that.allMarkerObject.push(marker)

            that.allMarkerObject.forEach(item=> {
              var contextMenu = new AMap.ContextMenu();

              //右键放大
              contextMenu.addItem("移动", function () {
                // that.map.zoomIn();
              }, 0);

              //右键缩小
              contextMenu.addItem("删除", function () {
                // that.map.zoomOut();
              }, 1);
              // //绑定鼠标右击事件——弹出右键菜单
              item.on('rightclick', function (e) {
                contextMenu.open(that.map, e.lnglat);
              });
              // console.log('777', item)
              // contextMenu.open(that.map, new AMap.LngLat(item.position[0], item.position[1]))
            })

          }else if(that.isDrawPolyline) { // 如果当前为画线状态 监听鼠标点击 把点放入数组中
            if(that.allPolylineArray.length >1) {
              console.log('打印上次的最后一个点',that.allPolylineArray[that.allPolylineArray.length -2].slice(-1)[0])
              // 比较上一个点 和 当前的点的经纬度对比 如果两点之间的距离很近 则把两个点当作一个点保存
              let lastMarker = that.allPolylineArray[that.allPolylineArray.length -2].slice(-1)[0]

              console.log('当前的点',{lng: lnglat.lng, lat: lnglat.lat})
              if(Math.abs(lastMarker.lng- lnglat.lng) < 0.001 && Math.abs(lastMarker.lat - lnglat.lat) < 0.001) { // 绝对值差
                // 如果当前的点和上一个点被判定为同一位置 则删除点击画线按钮后that.allPolylineArry  push的一个空数组 同时该点加入到上一条线段的后面
                that.allPolylineArray.pop()
                return
              }
            }
              that.allPolylineArray[that.allPolylineArray.length -1 ].push({lng: lnglat.lng, lat: lnglat.lat})
              console.log('所有polyline的起始点的经纬度集合', that.allPolylineArray)

          }
          function clickMarker(e) {
            that.isShowDrawer = 'block'
            console.log('click params', e)
            that.form.markerLng = e.target._opts.position.lng
            that.form.markerLat = e.target._opts.position.lat
            that.allPointArray.forEach(item=> {
              if(item.lng ==e.target._opts.position.lng && item.lat == e.target._opts.position.lat) {
                that.form.markerName = item.name
                that.form.markerType= item.type
              }
            })
            // that.form.markerLat = e.target._opts.position.lat
            // that.form.markerLat = e.target._opts.position.lat
            that.curEditPoint = [e.target._opts.position.lng, e.target._opts.position.lat] // 当前正在编辑的点的经纬度
            // 遍历当前所有的marker的经纬度的数组 匹配到当前点击的marker的经纬度 获取到该点在数组中的索引index
            that.allPointArray.forEach((item, index)=> {
              if(item.lng == e.target._opts.position.lng && item.lat == e.target._opts.position.lat) {
                that.curEditIndex = index
              }
            })
          }

        })

        // that.map.event.addListener("polyline",'click',function(e){
        //   console.log('eeeeeee', e)  //设置组成该折线的节点数组
        // })


      }).catch((e)=>{
        console.error(e);  //加载错误提示
      });
    },
    end() {
      let that = this
      that.mouseTool.close()
      that.isDrawPolyline = false
      that.isDrawMarker = false
    },

    // 开始绘图
    draw(type) {
      let that = this
      that.mouseTool.close()
      that.isDrawMarker = false

      console.log(AMap)

        switch(type){
        //   case 'marker':{
        //     that.isDrawMarker = true
        //     that.mouseTool.marker({
        //       //同Marker的Option设置
        //       show: false
        //     });
        //
        //     break;
        //   }
          case 'polyline':{
            that.isDrawPolyline = true
            that.allPolylineArray.push([])
            that.mouseTool.polyline({
              strokeColor: "#d0670a",
              strokeOpacity: 1,
              strokeWeight: 6,
              strokeStyle: "solid",
              showDir:true,
              dirColor:'white',
            });

            break;
          }
        }
    },
    drawMarker() {
      let that = this
      that.mouseTool.close()
      that.isDrawMarker = true
    },

    // marker的drawer取消按钮
    closeDrawer() {
      this.isShowDrawer = "none"
    },
    // 保存marker的drawer的按钮
    savePointInfo() {
      // this.form.markerLngt
      this.allPointArray[this.curEditIndex].lng = Number(this.form.markerLng)
      this.allPointArray[this.curEditIndex].lat = Number(this.form.markerLat)
      this.allPointArray[this.curEditIndex].name = this.form.markerName
      this.allPointArray[this.curEditIndex].type = this.form.markerType
      this.allMarkerObject[this.curEditIndex]._position.lng = Number(this.form.markerLng)
      this.allMarkerObject[this.curEditIndex]._position.lat = Number(this.form.markerLat)
      this.isShowDrawer = 'none'
      // console.log('修改之后的 allPointArray', this.allPointArray)
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
  position: relative;
  width: 100%;
  height: 100%;
}
.amap-marker-label{
  border: 0;
  background-color: transparent;
}

.info{
  position: relative;
  top: 0;
  right: 0;
  min-width: 0;
}
.left-drawer {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 400px;
  background: #fff;
  z-index: 999;
}
</style>