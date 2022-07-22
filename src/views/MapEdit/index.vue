<template>
  <div class="box">
    <button @click="draw('polyline')">画线</button>
    <button @click="draw('marker')">打点</button>
<!--    <button @click="drawMarker">打点</button>-->
    <button @click="end">结束</button>
    <button @click="editPolyline">修改线段</button>
    <button @click="editMarker">修改坐标点</button>
<!--    <button @click="continueDrawLine">continue</button>-->
    <div id="container">
      <div class="left-drawer" :style="{ display: isShowDrawer }">
        <h3>修改标记点</h3>
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


      <div class="left-drawer" :style="{ display: isShowLineEditDrawer, overflow: 'auto' }">
        <h3>修改线段</h3>
        <el-form ref="form" label-width="100px">
          <el-form-item label="线段类型">
            <el-select v-model="lineForm.type" placeholder="请选择">
              <el-option label="里程控制点" value="1"></el-option>
              <el-option label="构筑物" value="2"></el-option>
              <el-option label="标段分割点" value="3"></el-option>
              <el-option label="事件点" value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="施工长度/米">
            <el-input v-model="lineForm.length"></el-input>
          </el-form-item>
          <el-form-item label="当前状态">
            <el-input v-model="lineForm.status" placeholder=""></el-input>
          </el-form-item>
          <el-form-item label="沟槽深度">
            <el-input v-model="lineForm.depth" placeholder=""></el-input>
          </el-form-item>
          <el-form-item label="沟槽宽度">
            <el-input v-model="lineForm.width" placeholder=""></el-input>
          </el-form-item>
          <el-form-item label="垫层厚度">
            <el-input v-model="lineForm.thickness" placeholder=""></el-input>
          </el-form-item>
          <el-form-item label="垫层材质">
            <el-input v-model="lineForm.material" placeholder=""></el-input>
          </el-form-item>

<!--          <div v-for="(item, index) in lineForm.path" :key="index" style="display: flex">-->
<!--            <el-form-item label-width="60px " style="width: 50%"  label="lng">-->
<!--              <el-input  placeholder="经度">{{ item.lng }}</el-input>-->
<!--            </el-form-item>-->
<!--            <el-form-item label-width="60px" style="width: 50%" label="lat">-->
<!--              <el-input  placeholder="纬度">{{ // item.lat }}</el-input>-->
<!--            </el-form-item>-->
<!--          </div>-->

          <el-table
              :data="lineForm.path"
              style="width: 100%">
            <el-table-column
                label="经度"
                width="180">
              <template v-slot="{row}">
                <el-input v-model="row.lng" placeholder="经度" type="number"></el-input>
              </template>
            </el-table-column>
            <el-table-column
                label="纬度"
                width="180">
              <template v-slot="{row}">
                 <el-input v-model="row.lat" placeholder="纬度" type="number"></el-input>
              </template>
            </el-table-column>

          </el-table>

          <el-form-item>

            <el-button type="primary" @click="closeDrawer">取消</el-button>
            <el-button type="primary" @click="savePolylineInfo">保存</el-button>
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

      allSinglePolylinePath: [],
      allPointArray: [], // 所有地图上添加的marker的经纬度的集合
      allPolylineArray: [], // 所有地图上添加的polyline的线段的起始位置的经纬度的集合  本身是一个数组 数组中的每项也是一个数组（保存这一条连续的线段的关键点）
      // // 当前是否为继续画线的操作 默认false 点击 continue按钮后 变成true
      // isContinue: false,
      allMarkerObject: [],

      curIndex: 0,
      isDrawMarker: false, // 当前是否为打点 默认为false（画线）
      isDrawPolyline: false, // 当前是否为画线
      curMarkerPosition: {}, // 当前打点的marker的位置
      curMarkerObject: {}, // 当前正在编辑的marker的实例对象
      isShowDrawer: 'none', // 是否展示左侧drawer
      // 当前marker的info
      form: {
        markerName: '',
        markerLng: '',
        markerLat: '',
        markerType: ''
      },
      // 当前polyline的info
      lineForm: {
        type: '', // 线段类型
        length: '', // 施工长度（米）
        status: '', // 当前状态
        depth: '', // 沟槽深度
        width: '', // 沟槽宽度
        thickness: '', // 垫层厚度
        material: '', // 垫层材质
        path: [
          // {
          //   lng:'',
          //   lat: '',
          // }
        ], // 线段的path数组
      },
      curEditPoint: [],
      curEditIndex: [], // 当前正在编辑的marker的点的inidex
      curPolylinePath: [], // 当前正在编辑的线段的path
      curPolylineObj: {}, // 当前正在编辑的线段的实例对象
      isShowLineEditDrawer: 'none', // 是否展示编辑线段的drawer
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
        // that.map.on('dblclick',function(e) {
          // console.log('dbclick',e)
          // that.isDrawMarker = false
          // that.isDrawPolyline = false
        // })

        // 监听鼠标右键单击事件 点击后退出当前的画线或者画点操作
        // that.map.on('rightclick',function(e) {
          // console.log('rightclick',e)
          // that.isDrawMarker = false
          // that.isDrawPolyline = false
        // })

        // 监听鼠标绘制覆盖物事件
        that.mouseTool.on('draw', function(event) {
          console.log('为绘制出来的覆盖物对象', event)
          // event.obj 为绘制出来的覆盖物对象
          console.log('覆盖物对象绘制完成')
          that.mouseTool.close()

        })

        // 监听地图点击事件 如果当前为打点操作 则添加marker  如果当前为画线操作 把线条经过的点存入path中
        that.map.on('click', function (ev) {
          console.log('click')
          var lnglat = ev.lnglat;
          if(that.isDrawMarker) {
            that.curMarkerPosition = {lng: lnglat.lng, lat: lnglat.lat} // 当前打的marker的位置
            that.allPointArray.push({lng: lnglat.lng, lat: lnglat.lat, name: '', type: ''})
            console.log('当前所有的marker的点的经纬度的集合', that.allPointArray)

            // let marker = new AMap.Marker({
            //   position: new AMap.LngLat(that.curMarkerPosition.lng, that.curMarkerPosition.lat),
            //   title:'name',
            //   // 设置是否可以拖拽
            //   draggable: false,
            // })
            //
            // let text = marker._position.lng + ',' + marker._position.lat
            // marker.setLabel({
            //   offset: new AMap.Pixel(20, 20),  //设置文本标注偏移量
            //   content: `<div class='info'>${text}</div>`, //设置文本标注内容
            //   direction: 'right' //设置文本标注方位
            // });
            // // 给每个marker添加点击事件
            // marker.on('click', clickMarker)
            //
            // that.map.add(marker)
            // that.allMarkerObject.push(marker)


          }else if(that.isDrawPolyline) { // 如果当前为画线状态 监听鼠标点击 把点放入数组中
            if(that.allPolylineArray.length >1) {
              console.log('打印上次的最后一个点',that.allPolylineArray[that.allPolylineArray.length -2].slice(-1)[0])
              // 比较上一个点 和 当前的点的经纬度对比 如果两点之间的距离很近 则把两个点当作一个点保存
              let lastMarker = that.allPolylineArray[that.allPolylineArray.length -2].slice(-1)[0]

              console.log('当前的点',{lng: lnglat.lng, lat: lnglat.lat})
              if(Math.abs(lastMarker.lng- lnglat.lng) < 0.005 && Math.abs(lastMarker.lat - lnglat.lat) < 0.005) { // 绝对值差
                // 如果当前的点和上一个点被判定为同一位置 则删除点击画线按钮后that.allPolylineArry  push的一个空数组 同时该点加入到上一条线段的后面
                that.allPolylineArray.pop()
                return
              }
            }
              that.allPolylineArray[that.allPolylineArray.length -1 ].push({lng: lnglat.lng, lat: lnglat.lat})
              console.log('所有polyline的起始点的经纬度集合', that.allPolylineArray)

          }
          // marker的点击事件
          // function clickMarker(e) {
          //   that.isShowDrawer = 'block'
          //   console.log('click params', e)
          //   console.log('objobj', that.allMarkerObject)
          //   // 获取当前正在编辑的marker的实例
          //   that.curMarkerObject = that.allMarkerObject.filter(item=> {
          //     return item._position.lng == e.target._opts.position.lng && item._position.lat  == e.target._opts.position.lat
          //   })[0]
          //   console.log('当前编辑的marker实例', that.curMarkerObject)
          //
          //   that.form.markerLng = that.curMarkerObject._position.lng
          //   that.form.markerLat = that.curMarkerObject._position.lat
          //   that.form.name = that.curMarkerObject._opts.title
          //   that.curEditPoint = [e.target._opts.position.lng, e.target._opts.position.lat] // 当前正在编辑的点的经纬度
          //   // 遍历当前所有的marker的经纬度的数组 匹配到当前点击的marker的经纬度 获取到该点在数组中的索引index
          //   that.allPointArray.forEach((item, index)=> {
          //     if(item.lng == e.target._opts.position.lng && item.lat == e.target._opts.position.lat) {
          //       that.curEditIndex = index
          //     }
          //   })
          // }

        })

        // 获取覆盖物
        // that.map.getAllOverlays((e)=> {
        //   console.log('获取覆盖物', e)
        // })

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

      console.log(AMap)
        switch(type){
          case 'marker':{
            that.isDrawPolyline = false
            that.isDrawMarker = true
            that.mouseTool.marker({
              //同Marker的Option设置
              title: 'name',
              label: {
                offset:[8, -13],  //设置文本标注偏移量
                content: `<div class='info'>position</div>`, //设置文本标注内容
                direction: 'right', //设置文本标注方位
                // extData: {
                //   id: '',
                //   type: ''
                // }
              },
            });

            break;
          }
          case 'polyline':{
            that.isDrawPolyline = true
            that.isDrawMarker = false

            that.allPolylineArray.push([])
            that.mouseTool.polyline({
              strokeColor: "#1582a7",
              strokeOpacity: 1,
              strokeWeight: 6,
              strokeStyle: "solid",
              showDir:false,
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
      this.isShowLineEditDrawer = "none"
      // 恢复正在编辑的线段的样式
      this.curPolylineObj.setOptions({
        isOutline: false,
      })
    },
    // 保存marker的drawer的按
    savePointInfo() {
      // this.curMarkerObject.setPosition([Number(this.form.markerLng), Number(this.form.markerLat)])

      this.curMarkerObject._position.lng = Number(this.form.markerLng) // 在地图上重新设置marker更改后的位置
      this.curMarkerObject._position.lat = Number(this.form.markerLat) // 在地图上重新设置marker更改后的位置
      this.curMarkerObject.setTitle(this.form.markerName)  // 设置marker的title属性
      this.curMarkerObject.setExtData({type: this.form.markerType}) // 设置extdata中的type
      let text = `  <div>${this.form.markerName}</div>
                    <div class='info'>${this.form.markerLng + ',' + this.form.markerLat}</div>
                  `
      this.curMarkerObject.setLabel({content: text }) // 设置marker的label 中的content

      console.log('修改后的marker实例对象',this.curMarkerObject)

      this.isShowDrawer = 'none'
      this.isShowLineEditDrawer = 'none'
    },

    // 保存修改后的polyline的按钮
    savePolylineInfo() {
      let that =this
      // 恢复正在编辑的线段的样式
      that.curPolylineObj.setOptions({
        isOutline: false,
      })
      that.curPolylineObj.setPath(that.lineForm.path.map(item=> { return [item.lng, item.lat]})) // 在地图上重新设置polyline更改后的path

      console.log(" 修改polyline之后的 allPolylineArray", that.allPolylineArray)
      that.isShowLineEditDrawer = 'none'
    },

    // 修改线段 获取地图上所有的覆盖物 过滤出所有的线段 给每个线段绑定点击事件
    editPolyline() {
      let that = this
      // 获取所有的polyline的path
      // that.allSinglePolylinePath =
      console.log(that.map.getAllOverlays())
      let allCoverObj = that.map.getAllOverlays()
      console.log(allCoverObj)
      let allPolylineCoverObj = allCoverObj.filter(item=> {
        return item.type == "AMap.Overlay"
      })
      console.log(allPolylineCoverObj)
      // 给所有的polyline实例绑定点击事件
      allPolylineCoverObj.forEach(item=> {
        item.on('click', (e)=> {
          console.log('click line', e, e.target._opts.path) // 点击的这条线段的所有的点的集合
          that.curPolylineObj = item // 保存当前正在编辑的线段的实例
          // 设置正在编辑的线段的样式
          that.curPolylineObj.setOptions({
            isOutline: true,
            outlineColor: '#ffdb73', // 线条描边颜色，此项仅在isOutline为true时有效，默认：#00B2D5
            borderWeight: '3'
          })
          that.curPolylinePath = e.target._opts.path // 保存当前正在编辑的线段的关键点的经纬度集合
          that.isShowLineEditDrawer = 'block'
          that.lineForm.path = e.target._opts.path.map(item=> {
            return {lng: item[0], lat: item[1]}
          })
          that.lineForm.path = JSON.parse(JSON.stringify(that.lineForm.path))
          console.log('path', that.lineForm.path)
        })
      })
    },

    // 编辑marker的按钮
    editMarker() {
      let that = this
      console.log(that.map.getAllOverlays())
      let allCoverObj = that.map.getAllOverlays()
      console.log(allCoverObj)
      let allMarkerCoverObj = allCoverObj.filter(item=> {
        return item.type == "AMap.Marker"
      })
      console.log(allMarkerCoverObj)
      // 给所有的marker实例绑定点击事件
      allMarkerCoverObj.forEach(item=> {
        item.on('click', (e)=> {
          console.log('click marker', e, e.target._position.lng, e.target._position.lat, e.target._opts.title) // 点击的这条线段的所有的点的集合
          that.curMarkerObject = item // 保存当前正在编辑的marker的实例
          // 给每个点extData绑定id 和 type 属性
          that.curMarkerObject.setExtData({id:'', type: ''})
          console.log('that.curMarkerObject', that.curMarkerObject)

          that.form.markerLng = that.curMarkerObject._position.lng
          that.form.markerLat = that.curMarkerObject._position.lat
          that.form.markerName = that.curMarkerObject._opts.title
          // that.form.type = that.curMarkerObject._position.lat
          that.isShowDrawer = 'block'
          console.log('getextdata', that.curMarkerObject.getExtData())
          // console.log('getextdata', e.target.getExtData())
        })
      })
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