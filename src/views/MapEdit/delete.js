// this.map.on('click', function(ev) {
//   // 触发事件的对象
//   var target = ev.target;
//   // 触发事件的地理坐标，AMap.LngLat 类型
//   var lnglat = ev.lnglat;
//   // 触发事件的像素坐标，AMap.Pixel 类型
//   var pixel = ev.pixel;
//   // 触发事件类型
//   var type = ev.type;
//   console.log(target, lnglat, pixel, type)
//
//   var marker = new AMap.Marker({
//     position: new AMap.LngLat(lnglat.lng, lnglat.lat),
//     title:'name'
//   })
//   that.map.add(marker)
// });