/* 暖通专业智能组价系统 - 识别 / 定额 / 价格 Node 单测 */
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'data', 'prices.js'));
const A = require(path.join(__dirname, '..', 'js', 'app.js'));

let pass = 0, fail = 0;
function ck(desc, got, want) {
  const ok = got === want;
  if (ok) pass++;
  else { fail++; console.log('  ✗ ' + desc + '  got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)); }
}
function one(name) {
  const it = A.buildItem(name);
  const q = A.matchQuota(it);
  return { cat: it.category, sub: it.sub, code: q.code, qname: q.name, list: it.listCode, it: it };
}
function price(name) {
  const it = A.buildItem(name);
  const p = A.lookupPrice(it);
  return p ? p.price : null;
}

console.log('== 分类识别：设备 ==');
ck('轴流风机', A.classify('轴流式通风机 5000m3/h'), 'fan');
ck('离心风机', A.classify('离心式通风机 12000m3/h'), 'fan');
ck('混流风机', A.classify('混流式通风机 8000m3/h'), 'fan');
ck('排烟风机', A.classify('消防高温排烟风机 30000m3/h'), 'fan');
ck('卫生间通风器', A.classify('卫生间通风器'), 'fan');
ck('排气扇', A.classify('排气扇 风量300m3/h'), 'fan');
ck('组合式空调机组', A.classify('组合式空调机组 20000m3/h'), 'acu');
ck('新风机组', A.classify('新风机组 5000m3/h'), 'acu');
ck('吊顶式空调器', A.classify('吊顶式空调器 2.5kW'), 'acu');
ck('分体空调', A.classify('分体空调 3匹'), 'acu');
ck('多联机室外机', A.classify('多联机室外机 20HP'), 'acu');
ck('风机盘管', A.classify('风机盘管 FP-85 吊顶式'), 'fcu');
ck('风盘简写', A.classify('卧式暗装风盘 FP-51'), 'fcu');
ck('油烟净化器', A.classify('油烟净化器 8000m3/h'), 'fume');
ck('变风量末端', A.classify('变风量末端装置 800m3/h'), 'vav');
ck('除湿机', A.classify('除湿机 5kg/h'), 'dehum');
ck('过滤吸收器', A.classify('过滤吸收器 RFP-1000'), 'filter');
ck('空气加热器', A.classify('空气加热器 20000m3/h'), 'heater');
ck('除尘设备', A.classify('除尘设备 100kg'), 'dedust');

console.log('== 分类识别：风口风阀 ==');
ck('单层百叶风口', A.classify('单层百叶风口 800*400'), 'vent');
ck('双层百叶风口', A.classify('双层百叶风口 1000×500'), 'vent');
ck('防雨百叶', A.classify('防雨百叶 1200*600'), 'vent');
ck('自垂百叶', A.classify('自垂式百叶风口 500*300'), 'vent');
ck('门铰回风口', A.classify('门铰式回风口 600*300'), 'vent');
ck('电动风口', A.classify('电动风口 500*300'), 'vent');
ck('防火风口', A.classify('防火风口 800*400'), 'vent');
ck('方形散流器', A.classify('方形散流器 300*300'), 'vent');
ck('圆形散流器', A.classify('圆形散流器 φ400'), 'vent');
ck('旋流风口', A.classify('旋流风口 φ300'), 'vent');
ck('带调节阀百叶', A.classify('带调节阀百叶风口 630*320'), 'vent');
ck('多叶送风口', A.classify('多叶送风口 1250*630'), 'vent');
ck('板式排烟口', A.classify('板式排烟口 1000*500'), 'vent');
ck('70度防火阀', A.classify('70℃防火阀 800*400'), 'valve');
ck('280度排烟防火阀', A.classify('280℃排烟防火阀 1000*500'), 'valve');
ck('蝶阀', A.classify('蝶阀 φ300'), 'valve');
ck('止回阀', A.classify('止回阀 500*320'), 'valve');
ck('对开多叶调节阀', A.classify('对开多叶调节阀 1250*630'), 'valve');
ck('斜插板阀', A.classify('密闭式斜插板阀 800*400'), 'valve');
ck('定风量阀', A.classify('定风量阀 500*300'), 'valve');
ck('人防密闭阀', A.classify('人防手动密闭阀 φ300'), 'renfang');
ck('微穿孔板消声器', A.classify('微穿孔板消声器 600*320'), 'silencer');
ck('阻抗式消声器', A.classify('阻抗式消声器 1000*630'), 'silencer');
ck('静压箱', A.classify('静压箱 1200*400*250'), 'plenum');

console.log('== 清单编码 ==');
ck('通风机清单', one('轴流式通风机 5000m3/h').list, '030701301');
ck('空调器清单', one('组合式空调机组 20000m3/h').list, '030701003');
ck('风机盘管清单', one('风机盘管 FP-85').list, '030701004');
ck('油烟净化清单', one('油烟净化器 8000m3/h').list, '030701016');
ck('风口清单', one('单层百叶风口 800*400').list, '030703007');
ck('风阀清单', one('70℃防火阀 800*400').list, '030703001');
ck('人防清单', one('人防手动密闭阀 φ300').list, '030703023');
ck('消声器清单', one('微穿孔板消声器 600*320').list, '030703020');
ck('静压箱清单', one('静压箱 1200*400*250').list, '030703021');

console.log('== 定额：通风机风量分档（轴流） ==');
ck('轴流8900', one('轴流式通风机 8900m3/h').code, '9-239');
ck('轴流8901', one('轴流式通风机 8901m3/h').code, '9-240');
ck('轴流25000', one('轴流式通风机 25000m3/h').code, '9-240');
ck('轴流25001', one('轴流式通风机 25001m3/h').code, '9-241');
ck('轴流140000', one('轴流式通风机 140000m3/h').code, '9-242');
ck('轴流140001', one('轴流式通风机 140001m3/h').code, '9-243');
ck('卫生间通风器定额', one('卫生间通风器').code, '9-247');

console.log('== 定额：通风机风量分档（离心） ==');
ck('离心4500', one('离心式通风机 4500m3/h').code, '9-233');
ck('离心4501', one('离心式通风机 4501m3/h').code, '9-234');
ck('离心123000', one('离心式通风机 123000m3/h').code, '9-237');
ck('离心123001', one('离心式通风机 123001m3/h').code, '9-238');

console.log('== 定额：风机类型默认与手动切换 ==');
ck('未注类型默认轴流', one('通风机 5000m3/h').sub, 'axial');
ck('未注类型默认定额', one('通风机 5000m3/h').code, '9-239');
ck('切离心后定额', (function () { const it = A.buildItem('通风机 5000m3/h'); it.sub = 'centrifugal'; return A.matchQuota(it).code; })(), '9-234');
ck('切离心后价格', (function () { const it = A.buildItem('通风机 5000m3/h'); it.sub = 'centrifugal'; return A.lookupPrice(it).price; })(), 2250);
ck('轴流5000价格', price('轴流式通风机 5000m3/h'), 1900);

console.log('== 定额：空调器 ==');
ck('组合式20000', one('组合式空调机组 20000m3/h').code, '9-259');
ck('组合式4000', one('组合式空调机组 4000m3/h').code, '9-257');
ck('组合式100001', one('组合式空调机组 100001m3/h').code, '9-264');
ck('新风5000', one('新风机组 5000m3/h').code, '9-258');
ck('吊顶式', one('吊顶式空调器 2.5kW').code, '9-248');
ck('落地式', one('落地式空调器 5匹').code, '9-251');
ck('墙上式', one('墙上式空调器 1.5匹').code, '9-254');
ck('多联机', one('多联机室外机 20HP').code, '9-251');

console.log('== 定额：风机盘管安装方式 ==');
ck('吊顶式', one('风机盘管 FP-85 吊顶式').code, '9-266');
ck('落地式', one('风机盘管 FP-85 落地式').code, '9-265');
ck('壁挂式', one('风机盘管 FP-85 壁挂式').code, '9-267');
ck('卡式', one('风机盘管 FP-85 卡式').code, '9-268');
ck('默认吊顶', one('风机盘管 FP-85').code, '9-266');

console.log('== 定额：风口周长分档 ==');
ck('单层900', one('单层百叶风口 450*0').code, '');
ck('单层400x50=900', one('单层百叶风口 400*50').code, '9-86');
ck('单层450x50=1000', one('单层百叶风口 450*50').code, '9-87');
ck('防雨1200x600=3600', one('防雨百叶 1200*600').code, '9-91');
ck('方形散流器300x300', one('方形散流器 300*300').code, '9-104');
ck('圆形散流器φ400', one('圆形散流器 φ400').code, '9-107');
ck('带调节阀百叶630x320=1900', one('带调节阀百叶风口 630*320').code, '9-125');
ck('板式排烟口1000x500', one('板式排烟口 1000*500').code, '9-145');
ck('多叶送风口1250x630', one('多叶送风口 1250*630').code, '9-151');

console.log('== 定额：风阀周长分档 ==');
ck('防火阀800x400=2400', one('70℃防火阀 800*400').code, '9-83');
ck('防火阀600x500=2200', one('70℃防火阀 600*500').code, '9-82');
ck('排烟防火阀1000x500=3000', one('280℃排烟防火阀 1000*500').code, '9-83');
ck('蝶阀φ300', one('蝶阀 φ300').code, '9-64');
ck('止回阀500x320=1640', one('止回阀 500*320').code, '9-70');
ck('多叶1250x630=3760', one('对开多叶调节阀 1250*630').code, '9-77');
ck('斜插板800x400=2400', one('密闭式斜插板阀 800*400').code, '9-73');
ck('定风量阀500x300=1600', one('定风量阀 500*300').code, '9-76');
ck('超压排气阀', one('超压排气阀门').code, '9-420');

console.log('== 定额：人防 / 消声器 / 静压箱 ==');
ck('人防φ200', one('人防手动密闭阀 φ200').code, '9-423');
ck('人防φ300', one('人防手动密闭阀 φ300').code, '9-424');
ck('人防φ900', one('人防手动密闭阀 φ900').code, '9-429');
ck('微穿孔板600x320=1840', one('微穿孔板消声器 600*320').code, '9-191');
ck('阻抗式1000x630=3260', one('阻抗式消声器 1000*630').code, '9-198');
ck('管式400x240=1280', one('管式消声器 400*240').code, '9-201');
ck('静压箱1200x400x250', one('静压箱 1200*400*250').code, '9-213');

console.log('== 价格 ==');
ck('轴流5000=1900', price('轴流式通风机 5000m3/h'), 1900);
ck('轴流10000=3600', price('轴流式通风机 10000m3/h'), 3600);
ck('离心4500=2475', price('离心式通风机 4500m3/h'), 2475);
ck('离心20000=7600', price('离心式通风机 20000m3/h'), 7600);
ck('卫生间通风器=180', price('卫生间通风器'), 180);
ck('排气扇=180', price('排气扇 风量300m3/h'), 180);
ck('组合式20000=56000', price('组合式空调机组 20000m3/h'), 56000);
ck('新风5000=17500', price('新风机组 5000m3/h'), 17500);
ck('吊顶式2.5kW=3250', price('吊顶式空调器 2.5kW'), 3250);
ck('风机盘管FP-85=1350', price('风机盘管 FP-85'), 1350);
ck('风机盘管FP-102=1580', price('风机盘管 FP-102'), 1580);
ck('风机盘管无型号=1350', price('风机盘管 卧式暗装'), 1350);
ck('油烟8000=20800', price('油烟净化器 8000m3/h'), 20800);
ck('单层百叶800x400=138.6', price('单层百叶风口 800*400'), 138.6);
ck('防雨百叶1200x600=679.2', price('防雨百叶 1200*600'), 679.2);
ck('70度防火阀800x400=346.8', price('70℃防火阀 800*400'), 346.8);
ck('静压箱1200x400x250=422.4', price('静压箱 1200*400*250'), 422.4);
ck('无风量风机无价', price('通风机'), null);
ck('多联机待询价', price('多联机室外机 20HP'), null);

console.log('== 单位 ==');
ck('风机单位台', A.parseRows([['序号', '项目名称', '数量'], [1, '轴流式通风机 5000m3/h', 2]])[0].unit, '台');
ck('风口单位个', A.parseRows([['序号', '项目名称', '数量'], [1, '单层百叶风口 800*400', 2]])[0].unit, '个');
ck('风阀单位个', A.parseRows([['序号', '项目名称', '数量'], [1, '70℃防火阀 800*400', 2]])[0].unit, '个');
ck('静压箱单位个', A.parseRows([['序号', '项目名称', '数量'], [1, '静压箱 1200*400*250', 2]])[0].unit, '个');

console.log('== 参数解析 ==');
ck('风量m3/h', A.parseAirVolume('风机 5000m3/h'), 5000);
ck('风量L=8000', A.parseAirVolume('风机 L=8000'), 8000);
ck('风量风量12000', A.parseAirVolume('风机 风量12000'), 12000);
ck('风量无', A.parseAirVolume('风机'), null);
ck('尺寸800x400', A.calcPerimeter(A.parseDim('风口 800*400')), 2400);
ck('尺寸φ400', A.calcPerimeter(A.parseDim('风口 φ400')), 1257);
ck('面积800x400', A.calcArea(A.parseDim('风口 800*400')), 0.32);
ck('面积φ400', A.calcArea(A.parseDim('风口 φ400')), 0.126);
ck('制冷量2.5kW', A.parseCoolingKw('空调器 2.5kW'), 2.5);
ck('制冷量5匹', A.parseCoolingKw('空调器 5匹'), 12.5);

console.log('== 全流程 ==');
const aoa = [['序号', '项目名称', '数量'],
  [1, '轴流式通风机 5000m3/h', 2],
  [2, '离心式通风机 12000m3/h', 1],
  [3, '风机盘管 FP-85 吊顶式', 12],
  [4, '单层百叶风口 800*400', 20],
  [5, '70℃防火阀 800*400', 6],
  [6, '静压箱 1200*400*250', 2]];
const rows = A.parseRows(aoa);
ck('全流程条数', rows.length, 6);
ck('全流程首条序号', rows[0].index, '1');
ck('全流程首条定额', rows[0].quotaCode, '9-239');
ck('全流程首条价格', rows[0].price, 1900);
const total = rows.reduce((s, x) => s + (x.price ? x.price * x.quantity : 0), 0);
ck('全流程主材合计', +total.toFixed(2), +(1900 * 2 + 4560 + 1350 * 12 + 138.6 * 20 + 346.8 * 6 + 422.4 * 2).toFixed(2));

console.log('\n' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
