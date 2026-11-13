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
ck('吊顶式0.18t→9-249', one('吊顶式空调器 0.18t').code, '9-249');
ck('吊顶式0.3t→9-250', one('吊顶式空调器 0.3t').code, '9-250');
ck('吊顶式0.45t→9-250', one('吊顶式空调器 0.45t').code, '9-250');
ck('落地式0.8t→9-252', one('落地式空调器 0.8t').code, '9-252');
ck('落地式2.5t→9-253', one('落地式空调器 2.5t').code, '9-253');
ck('墙上式0.15t→9-255', one('墙上式空调器 0.15t').code, '9-255');
ck('落地式300kg→9-251', one('落地式空调器 300kg').code, '9-251');
ck('分段组装→9-270', one('分段组装式空调器 30000m3/h').code, '9-270');
ck('室内机按吊顶分档', one('多联机室内机 5kW').code, '9-248');
ck('吊顶式风量估算0.15t→9-248', one('吊顶式空调器 10000m3/h').code, '9-248');
ck('空调器质量档名称', one('落地式空调器 0.8t').qname, '落地式空调器安装 质量1.0t以内');
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
ck('圆形散流器φ200→9-105', one('圆形散流器 φ200').code, '9-105');
ck('圆形散流器φ600→9-107', one('圆形散流器 φ600').code, '9-107');
ck('圆形风口φ300→9-106', one('圆形风口 φ300').code, '9-106');
ck('圆形风口φ400→9-107', one('圆形风口 φ400').code, '9-107');
ck('球形喷口-300→9-106', one('球形喷口-300').code, '9-106');
ck('球形喷口直径300', A.buildItem('球形喷口-300').dim.diameter, 300);
ck('球形喷口名称', one('球形喷口-300').qname, '圆形散流器安装 直径360mm以内');
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
ck('普通静压箱→9-284', one('静压箱 1200*400*250').code, '9-284');
ck('消声静压箱1200*1100*400=1.32→9-214', one('消声静压箱 1200*1100*400').code, '9-214');
ck('消声静压箱800*600*400=0.48→9-213', one('消声静压箱 800*600*400').code, '9-213');
ck('消声静压箱2500*2000*500=5→9-215', one('消声静压箱 2500*2000*500').code, '9-215');
ck('静压箱截面积1.32', A.buildItem('消声静压箱 1200*1100*400').plenumArea, 1.32);
ck('普通静压箱截面积1.32', A.buildItem('静压箱 1200*1100*400').plenumArea, 1.32);
ck('消声静压箱子类', A.buildItem('消声静压箱 1200*1100*400').sub, 'silencer');
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
ck('多联机20HP=70000', price('多联机室外机 20HP'), 70000);
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
console.log('== 消声器：整类统一标准、随截面单调 ==');
var s1 = price('微穿孔板消声器 400*600'), s2 = price('微穿孔板消声器 600*320'), s3 = price('微穿孔板消声器 800*600');
ck('消声器400x600单价', s1, 1120);
ck('消声器600x320单价', s2, 1030.4);
ck('消声器800x600单价', s3, 1568);
ck('消声器单调800x600>400x600', s3 > s1, true);
ck('消声器单调400x600>600x320', s1 > s2, true);
ck('阻抗式比微穿孔板贵', price('阻抗式消声器 600*320') > s2, true);
ck('管式比微穿孔板便宜', price('管式消声器 600*320') < s2, true);

console.log('== 人防密闭阀：随直径单调 ==');
var r2 = price('人防手动密闭阀 φ200'), r3 = price('人防手动密闭阀 φ300'),
    r4 = price('人防手动密闭阀 φ400'), r6 = price('人防手动密闭阀 φ600'), r8 = price('人防手动密闭阀 φ800');
ck('人防φ200价', r2, 520);
ck('人防φ300价', r3, 780);
ck('人防φ400价', r4, 1040);
ck('人防φ600价', r6, 1560);
ck('人防φ800价', r8, 2080);
ck('人防单调φ800>φ600', r8 > r6, true);
ck('人防单调φ400>φ300', r4 > r3, true);
ck('人防单调φ300>φ200', r3 > r2, true);
ck('人防电动加价', price('电动人防手动密闭阀 φ300'), 1180);

console.log('== 排烟风机默认轴流 ==');
var paRows = A.parseRows([['序号', '项目名称', '数量'], [1, '消防高温排烟风机 30000m3/h', 1]]);
ck('排烟风机默认轴流', paRows[0].sub, 'axial');
ck('排烟风机定额9-241', paRows[0].quotaCode, '9-241');
ck('排烟风机有切换提示', /切换/.test(paRows[0].warn), true);

console.log('== 原缺价设备已补市场价 ==');
ck('除湿机5kg/h=7500', price('除湿机 5kg/h'), 7500);
ck('过滤吸收器1000风量=6000', price('过滤吸收器 1000m3/h'), 6000);
ck('变风量800风量=1800', price('变风量末端 800m3/h'), 1800);
ck('空气加热器20000风量=20000', price('空气加热器 20000m3/h'), 20000);
ck('除尘器5000风量=25000', price('除尘器 5000m3/h'), 25000);
ck('多联机室内机2.2kW=1980', price('多联机室内机 2.2kW'), 1980);

console.log('== 未匹配项：清单030806801 + 补1/补2/补3 ==');
var rowsX = A.parseRows([['序号', '项目名称', '数量'],
  [1, '除湿机 5kg/h', 1], [2, '过滤吸收器 1000m3/h', 1], [3, '管道支架 角钢 L50', 4]]);
ck('补项1清单', rowsX[0].listCode, '030806801');
ck('补项1编号', rowsX[0].quotaCode, '补1');
ck('补项2编号', rowsX[1].quotaCode, '补2');
ck('补项2清单', rowsX[1].listCode, '030806801');
ck('其他类识别', rowsX[2].category, 'other');
ck('其他类清单', rowsX[2].listCode, '030806801');
ck('其他类编号', rowsX[2].quotaCode, '补3');
ck('其他类有提示', /补充清单/.test(rowsX[2].warn), true);
ck('标题行被跳过', A.parseRows([['序号', '项目名称', '数量'], [1, '一层通风工程', ''], [2, '轴流式通风机 5000m3/h', 1]]).length, 1);

console.log('== 全流程：混合清单 ==');
var mix = A.parseRows([['序号', '项目名称', '数量'],
  [1, '轴流式通风机 5000m3/h', 2], [2, '离心式通风机 12000m3/h', 1], [3, '卫生间通风器', 8],
  [4, '组合式空调机组 20000m3/h', 1], [5, '风机盘管 FP-85 吊顶式', 24], [6, '单层百叶风口 800*400', 30],
  [7, '70℃防火阀 800*400', 8], [8, '微穿孔板消声器 600*320', 4], [9, '人防手动密闭阀 φ300', 2], [10, '除湿机 5kg/h', 1]]);
ck('混合清单条数', mix.length, 10);
ck('混合清单无价格空缺', mix.filter(function (x) { return x.price === null; }).length, 0);
ck('混合清单合计', +mix.reduce(function (a, x) { return a + (x.price || 0) * x.quantity; }, 0).toFixed(2), 118314);

function onlyDucts(list) { return list.filter(function (x) { return A.isDuctCat(x.category); }); }
function lastRow(list) { return list[list.length - 1]; }

console.log('== 风管：清单030702001 + 定额9-1~9-11 按长边长/直径分档 ==');
ck('风管类别', A.classify('矩形风道 600*400'), 'duct');
ck('风道字眼', A.classify('通风管道 1000×400'), 'duct');
ck('镀锌钢板字眼', A.classify('镀锌钢板 800*400'), 'duct');
ck('镀锌薄钢板字眼', A.classify('镀锌薄钢板风管'), 'duct');
ck('支架行不算风管', A.classify('镀锌钢板风管支架'), 'duct');
ck('风管机归空调器', A.buildItem('风管机 5000m3/h').category, 'acu');
var dr = A.parseRows([['序号', '项目名称', '数量'], [1, '风管 1000*400 镀锌钢板', 50]]);
ck('风管单位m²', dr[0].unit, 'm²');
ck('风管清单030702001', dr[0].listCode, '030702001');
ck('风管清单名称', A.LIST_NAME.duct, '碳钢通风管道');
ck('风管定额9-8', dr[0].quotaCode, '9-8');
ck('风管定额名称', dr[0].quotaName, '镀锌钢板矩形风管 长边长1000mm以内');

// 矩形：长边长分档 320/450/1000/1250/2000/4000
var rect = [['300*200', '9-6', 0.5], ['400*300', '9-7', 0.6], ['600*400', '9-8', 0.75], ['800*400', '9-8', 0.75],
  ['1000*400', '9-8', 0.75], ['1200*500', '9-9', 1.0], ['1600*500', '9-10', 1.0], ['3000*800', '9-11', 1.2]];
rect.forEach(function (c) {
  var it = A.buildItem('矩形风道' + c[0]);
  var q = A.matchQuota(it);
  ck('矩形' + c[0] + '定额', q.code, c[1]);
  ck('矩形' + c[0] + '板厚', it.plate.t, c[2]);
});
// 圆形：直径分档 320/450/1000/1250/2000
var rnd = [['φ300', '9-1', 0.5], ['φ400', '9-2', 0.6], ['φ800', '9-3', 0.75], ['φ1200', '9-4', 1.0], ['φ1800', '9-5', 1.0]];
rnd.forEach(function (c) {
  var it = A.buildItem('圆形镀锌钢板风道 ' + c[0]);
  var q = A.matchQuota(it);
  ck('圆形' + c[0] + '定额', q.code, c[1]);
  ck('圆形' + c[0] + '板厚', it.plate.t, c[2]);
  ck('圆形' + c[0] + '名称', q.name, '镀锌薄钢板圆形风管 直径' + { '9-1': '320', '9-2': '450', '9-3': '1000', '9-4': '1250', '9-5': '2000' }[c[1]] + 'mm以内');
});
ck('圆形φ800清单不变', A.buildItem('圆形风道φ800').listCode, '030702001');
ck('超4000取顶档', A.matchQuota(A.buildItem('矩形风道4500*1000')).code, '9-11');
ck('超档标记', A.matchQuota(A.buildItem('矩形风道4500*1000')).overRange, true);
// 无尺寸：清单仍为030702001，定额待手选
var nosz = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢板风管', 10]]);
ck('无尺寸清单保留', nosz[0].listCode, '030702001');
ck('无尺寸取最小档', nosz[0].quotaCode, '9-6');
ck('无尺寸不套补充清单', /030806801/.test(nosz[0].listCode), false);
ck('无尺寸无价格', nosz[0].price, null);
ck('无尺寸提示补规格', /未注风管尺寸/.test(nosz[0].warn), true);

console.log('== 风管：主材价按天津市当月信息价（板厚档）==');
ck('风管价格来源', A.lookupPrice(A.buildItem('矩形风道600*400')).source, 'info');
ck('δ0.5价', price('矩形风道300*200'), 16.25);
ck('δ0.6价', price('矩形风道400*300'), 19.08);
ck('δ0.75价', price('矩形风道600*400'), 23.37);
ck('δ1.0价', price('矩形风道1200*500'), 30.22);
ck('δ1.2价', price('矩形风道3000*800'), 35.98);
ck('风管价随板厚单调', price('矩形风道3000*800') > price('矩形风道1200*500') && price('矩形风道1200*500') > price('矩形风道600*400') && price('矩形风道600*400') > price('矩形风道400*300'), true);
ck('价格依据含信息价', /信息价/.test(A.lookupPrice(A.buildItem('矩形风道600*400')).basis), true);

console.log('== 风管：同定额工程量合并 ==');
var mg = A.parseRows([['序号', '项目名称', '数量', '单位'],
  [1, '矩形风道600*400', 200, 'm2'], [2, '矩形风道800*400', 600, 'm2'], [3, '矩形风道1000*400', 400, 'm2']]);
ck('三项合并为一行', onlyDucts(mg).length, 1);
ck('自动计列场外运输', mg[mg.length - 1].listCode, '030702301');
ck('运输工程量=风管合计', mg[mg.length - 1].quantity, 1200);
ck('合并后定额9-8', mg[0].quotaCode, '9-8');
ck('合并后工程量1200', mg[0].quantity, 1200);
ck('合并后名称=定额名称', mg[0].name, '镀锌钢板矩形风管 长边长1000mm以内');
ck('合并后价格', mg[0].price, 23.37);
ck('合并计数', mg[0].mergedCount, 3);
ck('合并提示', /已合并3项相同定额（600×400、800×400、1000×400）工程量合计1200m²/.test(mg[0].warn), true);
ck('合并后规格', A.specText(mg[0]), '长边长1000mm以内 δ0.75mm');
ck('合并后特征名称', /1\.名称：镀锌钢板矩形风管 长边长1000mm以内/.test(mg[0].features), true);
var mg2 = A.parseRows([['序号', '项目名称', '数量'],
  [1, '矩形风道600*400', 200], [2, '矩形风道1200*500', 100], [3, '防火阀 800*400', 3]]);
ck('不同定额不合并', onlyDucts(mg2).length, 2);
ck('未合并行序号连续', mg2.map(function (x) { return x.index; }).join(','), '1,2,3,4');
var mg3 = A.parseRows([['序号', '项目名称', '数量'],
  [1, '圆形镀锌钢板风道φ800', 300], [2, '圆形风道 φ900', 150], [3, '圆形风道 φ300', 60]]);
ck('圆形同档合并', onlyDucts(mg3).length, 2);
ck('圆形合并量', mg3[0].quantity, 450);
ck('圆形合并名称', mg3[0].name, '镀锌薄钢板圆形风管 直径1000mm以内');
ck('圆形低档独立', mg3[1].quotaCode, '9-1');
var mg4 = A.parseRows([['序号', '项目名称', '数量'], [1, '矩形风道600*400', 200]]);
ck('单条不合并', mg4[0].mergedCount, undefined);
ck('单条名称保留原名', mg4[0].name, '矩形风道600*400');
ck('单条序号不变', mg4[0].index, '1');
// 合并后切换形状仍命中同一档
mg[0].sub = 'round';
A.recomputeQuota(mg[0]);
ck('合并行切圆形重算', mg[0].quotaCode, '9-3');
ck('合并行切圆形名称', mg[0].name, '镀锌薄钢板圆形风管 直径1000mm以内');

console.log('== 净化风管：清单030702001 + 定额9-279~9-282 按周长分档 ==');
ck('净化分类', A.classify('净化风道 800*200'), 'ductClean');
ck('净化字眼+风道', A.classify('净化通风管道'), 'ductClean');
ck('进口风道归净化', A.classify('进口镀锌钢板风道 1000*400'), 'ductClean');
ck('净化清单030702001', A.buildItem('净化风道 800*200').listCode, '030702001');
ck('净化周长2000→9-280', A.matchQuota(A.buildItem('净化风道 800*200')).code, '9-280');
ck('净化周长1800→9-280', A.matchQuota(A.buildItem('净化风道 800*100')).code, '9-280');
ck('净化周长800→9-279', A.matchQuota(A.buildItem('净化风道 300*100')).code, '9-279');
ck('净化周长4000→9-281', A.matchQuota(A.buildItem('净化风道 1200*800')).code, '9-281');
ck('净化超4000→9-282', A.matchQuota(A.buildItem('净化风道 1500*800')).code, '9-282');
ck('净化定额名称', A.matchQuota(A.buildItem('净化风道 800*200')).name, '镀锌薄钢板矩形净化风管（咬口） 周长2000mm以内');
ck('净化板厚0.75', A.buildItem('净化风道 800*200').thk, 0.75);
ck('净化价=镀锌钢板信息价', A.lookupPrice(A.buildItem('净化风道 800*200')).price, 23.37);
ck('净化价格来源信息价', A.lookupPrice(A.buildItem('净化风道 800*200')).source, 'info');
ck('净化圆形按πD折周长', A.matchQuota(A.buildItem('圆形净化风道 φ600')).code, '9-280');
ck('净化圆形φ700折周长2199→9-281', A.matchQuota(A.buildItem('圆形净化风道 φ700')).code, '9-281');
var cl = A.parseRows([['序号', '项目名称', '数量'],
  [1, '净化风道800*200', 200], [2, '净化风道800*100', 100], [3, '净化风道1500*800', 50]]);
ck('净化同定额合并2项', onlyDucts(cl).length, 2);
ck('净化合并工程量300', onlyDucts(cl)[0].quantity, 300);
ck('净化合并名称=定额名称', onlyDucts(cl)[0].name, '镀锌薄钢板矩形净化风管（咬口） 周长2000mm以内');
ck('净化合并规格', A.specText(onlyDucts(cl)[0]), '周长2000mm以内 δ0.75mm');
ck('净化运输合计350', lastRow(cl).quantity, 350);

console.log('== 不锈钢板风管：清单030702003 + 定额9-293~9-297 ==');
ck('不锈钢分类', A.classify('不锈钢风道 1000*400'), 'ductSS');
ck('不锈钢圆形分类', A.classify('不锈钢圆形风道 φ400'), 'ductSS');
ck('不锈钢清单030702003', A.buildItem('不锈钢风道 1000*400').listCode, '030702003');
ck('不锈钢未注壁厚→9-293', A.matchQuota(A.buildItem('不锈钢风道 1000*400')).code, '9-293');
ck('不锈钢未注壁厚标记', A.matchQuota(A.buildItem('不锈钢风道 1000*400')).noThk, true);
var ssW = A.parseRows([['序号', '项目名称', '数量'], [1, '不锈钢风道 1000*400', 10]]);
ck('不锈钢未注壁厚提示', /按最小档 9-293/.test(ssW[0].warn), true);
ck('不锈钢未注壁厚板厚取2mm', A.buildItem('不锈钢风道 1000*400').thk, 2);
ck('不锈钢未注壁厚单价按2mm', A.lookupPrice(A.buildItem('不锈钢风道 1000*400')).price, 245.83);
ck('风管单位m²', A.buildItem('净化风道800*200').unit, 'm²');
ck('柔性单位m', A.buildItem('柔性软风管 φ200').unit, 'm');
ck('不锈钢φ300壁厚2→9-294', A.matchQuota(A.buildItem('不锈钢风道 φ300 壁厚2mm')).code, '9-294');
ck('不锈钢φ600δ3→9-296', A.matchQuota(A.buildItem('不锈钢风道 φ600 δ3')).code, '9-296');
ck('不锈钢φ900→9-297', A.matchQuota(A.buildItem('不锈钢风道 φ900 壁厚3mm')).code, '9-297');
ck('不锈钢定额名称', A.matchQuota(A.buildItem('不锈钢风道 φ300 壁厚2mm')).name, '不锈钢板圆形风管制作、安装（电焊） 直径×壁厚400mm以内×2');
ck('不锈钢矩形按长边长套圆形', A.matchQuota(A.buildItem('不锈钢矩形风道 500*300 壁厚2mm')).code, '9-295');
ck('不锈钢板厚2mm', A.buildItem('不锈钢风道 φ300 壁厚2mm').thk, 2);
ck('不锈钢价=2×7.93×15.5', A.lookupPrice(A.buildItem('不锈钢风道 φ300 壁厚2mm')).price, 245.83);
ck('不锈钢价格来源市场价', A.lookupPrice(A.buildItem('不锈钢风道 φ300 壁厚2mm')).source, 'market');
var ss = A.parseRows([['序号', '项目名称', '数量'],
  [1, '不锈钢风道 φ300 壁厚2mm', 100], [2, '不锈钢风道 φ350 壁厚2mm', 50], [3, '不锈钢风道 φ600 δ3', 30]]);
ck('不锈钢同定额合并', onlyDucts(ss).length, 2);
ck('不锈钢合并量150', onlyDucts(ss)[0].quantity, 150);
ck('不锈钢合并名称', onlyDucts(ss)[0].name, '不锈钢板圆形风管制作、安装（电焊） 直径×壁厚400mm以内×2');

console.log('== 塑料风管：清单030702005 + 定额9-322~9-330 ==');
ck('塑料分类', A.classify('塑料风道 800*400'), 'ductPlastic');
ck('PPR风道分类', A.classify('PPR风道 φ200'), 'ductPlastic');
ck('塑料清单030702005', A.buildItem('塑料风道 800*400').listCode, '030702005');
ck('塑料矩形周长2400→9-328', A.matchQuota(A.buildItem('塑料风道 800*400')).code, '9-328');
ck('塑料矩形周长1200→9-326', A.matchQuota(A.buildItem('塑料风道 400*200')).code, '9-326');
ck('塑料矩形周长1600→9-327', A.matchQuota(A.buildItem('塑料风道 500*300')).code, '9-327');
ck('塑料矩形超6500→9-330', A.matchQuota(A.buildItem('塑料风道 1600*1700')).code, '9-330');
ck('塑料圆形φ500→9-323', A.matchQuota(A.buildItem('塑料圆形风道 φ500')).code, '9-323');
ck('塑料圆形φ200→9-322', A.matchQuota(A.buildItem('PPR风道 φ200')).code, '9-322');
ck('塑料矩形定额名称', A.matchQuota(A.buildItem('塑料风道 800*400')).name, '塑料矩形风管制作、安装 周长×壁厚3200mm以内×5');
ck('塑料圆形定额名称', A.matchQuota(A.buildItem('塑料圆形风道 φ500')).name, '塑料圆形风管制作、安装 直径×壁厚630mm以内×4');
ck('塑料壁厚5', A.buildItem('塑料风道 800*400').thk, 5);
ck('塑料价=5×1.4×10', A.lookupPrice(A.buildItem('塑料风道 800*400')).price, 70);
ck('塑料圆形壁厚4价', A.lookupPrice(A.buildItem('塑料圆形风道 φ500')).price, 56);
ck('塑料同种类同档同价', A.lookupPrice(A.buildItem('塑料风道 500*300')).price, A.lookupPrice(A.buildItem('塑料圆形风道 φ600')).price);

console.log('== 玻璃钢风管：清单030702006 + 定额9-363~9-370 ==');
ck('玻璃钢分类', A.classify('玻璃钢风道 1000*400'), 'ductFrp');
ck('玻璃钢清单030702006', A.buildItem('玻璃钢风道 1000*400').listCode, '030702006');
ck('玻璃钢矩形周长2800→9-369', A.matchQuota(A.buildItem('玻璃钢风道 1000*400')).code, '9-369');
ck('玻璃钢矩形周长1000→9-368', A.matchQuota(A.buildItem('玻璃钢风道 300*200')).code, '9-368');
ck('玻璃钢矩形周长800→9-367', A.matchQuota(A.buildItem('玻璃钢风道 200*200')).code, '9-367');
ck('玻璃钢矩形超4000→9-370', A.matchQuota(A.buildItem('玻璃钢风道 1200*900')).code, '9-370');
ck('玻璃钢圆形φ300→9-364', A.matchQuota(A.buildItem('玻璃钢圆形风道 φ300')).code, '9-364');
ck('玻璃钢圆形φ1500→9-366', A.matchQuota(A.buildItem('玻璃钢圆形风道 φ1500')).code, '9-366');
ck('玻璃钢定额名称', A.matchQuota(A.buildItem('玻璃钢风道 1000*400')).name, '玻璃钢矩形风管安装 周长4000mm以内');
ck('玻璃钢圆形定额名称', A.matchQuota(A.buildItem('玻璃钢圆形风道 φ300')).name, '玻璃钢圆形风管安装 直径500mm以内');
ck('玻璃钢价65', A.lookupPrice(A.buildItem('玻璃钢风道 1000*400')).price, 65);
ck('玻璃钢圆矩同价', A.lookupPrice(A.buildItem('玻璃钢圆形风道 φ300')).price, 65);
var frp = A.parseRows([['序号', '项目名称', '数量'],
  [1, '玻璃钢风道 1000*400', 200], [2, '玻璃钢风道 1200*800', 100]]);
ck('玻璃钢同定额合并', onlyDucts(frp).length, 1);
ck('玻璃钢合并量300', onlyDucts(frp)[0].quantity, 300);

console.log('== 复合型风管：清单030702007 + 定额9-385~9-392（长边长）==');
ck('复合分类', A.classify('酚醛复合风道 1200*400'), 'ductComp');
ck('复合风道分类', A.classify('复合通风管道 800*400'), 'ductComp');
ck('复合清单030702007', A.buildItem('酚醛复合风道 1200*400').listCode, '030702007');
ck('复合矩形长边1200→9-392', A.matchQuota(A.buildItem('酚醛复合风道 1200*400')).code, '9-392');
ck('复合矩形长边500→9-390', A.matchQuota(A.buildItem('酚醛复合风道 500*300')).code, '9-390');
ck('复合矩形长边250→9-389', A.matchQuota(A.buildItem('酚醛复合风道 250*200')).code, '9-389');
ck('复合矩形长边800→9-391', A.matchQuota(A.buildItem('酚醛复合风道 800*400')).code, '9-391');
ck('复合圆形φ800→9-387', A.matchQuota(A.buildItem('酚醛复合圆形风道 φ800')).code, '9-387');
ck('复合圆形φ2500→9-388', A.matchQuota(A.buildItem('酚醛复合圆形风道 φ2500')).code, '9-388');
ck('复合定额名称', A.matchQuota(A.buildItem('酚醛复合风道 1200*400')).name, '复合型酚醛风管制作、安装 法兰矩形风管 长边长1000mm以外');
ck('复合按长边非周长', A.matchQuota(A.buildItem('酚醛复合风道 1200*400')).code === '9-392', true);
ck('复合价28', A.lookupPrice(A.buildItem('酚醛复合风道 1200*400')).price, 28);
var cp = A.parseRows([['序号', '项目名称', '数量'],
  [1, '酚醛复合风道 1200*400', 100], [2, '酚醛复合风道 1500*300', 60], [3, '酚醛复合风道 800*400', 40]]);
ck('复合同定额合并', onlyDucts(cp).length, 2);
ck('复合合并量160', onlyDucts(cp)[0].quantity, 160);

console.log('== 柔性软风管：清单030702008 + 定额9-39~9-43（单位m）==');
ck('柔性分类', A.classify('柔性软风管 φ200'), 'ductFlex');
ck('软管分类', A.classify('软风管 φ300'), 'ductFlex');
ck('软连接分类', A.classify('帆布软连接 400*300'), 'ductFlex');
ck('柔性清单030702008', A.buildItem('柔性软风管 φ200').listCode, '030702008');
ck('柔性单位m', A.buildItem('柔性软风管 φ200').unit, 'm');
ck('柔性φ200→9-40', A.matchQuota(A.buildItem('柔性软风管 φ200')).code, '9-40');
ck('柔性φ120→9-39', A.matchQuota(A.buildItem('柔性软风管 φ120')).code, '9-39');
ck('柔性φ1000→9-43', A.matchQuota(A.buildItem('柔性软风管 φ1000')).code, '9-43');
ck('柔性定额名称', A.matchQuota(A.buildItem('柔性软风管 φ200')).name, '柔性软风管安装 无保温套管 直径250mm以内');
ck('柔性价18元/m', A.lookupPrice(A.buildItem('柔性软风管 φ200')).price, 18);
ck('柔性大直径价高', A.lookupPrice(A.buildItem('柔性软风管 φ1000')).price > 18, true);
var fx = A.parseRows([['序号', '项目名称', '数量'], [1, '柔性软风管 φ200', 10], [2, '柔性软风管 φ250', 20]]);
ck('柔性同档合并', onlyDucts(fx).length, 1);
ck('柔性合并量30', onlyDucts(fx)[0].quantity, 30);
ck('柔性运输折算面积', lastRow(fx).quantity, 21.99);

console.log('== 软管接口：帆布/三防复合布/带钢丝撑筋铝箔（030702008 + 9-36，m²）==');
ck('帆布软接头分类', A.classify('帆布软接头 800*400'), 'ductFlex');
ck('帆布细分interface', A.buildItem('帆布软接头 800*400').sub, 'interface');
ck('帆布软接头→9-36', A.matchQuota(A.buildItem('帆布软接头 800*400')).code, '9-36');
ck('帆布软接头单位m²', A.buildItem('帆布软接头 800*400').unit, 'm²');
ck('帆布价35', A.lookupPrice(A.buildItem('帆布软接头 800*400')).price, 35);
ck('三防复合布分类', A.classify('三防复合布软风管 1000*400'), 'ductFlex');
ck('三防复合布→9-36', A.matchQuota(A.buildItem('三防复合布软风管 1000*400')).code, '9-36');
ck('三防复合布价55', A.lookupPrice(A.buildItem('三防复合布软风管 1000*400')).price, 55);
ck('钢丝撑筋铝箔→9-36', A.matchQuota(A.buildItem('带钢丝撑筋的铝箔软风管 φ300')).code, '9-36');
ck('钢丝撑筋铝箔价48', A.lookupPrice(A.buildItem('带钢丝撑筋的铝箔软风管 φ300')).price, 48);
ck('柔性软风管仍走9-40', A.matchQuota(A.buildItem('柔性软风管 φ200')).code, '9-40');
ck('柔性软风管仍为m', A.buildItem('柔性软风管 φ200').unit, 'm');
var sj = A.parseRows([['序号', '项目名称', '数量', '单位'], [1, '帆布软接头 800*400', 4, '个']]);
ck('帆布软接头折算m²', sj[0].quantity, 2.4);
ck('帆布软接头单位', sj[0].unit, 'm²');
ck('帆布软接头定额', sj[0].quotaCode, '9-36');

console.log('== 通风管道场外运输：030702301 + 9-56 ==');
var tr = A.parseRows([['序号', '项目名称', '数量'], [1, '矩形风道600*400', 200], [2, '矩形风道1000*400', 100]]);
ck('运输行存在', lastRow(tr).category, 'transport');
ck('运输清单编码', lastRow(tr).listCode, '030702301');
ck('运输清单名称', lastRow(tr).listName, '通风管道场外运输');
ck('运输定额9-56', lastRow(tr).quotaCode, '9-56');
ck('运输工程量=风管合计', lastRow(tr).quantity, 300);
ck('运输无主材价', lastRow(tr).price, null);
ck('运输无主材标记', lastRow(tr).priceSource, 'none');
ck('运输序号连续', lastRow(tr).index, '2');
var tr2 = A.parseRows([['序号', '项目名称', '数量'], [1, '70℃防火阀 800*400', 3]]);
ck('无风管不计运输', tr2.filter(function (x) { return x.category === 'transport'; }).length, 0);
var tr3 = A.parseRows([['序号', '项目名称', '数量'],
  [1, '矩形风道600*400', 100], [2, '净化风道800*200', 50], [3, '不锈钢风道 φ300 壁厚2mm', 20],
  [4, '塑料风道 800*400', 30], [5, '玻璃钢风道 1000*400', 40], [6, '酚醛复合风道 1200*400', 25],
  [7, '柔性软风管 φ200', 10], [8, '通风管道场外运输', 999]]);
ck('多材质风管运输合计', lastRow(tr3).quantity, 271.28);
ck('用户自带运输行不重复', tr3.filter(function (x) { return x.category === 'transport'; }).length, 1);
ck('运输行提示合计口径', /全部风管展开面积合计271.28m²/.test(lastRow(tr3).warn), true);
ck('运输行识别', A.classify('通风管道场外运输'), 'transport');

console.log('== 列自动识别（兼容多种清单格式）==');
var L1 = A.parseRows([['70℃防火阀防烟防火阀-800*250', '个', 1],
  ['70℃防火阀防烟防火阀-1000*300', '个', 2],
  ['单层百叶风口 800*400', '个', 3]]);
ck('无表头-名称列', L1[0].name, '70℃防火阀防烟防火阀-800*250');
ck('无表头-风阀类别', L1[0].category, 'valve');
ck('无表头-风阀清单', L1[0].listCode, '030703001');
ck('无表头-风阀定额', L1[0].quotaCode, '9-82');
ck('无表头-单位取个', L1[0].unit, '个');
ck('无表头-数量2', L1[1].quantity, 2);
ck('无表头-序号自动', L1[2].index, '3');
ck('无表头-风口类别', L1[2].category, 'vent');
ck('无表头-风口清单', L1[2].listCode, '030703007');
ck('无表头-无待询价', L1.filter(function (x) { return x.price === null; }).length, 0);

var L2 = A.parseRows([['项目名称', '单位', '数量'], ['70℃防火阀防烟防火阀-800*250', '个', 4]]);
ck('有表头-数量4', L2[0].quantity, 4);
ck('有表头-清单', L2[0].listCode, '030703001');

var L3 = A.parseRows([['序号', '项目名称', '数量'], [7, '70℃防火阀防烟防火阀-800*250', 5]]);
ck('标准格式-序号7', L3[0].index, '7');
ck('标准格式-数量5', L3[0].quantity, 5);

var L4 = A.parseRows([['序号', '项目名称', '单位', '数量'], [1, '70℃防火阀防烟防火阀-800*250', '个', 6]]);
ck('四列格式-数量6', L4[0].quantity, 6);
ck('四列格式-单位个', L4[0].unit, '个');

var L5 = A.parseRows([['1.70℃防火阀防烟防火阀-800*250', '个', 2]]);
ck('名称前缀剥离', L5[0].name, '70℃防火阀防烟防火阀-800*250');

console.log('\n== 冷水机组：030112001 + 1-1130~1-1152（活塞/离心/螺杆，按制冷量）==');
ck('冷水机组清单', one('冷水机组 1200kW').list, '030112001');
ck('活塞式60kW→1-1130', one('活塞式冷水机组 60kW').code, '1-1130');
ck('活塞式1500kW→1-1137', one('活塞式冷水机组 1500kW').code, '1-1137');
ck('活塞式中间档360kW→1-1133', one('活塞式冷水机组 360kW').code, '1-1133');
ck('离心式350kW→1-1138', one('离心式冷水机组 350kW').code, '1-1138');
ck('离心式1200kW→1-1141', one('离心式冷水机组 1200kW').code, '1-1141');
ck('离心式3000kW→1-1145', one('离心式冷水机组 3000kW').code, '1-1145');
ck('螺杆式240kW→1-1146', one('螺杆式冷水机组 240kW').code, '1-1146');
ck('螺杆式2300kW→1-1152', one('螺杆式冷水机组 2300kW').code, '1-1152');
ck('螺杆式中间600kW→1-1148', one('螺杆式冷水机组 600kW').code, '1-1148');
ck('冷水机组未注类别按活塞', A.buildItem('冷水机组 800kW').sub, 'piston');
ck('冷水机组未注类别标黄', A.buildItem('冷水机组 800kW').chillerAuto, true);
ck('无制冷量→活塞最小档', one('冷水机组').code, '1-1130');
ck('无制冷量标记', A.matchQuota(A.buildItem('冷水机组')).noKw, true);
ck('定额名称含制冷量', one('离心式冷水机组 900kW').qname, '离心式冷水机组 制冷量900kW以内');
ck('活塞60kW价42000', price('活塞式冷水机组 60kW'), 42000);
ck('螺杆1200kW价680000', price('螺杆式冷水机组 1200kW'), 680000);
ck('离心3000kW价1620000', price('离心式冷水机组 3000kW'), 1620000);
ck('冷水机组品牌标注', A.buildItem('螺杆式冷水机组 1200kW').brand, '格力/美的/海尔');
ck('冷水机组价格来源市场价', A.lookupPrice(A.buildItem('螺杆式冷水机组 1200kW')).source, 'market');
ck('冷水机组基价含3品牌', /格力/.test(A.lookupPrice(A.buildItem('螺杆式冷水机组 1200kW')).basis) && /美的/.test(A.lookupPrice(A.buildItem('螺杆式冷水机组 1200kW')).basis), true);

console.log('== 热泵机组：030112003 + 1-1153~1-1164 ==');
ck('热泵清单', one('热泵机组 350kW').list, '030112003');
ck('热泵10kW→1-1153', one('热泵机组 10kW').code, '1-1153');
ck('热泵700kW→1-1164', one('热泵机组 700kW').code, '1-1164');
ck('热泵350kW→1-1161', one('热泵机组 350kW').code, '1-1161');
ck('冷热水机组识别热泵', A.classify('风冷热泵冷热水机组 480kW'), 'heatpump');
ck('热泵无参数→1-1153', one('热泵机组').code, '1-1153');
ck('热泵定额名称', one('热泵机组 300kW').qname, '热泵冷（热）水机组 制冷量300kW以内');
ck('热泵350kW价295000', price('热泵机组 350kW'), 295000);
ck('热泵品牌标注', A.buildItem('热泵机组 350kW').brand, '格力/美的/清华同方');

console.log('== 冷却塔：030112006 + 1-1295~1-1303 ==');
ck('冷却塔清单', one('玻璃钢冷却塔 300m3/h').list, '030112006');
ck('冷却塔30→1-1295', one('冷却塔 30m3/h').code, '1-1295');
ck('冷却塔700→1-1303', one('冷却塔 700m3/h').code, '1-1303');
ck('冷却塔150→1-1299', one('玻璃钢冷却塔 150m3/h').code, '1-1299');
ck('冷却塔无参数→1-1295', one('冷却塔').code, '1-1295');
ck('冷却塔无参数标记', A.matchQuota(A.buildItem('冷却塔')).noFlow, true);
ck('冷却塔定额名称', one('冷却塔 500m3/h').qname, '玻璃钢冷却塔 设备处理水量500m³/h以内');
ck('冷却塔300价110000', price('冷却塔 300m3/h'), 110000);
ck('冷却塔品牌标注', A.buildItem('冷却塔 300m3/h').brand, '良机/金日/华强');

console.log('== 水系统管道：复用给排水站（031001001~008 + 第八册）==');
ck('镀锌钢管清单', one('镀锌钢管 DN100').list, '031001002');
ck('镀锌钢管定额', one('镀锌钢管 DN100').code, '8-181');
ck('焊接钢管定额', one('焊接钢管 DN150').code, '8-202');
ck('无缝钢管定额', one('无缝钢管 DN200').code, '8-203');
ck('PPR管清单', one('PPR管 De25').list, '031001008');
ck('PPR管定额', one('PPR管 De25').code, '8-411');
ck('管道单位m', A.buildItem('镀锌钢管 DN100').unit, 'm');
ck('空调水管道未注材质按镀锌', A.buildItem('空调水管道 DN80').category, 'galv');
ck('冷凝水管按镀锌', A.buildItem('冷凝水管道 DN50').category, 'galv');
ck('风管不被识别为管道', A.classify('镀锌钢板风管 1000*400'), 'duct');
ck('不锈钢风道不被识别为管道', A.classify('不锈钢风道 φ500'), 'ductSS');
ck('塑料风管不被识别为管道', A.classify('塑料风管 400*200'), 'ductPlastic');

var pipeRows = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢管 DN100', 60], [2, '焊接钢管 DN150', 30]]);
ck('管道解析条数（2管道+支架）', pipeRows.length, 3);
ck('管道主材价', pipeRows[0].price, 52);
ck('管道价格来源市场价', pipeRows[0].priceSource, 'market');
ck('管道价格旁品牌', /天津利达/.test(pipeRows[0].priceBrand), true);
ck('管道附加消毒冲洗', (pipeRows[0].extras || []).filter(function (x) { return x.role === 'flush'; }).length, 1);
ck('消毒冲洗定额8-491', (pipeRows[0].extras || [])[0].code, '8-491');
ck('管道特征含安装部位', /安装部位/.test(pipeRows[0].features), true);
ck('管道无运输行', pipeRows.filter(function (x) { return x.category === 'transport'; }).length, 0);

var grooveRow = A.parseRows([['序号', '项目名称', '数量'], [1, '焊接钢管 沟槽连接 DN150', 60]]);
ck('沟槽连接识别', grooveRow[0].joint, 'groove');
ck('沟槽附加管件', (grooveRow[0].extras || []).filter(function (x) { return x.role === 'fitting'; }).length, 1);
ck('沟槽管件定额8-224', (grooveRow[0].extras || [])[0].code, '8-224');
ck('沟槽管件数量按6m', (grooveRow[0].extras || [])[0].qty, 10);

console.log('== 混合清单：设备 + 风管 + 管道 ==');
var mix = A.parseRows([['序号', '项目名称', '数量'],
  [1, '螺杆式冷水机组 制冷量1200kW', 2],
  [2, '玻璃钢冷却塔 300m3/h', 2],
  [3, '热泵机组 350kW', 1],
  [4, '镀锌钢板矩形风管 1000*400', 200],
  [5, '镀锌钢管 DN100', 80],
  [6, 'PPR管 De32', 120]]);
ck('混合条数（3设备+1风管+2管道+支架+运输）', mix.length, 8);
ck('混合含运输行', mix.filter(function (x) { return x.category === 'transport'; }).length, 1);
ck('运输量只算风管', mix.filter(function (x) { return x.category === 'transport'; })[0].quantity, 200);
ck('运输行紧跟风管清单', mix[4].category, 'transport');
ck('运输行序号=风管序号+1', mix[4].index, '5');
ck('混合设备条数', mix.filter(function (x) { return x.category === 'chiller' || x.category === 'coolingTower' || x.category === 'heatpump'; }).length, 3);
ck('混合管道条数', mix.filter(function (x) { return x.unit === 'm'; }).length, 2);
ck('冷水机组主材合计', mix.filter(function (x) { return x.category === 'chiller'; })[0].quantity * mix.filter(function (x) { return x.category === 'chiller'; })[0].price, 1360000);

console.log('== 水系统阀门（031002001 + 8-579~584 / 8-620~629）==');
ck('闸阀分类', A.classify('闸阀 DN100'), 'waterValve');
ck('Y型过滤器分类', A.classify('Y型过滤器 DN150'), 'waterValve');
ck('橡胶软接头分类', A.classify('橡胶软接头 DN200'), 'waterValve');
ck('波纹补偿器分类', A.classify('波纹补偿器 DN300'), 'waterValve');
ck('蝶阀带DN归水阀', A.classify('蝶阀 DN200'), 'waterValve');
ck('蝶阀带尺寸归风阀', A.classify('蝶阀 1000×400'), 'valve');
ck('防火阀仍为风阀', A.classify('防火阀 800×400'), 'valve');
var wv = one('闸阀 DN32');
ck('DN32螺纹阀门8-582', wv.code, '8-582');
ck('DN32清单031002001', wv.list, '031002001');
ck('DN32取信息价', A.lookupPrice(wv.it).source, 'info');
ck('闸阀DN32信息价95', A.lookupPrice(wv.it).price, 95);
var wv2 = one('闸阀 DN100');
ck('DN100焊接法兰8-622', wv2.code, '8-622');
ck('DN100闸阀信息价290', A.lookupPrice(wv2.it).price, 290);
var wv3 = one('闸阀 DN500');
ck('DN500取8-629', wv3.code, '8-629');
ck('DN500超档提示', /超本类最大档/.test(wv3.it.category === 'waterValve' ? A.buildWarn(wv3.it, { overRange: true }) : ''), true);
var wv4 = one('橡胶软接头 DN200');
ck('软接头市场价', A.lookupPrice(wv4.it).source, 'market');
ck('软接头标品牌', /冠龙/.test(A.lookupPrice(wv4.it).brand || ''), true);
var wv5 = one('阀门');
ck('无DN阀门仍按风阀', wv5.cat, 'valve');

console.log('== 特殊阀门四类 ==');
var aa = one('自动排气阀 DN25');
ck('自动排气阀分类', aa.cat, 'autoAir');
ck('自动排气阀8-682', aa.code, '8-682');
ck('自动排气阀清单031002303', aa.list, '031002303');
ck('自动排气阀信息价', A.lookupPrice(aa.it).source, 'info');
var tv = one('散热器温控阀 DN25');
ck('温控阀8-686', tv.code, '8-686');
ck('温控阀清单031002306', tv.list, '031002306');
ck('温控阀市场价', A.lookupPrice(tv.it).source, 'market');
var fv = one('浮球阀 DN100');
ck('浮球阀分类', fv.cat, 'floatValve');
ck('浮球阀8-615', fv.code, '8-615');
ck('浮球阀清单031002301', fv.list, '031002301');
ck('浮球阀市场价480', A.lookupPrice(fv.it).price, 480);
var lv = one('液压水位控制阀 DN150');
ck('水位控制阀分类', lv.cat, 'levelValve');
ck('水位控制阀8-648', lv.code, '8-648');
ck('水位控制阀清单031002302', lv.list, '031002302');
ck('水位控制阀市场价1900', A.lookupPrice(lv.it).price, 1900);

console.log('== 口部冲洗阀与电磁阀（031002304/031002305）==');
ck('口部冲洗阀分类', A.classify('口部冲洗阀'), 'flushValve');
ck('口部冲洗分类2', A.classify('口部冲洗阀 DN50'), 'flushValve');
var fl = one('口部冲洗阀');
ck('口部冲洗8-1260', fl.code, '8-1260');
ck('口部冲洗清单031002304', fl.list, '031002304');
ck('口部冲洗单位套', fl.it.unit, '套');
ck('口部冲洗市场价480', A.lookupPrice(fl.it).price, 480);
ck('口部冲洗标品牌', /人防/.test(A.lookupPrice(fl.it).brand || ''), true);
ck('电磁阀分类', A.classify('电磁阀 DN100'), 'solenoidValve');
ck('电磁阀不误判通用水阀', A.classify('电磁阀 DN100') === 'waterValve', false);
var sv = one('电磁阀 DN25');
ck('电磁阀DN25螺纹8-605', sv.code, '8-605');
ck('电磁阀清单031002305', sv.list, '031002305');
ck('电磁阀单位个', sv.it.unit, '个');
ck('电磁阀DN25市场价230', A.lookupPrice(sv.it).price, 230);
var sv2 = one('电磁阀 DN65');
ck('电磁阀DN65法兰8-633', sv2.code, '8-633');
var sv3 = one('电磁阀 DN500');
ck('电磁阀DN500法兰8-644', sv3.code, '8-644');
ck('电磁阀DN500市场价6500', A.lookupPrice(sv3.it).price, 6500);
var sv4 = one('电磁阀');
ck('电磁阀无DN取8-603', sv4.code, '8-603');
ck('电磁阀标品牌', /丹佛斯/.test(A.lookupPrice(sv.it).brand || ''), true);

console.log('== 保温绝热（031208002）==');
ck('橡塑分类', A.classify('橡塑保温管壳'), 'insulRubber');
ck('玻璃棉分类', A.classify('离心玻璃棉保温'), 'insulGlass');
var ir = one('橡塑保温管壳 DN100');
ck('橡塑11-582', ir.code, '11-582');
ck('橡塑清单031208002', ir.list, '031208002');
ck('橡塑主材1000', A.lookupPrice(ir.it).price, 1000);
ck('橡塑单位m³', ir.it.unit, 'm³');
var ig = one('离心玻璃棉保温');
ck('玻璃棉11-647', ig.code, '11-647');
ck('玻璃棉主材450', A.lookupPrice(ig.it).price, 450);

console.log('== 管道支架自动补项（031301005 + 7-138）==');
var brRows = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢管 DN100', 80], [2, '无缝钢管 DN150', 60]]);
var br = brRows.filter(function (x) { return x.category === 'bracket'; });
ck('有管道必补支架', br.length, 1);
ck('支架清单031301005', br[0].listCode, '031301005');
ck('支架定额7-138', br[0].quotaCode, '7-138');
ck('支架单位kg', br[0].unit, 'kg');
ck('支架工程量80*0.9+60*1.5=162', br[0].quantity, 162);
ck('支架主材信息价4.2', br[0].price, 4.2);
ck('支架价格来源信息价', br[0].priceSource, 'info');
ck('支架在管道行之后', brRows.indexOf(br[0]) > brRows.findIndex(function (x) { return x.category === 'seamless'; }), true);
var brRows2 = A.parseRows([['序号', '项目名称', '数量'], [1, '管道支架 150kg', 150], [2, '镀锌钢管 DN100', 80]]);
ck('原表已带支架不重复', brRows2.filter(function (x) { return x.category === 'bracket'; }).length, 1);
ck('无管道不补支架', A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢板风管 1000*400', 100]]).filter(function (x) { return x.category === 'bracket'; }).length, 0);

console.log('== 保温单位折算 ==');
var conv = A.parseRows([['序号', '项目名称', '数量', '单位'], [1, '橡塑保温管壳 DN100', 100, 'm']]);
ck('橡塑按长度折算体积', conv[0].unit, 'm³');
ck('橡塑100m DN100 折1.23m³', conv[0].quantity, 1.23);
var conv2 = A.parseRows([['序号', '项目名称', '数量', '单位'], [1, '离心玻璃棉保温', 100, 'm²']]);
ck('玻璃棉按面积折算4m³', conv2[0].quantity, 4);

console.log('== 广联达导出 K 列（名称列统一为项目名称）==');
var capRows = null;
global.XLSX = { utils: { aoa_to_sheet: function (rows) { capRows = rows; return {}; },
  book_new: function () { return {}; }, book_append_sheet: function () {} }, writeFile: function () {} };
var expItems = A.parseRows([['序号', '项目名称', '数量'], [1, '吊顶式空调器 2.5kW', 10], [2, '镀锌钢板风管 1000*400', 100]]);
expItems.forEach(function (it) { var q = A.matchQuota(it); if (q) { it.quotaCode = q.code; it.quotaName = q.name; } });
A.exportGLD(expItems);
var listRow = capRows[1], quotaRow = capRows[2], devRow = capRows[3];
ck('导出K2=项目名称', listRow[10], '吊顶式空调器 2.5kW');
ck('导出K2等于B2', listRow[10], listRow[1]);
ck('导出子目下设备K=项目名称', devRow[10], '吊顶式空调器 2.5kW');
ck('导出子目下设备K不是品牌', devRow[10] === (expItems[0].brand || '主材'), false);
ck('导出定额行K保留定额名称', quotaRow[10], '吊顶式空调器安装 质量0.15t以内');
ck('导出K列无空值', capRows.slice(1).every(function (r) { return r[10] !== '' && r[10] !== undefined; }), true);
ck('导出K列不出现类别标签', capRows.slice(1).every(function (r) { return r[10] !== '空调器'; }), true);
ck('导出A2=清单序号1', String(listRow[0]), '1');
ck('导出A3=定额子序号1.1', String(quotaRow[0]), '1.1');
ck('导出A4=主材子序号1.2', String(devRow[0]), '1.2');
ck('导出第二清单A5=2', String(capRows[4][0]), '2');
ck('导出第二清单定额A6=2.1', String(capRows[5][0]), '2.1');
ck('导出第二清单主材A7=2.2', String(capRows[6][0]), '2.2');
ck('导出J2=清单行', listRow[9], '清单行');
ck('导出J3=定额行', quotaRow[9], '定额行');
ck('导出J4=子目下设备', devRow[9], '子目下设备');
ck('导出A列无空值', capRows.slice(1).every(function (r) { return r[0] !== '' && r[0] !== undefined; }), true);
ck('导出J列无裸清单定额', capRows.slice(1).every(function (r) { return r[9] !== '清单' && r[9] !== '定额'; }), true);
ck('导出子序号不重复', (function () {
  var seen = {}, dup = false;
  capRows.slice(1).forEach(function (r) { var k = String(r[0]); if (seen[k]) dup = true; seen[k] = 1; });
  return dup;
})(), false);
var devRows = capRows.filter(function (r) { return r[9] === '子目下设备'; });
ck('子目下设备编码Z00741-001', devRows[0][8], 'Z00741-001');
ck('子目下设备编码Z00741-002', devRows[1][8], 'Z00741-002');
ck('子目下设备编码格式', devRows.every(function (r) { return /^Z00741-\d{3}$/.test(r[8]); }), true);
ck('子目下设备编码互不相同', (function () {
  var seen = {}, dup = false;
  devRows.forEach(function (r) { if (seen[r[8]]) dup = true; seen[r[8]] = 1; });
  return dup;
})(), false);

console.log('== 管道类：主材行紧跟主定额、附加定额排后 ==');
capRows = null;
var pipeItems = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢管 DN100', 100]]);
pipeItems.forEach(function (it) { var q = A.matchQuota(it); if (q) { it.quotaCode = q.code; it.quotaName = q.name; } });
A.exportGLD(pipeItems);
ck('管道清单行', capRows[1][9], '清单行');
ck('管道主定额行', capRows[2][9], '定额行');
ck('管道主材紧跟定额', capRows[3][9], '子目下设备');
ck('管道主材行号1.2', String(capRows[3][0]), '1.2');
ck('管道主材编码', capRows[3][8], 'Z00741-001');
ck('管道附加定额排最后', capRows[4][9], '定额行');
ck('管道附加定额编码8-491', capRows[4][8], '8-491');
ck('管道附加定额行号1.3', String(capRows[4][0]), '1.3');
ck('管道附加定额无主材单价', capRows[4][14], '');

console.log('== 定额行必须带单位与工程量（广联达识别子目行的前提）==');
capRows = null;
var pipe2 = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢管 DN100', 100]]);
A.exportGLD(pipe2);
ck('管道定额行单位10m', capRows[2][12], '10m');
ck('管道定额行工程量=100/10', capRows[2][13], 10);
var flushRow = capRows.filter(function (r) { return r[9] === '定额行' && String(r[8]).indexOf('8-49') === 0; })[0];
ck('冲洗定额单位100m', flushRow[12], '100m');
ck('冲洗定额工程量=100/100', flushRow[13], 1);
ck('所有定额行有单位', capRows.filter(function (r) { return r[9] === '定额行'; }).every(function (r) { return r[12] !== '' && r[12] !== undefined && r[12] !== null; }), true);
ck('所有定额行有工程量', capRows.filter(function (r) { return r[9] === '定额行'; }).every(function (r) { return r[13] !== '' && r[13] !== undefined && r[13] !== null && !isNaN(r[13]); }), true);
var equipRows = A.parseRows([['序号', '项目名称', '数量'], [1, '吊顶式空调器 2.5kW', 10]]);
A.exportGLD(equipRows);
ck('设备定额行单位台', capRows[2][12], '台');
ck('设备定额行工程量=清单量', capRows[2][13], 10);

console.log('== 分组标题行不组价 ==');
var grp = A.parseRows([['序号', '项目名称', '工程量'], [null, '管路及阀门', null], ['1', '无缝钢管 DN300', 150], [null, '风机盘管及空调机组阀门', null], ['2', '镀锌钢管 DN100', 80]]);
ck('分组标题被跳过', grp.filter(function (x) { return x.category !== 'bracket'; }).length, 2);
ck('分组标题不进清单', grp.some(function (x) { return x.name.indexOf('管路及阀门') >= 0; }), false);
ck('真实清单保留', grp.map(function (x) { return x.name; }).join('|').indexOf('无缝钢管 DN300') >= 0, true);

console.log('== 主材行项目特征列必须为空（否则广联达判为清单行）==');
capRows = null;
var p3 = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢管 DN100', 100]]);
A.exportGLD(p3);
var devOne = capRows.filter(function (r) { return r[9] === '子目下设备'; })[0];
ck('主材行项目特征为空', devOne[11], '');
ck('主材行规格补充列为空', devOne[6], '');
ck('所有主材行项目特征为空', capRows.filter(function (r) { return r[9] === '子目下设备'; }).every(function (r) { return r[11] === ''; }), true);

console.log('== 风管定额计量单位 10m²（工程量按面积÷10 换算）==');
capRows = null;
var ductItems = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢板矩形风管 1000*400', 280]]);
A.exportGLD(ductItems);
ck('风管清单单位m²', capRows[1][12], 'm²');
ck('风管定额行单位10m²', capRows[2][12], '10m²');
ck('风管定额行工程量=280/10', capRows[2][13], 28);
ck('风管主材单位m²', capRows[3][12], 'm²');
ck('风管主材工程量=280', capRows[3][13], 280);
var flexItems = A.parseRows([['序号', '项目名称', '数量'], [1, '帆布软接头 800*400', 20]]);
A.exportGLD(flexItems);
ck('软管接口单位m²不换算', capRows[2][12], 'm²');

console.log('== 管道支架紧跟管道之后（不放到全表末尾）==');
var brPos = A.parseRows([['序号', '项目名称', '数量'], [1, '镀锌钢管 DN100', 80], [2, '无缝钢管 DN150', 60], [3, '橡塑保温管壳 DN100', 20]]);
var brIdx = brPos.map(function (x) { return x.category; }).indexOf('bracket');
ck('支架紧跟在最后一条管道之后', brPos[brIdx - 1].category, 'seamless');
ck('支架在保温之前', brIdx < brPos.map(function (x) { return x.category; }).indexOf('insulRubber'), true);
ck('支架序号连续', brPos[brIdx].index, String(brIdx + 1));
A.exportGLD(brPos);
var brExp = capRows.filter(function (r) { return r[9] === '定额行' && r[8] === '7-138'; })[0];
ck('支架定额单位100kg', brExp[12], '100kg');
ck('支架定额工程量=162/100', brExp[13], 1.62);

console.log('== 管道支架按系统分组（每个系统各补一条）==');
var sysRows = A.parseRows([
  ['序号', '项目名称', '数量'],
  ['', '给水管道', ''],
  [1, '镀锌钢管 DN100', 80],
  [2, '镀锌钢管 DN50', 40],
  ['', '中水管道', ''],
  [3, '镀锌钢管 DN80', 60],
  [4, '截止阀 DN50', 5]
]);
var sysBr = sysRows.filter(function (x) { return x.category === 'bracket'; });
ck('两个系统各一条支架', sysBr.length, 2);
ck('给水系统支架量=80*0.9+40*0.45', sysBr[0].quantity, 90);
ck('中水系统支架量=60*0.9', sysBr[1].quantity, 54);
var sysCats = sysRows.map(function (x) { return x.category; });
ck('给水支架紧跟给水管道', sysCats[sysCats.indexOf('bracket') - 1], 'galv');
ck('中水支架在中水管道之后、阀门之前', sysCats.indexOf('bracket', sysCats.indexOf('bracket') + 1) < sysCats.indexOf('waterValve'), true);

console.log('\n== 12位清单编码（同码递增、异码各自001）==');
global.XLSX = {
  utils: {
    aoa_to_sheet: function (d) { return d; },
    book_new: function () { return {}; },
    book_append_sheet: function (wb, ws) { wb.__rows = ws; }
  },
  writeFile: function (wb, name) { if (/建经/.test(name)) capJ = wb.__rows; else capG = wb.__rows; }
};
var capG = null, capJ = null;
var c12 = A.parseRows([['序号','项目名称','数量'],[1,'单层百叶风口 800*400',4],[2,'单层百叶风口 800*400',6]]);
A.exportGLD(c12);
var lc12 = capG.filter(function (r) { return r[9] === '清单行'; }).map(function (r) { return r[8]; });
ck('编码均为12位', lc12.every(function (c) { return /^\d{12}$/.test(c); }), true);
var g12 = {};
lc12.forEach(function (c) { var p = c.slice(0, 9); (g12[p] = g12[p] || []).push(c.slice(9)); });
var dup12 = Object.keys(g12).filter(function (k) { return g12[k].length > 1; });
ck('存在同码重复项', dup12.length > 0, true);
ck('同码后缀001/002', dup12.length ? g12[dup12[0]].join(',') : '', '001,002');
ck('首条后缀001', lc12[0].slice(9), '001');

console.log('\n== 补充码也补足12位 ==');
var sp12 = [{ listCode: '03B001' }, { listCode: '03B001' }, { listCode: '031001003' }, { listCode: '' }];
A.annotateListCode12(sp12);
ck('补充码补足12位', sp12[0].listCode12, '03B001000001');
ck('补充码同码递增', sp12[1].listCode12, '03B001000002');
ck('标准码不受影响', sp12[2].listCode12, '031001003001');
ck('空编码保持空', sp12[3].listCode12, '');
ck('长度统一12位', [sp12[0], sp12[1], sp12[2]].every(function (x) { return x.listCode12.length === 12; }), true);

console.log('\n== 概算模式（?mode=gs）：不套清单编码与项目特征 ==');
var capGG = null, capJG = null;
global.XLSX.writeFile = function (wb, name) { if (/建经/.test(name)) capJG = wb.__rows; else capGG = wb.__rows; };
var gsRows = A.parseRows([['序号','项目名称','数量'],[1,'单层百叶风口 800*400',4],[2,'镀锌钢管 DN50',40]]);
A.exportGLDGs(gsRows);
ck('概算广联达表头14列', capGG[0].length, 14);
ck('概算广联达无项目特征列', capGG[0].indexOf('项目特征'), -1);
ck('概算广联达无清单行', capGG.filter(function (r) { return r[9] === '清单行'; }).length, 0);
ck('概算广联达有定额行', capGG.filter(function (r) { return r[9] === '定额行'; }).length > 0, true);
ck('概算广联达行宽统一', capGG.filter(function (r) { return r.length && r.length !== 14; }).length, 0);
ck('概算广联达首行是定额行', capGG[1][9], '定额行');
ck('概算广联达首行项目名称', capGG[1][1], gsRows[0].name);
ck('概算定额行K列为项目名称', capGG[1][10], gsRows[0].name);
ck('概算广联达首行定额编码', capGG[1][8], gsRows[0].quotaCode);

A.exportJianjingGs(gsRows);
ck('概算建经表头7列', capJG[0].length, 7);
ck('概算建经无项目编码列', capJG[0].indexOf('项目编码'), -1);
ck('概算建经无项目特征列', capJG[0].indexOf('项目特征'), -1);
ck('概算建经行宽统一', capJG.filter(function (r) { return r.length && r.length !== 7; }).length, 0);
ck('概算建经保留定额编码', capJG[1][4], gsRows[0].quotaCode);

delete require.cache[require.resolve(path.join(__dirname, '..', 'js', 'app.js'))];
global.location = { search: '?mode=gs' };
var A2 = require(path.join(__dirname, '..', 'js', 'app.js'));
var capG2 = null;
global.XLSX.writeFile = function (wb, name) { if (/建经/.test(name)) capJG = wb.__rows; else capG2 = wb.__rows; };
A2.exportGLD(A2.parseRows([['序号','项目名称','数量'],[1,'单层百叶风口 800*400',4]]));
ck('mode=gs 自动走概算导出', capG2[0].indexOf('项目特征'), -1);
delete global.location;


console.log('\n== 价格数据库联动（信息价 > 数据库价 > 市场价）==');
  function hvPr(n) { return A.parseRows([[1, n, 10]])[0]; }

// 无数据库时前面全部用例已隐式验证：取价逻辑零变化
var _dbStore = {};
window.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(_dbStore, k) ? _dbStore[k] : null; },
  setItem: function (k, v) { _dbStore[k] = String(v); },
  removeItem: function (k) { delete _dbStore[k]; }
};
var PDB = require('../../jidian-system/price-db/js/db.js');
ck('价格库模块可加载', typeof PDB.lookupBatch, 'function');
ck('接入前为空库', PDB.stats().total, 0);

var _mk = hvPr('轴流式通风机 5000m3/h');
ck('接入前为市场价', _mk.priceSource, 'market');
ck('接入前价格', _mk.price, 1900);

PDB.addItems([
  { prof: 'hvac', cat: '通风空调设备类', brand: '联塑', name: '轴流式通风机 5000m3/h', price: 99.99, date: '2026-11-01' },
  { prof: 'hvac', cat: '通风空调设备类', brand: '测试品牌', name: '闸阀 DN50', price: 1.23, date: '2026-11-02' },
  { prof: 'plumbing', cat: '管道类', brand: '串味品牌', name: '轴流式通风机 5000m3/h', price: 7.77, date: '2026-11-03' }
]);
ck('入库三条', PDB.stats().total, 3);
window.__priceDbRefresh();

var _db = hvPr('轴流式通风机 5000m3/h');
ck('市场价被数据库价覆盖', _db.priceSource, 'db');
ck('数据库价取数', Math.round(_db.price * 100) / 100, 99.99);
ck('显示数据库品牌', _db.priceBrand, '联塑');
ck('价格依据含品牌与日期', /价格数据库/.test(_db.priceBasis) && /联塑/.test(_db.priceBasis) && /2026-11-01/.test(_db.priceBasis), true);
ck('专业隔离：不取其它专业同名条目', Math.round(_db.price * 100) / 100, 99.99);

var _if = hvPr('闸阀 DN50');
ck('信息价不被数据库价覆盖', _if.priceSource !== 'db', true);
ck('信息价数值不变', _if.price, 145);

var _ms = hvPr('铝合金风口 600x300');
ck('库中无匹配保持原价源', _ms.priceSource !== 'db', true);
ck('库中无匹配价格不变', Math.round(_ms.price * 100) / 100, 92.4);

// 数据更新后（价格改动）重新组价即取新价
PDB.addItems([{ prof: 'hvac', cat: '通风空调设备类', brand: '联塑', name: '轴流式通风机 5000m3/h', price: 108.88, date: '2026-11-10' }]);
window.__priceDbRefresh();
var _db2 = hvPr('轴流式通风机 5000m3/h');
ck('库价更新后重取', Math.round(_db2.price * 100) / 100, 108.88);
ck('更新后仍为数据库价', _db2.priceSource, 'db');

console.log('\n' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
