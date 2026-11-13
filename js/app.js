/* ============================================================
 * 暖通专业智能组价系统
 * 天津2025清单计价规范 / 2020预算基价 第九册（通风空调工程）
 * 输入：A列序号 / B列项目名称 / C列数量
 * 输出：清单编码 + 定额编码 + 主材价 + 项目特征，支持广联达 / 建经 双格式导出
 * ============================================================ */
(function () {
  'use strict';

  // ---------- 概算模式 ----------
  // 概算计价不套清单编码、不生成项目特征：URL 带 ?mode=gs 时启用。
  // 界面隐藏「清单编码」列；广联达导出删清单行与项目特征列；
  // 建经导出删清单编码列与项目特征列。无该参数（预算模式）时行为完全不变。
  var GS_MODE = /[?&]mode=gs(?:&|$)/.test((typeof location !== 'undefined' && location.search) || '');

  var P = (typeof window !== 'undefined' && window.HVAC_PRICES) ? window.HVAC_PRICES
    : (typeof require !== 'undefined' ? require('../data/prices.js') : {});
  // 管道模块：与给排水站同一套清单/定额/主材价口径（031001001~008 + 第八册）
  var PIPE = (typeof window !== 'undefined' && window.HVAC_PIPE) ? window.HVAC_PIPE
    : (typeof require !== 'undefined' ? require('./pipes.js') : null);

  // ============================================================
  // 清单编码（天津2025清单计价规范 附录D 通风空调工程）
  // ============================================================
  var LIST = {
    other: '',
    heater: '030701001',    // 空气加热器、冷却器
    dedust: '030701002',    // 除尘设备
    acu: '030701003',       // 空调器
    fcu: '030701004',       // 风机盘管
    dehum: '030701014',     // 除湿机
    filter: '030701015',    // 过滤吸收器
    fume: '030701016',      // 油烟净化器
    vav: '030701017',       // 变风量末端
    fan: '030701301',       // 通风机
    valve: '030703001',     // 碳钢阀门（风阀）
    vent: '030703007',      // 风口
    silencer: '030703020',  // 消声器
    plenum: '030703021',    // 静压箱
    renfang: '030703023',   // 人防手动密闭阀
    duct: '030702001',      // 碳钢通风管道（镀锌钢板矩形 9-6~9-11 / 圆形 9-1~9-5）
    ductClean: '030702001', // 净化风管（按碳钢通风管道计列，定额 9-279~9-282）
    ductSS: '030702003',    // 不锈钢板通风管道（9-293~9-297）
    ductPlastic: '030702005', // 塑料通风管道（9-322~9-330）
    ductFrp: '030702006',   // 玻璃钢通风管道（9-363~9-370）
    ductComp: '030702007',  // 复合型风管（9-385~9-392）
    ductFlex: '030702008',  // 柔性软风管（9-39~9-43）
    transport: '030702301', // 通风管道场外运输（9-56）
    guideVane: '030702009', // 弯头导流叶片（9-35）
    chiller: '030112001',   // 冷水机组（第一册 1-1130~1-1152）
    heatpump: '030112003',  // 热泵机组（1-1153~1-1164）
    coolingTower: '030112006', // 冷却塔（1-1295~1-1303）
    waterValve: '031002001',   // 金属阀门（第八册 8-579~8-584 螺纹 / 8-620~8-629 焊接法兰）
    autoAir: '031002303',      // 自动排气阀（8-682）
    tempValve: '031002306',    // 散热器温控阀（8-686）
    floatValve: '031002301',   // 法兰浮球阀（8-612~8-616）
    levelValve: '031002302',   // 法兰液压水位控制阀（8-645~8-649）
    flushValve: '031002304',   // 口部冲洗阀（8-1260，定额单位 套）
    solenoidValve: '031002305', // 电磁阀（8-603~8-608 螺纹 / 8-630~8-644 法兰）
    bracket: '031301005',      // 支/吊架、基础型钢（第七册 7-138）
    insulRubber: '031208002',  // 其他管道绝热（11-582 橡塑）
    insulGlass: '031208002'    // 其他管道绝热（11-647 离心玻璃棉）
  };
  var LIST_NAME = {
    heater: '空气加热器、冷却器', dedust: '除尘设备', acu: '空调器', fcu: '风机盘管',
    dehum: '除湿机', filter: '过滤吸收器', fume: '油烟净化器', vav: '变风量末端',
    fan: '通风机', valve: '碳钢阀门', vent: '风口', silencer: '消声器',
    plenum: '静压箱', renfang: '人防手动密闭阀', duct: '碳钢通风管道',
    ductClean: '碳钢通风管道', ductSS: '不锈钢板通风管道', ductPlastic: '塑料通风管道',
    ductFrp: '玻璃钢通风管道', ductComp: '复合型风管', ductFlex: '柔性软风管',
    transport: '通风管道场外运输', guideVane: '弯头导流叶片',
    chiller: '冷水机组', heatpump: '热泵机组', coolingTower: '冷却塔',
    waterValve: '金属阀门', autoAir: '自动排气阀', tempValve: '散热器温控阀',
    floatValve: '法兰浮球阀', levelValve: '液压水位控制阀',
    flushValve: '口部冲洗阀', solenoidValve: '电磁阀',
    bracket: '支/吊架、基础型钢', insulRubber: '其他管道绝热', insulGlass: '其他管道绝热'
  };

  // 未匹配清单/定额时统一套用的补充清单编码
  var SUPP_LIST = '030806801';
  var buSeq = 0;   // 补充定额流水号：补1、补2、补3……

  var CAT_LABEL = {
    fan: '通风机', acu: '空调器', fcu: '风机盘管', fume: '油烟净化',
    heater: '空气加热/冷却器', dedust: '除尘设备', dehum: '除湿机', filter: '过滤吸收器',
    vav: '变风量末端', vent: '风口', valve: '风阀', silencer: '消声器',
    plenum: '静压箱', renfang: '人防密闭阀', guideVane: '弯头导流叶片', duct: '碳钢通风管道',
    ductClean: '净化通风管道', ductSS: '不锈钢板通风管道', ductPlastic: '塑料通风管道',
    ductFrp: '玻璃钢通风管道', ductComp: '复合型风管', ductFlex: '柔性软风管',
    transport: '通风管道场外运输',
    chiller: '冷水机组', heatpump: '热泵机组', coolingTower: '冷却塔',
    waterValve: '金属阀门', autoAir: '自动排气阀', tempValve: '散热器温控阀',
    floatValve: '浮球阀', levelValve: '液压水位控制阀',
    flushValve: '口部冲洗阀', solenoidValve: '电磁阀',
    bracket: '管道支架', insulRubber: '橡塑保温', insulGlass: '离心玻璃棉保温',
    other: '其他（未匹配）'
  };

  var CAT_WORK = {
    fan: '风机本体安装、减震器安装、试运转',
    acu: '设备开箱检验、吊装就位、找平找正、固定、试运转',
    fcu: '吊架制作安装、设备安装、连接、试压、试运转',
    fume: '设备就位、固定、接线、调试',
    heater: '设备安装、找平找正、固定',
    dedust: '设备安装、找平找正、固定',
    dehum: '设备安装、找平找正、固定',
    filter: '设备安装、固定',
    vav: '设备安装、调试',
    vent: '风口制作（成品）、安装、固定',
    valve: '阀体安装、固定、调试',
    silencer: '消声器安装、固定',
    plenum: '静压箱制作（成品）、安装、固定（消声静压箱含消声棉、穿孔板安装）',
    renfang: '阀体安装、固定、密闭检查',
    duct: '风管制作（放样、下料、折方/卷圆、咬口、法兰）、安装、固定、严密性试验',
    ductClean: '净化风管制作（放样、下料、折方、咬口、上法兰、口缝涂密封胶、内表面清洗）、安装、固定、严密性试验',
    ductSS: '不锈钢板风管制作（放样、下料、卷圆、焊接、上法兰）、安装、固定、严密性试验',
    ductPlastic: '塑料风管制作（放样、下料、坡口、焊接、上法兰）、安装、固定、严密性试验',
    ductFrp: '玻璃钢风管成品安装、法兰连接、找平找正、固定、严密性试验',
    ductComp: '复合型风管制作（下料、开槽、涂胶、合缝、法兰）、安装、固定、严密性试验',
    ductFlex: '软风管就位、加垫、连接、找平找正、固定（软管接口：下料、缝合/咬口、法兰连接）',
    transport: '通风管道装车、场外运输、卸车',
    guideVane: '导流叶片放样、下料、成型、安装、固定',
    chiller: '设备开箱检验、基础放线、吊装就位、找平找正、地脚螺栓固定、单机试运转',
    heatpump: '设备开箱检验、吊装就位、找平找正、固定、冷热水管道接口、单机试运转',
    coolingTower: '设备开箱检验、塔体就位、找平找正、固定、填料及布水器安装、单机试运转',
    waterValve: '阀体安装、法兰/螺纹连接、试压、调试',
    autoAir: '阀体安装、螺纹连接、试压、调试',
    tempValve: '温控阀及传感器安装、连接、调试',
    floatValve: '阀体安装、法兰连接、试压、调试',
    levelValve: '阀体安装、法兰连接、试压、调试',
    flushValve: '壁龛（地坑）门框及扇（盖）制作安装、阀安装、刷油、水压试验',
    solenoidValve: '阀体安装、螺纹/法兰连接、接线、试压、调试',
    bracket: '支吊架制作（切断、调直、钻孔、焊接、除锈刷油）、安装、固定',
    insulRubber: '橡塑保温壳安装（下料、涂胶、粘贴、接缝处理）',
    insulGlass: '带铝箔离心玻璃棉安装（下料、粘贴、铝箔胶带封缝、固定）',
    other: '待补充：请按实际做法填写工作内容'
  };

  // 管道类（复用给排水站）清单编码/名称/工作内容并入本表，供导出与项目特征复用
  if (PIPE) {
    Object.keys(PIPE.LIST).forEach(function (k) {
      LIST[k] = PIPE.LIST[k].code;
      LIST_NAME[k] = PIPE.LIST[k].name;
      CAT_LABEL[k] = PIPE.CAT_LABEL[k];
      CAT_WORK[k] = PIPE.CAT_WORK[k];
    });
  }

  // ============================================================
  // 定额表（第九册 通风空调工程）
  // ============================================================
  function T(max, code, label) { return { max: max, code: code, label: label }; }

  var FAN_TIERS = {
    axial: [ // 轴流式、斜流式、混流式通风机
      T(8900, '9-239', '8900m³/h以内'),
      T(25000, '9-240', '25000m³/h以内'),
      T(63000, '9-241', '63000m³/h以内'),
      T(140000, '9-242', '140000m³/h以内'),
      T(Infinity, '9-243', '140000m³/h以外')
    ],
    centrifugal: [ // 离心式通风机
      T(4500, '9-233', '4500m³/h以内'),
      T(10000, '9-234', '10000m³/h以内'),
      T(20000, '9-235', '20000m³/h以内'),
      T(50000, '9-236', '50000m³/h以内'),
      T(123000, '9-237', '123000m³/h以内'),
      T(Infinity, '9-238', '123000m³/h以外')
    ]
  };

  var ACU_UNIT_TIERS = [ // 组合式空调机组 / 新风机组
    T(4000, '9-257', '4000m³/h以内'),
    T(10000, '9-258', '10000m³/h以内'),
    T(20000, '9-259', '20000m³/h以内'),
    T(40000, '9-260', '40000m³/h以内'),
    T(60000, '9-261', '60000m³/h以内'),
    T(80000, '9-262', '80000m³/h以内'),
    T(100000, '9-263', '100000m³/h以内'),
    T(Infinity, '9-264', '100000m³/h以外')
  ];

  // 吊顶式 / 落地式 / 墙上式空调器：按设备质量分档（单位 台）
  var ACU_FORM_TITLE = {
    ceiling: '吊顶式空调器安装 ',
    floor: '落地式空调器安装 ',
    wall: '墙上式空调器安装 '
  };
  var ACU_MASS_TIERS = {
    ceiling: [T(0.15, '9-248', '质量0.15t以内'), T(0.2, '9-249', '质量0.2t以内'), T(0.4, '9-250', '质量0.4t以内')],
    floor: [T(0.6, '9-251', '质量0.6t以内'), T(1.0, '9-252', '质量1.0t以内'), T(2.0, '9-253', '质量2.0t以内')],
    wall: [T(0.1, '9-254', '质量0.1t以内'), T(0.2, '9-255', '质量0.2t以内'), T(0.3, '9-256', '质量0.3t以内')]
  };
  // 名称未注质量时按风量估算本体质量（t / 1000m³·h⁻¹）：吊顶式 0.015、落地式 0.025、墙上式 0.012
  var ACU_MASS_PER_KVOL = { ceiling: 0.015, floor: 0.025, wall: 0.012 };

  var FUME_TIERS = [
    T(3000, '9-271', '3000m³/h以内'),
    T(10000, '9-272', '10000m³/h以内'),
    T(30000, '9-273', '30000m³/h以内'),
    T(Infinity, '9-274', '30000m³/h以外')
  ];

  // 风阀（周长分档，mm）
  var V_FIRE = [T(2200, '9-82', '2200mm以内'), T(3600, '9-83', '3600mm以内'), T(5400, '9-84', '5400mm以内'), T(Infinity, '9-85', '5400mm以外')];
  var V_BUTTERFLY = [T(800, '9-63', '800mm以内'), T(1600, '9-64', '1600mm以内'), T(2400, '9-65', '2400mm以内'), T(3200, '9-66', '3200mm以内'), T(Infinity, '9-67', '3200mm以外')];
  var V_CHECK = [T(800, '9-68', '800mm以内'), T(1200, '9-69', '1200mm以内'), T(2000, '9-70', '2000mm以内'), T(Infinity, '9-71', '2000mm以外')];
  var V_SLUICE = [T(2200, '9-72', '2200mm以内'), T(3600, '9-73', '3600mm以内'), T(5400, '9-74', '5400mm以内'), T(Infinity, '9-75', '5400mm以外')];
  var V_MULTI = [T(2800, '9-76', '2800mm以内'), T(4000, '9-77', '4000mm以内'), T(5200, '9-78', '5200mm以内'), T(6500, '9-79', '6500mm以内'), T(8000, '9-80', '8000mm以内'), T(Infinity, '9-81', '8000mm以外')];

  // 风口（周长分档，mm）
  var O_LOUVER = [T(900, '9-86', '900mm以内'), T(1280, '9-87', '1280mm以内'), T(1800, '9-88', '1800mm以内'), T(2500, '9-89', '2500mm以内'), T(3300, '9-90', '3300mm以内'), T(4800, '9-91', '4800mm以内'), T(6000, '9-92', '6000mm以内'), T(Infinity, '9-93', '6000mm以外')];
  var O_DIFF_SQ = [T(500, '9-102', '500mm以内'), T(1000, '9-103', '1000mm以内'), T(Infinity, '9-104', '1000mm以外')];
  // 圆形、流线形散流器（含圆形风口、球形喷口）：按风口直径分档，分档值取周长 πD（200/360/500）
  var O_DIFF_RD = [T(628, '9-105', '直径200mm以内'), T(1131, '9-106', '直径360mm以内'), T(1571, '9-107', '直径500mm以内')];
  var O_LOUVER_ADJ = [T(800, '9-122', '800mm以内'), T(1200, '9-123', '1200mm以内'), T(1800, '9-124', '1800mm以内'), T(2400, '9-125', '2400mm以内'), T(3200, '9-126', '3200mm以内'), T(Infinity, '9-127', '3200mm以外')];
  var O_ROUND_ADJ = [T(800, '9-128', '800mm以内'), T(1200, '9-129', '1200mm以内'), T(1800, '9-130', '1800mm以内'), T(2400, '9-131', '2400mm以内'), T(3200, '9-132', '3200mm以内'), T(4000, '9-133', '4000mm以内'), T(Infinity, '9-134', '4000mm以外')];
  var O_PLATE = [T(800, '9-140', '800mm以内'), T(1280, '9-141', '1280mm以内'), T(1600, '9-142', '1600mm以内'), T(2000, '9-143', '2000mm以内'), T(2800, '9-144', '2800mm以内'), T(3200, '9-145', '3200mm以内'), T(Infinity, '9-146', '3200mm以外')];
  var O_MULTI = [T(1200, '9-147', '1200mm以内'), T(2000, '9-148', '2000mm以内'), T(2600, '9-149', '2600mm以内'), T(3200, '9-150', '3200mm以内'), T(3800, '9-151', '3800mm以内'), T(4400, '9-152', '4400mm以内'), T(4800, '9-153', '4800mm以内'), T(Infinity, '9-154', '4800mm以外')];

  // 消声器（周长分档，mm）
  var S_MICRO = [T(1800, '9-190', '1800mm以内'), T(2800, '9-191', '2800mm以内'), T(3800, '9-192', '3800mm以内'), T(4800, '9-193', '4800mm以内'), T(6000, '9-194', '6000mm以内'), T(Infinity, '9-195', '6000mm以外')];
  var S_IMPED = [T(2200, '9-196', '2200mm以内'), T(3000, '9-197', '3000mm以内'), T(3800, '9-198', '3800mm以内'), T(4800, '9-199', '4800mm以内'), T(Infinity, '9-200', '4800mm以外')];
  var S_PIPE = [T(1280, '9-201', '1280mm以内'), T(2000, '9-202', '2000mm以内'), T(3000, '9-203', '3000mm以内'), T(Infinity, '9-204', '3000mm以外')];

  // 消声静压箱安装（截面积分档，m²）：截面积取名称前两维相乘，如 1200*1100*400 → 1.32m²
  var PLENUM_TIERS = [T(0.8, '9-213', '0.8m²以内'), T(3.5, '9-214', '3.5m²以内'), T(Infinity, '9-215', '3.5m²以外')];
  // 普通静压箱（不分规格，单一子目）
  var PLENUM_PLAIN = { code: '9-284', name: '静压箱安装' };

  // 人防手动密闭阀（直径分档，mm）
  var RF_TIERS = [T(200, '9-423', '200mm以内'), T(300, '9-424', '300mm以内'), T(400, '9-425', '400mm以内'), T(500, '9-426', '500mm以内'), T(600, '9-427', '600mm以内'), T(800, '9-428', '800mm以内'), T(Infinity, '9-429', '800mm以外')];

  // 碳钢（镀锌钢板）通风管道 9-1~9-11，单位 10m²
  // 矩形按"长边长"分档：320/450/1000/1250/2000/4000
  var DUCT_RECT_TIERS = [T(320, '9-6', '长边长320mm以内'), T(450, '9-7', '长边长450mm以内'), T(1000, '9-8', '长边长1000mm以内'),
    T(1250, '9-9', '长边长1250mm以内'), T(2000, '9-10', '长边长2000mm以内'), T(4000, '9-11', '长边长4000mm以内')];
  // 圆形按"直径"分档：320/450/1000/1250/2000
  var DUCT_ROUND_TIERS = [T(320, '9-1', '直径320mm以内'), T(450, '9-2', '直径450mm以内'), T(1000, '9-3', '直径1000mm以内'),
    T(1250, '9-4', '直径1250mm以内'), T(2000, '9-5', '直径2000mm以内')];

  // 定额档 → 镀锌钢板板厚（GB50243 常用板厚，随长边长/直径递增）
  var DUCT_PLATE_T = { '9-1': 0.5, '9-2': 0.6, '9-3': 0.75, '9-4': 1.0, '9-5': 1.0, '9-6': 0.5, '9-7': 0.6, '9-8': 0.75, '9-9': 1.0, '9-10': 1.0, '9-11': 1.2 };

  // ---- 净化风管 9-279~9-282：按"周长"分档（圆形执行矩形子目，周长=πD）----
  var DUCT_CLEAN_TIERS = [T(800, '9-279', '周长800mm以内'), T(2000, '9-280', '周长2000mm以内'),
    T(4000, '9-281', '周长4000mm以内'), T(Infinity, '9-282', '周长4000mm以外')];
  // 定额消耗量对应的优质镀锌钢板板厚：0.5/0.75/1.0/1.2
  var DUCT_CLEAN_T = { '9-279': 0.5, '9-280': 0.75, '9-281': 1.0, '9-282': 1.2 };

  // ---- 不锈钢板圆形风管（电焊）9-293~9-297：直径×壁厚分档 ----
  var DUCT_SS_TIERS = [T(200, '9-293', '直径×壁厚200mm以内×2'), T(400, '9-294', '直径×壁厚400mm以内×2'),
    T(560, '9-295', '直径×壁厚560mm以内×2'), T(700, '9-296', '直径×壁厚700mm以内×3'),
    T(Infinity, '9-297', '直径×壁厚700mm以外×3')];
  var DUCT_SS_THK = { '9-293': 2, '9-294': 2, '9-295': 2, '9-296': 3, '9-297': 3 };

  // ---- 塑料风管 9-322~9-325 圆形（直径）/ 9-326~9-330 矩形（周长）----
  var DUCT_PL_ROUND = [T(300, '9-322', '直径×壁厚300mm以内×3'), T(630, '9-323', '直径×壁厚630mm以内×4'),
    T(1000, '9-324', '直径×壁厚1000mm以内×5'), T(2000, '9-325', '直径×壁厚2000mm以内×6')];
  var DUCT_PL_RECT = [T(1300, '9-326', '周长×壁厚1300mm以内×3'), T(2000, '9-327', '周长×壁厚2000mm以内×4'),
    T(3200, '9-328', '周长×壁厚3200mm以内×5'), T(4500, '9-329', '周长×壁厚4500mm以内×6'),
    T(6500, '9-330', '周长×壁厚6500mm以内×8')];
  var DUCT_PL_THK = { '9-322': 3, '9-323': 4, '9-324': 5, '9-325': 6, '9-326': 3, '9-327': 4, '9-328': 5, '9-329': 6, '9-330': 8 };

  // ---- 玻璃钢风管 9-363~9-366 圆形（直径）/ 9-367~9-370 矩形（周长），δ=4mm以内 ----
  var DUCT_FRP_ROUND = [T(200, '9-363', '直径200mm以内'), T(500, '9-364', '直径500mm以内'),
    T(1120, '9-365', '直径1120mm以内'), T(Infinity, '9-366', '直径1120mm以外')];
  var DUCT_FRP_RECT = [T(800, '9-367', '周长800mm以内'), T(2000, '9-368', '周长2000mm以内'),
    T(4000, '9-369', '周长4000mm以内'), T(Infinity, '9-370', '周长4000mm以外')];

  // ---- 复合型酚醛风管 9-385~9-388 圆形（直径）/ 9-389~9-392 矩形（长边长）----
  var DUCT_COMP_ROUND = [T(300, '9-385', '直径300mm以内'), T(630, '9-386', '直径630mm以内'),
    T(1000, '9-387', '直径1000mm以内'), T(2000, '9-388', '直径2000mm以内')];
  var DUCT_COMP_RECT = [T(300, '9-389', '长边长300mm以内'), T(630, '9-390', '长边长630mm以内'),
    T(1000, '9-391', '长边长1000mm以内'), T(Infinity, '9-392', '长边长1000mm以外')];

  // ---- 柔性软风管 9-39~9-43：直径分档，单位 m（无保温套管）----
  var DUCT_FLEX_TIERS = [T(150, '9-39', '直径150mm以内'), T(250, '9-40', '直径250mm以内'),
    T(500, '9-41', '直径500mm以内'), T(710, '9-42', '直径710mm以内'), T(910, '9-43', '直径910mm以内')];

  // 定额名称前缀（分档标签已含"长边长/直径/周长"口径，这里只补定额子目名称）
  var DUCT_TITLE = {
    duct: { rect: '镀锌钢板矩形风管 ', round: '镀锌薄钢板圆形风管 ' },
    ductClean: { rect: '镀锌薄钢板矩形净化风管（咬口） ', round: '镀锌薄钢板矩形净化风管（咬口） ' },
    ductSS: { rect: '不锈钢板圆形风管制作、安装（电焊） ', round: '不锈钢板圆形风管制作、安装（电焊） ' },
    ductPlastic: { rect: '塑料矩形风管制作、安装 ', round: '塑料圆形风管制作、安装 ' },
    ductFrp: { rect: '玻璃钢矩形风管安装 ', round: '玻璃钢圆形风管安装 ' },
    ductComp: { rect: '复合型酚醛风管制作、安装 法兰矩形风管 ', round: '复合型酚醛风管制作、安装 法兰圆形风管 ' },
    ductFlex: { rect: '柔性软风管安装 无保温套管 ', round: '柔性软风管安装 无保温套管 ' }
  };

  function isDuctCat(c) { return !!DUCT_TITLE[c]; }

  // ============================================================
  // 第一册 机械设备安装工程：制冷设备 / 冷却塔（2020 天津预算基价）
  //   活塞式冷水机组 1-1130~1-1137：60/125/240/360/600/935/1200/1500 kW以内
  //   离心式冷水机组 1-1138~1-1145：350/600/900/1200/1500/1800/2300/3000 kW以内
  //   螺杆式冷水机组 1-1146~1-1152：240/350/600/900/1200/1800/2300 kW以内
  //   热泵冷（热）水机组 1-1153~1-1164：10/20/35/60/120/180/240/300/350/480/600/700 kW以内
  //   玻璃钢冷却塔 1-1295~1-1303：30/50/70/100/150/250/300/500/700 m³/h以内
  // ============================================================
  var CHILLER_TIERS = {
    piston: [T(60, '1-1130', '60kW以内'), T(125, '1-1131', '125kW以内'), T(240, '1-1132', '240kW以内'),
      T(360, '1-1133', '360kW以内'), T(600, '1-1134', '600kW以内'), T(935, '1-1135', '935kW以内'),
      T(1200, '1-1136', '1200kW以内'), T(1500, '1-1137', '1500kW以内')],
    centrifugal: [T(350, '1-1138', '350kW以内'), T(600, '1-1139', '600kW以内'), T(900, '1-1140', '900kW以内'),
      T(1200, '1-1141', '1200kW以内'), T(1500, '1-1142', '1500kW以内'), T(1800, '1-1143', '1800kW以内'),
      T(2300, '1-1144', '2300kW以内'), T(3000, '1-1145', '3000kW以内')],
    screw: [T(240, '1-1146', '240kW以内'), T(350, '1-1147', '350kW以内'), T(600, '1-1148', '600kW以内'),
      T(900, '1-1149', '900kW以内'), T(1200, '1-1150', '1200kW以内'), T(1800, '1-1151', '1800kW以内'),
      T(2300, '1-1152', '2300kW以内')]
  };
  var CHILLER_TITLE = {
    piston: '活塞式冷水机组 制冷量', centrifugal: '离心式冷水机组 制冷量', screw: '螺杆式冷水机组 制冷量'
  };
  var HEATPUMP_TIERS = [T(10, '1-1153', '10kW以内'), T(20, '1-1154', '20kW以内'), T(35, '1-1155', '35kW以内'),
    T(60, '1-1156', '60kW以内'), T(120, '1-1157', '120kW以内'), T(180, '1-1158', '180kW以内'),
    T(240, '1-1159', '240kW以内'), T(300, '1-1160', '300kW以内'), T(350, '1-1161', '350kW以内'),
    T(480, '1-1162', '480kW以内'), T(600, '1-1163', '600kW以内'), T(700, '1-1164', '700kW以内')];
  var TOWER_TIERS = [T(30, '1-1295', '30m³/h以内'), T(50, '1-1296', '50m³/h以内'), T(70, '1-1297', '70m³/h以内'),
    T(100, '1-1298', '100m³/h以内'), T(150, '1-1299', '150m³/h以内'), T(250, '1-1300', '250m³/h以内'),
    T(300, '1-1301', '300m³/h以内'), T(500, '1-1302', '500m³/h以内'), T(700, '1-1303', '700m³/h以内')];

  // ===== 水系统阀门（第八册第二章）=====
  // 螺纹阀门 8-579~8-584：DN15/20/25/32/40/50；焊接法兰阀 8-620~8-629：DN65~400
  var WVALVE_THREAD = [T(15, '8-579', '15mm以内'), T(20, '8-580', '20mm以内'), T(25, '8-581', '25mm以内'),
    T(32, '8-582', '32mm以内'), T(40, '8-583', '40mm以内'), T(50, '8-584', '50mm以内')];
  var WVALVE_FLANGE = [T(65, '8-620', '65mm以内'), T(80, '8-621', '80mm以内'), T(100, '8-622', '100mm以内'),
    T(125, '8-623', '125mm以内'), T(150, '8-624', '150mm以内'), T(200, '8-625', '200mm以内'),
    T(250, '8-626', '250mm以内'), T(300, '8-627', '300mm以内'), T(350, '8-628', '350mm以内'),
    T(400, '8-629', '400mm以内')];
  var FLOAT_TIERS = [T(32, '8-612', '32mm以内'), T(50, '8-613', '50mm以内'), T(80, '8-614', '80mm以内'),
    T(100, '8-615', '100mm以内'), T(150, '8-616', '150mm以内')];
  var LEVEL_TIERS = [T(50, '8-645', '50mm以内'), T(80, '8-646', '80mm以内'), T(100, '8-647', '100mm以内'),
    T(150, '8-648', '150mm以内'), T(200, '8-649', '200mm以内')];
  // 电磁阀（031002305）：螺纹 8-603~8-608（DN15~50）、法兰 8-630~8-644（DN32~500）
  var SOL_THREAD = [T(15, '8-603', '15mm以内'), T(20, '8-604', '20mm以内'), T(25, '8-605', '25mm以内'),
    T(32, '8-606', '32mm以内'), T(40, '8-607', '40mm以内'), T(50, '8-608', '50mm以内')];
  var SOL_FLANGE = [T(32, '8-630', '32mm以内'), T(40, '8-631', '40mm以内'), T(50, '8-632', '50mm以内'),
    T(65, '8-633', '65mm以内'), T(80, '8-634', '80mm以内'), T(100, '8-635', '100mm以内'),
    T(125, '8-636', '125mm以内'), T(150, '8-637', '150mm以内'), T(200, '8-638', '200mm以内'),
    T(250, '8-639', '250mm以内'), T(300, '8-640', '300mm以内'), T(350, '8-641', '350mm以内'),
    T(400, '8-642', '400mm以内'), T(450, '8-643', '450mm以内'), T(500, '8-644', '500mm以内')];

  function parseChillerType(name) {
    var t = String(name || '');
    if (/离心/.test(t)) return 'centrifugal';
    if (/螺杆/.test(t)) return 'screw';
    if (/活塞/.test(t)) return 'piston';
    return null;
  }
  // 冷却塔处理水量 m³/h
  function parseWaterFlow(name) {
    var m = String(name || '').match(/(\d+(?:\.\d+)?)\s*(?:m3\/h|m³\/h|立方米\/小时|立方\/小时|t\/h|吨\/小时|吨\/h)/i);
    if (m) return parseFloat(m[1]);
    return null;
  }

  // ============================================================
  // 类型下拉选项（输出页面手动选择）
  // ============================================================
  var TYPE_OPTS = {
    chiller: [
      { v: 'piston', label: '活塞式冷水机组' },
      { v: 'centrifugal', label: '离心式冷水机组' },
      { v: 'screw', label: '螺杆式冷水机组' }
    ],
    fan: [
      { v: 'axial', label: '轴流/斜流/混流式' },
      { v: 'centrifugal', label: '离心式' }
    ],
    acu: [
      { v: 'unit', label: '组合式空调机组' },
      { v: 'pau', label: '新风机组' },
      { v: 'ceiling', label: '吊顶式空调器' },
      { v: 'floor', label: '落地式空调器' },
      { v: 'wall', label: '墙上式空调器' },
      { v: 'section', label: '分段组装式空调器' },
      { v: 'split', label: '分体空调' },
      { v: 'vrf', label: '多联机VRF（按落地式分档）' }
    ],
    plenum: [
      { v: 'plain', label: '静压箱' },
      { v: 'silencer', label: '消声静压箱' }
    ],
    fcu: [
      { v: 'ceiling', label: '吊顶式' },
      { v: 'floor', label: '落地式' },
      { v: 'wall', label: '壁挂式' },
      { v: 'cassette', label: '卡式' }
    ],
    vent: [
      { v: 'louver1', label: '单层百叶风口' },
      { v: 'louver2', label: '双层百叶风口' },
      { v: 'rain', label: '防雨百叶风口' },
      { v: 'autodrop', label: '自垂式百叶风口' },
      { v: 'hinge', label: '门铰式回风口' },
      { v: 'ventE', label: '电动风口' },
      { v: 'fireVent', label: '防火风口' },
      { v: 'diffuserSq', label: '方形散流器' },
      { v: 'diffuserRd', label: '圆形散流器' },
      { v: 'louverAdj', label: '带调节阀百叶风口' },
      { v: 'roundAdj', label: '圆形带调节阀风口' },
      { v: 'multileafOutlet', label: '多叶送/排烟口' },
      { v: 'plateOutlet', label: '板式排烟口' }
    ],
    valve: [
      { v: 'fire70', label: '70℃防火阀' },
      { v: 'fire70e', label: '70℃防火阀·电动' },
      { v: 'fire280', label: '280℃排烟防火阀' },
      { v: 'fire280e', label: '280℃排烟阀·电动' },
      { v: 'butterfly', label: '蝶阀' },
      { v: 'butterflyE', label: '蝶阀·电动' },
      { v: 'check', label: '止回阀' },
      { v: 'sluice', label: '斜插板阀' },
      { v: 'multileaf', label: '对开多叶调节阀' },
      { v: 'multileafE', label: '对开多叶·电动' },
      { v: 'tee', label: '三通多叶调节阀' },
      { v: 'sealed', label: '密闭阀门' },
      { v: 'cav', label: '定风量阀' },
      { v: 'overpressure', label: '超压排气阀门' }
    ],
    silencer: [
      { v: 'micro', label: '微穿孔板消声器' },
      { v: 'impedance', label: '阻抗式消声器' },
      { v: 'pipe', label: '管式消声器' }
    ],
    renfang: [
      { v: 'manual', label: '手动密闭阀' },
      { v: 'manualE', label: '电动密闭阀' }
    ],
    duct: [
      { v: 'rect', label: '矩形风管' },
      { v: 'round', label: '圆形风管' }
    ],
    ductClean: [
      { v: 'rect', label: '矩形净化风管' },
      { v: 'round', label: '圆形净化风管' }
    ],
    ductSS: [
      { v: 'round', label: '圆形（按直径）' },
      { v: 'rect', label: '矩形（按长边长）' }
    ],
    ductPlastic: [
      { v: 'rect', label: '矩形（按周长）' },
      { v: 'round', label: '圆形（按直径）' }
    ],
    ductFrp: [
      { v: 'rect', label: '矩形（按周长）' },
      { v: 'round', label: '圆形（按直径）' }
    ],
    ductComp: [
      { v: 'rect', label: '矩形（按长边长）' },
      { v: 'round', label: '圆形（按直径）' }
    ],
    ductFlex: [
      { v: 'round', label: '成品柔性软风管（按长度m）' },
      { v: 'interface', label: '软管接口（帆布/三防复合布，按面积m²）' }
    ]
  };

  // ============================================================
  // 识别工具
  // ============================================================
  function has(s, arr) { for (var i = 0; i < arr.length; i++) if (s.indexOf(arr[i]) >= 0) return true; return false; }

  // 风量（m³/h）
  function parseAirVolume(name) {
    var m = name.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:m3|m³|m\^3|立方米)\s*\/?\s*h?/i);
    if (m) {
      var v = parseFloat(String(m[1]).replace(/,/g, ''));
      if (v > 0) return v;
    }
    m = name.match(/(?:风量|风量:|L|Q)\s*[=:：]?\s*(\d[\d,]*)/i);
    if (m) { var v2 = parseFloat(String(m[1]).replace(/,/g, '')); if (v2 >= 100) return v2; }
    m = name.match(/(\d{3,6})\s*(?:cmh|CMH|CMH)/);
    if (m) return parseFloat(m[1]);
    return null;
  }

  // 制冷量（kW）
  function parseCoolingKw(name) {
    var m = name.match(/(\d+(?:\.\d+)?)\s*(?:kW|KW|kw)/);
    if (m) return parseFloat(m[1]);
    m = name.match(/(\d+(?:\.\d+)?)\s*(?:匹|HP|hp|P(?![A-Za-z]))/);
    if (m) return +(parseFloat(m[1]) * 2.5).toFixed(1);
    return null;
  }

  // 除湿量（kg/h）
  function parseDehumKg(name) {
    var m = name.match(/(\d+(?:\.\d+)?)\s*(?:kg\/h|KG\/H|kg·h|公斤\/小时|公斤每小时)/);
    if (m) return parseFloat(m[1]);
    m = name.match(/(?:除湿量)[^\d]{0,6}(\d+(?:\.\d+)?)/);
    if (m) return parseFloat(m[1]);
    return null;
  }

  // 尺寸（mm）：支持 800*400、800×400×250、φ400/D400
  function parseDim(name) {
    var d = { length: 0, width: 0, height: 0, diameter: 0 };
    var mD = name.match(/[φΦϕ∅]\s*(\d+(?:\.\d+)?)/) || name.match(/\bD\s*(\d{2,4})\b/);
    if (mD) { d.diameter = parseFloat(mD[1]); return d; }
    var m3 = name.match(/(\d{2,5})\s*[×xX*＊]\s*(\d{2,5})\s*[×xX*＊]\s*(\d{2,5})/);
    if (m3) {
      d.length = parseFloat(m3[1]); d.width = parseFloat(m3[2]); d.height = parseFloat(m3[3]);
      return d;
    }
    var m2 = name.match(/(\d{2,5})\s*[×xX*＊]\s*(\d{2,5})/);
    if (m2) { d.length = parseFloat(m2[1]); d.width = parseFloat(m2[2]); return d; }
    return d;
  }

  // 周长（mm）：圆形 πD；矩形 2(L+W)
  function calcPerimeter(d) {
    if (d.diameter) return Math.round(Math.PI * d.diameter);
    if (d.length && d.width) return 2 * (d.length + d.width);
    return 0;
  }
  // 面积（㎡）
  function calcArea(d) {
    if (d.diameter) return +(Math.PI * Math.pow(d.diameter / 2000, 2)).toFixed(3);
    if (d.length && d.width) return +((d.length / 1000) * (d.width / 1000)).toFixed(3);
    return 0;
  }
  // 展开面积（㎡，静压箱 2(LW+LH+WH)）
  function calcSurface(d) {
    var L = d.length / 1000, W = d.width / 1000, H = d.height / 1000;
    if (!H) return +((2 * (L * W)) || 0).toFixed(3);
    return +(2 * (L * W + L * H + W * H)).toFixed(3);
  }
  // 截面积（㎡，静压箱 W×H）
  function calcSection(d) {
    if (!d.width) return 0;
    var H = d.height || d.width;
    return +((d.width / 1000) * (H / 1000)).toFixed(3);
  }

  // ============================================================
  // 风管辅助（碳钢/净化/不锈钢/塑料/玻璃钢/复合/柔性软风管）
  // 分档口径：碳钢=长边长|直径；净化=周长；不锈钢=直径×壁厚；
  //          塑料=圆形直径|矩形周长；玻璃钢=圆形直径|矩形周长；
  //          复合=圆形直径|矩形长边长；柔性=直径
  // ============================================================
  function ductShapeOf(name) {
    if (/圆形|圆风管|圆管|圆型|[φΦϕ∅]/.test(name)) return 'round';
    if (/矩形|方管|方风管|方型/.test(name)) return 'rect';
    return parseDim(name).diameter ? 'round' : 'rect';
  }

  // 名称中显式标注的壁厚/板厚（mm），没有则返回 0
  function parseThk(name) {
    var m = name.match(/(?:δ|壁厚|厚度|板厚)\s*[:：=]?\s*(\d+(?:\.\d+)?)/);
    if (m) return parseFloat(m[1]);
    m = name.match(/[×xX*]\s*(\d(?:\.\d)?)\s*(?:mm)?\s*$/);      // φ400×2 / 800*400 不算
    if (m) return parseFloat(m[1]);
    m = name.match(/(\d(?:\.\d)?)\s*mm\s*(?:厚|板)/);
    if (m) return parseFloat(m[1]);
    return 0;
  }

  // 定额分档用的特征值（mm）
  function ductMetricOf(it) {
    var d = it.dim || {};
    var L = d.length || 0, W = d.width || 0, D = d.diameter || 0;
    var round = it.sub === 'round';
    var long = Math.max(L, W);
    var peri = (L && W) ? 2 * (L + W) : 0;
    var dia = D || long;
    switch (it.category) {
      case 'ductFlex': return dia;
      case 'duct': return round ? dia : long;
      case 'ductSS': return dia;                                  // 矩形执行圆形子目，按长边长
      case 'ductComp': return round ? dia : long;
      case 'ductClean': return round ? (dia ? Math.round(Math.PI * dia) : 0) : peri;
      case 'ductPlastic':
      case 'ductFrp': return round ? dia : peri;
      default: return long;
    }
  }

  // 名称无标准尺寸写法时兜底：取 100~4000 范围内最大数字
  function ductSizeFromName(name) {
    var re = /\d{2,4}/g, m, best = 0;
    while ((m = re.exec(name))) {
      var v = parseFloat(m[0]);
      if (v >= 100 && v <= 4000 && v > best) best = v;
    }
    return best;
  }

  function plateOfT(t) {
    var pl = P.duct.plates;
    for (var i = 0; i < pl.length; i++) if (Math.abs(pl[i].t - t) < 0.001) return pl[i];
    return pl[1] || pl[0];
  }

  function ductTiersOf(it) {
    var round = it.sub === 'round';
    switch (it.category) {
      case 'ductClean': return DUCT_CLEAN_TIERS;
      case 'ductSS': return DUCT_SS_TIERS;
      case 'ductPlastic': return round ? DUCT_PL_ROUND : DUCT_PL_RECT;
      case 'ductFrp': return round ? DUCT_FRP_ROUND : DUCT_FRP_RECT;
      case 'ductComp': return round ? DUCT_COMP_ROUND : DUCT_COMP_RECT;
      case 'ductFlex': return DUCT_FLEX_TIERS;
      default: return round ? DUCT_ROUND_TIERS : DUCT_RECT_TIERS;
    }
  }

  // 统一同步：形状 → 特征值 → 定额档 → 板厚/壁厚
  function syncDuct(it) {
    if (!it || !isDuctCat(it.category)) return;
    if (it.category === 'ductFlex') it.sub = flexKindOf(it.name);
    else if (it.sub !== 'round') it.sub = 'rect';
    var sz = ductMetricOf(it);
    if (!sz) sz = ductSizeFromName(it.name);
    it.ductSize = sz;
    var tiers = ductTiersOf(it);
    var i = tierIndex(tiers, sz);
    // 不锈钢板风管：名称未注壁厚 → 统一按最小档 9-293，壁厚与单价同步取该档
    if (it.category === 'ductSS' && !it.thkName) i = 0;
    it.ductTierIdx = i;
    it.ductTier = i >= 0 ? tiers[i] : null;
    var code = i >= 0 ? tiers[i].code : '';
    var thk = 0;
    if (it.category === 'duct') thk = DUCT_PLATE_T[code] || 0.75;
    else if (it.category === 'ductClean') thk = DUCT_CLEAN_T[code] || 0.75;
    else if (it.category === 'ductSS') thk = DUCT_SS_THK[code] || 2;
    else if (it.category === 'ductPlastic') thk = DUCT_PL_THK[code] || 3;
    else if (it.category === 'ductFrp') thk = 4;
    else if (it.category === 'ductComp') thk = 20;
    it.thk = thk;
    it.plate = (it.category === 'duct' || it.category === 'ductClean') ? plateOfT(thk || 0.75) : null;
  }

  // 风管定额档标签（含长边长/直径/周长口径），合并行与项目特征共用
  function ductTierLabel(it) {
    var tiers = ductTiersOf(it);
    var i = tierIndex(tiers, it.ductSize);
    return tiers[i < 0 ? 0 : i].label;
  }

  // 板厚/壁厚文本
  function ductThkText(it) {
    if (!it.thk) return '';
    if (it.category === 'duct' || it.category === 'ductClean') return 'δ' + Number(it.thk).toFixed(2) + 'mm';
    if (it.category === 'ductFrp') return 'δ4mm以内';
    if (it.category === 'ductComp') return '板厚' + it.thk + 'mm';
    if (it.category === 'ductSS') return it.thkName ? ('壁厚' + it.thk + 'mm') : ('壁厚未注（按' + it.thk + 'mm计）');
    if (it.category === 'ductPlastic') return '壁厚' + it.thk + 'mm';
    return '';
  }

  // 风管原始规格文本（用于合并说明）
  function ductDimText(it) {
    var d = it.dim || {};
    if (it.sub === 'round') {
      if (d.diameter) return 'φ' + d.diameter;
      return it.ductSize ? 'φ' + it.ductSize : '未注规格';
    }
    if (d.length && d.width) return d.length + '×' + d.width;
    return it.ductSize ? String(it.ductSize) : '未注规格';
  }

  // 同定额风管工程量合并：名称改为定额名称，工程量相加（其余类别不动）
  function mergeDucts(items) {
    var seen = {}, out = [], mergedAny = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      // 软管接口按材质（帆布/三防复合布/铝箔）分别计价，不合并
      if (!isDuctCat(it.category) || !it.quotaCode || (it.category === 'ductFlex' && it.sub === 'interface')) { out.push(it); continue; }
      var g = seen[it.quotaCode];
      if (!g) { seen[it.quotaCode] = it; it.mergedFrom = []; it.ductArea = ductAreaOf(it); out.push(it); continue; }
      g.quantity = +(g.quantity + it.quantity).toFixed(2);
      g.ductArea = +((g.ductArea || 0) + ductAreaOf(it)).toFixed(2);
      g.mergedFrom.push(it);
    }
    for (var k in seen) {
      var m = seen[k];
      if (!m.mergedFrom || !m.mergedFrom.length) { delete m.mergedFrom; continue; }
      var members = [m].concat(m.mergedFrom);
      var names = members.map(ductDimText);
      m.mergedCount = members.length;
      m.mergedNames = names;
      delete m.mergedFrom;
      m.name = m.quotaName;                                  // 项目名称改为定额名称
      m.mergedSpec = ductTierLabel(m) + (ductThkText(m) ? ' ' + ductThkText(m) : '');
      m.features = generateFeature('guanglianda', m);
      var u = m.unit === 'm' ? 'm' : 'm²';
      var note = '已合并' + m.mergedCount + '项相同定额（' + names.join('、') + '）工程量合计' + m.quantity + u;
      m.warn = note + (m.warn ? '；' + m.warn : '');
      mergedAny = true;
    }
    if (mergedAny) for (var n = 0; n < out.length; n++) out[n].index = String(n + 1);   // 合并后序号连续
    return out;
  }

  // 风管展开面积（m²）：柔性软风管按 π×D×L 折算，其余本身即为 m²
  function ductAreaOf(it) {
    if (it.ductArea !== undefined && it.ductArea !== null) return it.ductArea;   // 合并时已累加
    if (it.category === 'ductFlex') {
      // 软管接口工程量已是展开面积（m²），直接参与运输面积合计
      if (it.sub === 'interface') return it.quantity || 0;
      var d = (it.dim && it.dim.diameter) || it.ductSize || 0;
      return +((Math.PI * d / 1000) * (it.quantity || 0)).toFixed(2);
    }
    return it.quantity || 0;
  }

  // 全部风管匹配完成后追加"通风管道场外运输"（030702301 + 9-56），工程量=全部风管面积合计
  // 位置：紧跟最后一条风管清单之后（属风道相关清单项），不放到全表末尾
  function withTransport(items) {
    var area = 0, has = false, base = [], lastDuct = -1;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.category === 'transport') continue;
      base.push(it);
      if (isDuctCat(it.category)) { has = true; area += ductAreaOf(it); lastDuct = base.length - 1; }
    }
    if (!has) return items;
    area = +area.toFixed(2);
    var row = {
      index: '',
      name: '通风管道场外运输',
      unit: 'm²',
      quantity: area,
      brand: '',
      category: 'transport',
      categoryLabel: CAT_LABEL.transport,
      sub: '',
      dim: { length: 0, width: 0, height: 0, diameter: 0 },
      perimeter: 0,
      listCode: LIST.transport,
      listName: LIST_NAME.transport,
      quotaCode: '9-56',
      quotaName: '通风管道场外运输',
      quotaUnit: '10m²',      // 第九册 9-56 计量单位为 10m²
      quotaFactor: 10,
      price: null,
      priceSource: 'none',
      priceBasis: '场外运输子目不设主材，仅计人工、材料（绑扎、垫木）与机械',
      warn: '工程量按全部风管展开面积合计' + area + 'm² 计列，定额固定 9-56，不另计主材价'
    };
    row.features = '1.名称：通风管道场外运输\n2.工程量口径：全部风管展开面积合计\n3.其他：通风管道装车、场外运输、卸车（该子目不设主材）';
    if (lastDuct >= 0) base.splice(lastDuct + 1, 0, row); else base.push(row);
    // 清单序号重排为连续 1..n，保证插入后层级与序号不错位
    for (var k = 0; k < base.length; k++) base[k].index = String(k + 1);
    return base;
  }

  // 全部管道匹配完成后追加"管道支架"（031301005 + 7-138），主材型钢按信息价
  // 用户表内已提供支架行时不重复新增；工程量按管道长度×分档含量估算
  function bracketWeightPerM(dn) {
    var tbl = P.bracket.weightPerM;
    if (!(dn > 0)) return 0.60;
    for (var i = 0; i < tbl.length; i++) if (dn <= tbl[i].max) return tbl[i].w;
    return tbl[tbl.length - 1].w;
  }
  // 管道支架：按系统分别补项（系统来自清单里的分组标题行，如「给水管道」「中水管道」；
  // 无分组标题时全表算一个系统），每个系统在其最后一条管道清单之后插入一条支架，
  // 位置紧跟管道，不放到全表末尾
  function withBracket(items) {
    var exists = false;
    for (var i = 0; i < items.length; i++) if (items[i].category === 'bracket') exists = true;
    if (exists) return items;
    var order = [], map = {};
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var key = it.system || '';
      if (!map[key]) { map[key] = { key: key, lastPipe: -1, len: 0, wt: 0 }; order.push(map[key]); }
      if (PIPE && PIPE.LIST[it.category]) {
        map[key].lastPipe = j;
        map[key].len += (it.quantity || 0);
        map[key].wt += (it.quantity || 0) * bracketWeightPerM(it.dn);
      }
    }
    var groups = order.filter(function (g) { return g.lastPipe >= 0 && g.wt > 0; });
    if (!groups.length) return items;
    // 从后往前插，避免插入后前面分组的下标失效
    groups.sort(function (a, b) { return b.lastPipe - a.lastPipe; });
    var multi = groups.length > 1;
    groups.forEach(function (g) {
      var total = Math.round(g.wt * 10) / 10;
      if (!(total > 0)) return;
      var pipeLen = +g.len.toFixed(2);
      var nm = '管道支架';
      var row = {
        index: '',
        name: nm,
        unit: 'kg',
        quantity: total,
        brand: '型钢（信息价）',
        category: 'bracket',
        categoryLabel: CAT_LABEL.bracket,
        sub: '',
        dn: null,
        dim: { length: 0, width: 0, height: 0, diameter: 0 },
        perimeter: 0,
        listCode: LIST.bracket,
        listName: LIST_NAME.bracket,
        quotaCode: '7-138',
        quotaName: '管道支架制作、安装 管道支吊架',
        quotaUnit: '100kg',
        quotaFactor: 100,
        price: P.bracket.steel,
        priceSource: 'info',
        priceBasis: '信息价：型钢（角钢、槽钢）' + P.bracket.steel + '元/kg',
        priceBrand: '',
        system: g.key,
        autoAdded: true,
        warn: '管道支架为自动补项' + (g.key ? '（' + g.key + '）' : '') + '：工程量按管道总长' + pipeLen + 'm 与管径分档含量估算约' + total + 'kg（0.45~3.2kg/m），定额 7-138 计量单位为100kg，请按图纸支架实际重量调整'
      };
      row.features = '1.名称：管道支架（支/吊架、基础型钢）' + (g.key ? '（系统：' + g.key + '）' : '') + '\n2.材质：型钢（角钢、槽钢）制作\n3.工作内容：切断、调直、钻孔、焊接、除锈刷油、安装固定\n4.主材：型钢按信息价' + P.bracket.steel + '元/kg 计入\n5.工程量：按管道长度估算' + total + 'kg，请按图纸核实';
      items.splice(g.lastPipe + 1, 0, row);
    });
    return items;
  }

  // 风机类型
  function parseFanType(name) {
    if (/离心/.test(name)) return 'centrifugal';
    if (/轴流|斜流|混流/.test(name)) return 'axial';
    return null;
  }

  // 空调器形式（定额按安装方式 + 设备质量分档）
  function parseAcuForm(name) {
    if (/分段组装/.test(name)) return 'section';
    if (/组合式|空调机组|恒温恒湿|精密空调/.test(name)) return 'unit';
    if (/新风机组|新风处理|新风/.test(name) && !/室内机|室外机|多联|VRF/.test(name)) return 'pau';
    // 多联机 / 室内机 / 室外机：按安装方式走吊顶、落地、墙上分档
    if (/多联|VRF|室内机|室外机/.test(name)) {
      if (/墙上|壁挂|壁装/.test(name)) return 'wall';
      if (/落地|柜式/.test(name)) return 'floor';
      if (/吊顶|嵌入式|卡式|天井/.test(name)) return 'ceiling';
      return /室外机/.test(name) ? 'floor' : 'ceiling';
    }
    if (/吊顶/.test(name)) return 'ceiling';
    if (/落地|柜式/.test(name)) return 'floor';
    if (/墙上|壁挂|壁装/.test(name)) return 'wall';
    if (/分体/.test(name)) return 'split';
    if (/空气幕/.test(name)) return 'split';
    return null;
  }

  // 空调器本体质量（t）：名称优先（0.3t / 300kg），否则按风量估算
  function parseAcuMass(name) {
    var s2 = String(name || '');
    var m = s2.match(/(\d+(?:\.\d+)?)\s*(?:t|T|吨)(?![a-zA-Z])/);
    if (m) return parseFloat(m[1]);
    m = s2.match(/(\d+(?:\.\d+)?)\s*(?:kg|KG|Kg|公斤)(?![a-zA-Z])/);
    if (m) return +(parseFloat(m[1]) / 1000).toFixed(3);
    return null;
  }

  // 柔性软风管细分：软管接口（帆布/三防复合布/钢丝撑筋铝箔，按展开面积 m²）与成品柔性软风管（按长度 m）
  function flexKindOf(name) {
    var s2 = String(name || '');
    if (/帆布|三防复合布|三防布|钢丝撑筋|软接头|软连接|软管接口|柔性接口/.test(s2)) return 'interface';
    return 'round';
  }

  // 风机盘管安装方式
  function parseFcuMount(name) {
    if (/卡式|嵌入式|四面出风/.test(name)) return 'cassette';
    if (/壁挂|挂式|壁装/.test(name)) return 'wall';
    if (/落地|立式/.test(name)) return 'floor';
    if (/吊顶|卧式暗装|明装/.test(name)) return 'ceiling';
    return 'ceiling';
  }

  // 风口类型
  function parseVentType(name) {
    if (/板式排烟口|板式排烟阀/.test(name)) return 'plateOutlet';
    if (/多叶送|多叶排烟|多叶送风|多叶排风/.test(name)) return 'multileafOutlet';
    if (/防火风口/.test(name)) return 'fireVent';
    if (/带调节阀|调节阀百叶/.test(name)) return 'louverAdj';
    if (/圆形.*阀|圆形风口.*阀/.test(name)) return 'roundAdj';
    if (/方形散流器|散流器/.test(name) && !/圆形/.test(name)) return 'diffuserSq';
    // 圆形风口 / 圆形散流器 / 球形喷口 / 旋流风口：套圆形、流线形散流器（9-105~9-107，按风口直径分档）
    if (/圆形散流器|圆形风口|球形喷口|喷口|旋流|圆形|圆型/.test(name)) return 'diffuserRd';
    if (/门铰/.test(name)) return 'hinge';
    if (/自垂/.test(name)) return 'autodrop';
    if (/防雨/.test(name)) return 'rain';
    if (/双层/.test(name)) return 'louver2';
    if (/单层/.test(name)) return 'louver1';
    if (/电动/.test(name)) return 'ventE';
    if (/圆形风口|圆形/.test(name)) return 'roundAdj';
    if (/百叶/.test(name)) return 'louver1';
    return 'louver1';
  }

  // 风阀类型
  function parseValveType(name) {
    var elec = /电动/.test(name);
    if (/超压排气/.test(name)) return 'overpressure';
    if (/定风量/.test(name)) return 'cav';
    if (/三通/.test(name)) return 'tee';
    if (/密闭式斜插板|斜插板/.test(name)) return 'sluice';
    if (/密闭/.test(name)) return 'sealed';
    if (/280/.test(name)) return elec ? 'fire280e' : 'fire280';
    if (/防火阀|排烟阀|防火调节阀/.test(name)) return elec ? 'fire70e' : 'fire70';
    if (/止回/.test(name)) return 'check';
    if (/对开多叶|多叶调节|调节阀/.test(name)) return elec ? 'multileafE' : 'multileaf';
    if (/蝶阀/.test(name)) return elec ? 'butterflyE' : 'butterfly';
    return elec ? 'butterflyE' : 'butterfly';
  }

  // 消声器类型
  function parseSilencerType(name) {
    if (/阻抗/.test(name)) return 'impedance';
    if (/管式/.test(name)) return 'pipe';
    if (/微穿孔|穿孔板/.test(name)) return 'micro';
    return 'micro';
  }

  // ============================================================
  // 分类
  // ============================================================
  // ===== 水系统阀门识别（风阀走 030703001，水阀走 031002001 及四类特殊清单）=====
  function parseValveDn(name) {
    var s2 = String(name || '');
    var m = s2.match(/(?:DN|dn|De|de|D|Φ|φ|Ø)\s*[-－]?\s*(\d{2,4})/);
    if (m) return parseInt(m[1], 10);
    m = s2.match(/(\d{2,4})\s*(?:mm|MM|毫米)/);
    if (m) return parseInt(m[1], 10);
    return null;
  }
  // 严格管径：仅认 DN/De（用于区分"蝶阀 φ300"这类风阀口径）
  function parseValveDnStrict(name) {
    var m = String(name || '').match(/(?:DN|dn|De|de)\s*[-－]?\s*(\d{2,4})/);
    return m ? parseInt(m[1], 10) : null;
  }
  // 阀种（决定取信息价还是市场价）
  function parseWaterValveKind(name) {
    var s2 = String(name || '');
    if (/闸阀/.test(s2)) return 'gate';
    if (/截止阀/.test(s2)) return 'globe';
    if (/蝶阀/.test(s2)) return 'butterfly';
    if (/止回阀|逆止阀/.test(s2)) return 'check';
    if (/Y型过滤器|y型过滤器|过滤器/.test(s2)) return 'strainer';
    if (/球阀/.test(s2)) return 'ball';
    return 'market';
  }
  function isWaterValveName(n) {
    if (/防火|排烟|风管|风道|多叶|密闭|定风量|超压|初效|中效|高效|空气过滤|过滤吸收|帆布|三防复合布|三防布|钢丝撑筋|软风管/.test(n)) return false;
    if (/自动排气阀|放风阀/.test(n)) return true;
    if (/温控阀|浮球阀|水位控制阀/.test(n)) return true;
    if (/截止阀|闸阀|球阀|Y型过滤器|y型过滤器|过滤器|软接头|橡胶软接头|补偿器|波纹补偿器|平衡阀|减压阀|电磁阀|水阀/.test(n)) return true;
    // 蝶阀/止回阀/阀门/阀：仅当显式写 DN/De（不是风阀口径 φ/截面尺寸）时按水阀处理
    if (/蝶阀|止回阀|阀门|阀/.test(n)) {
      var dn = parseValveDnStrict(n);
      if (dn && !/\d{2,4}\s*[×xX*]\s*\d{2,4}/.test(n)) return true;
    }
    return false;
  }

  function classify(name) {
    if (!name) return null;
    var n = String(name);

    // 静压箱、消声器优先
    if (/静压箱/.test(n)) return 'plenum';
    if (/消声器|消声弯头|消声静压/.test(n)) return 'silencer';
    // 弯头导流叶片（030702009 + 9-35）：须先于风管判断
    if (/导流叶片|导流片/.test(n) || (/导流/.test(n) && /弯头/.test(n))) return 'guideVane';
    // 人防密闭阀
    if (/人防/.test(n) && /密闭|阀门|阀/.test(n)) return 'renfang';
    // 绝热（031208002）：橡塑 / 离心玻璃棉，须先于风管与管道判断
    if (/橡塑/.test(n) && /保温|绝热|管|板|壳/.test(n)) return 'insulRubber';
    if (/(离心)?玻璃棉/.test(n)) return 'insulGlass';
    // 特殊阀门：口部冲洗阀（031002304）、电磁阀（031002305）须先于通用水阀判断
    if (/口部冲洗/.test(n)) return 'flushValve';
    if (/电磁阀/.test(n)) return 'solenoidValve';
    // 水系统阀门：自动排气阀 / 温控阀 / 浮球阀 / 水位控制阀 / 通用金属阀门
    if (isWaterValveName(n)) {
      if (/自动排气阀|放风阀/.test(n)) return 'autoAir';
      if (/温控阀/.test(n)) return 'tempValve';
      if (/浮球阀/.test(n)) return 'floatValve';
      if (/水位控制阀/.test(n)) return 'levelValve';
      return 'waterValve';
    }
    // 风口类（防火风口、多叶送/排烟口、板式排烟口、散流器、百叶、风口）
    if (/防火风口/.test(n)) return 'vent';
    if (/多叶送|多叶排烟|多叶送风|多叶排风/.test(n)) return 'vent';
    if (/板式排烟口/.test(n)) return 'vent';
    if (/散流器|旋流|喷口/.test(n)) return 'vent';
    if (/风口/.test(n)) return 'vent';
    if (/百叶/.test(n) && !/阀/.test(n)) return 'vent';
    // 风阀类
    if (/阀/.test(n)) return 'valve';
    // 风管类（风管机属空调器，需先排除）
    if (/风管机/.test(n)) return 'acu';
    if (/场外运输|场外运/.test(n)) return 'transport';
    // 各材质风管按"先特殊后通用"识别，避免都被碳钢风管吃掉
    if (/软风管|软管|软连接|软接头|帆布|三防复合布|三防布|钢丝撑筋/.test(n)) return 'ductFlex';
    if (/不锈钢/.test(n) && /风道|风管|管道/.test(n)) return 'ductSS';
    if (/玻璃钢/.test(n) && /风道|风管|管道/.test(n)) return 'ductFrp';
    if (/(复合|酚醛|玻镁|无机)/.test(n) && /风道|风管|管道/.test(n)) return 'ductComp';
    if (/(塑料|PPR|PVC|UPVC)/i.test(n) && /风道|风管|管道/.test(n)) return 'ductPlastic';
    if (/(净化|进口)/.test(n) && /风道|风管|管道/.test(n)) return 'ductClean';
    if (/风管|风道|通风管道|送风管道|排风管道|排烟管道|送回风管/.test(n)) return 'duct';
    // 名称只写材质（镀锌钢板/镀锌薄钢板）时，按常规碳钢通风管道处理；排除板材/型钢/法兰等非风管行
    if (/镀锌(?:薄)?钢板/.test(n) && !/支架|法兰|角钢|型钢|板材|卷|板厚|δ/.test(n)) return 'duct';

    // 制冷设备（第一册）
    if (/冷却塔/.test(n)) return 'coolingTower';
    if (/冷水机组|冷水机(?!组)/.test(n)) return 'chiller';
    if (/热泵|冷热水机组/.test(n)) return 'heatpump';
    // 管道类（与给排水站同一口径），放在风管之后、设备之前
    if (PIPE) { var pc = PIPE.classify(n); if (pc) return pc; }

    // 设备类
    if (/风机盘管|风盘|FCU/i.test(n)) return 'fcu';
    if (/油烟净化|油烟|油网/.test(n)) return 'fume';
    if (/变风量|VAV/i.test(n)) return 'vav';
    if (/除湿/.test(n)) return 'dehum';
    if (/过滤吸收器|过滤吸收/.test(n)) return 'filter';
    if (/空气加热|空气冷却|加热器|冷却器/.test(n)) return 'heater';
    if (/除尘|除污/.test(n)) return 'dedust';
    if (/组合式空调|空调机组|新风|空调器|空气幕|分体|多联|室外机|室内机|恒温恒湿|精密空调/.test(n)) return 'acu';
    if (/通风机|风机|排气扇|换气扇|卫生间通风|排风扇|送风机|排风机|排烟风机|加压风机|补风机/.test(n)) return 'fan';
    return null;
  }

  // ============================================================
  // 生成条目
  // ============================================================
  function buildItem(name) {
    var category = classify(name);
    if (!category) category = 'other';

    var it = {
      category: category,
      categoryLabel: CAT_LABEL[category],
      name: name,
      listCode: LIST[category],
      unit: '台',
      sub: '',
      airVolume: parseAirVolume(name),
      dim: parseDim(name),
      brand: ''
    };

    if (isDuctCat(category)) {
      var flexK = category === 'ductFlex' ? flexKindOf(name) : '';
      it.unit = category === 'ductFlex' ? (flexK === 'interface' ? 'm²' : 'm') : 'm²';
      it.brand = (P[category] && P[category].brand) || P.duct.brand;
      it.sub = category === 'ductFlex' ? flexK : ductShapeOf(name);
      it.thkName = parseThk(name);         // 名称里显式写的壁厚/板厚
      it.ductAuto = !parseDim(name).length && !parseDim(name).diameter;
      syncDuct(it);
    }
    if (category === 'chiller') {
      var ct = parseChillerType(name);
      it.sub = ct || 'piston';
      it.chillerAuto = !ct;
      it.coolKw = parseCoolingKw(name);
      it.brand = P.chiller.brands.map(function (b) { return b.name.replace(/（.*?）/g, ''); }).join('/');
    }
    if (category === 'heatpump') {
      it.sub = 'hp';
      it.coolKw = parseCoolingKw(name);
      it.brand = P.heatpump.brands.map(function (b) { return b.name.replace(/（.*?）/g, ''); }).join('/');
    }
    if (category === 'coolingTower') {
      it.sub = 'tower';
      it.waterFlow = parseWaterFlow(name);
      it.brand = P.coolingTower.brands.map(function (b) { return b.name.replace(/（.*?）/g, ''); }).join('/');
    }
    // 水系统阀门（031002001 及四类特殊清单）
    if (category === 'waterValve' || category === 'autoAir' || category === 'tempValve' ||
        category === 'floatValve' || category === 'levelValve') {
      it.unit = '个';
      it.dn = parseValveDn(name);
      it.valveKind = parseWaterValveKind(name);
      var vcfg = P.waterValve;
      if (category === 'waterValve') {
        // 有信息价的阀种不标品牌（页面只显示"信息价"），无信息价的给市场价品牌
        it.brand = vcfg.info[it.valveKind] ? '' : vcfg.brand;
      }
      else {
        var spKey = { autoAir: 'autoAir', tempValve: 'temp', floatValve: 'float', levelValve: 'level' }[category];
        var spc = vcfg.special[spKey];
        it.brand = (spc.source === 'info') ? '' : (spc.brand || vcfg.brand);
        it.sub = spKey;
      }
    }
    // 口部冲洗阀（031002304 + 8-1260），定额单位 套
    if (category === 'flushValve') {
      it.unit = '套';
      it.brand = P.waterValve.special.flush.brand;
      it.sub = 'flush';
    }
    // 电磁阀（031002305）：DN15~50 螺纹 8-603~8-608，>50 法兰 8-630~8-644
    if (category === 'solenoidValve') {
      it.unit = '个';
      it.dn = parseValveDn(name);
      it.brand = P.waterValve.solenoid.brand;
      it.sub = 'solenoid';
    }
    // 管道支架（031301005 + 7-138），主材型钢按信息价
    if (category === 'bracket') {
      it.unit = 'kg';
      it.brand = '型钢（信息价）';
    }
    // 绝热（031208002）
    if (category === 'insulRubber' || category === 'insulGlass') {
      it.unit = 'm³';
      it.dn = PIPE ? PIPE.parseDN(name) : null;
      var icfg = category === 'insulRubber' ? P.insul.rubber : P.insul.glass;
      it.brand = icfg.brand;
      it.insulThk = category === 'insulRubber' ? 30 : 40;
    }
    // 管道：整段交给管道模块解析（材质/管径/介质/部位/连接方式）
    if (PIPE && PIPE.LIST[category]) {
      var pi = PIPE.buildItem(name);
      ['material', 'dn', 'medium', 'loc', 'isRain', 'mediumAmbiguous', 'locAmbiguous', 'joint', 'jointAuto',
        'jointFromName', 'jointFallback', 'plasticKind', 'compositeKind', 'listCode', 'listName'].forEach(function (k) {
          if (pi[k] !== undefined) it[k] = pi[k];
        });
      it.unit = 'm';
      it.brand = PIPE.brandOf(it) || '';
    }
    if (category === 'fan') {
      var ft = parseFanType(name);
      it.sub = ft || 'axial';
      it.fanAuto = !ft;                    // 名称未注明风机类型 → 默认轴流，提示手动确认
      it.isToiletFan = /卫生间|排气扇|换气扇/.test(name);
      it.brand = P.fan.brand;
    }
    if (category === 'acu') {
      var af = parseAcuForm(name);
      it.sub = af || 'ceiling';
      it.acuAuto = !af;
      it.acuMass = parseAcuMass(name);                        // 名称显式质量（t）
      it.isVrf = /多联|VRF|室内机|室外机/.test(name);          // 多联机室内/室外机：定额按安装方式分档，价格按 HP/kW
      it.brand = (it.sub === 'pau') ? P.pau.brand : (it.sub === 'unit' ? P.ahu.brand : '国产中高档');
    }
    if (category === 'fcu') {
      it.sub = parseFcuMount(name);
      it.fcuModel = (name.match(/FP[\s-]*\d{2,3}/i) || [''])[0].replace(/\s+/g, '').toUpperCase();
      it.brand = P.fcu.brand;
    }
    if (category === 'fume') it.brand = P.fume.brand;
    if (category === 'vent') {
      it.sub = parseVentType(name);
      it.brand = P.vent.brand;
      // 圆形风口 / 球形喷口写成「球形喷口-300」时，-300 即风口直径 300mm
      var dv = it.dim;
      if (!dv.diameter && !dv.length && !dv.width) {
        var mfd = name.match(/[-－—–_]\s*(\d{2,4})\s*(?:mm)?\s*$/i);
        if (mfd) {
          var fdv = parseInt(mfd[1], 10);
          if (fdv >= 100) { dv.diameter = fdv; it.roundVent = true; }
        }
      }
    }
    if (category === 'valve') {
      it.sub = parseValveType(name); it.brand = P.valve.brand;
      // 圆形风道阀门：名称写成「对开多叶调节阀-300」即表示圆形风道、直径300mm，
      // 按周长 πD 分档套定额（如 D300→周长942mm→9-76 周长2800mm以内）。
      // 防火阀/排烟阀的 -70/-280 是熔断温度，不按直径处理。
      var d0 = it.dim;
      if (!d0.diameter && !d0.length && !d0.width) {
        var mvd = name.match(/[-－—–_]\s*(\d{2,4})\s*(?:mm)?\s*$/i);
        if (mvd) {
          var dv = parseFloat(mvd[1]);
          var isTemp = /防火|排烟/.test(name) && (dv === 70 || dv === 280);
          var isVolt = /电动|电磁/.test(name) && [12, 24, 220, 380].indexOf(dv) >= 0;
          if (dv >= 100 && !isTemp && !isVolt) { d0.diameter = dv; it.roundValve = true; }
        }
      }
    }
    if (category === 'silencer') { it.sub = parseSilencerType(name); it.brand = P.silencer.brand; }
    if (category === 'plenum') {
      it.sub = /消声/.test(name) ? 'silencer' : 'plain';       // 消声静压箱 9-213~215 / 普通静压箱 9-284
      it.brand = P.plenum.brand;
    }
    if (category === 'guideVane') { it.sub = 'vane'; it.brand = P.guideVane.brand; }
    if (category === 'renfang') { it.sub = /电动/.test(name) ? 'manualE' : 'manual'; it.brand = P.renfang.brand; }

    // 风管不按周长计价，周长字段置0（避免合并行输出误导性的"规格补充"）
    // 风管不按周长计价；软管接口（帆布/三防复合布）需周长折算展开面积，保留
    it.perimeter = (isDuctCat(category) && !(category === 'ductFlex' && it.sub === 'interface')) ? 0 : calcPerimeter(it.dim);
    it.area = calcArea(it.dim);
    it.surface = calcSurface(it.dim);
    it.sectionArea = calcSection(it.dim);
    // 静压箱截面积：按名称前两维相乘（1200*1100*400 → 1.2×1.1=1.32m²）
    it.plenumArea = (category === 'plenum') ? (it.area || 0) : 0;
    return it;
  }

  // ============================================================
  // 定额匹配
  // ============================================================
  function tierIndex(tiers, v) {
    if (v === null || v === undefined || isNaN(v) || v <= 0) return -1;
    for (var i = 0; i < tiers.length; i++) if (v <= tiers[i].max) return i;
    return tiers.length - 1;
  }
  function overOf(tiers, v) {
    if (v === null || v === undefined || isNaN(v) || v <= 0) return false;
    var last = tiers[tiers.length - 1];
    return last.max !== Infinity && v > last.max;
  }
  function pick(tiers, v, prefix) {
    var i = tierIndex(tiers, v);
    if (i < 0) return null;
    return { code: tiers[i].code, name: prefix + tiers[i].label, inferred: tiers.length > 2, overRange: overOf(tiers, v) };
  }

  function matchQuota(it) {
    var s = it.sub;

    // 冷水机组：活塞/离心/螺杆三类，按制冷量分档；无制冷量取本类最小档
    if (it.category === 'chiller') {
      var ctiers = CHILLER_TIERS[it.sub] || CHILLER_TIERS.piston;
      var ckw = it.coolKw;
      var ci = tierIndex(ctiers, ckw);
      var noKw = !(ckw > 0);
      if (ci < 0) ci = 0;
      return {
        code: ctiers[ci].code, name: (CHILLER_TITLE[it.sub] || CHILLER_TITLE.piston) + ctiers[ci].label,
        inferred: false, overRange: noKw ? false : overOf(ctiers, ckw), keepList: true, noKw: noKw
      };
    }
    // 热泵冷（热）水机组
    if (it.category === 'heatpump') {
      var hkw = it.coolKw;
      var hi = tierIndex(HEATPUMP_TIERS, hkw);
      var noHkw = !(hkw > 0);
      if (hi < 0) hi = 0;
      return {
        code: HEATPUMP_TIERS[hi].code, name: '热泵冷（热）水机组 制冷量' + HEATPUMP_TIERS[hi].label,
        inferred: false, overRange: noHkw ? false : overOf(HEATPUMP_TIERS, hkw), keepList: true, noKw: noHkw
      };
    }
    // 玻璃钢冷却塔：按处理水量分档
    if (it.category === 'coolingTower') {
      var tf = it.waterFlow;
      var ti2 = tierIndex(TOWER_TIERS, tf);
      var noFlow = !(tf > 0);
      if (ti2 < 0) ti2 = 0;
      return {
        code: TOWER_TIERS[ti2].code, name: '玻璃钢冷却塔 设备处理水量' + TOWER_TIERS[ti2].label,
        inferred: false, overRange: noFlow ? false : overOf(TOWER_TIERS, tf), keepList: true, noFlow: noFlow
      };
    }
    // 水系统阀门：DN15~50 螺纹阀门 8-579~584；DN65~400 焊接法兰阀 8-620~629；>400 取 8-629
    if (it.category === 'waterValve') {
      var wdn = it.dn;
      if (!(wdn > 0)) return { code: '8-579', name: '螺纹阀门 公称直径15mm以内', inferred: false, keepList: true, noDn: true };
      if (wdn <= 50) {
        var wti = tierIndex(WVALVE_THREAD, wdn);
        return { code: WVALVE_THREAD[wti].code, name: '螺纹阀门 公称直径' + WVALVE_THREAD[wti].label, inferred: false, keepList: true };
      }
      var wfi = tierIndex(WVALVE_FLANGE, wdn);
      return {
        code: WVALVE_FLANGE[wfi].code, name: '焊接法兰阀门 公称直径' + WVALVE_FLANGE[wfi].label,
        inferred: false, overRange: overOf(WVALVE_FLANGE, wdn), keepList: true
      };
    }
    if (it.category === 'autoAir') return { code: '8-682', name: '自动排气阀、手动放风阀 公称直径25mm以内', inferred: false, keepList: true };
    if (it.category === 'tempValve') return { code: '8-686', name: '散热器温控阀 公称直径25mm以内', inferred: false, keepList: true };
    if (it.category === 'floatValve') {
      var fdn = it.dn, noF = !(fdn > 0);
      var fi = tierIndex(FLOAT_TIERS, fdn); if (fi < 0) fi = 0;
      return { code: FLOAT_TIERS[fi].code, name: '法兰浮球阀 公称直径' + FLOAT_TIERS[fi].label, inferred: false, keepList: true, noDn: noF, overRange: noF ? false : overOf(FLOAT_TIERS, fdn) };
    }
    if (it.category === 'levelValve') {
      var ldn = it.dn, noL = !(ldn > 0);
      var li = tierIndex(LEVEL_TIERS, ldn); if (li < 0) li = 0;
      return { code: LEVEL_TIERS[li].code, name: '法兰液压水位控制阀 公称直径' + LEVEL_TIERS[li].label, inferred: false, keepList: true, noDn: noL, overRange: noL ? false : overOf(LEVEL_TIERS, ldn) };
    }
    // 口部冲洗阀（人防 8-1260，定额单位 套，含制作安装）
    if (it.category === 'flushValve') {
      return { code: '8-1260', name: '口部冲洗阀制作、安装 壁龛式', inferred: false, keepList: true, unit: '套', factor: 1 };
    }
    // 电磁阀：DN15~50 螺纹 8-603~8-608；DN>50 法兰 8-630~8-644（>500 取 8-644）
    if (it.category === 'solenoidValve') {
      var sdn = it.dn;
      if (!(sdn > 0)) return { code: '8-603', name: '螺纹电磁阀安装 公称直径15mm以内', inferred: false, keepList: true, noDn: true };
      if (sdn <= 50) {
        var sti = tierIndex(SOL_THREAD, sdn);
        return { code: SOL_THREAD[sti].code, name: '螺纹电磁阀安装 公称直径' + SOL_THREAD[sti].label, inferred: false, keepList: true };
      }
      var sfi = tierIndex(SOL_FLANGE, sdn);
      return {
        code: SOL_FLANGE[sfi].code, name: '法兰电磁阀安装 公称直径' + SOL_FLANGE[sfi].label,
        inferred: false, overRange: overOf(SOL_FLANGE, sdn), keepList: true
      };
    }
    // 管道支架（第七册 7-138，定额单位 100kg）
    if (it.category === 'bracket') {
      return { code: '7-138', name: '管道支架制作、安装 管道支吊架', inferred: false, keepList: true, unit: '100kg', factor: 100 };
    }
    // 绝热（第十一册）
    if (it.category === 'insulRubber') {
      return { code: '11-582', name: '管道橡塑保温壳安装（管道） 管径D133mm以内', inferred: false, keepList: true, unit: 'm³', factor: 1 };
    }
    if (it.category === 'insulGlass') {
      return { code: '11-647', name: '带铝箔离心玻璃棉安装 通风管道 厚度40mm', inferred: false, keepList: true, unit: 'm³', factor: 1 };
    }
    // 弯头导流叶片（第九册 9-35，清单单位 m²）
    if (it.category === 'guideVane') {
      return { code: '9-35', name: '弯头导流叶片制作、安装', inferred: false, keepList: true, unit: 'm²' };
    }
    // 管道：交给管道模块（第八册）
    if (PIPE && PIPE.LIST[it.category]) return PIPE.matchQuota(it);

    if (it.category === 'fan') {
      if (it.isToiletFan) {
        return { code: '9-247', name: '卫生间通风器安装', inferred: false };
      }
      var ftiers = FAN_TIERS[s === 'centrifugal' ? 'centrifugal' : 'axial'];
      var pre = (s === 'centrifugal') ? '离心式通风机安装 风量' : '轴流式、斜流式、混流式通风机安装 风量';
      var q = pick(ftiers, it.airVolume, pre);
      if (!q) return { code: '', name: '', noTier: true };
      return q;
    }

    if (it.category === 'acu') {
      if (s === 'unit' || s === 'pau') {
        var q1 = pick(ACU_UNIT_TIERS, it.airVolume, s === 'pau' ? '新风机组安装（套组合式空调机组） 风量' : '组合式空调机组安装 风量');
        if (!q1) return { code: '', name: '', noTier: true };
        return q1;
      }
      // 分段组装式空调器：定额单位 100kg
      if (s === 'section') {
        return { code: '9-270', name: '分段组装式空调器安装（按100kg计）', inferred: false, keepList: true, unit: '100kg', factor: 100 };
      }
      // 吊顶式 / 落地式 / 墙上式：按设备质量分档（名称质量优先，否则按风量估算，再否则取最小档）
      if (s === 'ceiling' || s === 'floor' || s === 'wall' || s === 'vrf') {
        var form = (s === 'vrf') ? 'floor' : s;
        var mtiers = ACU_MASS_TIERS[form];
        var mass = it.acuMass, massAuto = false;
        if (!(mass > 0) && it.airVolume > 0) {
          mass = +(it.airVolume * ACU_MASS_PER_KVOL[form] / 1000).toFixed(3);
          massAuto = true;
        }
        var noMass = !(mass > 0);
        var mi = tierIndex(mtiers, mass);
        if (mi < 0) mi = 0;
        it.acuMassUsed = noMass ? 0 : mass;
        return {
          code: mtiers[mi].code, name: ACU_FORM_TITLE[form] + mtiers[mi].label,
          inferred: false, massTier: noMass, massAuto: massAuto,
          overRange: noMass ? false : overOf(mtiers, mass)
        };
      }
      if (s === 'split') return { code: '9-251', name: '落地式空调器安装 质量0.6t以内（分体空调按落地式套用）', inferred: true, massTier: true };
    }

    if (it.category === 'fcu') {
      var map = { ceiling: ['9-266', '风机盘管安装 吊顶式'], floor: ['9-265', '风机盘管安装 落地式'], wall: ['9-267', '风机盘管安装 壁挂式'], cassette: ['9-268', '风机盘管安装 卡式'] };
      var m = map[s] || map.ceiling;
      return { code: m[0], name: m[1], inferred: false };
    }

    if (it.category === 'fume') {
      var q2 = pick(FUME_TIERS, it.airVolume, '油烟净化器安装 风量');
      if (!q2) return { code: '', name: '', noTier: true };
      return q2;
    }

    if (it.category === 'vav') return { code: '9-269', name: '变风量末端装置安装', inferred: false };
    if (it.category === 'heater') return { code: '9-230', name: '空气加热器（冷却器）安装', inferred: false };
    if (it.category === 'dedust') return { code: '9-275', name: '除尘设备安装 质量100kg以内', inferred: true };
    if (it.category === 'dehum') return { code: '', name: '', noQuota: true };
    if (it.category === 'filter') return { code: '', name: '', noQuota: true };

    if (it.category === 'renfang') {
      var q3 = pick(RF_TIERS, it.dim.diameter, '人防手动密闭阀安装 直径');
      if (!q3) return { code: '', name: '', noTier: true };
      return q3;
    }

    if (it.category === 'silencer') {
      var stiers = s === 'impedance' ? S_IMPED : (s === 'pipe' ? S_PIPE : S_MICRO);
      var spre = s === 'impedance' ? '阻抗式消声器安装' : (s === 'pipe' ? '管式消声器安装' : '微穿孔板消声器安装');
      var q4 = pick(stiers, it.perimeter, spre + ' 周长');
      if (!q4) return { code: '', name: '', noTier: true };
      return q4;
    }

    if (it.category === 'plenum') {
      // 普通静压箱：单一子目 9-284
      if (s !== 'silencer') return { code: PLENUM_PLAIN.code, name: PLENUM_PLAIN.name, inferred: false, keepList: true };
      // 消声静压箱：按截面积（名称前两维相乘）分档；未识别尺寸时按最小档计列并提示
      if (!(it.plenumArea > 0)) {
        return { code: PLENUM_TIERS[0].code, name: '消声静压箱安装 ' + PLENUM_TIERS[0].label, inferred: false, plenumNoSize: true };
      }
      var q5 = pick(PLENUM_TIERS, it.plenumArea, '消声静压箱安装 截面积');
      if (!q5) return { code: '', name: '', noTier: true };
      return q5;
    }

    if (it.category === 'valve') {
      var p = it.perimeter;
      if (s === 'overpressure') return { code: '9-420', name: '超压排气阀门安装', inferred: false };
      if (s === 'fire70' || s === 'fire70e' || s === 'fire280' || s === 'fire280e') {
        var q6 = pick(V_FIRE, p, '防火阀安装 周长');
        if (!q6) return { code: '', name: '', noTier: true };
        q6.name = (s === 'fire280' || s === 'fire280e' ? '排烟防火阀安装 周长' : '防火阀安装 周长') + V_FIRE[tierIndex(V_FIRE, p)].label + (s === 'fire70e' || s === 'fire280e' ? '（电动）' : '');
        return q6;
      }
      if (s === 'butterfly' || s === 'butterflyE') {
        var q7 = pick(V_BUTTERFLY, p, '蝶阀安装 周长');
        if (!q7) return { code: '', name: '', noTier: true };
        return q7;
      }
      if (s === 'check') {
        var q8 = pick(V_CHECK, p, '止回阀安装 周长');
        if (!q8) return { code: '', name: '', noTier: true };
        return q8;
      }
      if (s === 'sluice') {
        var q9 = pick(V_SLUICE, p, '密闭式斜插板阀安装 周长');
        if (!q9) return { code: '', name: '', noTier: true };
        return q9;
      }
      // 对开多叶调节阀 / 电动 / 三通 / 密闭 / 定风量
      var q10 = pick(V_MULTI, p, '对开多叶调节阀安装 周长');
      if (!q10) return { code: '', name: '', noTier: true };
      var label = s === 'multileafE' ? '对开多叶调节阀安装（电动）周长' : (s === 'tee' ? '三通多叶调节阀安装 周长' : (s === 'sealed' ? '密闭阀门安装 周长' : (s === 'cav' ? '定风量阀安装 周长' : '对开多叶调节阀安装 周长')));
      q10.name = label + V_MULTI[tierIndex(V_MULTI, p)].label;
      return q10;
    }

    if (it.category === 'vent') {
      var pv = it.perimeter;
      if (s === 'plateOutlet') {
        var a1 = pick(O_PLATE, pv, '板式排烟口安装 周长');
        if (!a1) return { code: '', name: '', noTier: true };
        return a1;
      }
      if (s === 'multileafOutlet') {
        var a2 = pick(O_MULTI, pv, '多叶送风口、排烟口安装 周长');
        if (!a2) return { code: '', name: '', noTier: true };
        return a2;
      }
      if (s === 'diffuserSq') {
        var a3 = pick(O_DIFF_SQ, pv, '方形散流器安装 周长');
        if (!a3) return { code: '', name: '', noTier: true };
        return a3;
      }
      if (s === 'diffuserRd') {
        var a4 = pick(O_DIFF_RD, pv, '圆形散流器安装 ');
        if (!a4) return { code: '', name: '', noTier: true };
        return a4;
      }
      if (s === 'louverAdj') {
        var a5 = pick(O_LOUVER_ADJ, pv, '带调节阀百叶风口安装 周长');
        if (!a5) return { code: '', name: '', noTier: true };
        return a5;
      }
      if (s === 'roundAdj') {
        var a6 = pick(O_ROUND_ADJ, pv, '圆形风口（带调节阀）安装 周长');
        if (!a6) return { code: '', name: '', noTier: true };
        return a6;
      }
      var a7 = pick(O_LOUVER, pv, '百叶风口安装 周长');
      if (!a7) return { code: '', name: '', noTier: true };
      return a7;
    }

    if (isDuctCat(it.category)) return matchDuctQuota(it);

    return { code: '', name: '' };
  }

  // 各材质风管定额匹配（清单已由用户口径锁定，故统一 keepList）
  function matchDuctQuota(it) {
    syncDuct(it);
    var tiers = ductTiersOf(it);
    var cat = it.category;

    // 帆布 / 三防复合布 / 带钢丝撑筋铝箔软风管：按软管接口（9-36）以展开面积 m² 计
    if (cat === 'ductFlex' && it.sub === 'interface') {
      return { code: '9-36', name: '软管接口制作、安装', inferred: false, keepList: true, unit: 'm²' };
    }

    var i = it.ductTierIdx;
    var noSize = !(it.ductSize > 0);
    if (i < 0) i = 0;                                   // 无尺寸/超档兜底：取该类最小档
    var res = {
      code: tiers[i].code,
      name: DUCT_TITLE[cat][it.sub] + tiers[i].label,
      inferred: false,
      overRange: noSize ? false : overOf(tiers, it.ductSize),
      keepList: true,
      noSize: noSize
    };
    if (cat === 'ductSS' && !it.thkName) res.noThk = true;
    // 风管制作安装定额计量单位为 10m²（第九册），导出时工程量须按面积÷10 换算；
    // 柔性软风管 9-39~9-43 按 m 计，软管接口 9-36 按 m² 计，均不换算
    if (cat !== 'ductFlex') { res.unit = '10m²'; res.factor = 10; }
    return res;
  }

  // ============================================================
  // 主材价
  // ============================================================
  function coefByVolume(table, v) {
    for (var i = 0; i < table.length; i++) if (v <= table[i].max) return table[i];
    return table[table.length - 1];
  }

  // 品牌短名：去掉括号内的规格说明，便于表格窄列显示（完整信息放 title）
  function brandShort(v) {
    return String(v || '').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim();
  }

  // 制冷设备/冷却塔：国产中高档品牌询价，单价 = 档位基准价 × 品牌系数，basis 列 3 个品牌参考价
  // 就近档位：返回 dns 中第一个 >= dn 的下标，超出取最后一档
  function nearIdx(arr, v) {
    if (!(v > 0)) return 0;
    for (var i = 0; i < arr.length; i++) if (v <= arr[i]) return i;
    return arr.length - 1;
  }

  // 水系统阀门主材价：有信息价取信息价（不标品牌），无信息价取市场价并给参考品牌
  function valveWaterPrice(it) {
    var vc = P.waterValve, dn = it.dn;
    if (it.category === 'waterValve') {
      var kind = it.valveKind || 'market';
      var t = vc.info[kind];
      if (t) {
        var i1 = nearIdx(t.dns, dn);
        return {
          price: t.prices[i1], source: 'info',
          basis: '信息价：' + t.name + ' DN' + t.dns[i1] + ' ' + t.prices[i1] + '元/个' +
            (dn > 0 && t.dns[i1] !== dn ? '（DN' + dn + '按相邻档取定）' : '')
        };
      }
      var i2 = nearIdx(vc.market.dns, dn);
      return {
        price: vc.market.prices[i2], source: 'market', brand: vc.brand,
        basis: '市场价（' + vc.brand + '）：' + (it.name || '阀门') + ' DN' + vc.market.dns[i2] + ' ' + vc.market.prices[i2] + '元/个（该阀种无信息价，按市场价计）'
      };
    }
    if (it.category === 'flushValve') {
      var fl = vc.special.flush;
      return {
        price: fl.prices[0], source: 'market', brand: fl.brand,
        basis: '市场价（' + fl.brand + '）：' + fl.name + ' 成套 ' + fl.prices[0] + '元/套（定额 8-1260 按套计）'
      };
    }
    if (it.category === 'solenoidValve') {
      var so = vc.solenoid;
      var i4 = nearIdx(so.dns, dn);
      return {
        price: so.prices[i4], source: 'market', brand: so.brand,
        basis: '市场价（' + so.brand + '）：电磁阀 DN' + so.dns[i4] + ' ' + so.prices[i4] + '元/个' +
          (dn > 0 && so.dns[i4] !== dn ? '（DN' + dn + '按相邻档取定）' : '')
      };
    }
    var key = { autoAir: 'autoAir', tempValve: 'temp', floatValve: 'float', levelValve: 'level' }[it.category];
    var sp = vc.special[key];
    var i3 = nearIdx(sp.dns, dn);
    if (sp.source === 'info') {
      return {
        price: sp.prices[i3], source: 'info',
        basis: '信息价：' + sp.name + ' DN' + sp.dns[i3] + ' ' + sp.prices[i3] + '元/个'
      };
    }
    return {
      price: sp.prices[i3], source: 'market', brand: sp.brand || vc.brand,
      basis: '市场价（' + (sp.brand || vc.brand) + '）：' + sp.name + ' DN' + sp.dns[i3] + ' ' + sp.prices[i3] + '元/个'
    };
  }

  function equipPrice(cfg, tiers, v, metricCn) {
    if (!cfg || !tiers) return { price: null, source: 'pending', basis: '' };
    var noParam = !(v > 0);
    var row = null;
    if (noParam) { row = tiers[0]; v = tiers[0].max; }
    for (var i = 0; i < tiers.length; i++) if (v <= tiers[i].max) { row = tiers[i]; break; }
    if (!row) row = tiers[tiers.length - 1];
    var base = cfg.brands[0];
    var price = Math.round(row.price * base.coef);
    var list = cfg.brands.map(function (b) {
      return b.name.replace(/（.*?）/g, '') + ' ¥' + String(Math.round(row.price * b.coef)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }).join(' / ');
    return {
      price: price, source: 'market', brand: base.name,
      basis: '国产中高档品牌询价（' + metricCn + v + (noParam ? '，名称未注参数按最小档取定，请核对' : '') + '）：' + list + '；取 ' + base.name + ' ' + price + ' 元/台'
    };
  }

  function lookupPrice(it) {
    var s = it.sub;

    if (it.category === 'chiller') return equipPrice(P.chiller, P.chiller[it.sub] || P.chiller.piston, it.coolKw, '制冷量kW');
    if (it.category === 'heatpump') return equipPrice(P.heatpump, P.heatpump.tiers, it.coolKw, '制冷量kW');
    if (it.category === 'coolingTower') return equipPrice(P.coolingTower, P.coolingTower.tiers, it.waterFlow, '处理水量m³/h');
    if (it.category === 'waterValve' || it.category === 'autoAir' || it.category === 'tempValve' ||
        it.category === 'floatValve' || it.category === 'levelValve') return valveWaterPrice(it);
    if (it.category === 'flushValve' || it.category === 'solenoidValve') return valveWaterPrice(it);
    if (it.category === 'bracket') {
      return {
        price: P.bracket.steel, source: 'info',
        basis: '信息价：型钢（角钢、槽钢）' + P.bracket.steel + '元/kg，支架主材按型钢重量计入'
      };
    }
    if (it.category === 'insulRubber') {
      return { price: P.insul.rubber.price, source: 'market', brand: P.insul.rubber.brand, basis: '市场价（' + P.insul.rubber.brand + '）：橡塑保温材料 ' + P.insul.rubber.price + '元/m³' };
    }
    if (it.category === 'insulGlass') {
      return { price: P.insul.glass.price, source: 'market', brand: P.insul.glass.brand, basis: '市场价（' + P.insul.glass.brand + '）：带铝箔离心玻璃棉 ' + P.insul.glass.price + '元/m³（厚40mm）' };
    }
    if (it.category === 'guideVane') {
      var gv = P.guideVane;
      return {
        price: gv.unit, source: 'market', brand: gv.brand,
        basis: '市场价（' + gv.brand + '）：弯头导流叶片成品 ' + gv.unit + '元/㎡（含下料、咬口成型）；如按钢板材料价计为' + gv.mat + '元/㎡（δ1.0×7.85kg/㎡×4.20元/kg）'
      };
    }
    if (PIPE && PIPE.LIST[it.category]) {
      var pq = PIPE.lookupPrice(it, currentPeriod());
      if (pq) return pq;
      return { price: null, source: 'pending', basis: '' };
    }

    if (it.category === 'fan') {
      if (it.isToiletFan) {
        return { price: P.fan.toilet.price, source: 'market', basis: '市场价：' + P.fan.toilet.label + ' ' + P.fan.toilet.price + '元/台' };
      }
      var v = it.airVolume;
      if (!v) return null;
      var tbl = (s === 'centrifugal') ? P.fan.centrifugal : P.fan.axial;
      var row = coefByVolume(tbl, v);
      var price = Math.round(v * row.coef);
      return { price: price, source: 'market', basis: '市场价（' + P.fan.brand + '）：风量' + v + 'm³/h × ' + row.coef + '元 = ' + price + '元/台' };
    }

    if (it.category === 'acu') {
      if (s === 'unit' || s === 'pau') {
        var av = it.airVolume;
        if (!av) return null;
        var pack = (s === 'pau') ? P.pau : P.ahu;
        var r = coefByVolume(pack.table, av);
        var pr = Math.round(av * r.coef);
        return { price: pr, source: 'market', basis: '市场价（' + pack.brand + '）：风量' + av + 'm³/h × ' + r.coef + '元 = ' + pr + '元/台' };
      }
      // 分段组装式空调器：现场分段组装的组合式机组，按风量套组合式机组市场价
      if (s === 'section') {
        var sv = it.airVolume;
        if (!sv) return null;
        var sr = coefByVolume(P.ahu.table, sv);
        var spr = Math.round(sv * sr.coef);
        return { price: spr, source: 'market', basis: '市场价（' + P.ahu.brand + '）：分段组装式空调器 风量' + sv + 'm³/h × ' + sr.coef + '元 = ' + spr + '元/台' };
      }
      if (s === 'split') {
        var kwS = parseCoolingKw(it.name);
        if (kwS) {
          var prS = Math.round(kwS * 800);
          return { price: prS, source: 'market', basis: '市场价（' + P.acuUnit.brand + '）：分体空调 制冷量' + kwS + 'kW × 800元/kW = ' + prS + '元/台' };
        }
        return { price: 4200, source: 'market', basis: '市场价（国产中高档）：分体空调（壁挂/柜式）含安装辅材 4200元/台' };
      }
      if (s === 'vrf' || it.isVrf) {
        var vf = P.vrf, hpm = it.name.match(/(\d+(?:\.\d+)?)\s*(?:HP|hp|匹)/), kwV = parseCoolingKw(it.name);
        if (hpm) {
          var vpr = Math.round(parseFloat(hpm[1]) * vf.perHp);
          return { price: vpr, source: 'market', basis: '市场价（' + vf.brand + '）：多联机 ' + hpm[1] + 'HP × ' + vf.perHp + '元/HP = ' + vpr + '元/台' };
        }
        if (kwV) {
          var vpr2 = Math.round(kwV * vf.perKw);
          return { price: vpr2, source: 'market', basis: '市场价（' + vf.brand + '）：多联机室内机 制冷量' + kwV + 'kW × ' + vf.perKw + '元/kW = ' + vpr2 + '元/台' };
        }
        return { price: vf.fallback, source: 'market', basis: '市场价（' + vf.brand + '）：未识别HP/制冷量，按常规 ' + vf.fallback + '元/台（请核对）' };
      }
      // 吊顶式 / 落地式 / 墙上式：按制冷量kW或风量参考
      var cfgA = P.acuUnit[s];
      if (!cfgA) return { price: null, source: 'pending', basis: '' };
      var kw = parseCoolingKw(it.name);
      if (kw) {
        var prA = Math.round(kw * cfgA.perKw);
        return { price: prA, source: 'market', basis: '市场价（' + P.acuUnit.brand + '）：' + cfgA.label + ' 制冷量' + kw + 'kW × ' + cfgA.perKw + '元/kW = ' + prA + '元/台' };
      }
      if (it.airVolume) {
        var prB = Math.round(it.airVolume * cfgA.perVol);
        return { price: prB, source: 'market', basis: '市场价（' + P.acuUnit.brand + '）：' + cfgA.label + ' 风量' + it.airVolume + 'm³/h × ' + cfgA.perVol + '元 = ' + prB + '元/台' };
      }
      return { price: null, source: 'pending', basis: '' };
    }

    if (it.category === 'fcu') {
      var model = it.fcuModel;
      var hit = null;
      if (model) { for (var i = 0; i < P.fcu.table.length; i++) if (P.fcu.table[i].type === model) { hit = P.fcu.table[i]; break; } }
      if (hit) return { price: hit.price, source: 'market', basis: '市场价（' + P.fcu.brand + '）：型号' + hit.type + ' 风机盘管 ' + hit.price + '元/台' };
      return { price: P.fcu.fallback.price, source: 'market', basis: '市场价（' + P.fcu.brand + '）：未识别FP型号，按' + P.fcu.fallback.type + '计 ' + P.fcu.fallback.price + '元/台（请按实际型号核对）' };
    }

    if (it.category === 'fume') {
      var fv = it.airVolume;
      if (!fv) return null;
      var fr = coefByVolume(P.fume.table, fv);
      var fp = Math.round(fv * fr.coef);
      return { price: fp, source: 'market', basis: '市场价（' + P.fume.brand + '）：风量' + fv + 'm³/h × ' + fr.coef + '元 = ' + fp + '元/台' };
    }

    if (it.category === 'vent') return ventPrice(it);
    if (it.category === 'valve') return valvePrice(it);
    if (it.category === 'renfang') return renfangPrice(it);
    if (isDuctCat(it.category)) return ductPrice(it);
    if (it.category === 'silencer') {
      var per = it.perimeter / 1000;
      if (!per) return null;
      var scfg = P.silencer, tc = scfg.typeCoef[it.sub] || 1.0;
      var sp = +(per * scfg.perM * tc).toFixed(2);
      var tnote = tc === 1.0 ? '' : ' × ' + tc + '（' + (scfg.typeName[it.sub] || '') + '系数）';
      return { price: sp, source: 'market', basis: '市场价（' + scfg.brand + '）：周长' + per.toFixed(2) + 'm × ' + scfg.perM + '元/m' + tnote + ' = ' + sp + '元/个（按1m标准节长，随截面单调）' };
    }
    if (it.category === 'plenum') {
      var sf = it.surface;
      if (!sf) return null;
      var isSil = it.sub === 'silencer';
      var pcoef = isSil ? (P.plenum.silencerCoef || P.plenum.coef) : P.plenum.coef;
      var pp = +(sf * pcoef * P.plenum.factor).toFixed(2);
      return {
        price: pp, source: 'market', brand: P.plenum.brand,
        basis: '市场价（' + P.plenum.brand + '）：' + (isSil ? '消声静压箱' : '静压箱') + ' 展开面积' + sf + '㎡ × ' +
          pcoef + '元/㎡ × ' + P.plenum.factor + '系数 = ' + pp + '元/个'
      };
    }

    if (it.category === 'vav') {
      var vc = P.vav, vv = it.airVolume;
      if (vv) {
        var vp = Math.max(Math.round(vv * vc.perVol), vc.minPrice);
        return { price: vp, source: 'market', basis: '市场价（' + vc.brand + '）：风量' + vv + 'm³/h × ' + vc.perVol + '元 = ' + vp + '元/台（下限' + vc.minPrice + '元）' };
      }
      return { price: vc.fallback, source: 'market', basis: '市场价（' + vc.brand + '）：未识别风量，按常规变风量末端 ' + vc.fallback + '元/台（请核对）' };
    }

    if (it.category === 'dehum') {
      var dc = P.dehum, kg = parseDehumKg(it.name);
      if (kg) {
        var dp = Math.round(kg * dc.perKg);
        return { price: dp, source: 'market', basis: '市场价（' + dc.brand + '）：除湿量' + kg + 'kg/h × ' + dc.perKg + '元 = ' + dp + '元/台' };
      }
      if (it.airVolume) {
        var dp2 = Math.round(it.airVolume * dc.perVol);
        return { price: dp2, source: 'market', basis: '市场价（' + dc.brand + '）：风量' + it.airVolume + 'm³/h × ' + dc.perVol + '元 = ' + dp2 + '元/台' };
      }
      return { price: dc.fallback, source: 'market', basis: '市场价（' + dc.brand + '）：未识别除湿量/风量，按常规 ' + dc.fallback + '元/台（请核对）' };
    }

    if (it.category === 'filter') {
      var fc = P.filterAbs;
      if (it.airVolume) {
        var fp2 = Math.round(it.airVolume * fc.perVol);
        return { price: fp2, source: 'market', basis: '市场价（' + fc.brand + '）：过滤吸收器 风量' + it.airVolume + 'm³/h × ' + fc.perVol + '元 = ' + fp2 + '元/台' };
      }
      return { price: fc.fallback, source: 'market', basis: '市场价（' + fc.brand + '）：过滤吸收器按常规 ' + fc.fallback + '元/台（请核对）' };
    }

    if (it.category === 'heater') {
      var hc = P.heater;
      if (it.airVolume) {
        var hp2 = Math.round(it.airVolume * hc.perVol);
        return { price: hp2, source: 'market', basis: '市场价（' + hc.brand + '）：空气加热（冷却）器 风量' + it.airVolume + 'm³/h × ' + hc.perVol + '元 = ' + hp2 + '元/台' };
      }
      return { price: hc.fallback, source: 'market', basis: '市场价（' + hc.brand + '）：按常规 ' + hc.fallback + '元/台（请核对）' };
    }

    if (it.category === 'dedust') {
      var uc = P.dedust;
      if (it.airVolume) {
        var up = Math.round(it.airVolume * uc.perVol);
        return { price: up, source: 'market', basis: '市场价（' + uc.brand + '）：除尘设备 风量' + it.airVolume + 'm³/h × ' + uc.perVol + '元 = ' + up + '元/台' };
      }
      return { price: uc.fallback, source: 'market', basis: '市场价（' + uc.brand + '）：按常规 ' + uc.fallback + '元/台（请核对）' };
    }

    // 其他未匹配类型：留空待人工
    return { price: null, source: 'pending', basis: '' };
  }

  function ventPrice(it) {
    var G = it.area, s = it.sub, cfg = P.vent;
    if (!G) return null;
    var c = cfg.coef[s] || cfg.coef.louver1;
    var coef = c.coef, base = c.base, note = '';
    if (s === 'multileafOutlet' && G < cfg.smallArea) { coef = cfg.multileafBig.coef; base = cfg.multileafBig.base; note = '（面积<0.5㎡取高档系数）'; }
    if (s === 'plateOutlet' && G < cfg.smallArea) { coef = cfg.plateBig.coef; base = cfg.plateBig.base; note = '（面积<0.5㎡取高档系数）'; }
    var price = (G * coef + base) * cfg.factor;
    if (s === 'ventE') {
      var add = G <= cfg.ventEAdd[0].max ? cfg.ventEAdd[0].add : cfg.ventEAdd[1].add;
      price += add; note = '（含电动执行机构+' + add + '元）';
    }
    price = +price.toFixed(2);
    // 天津市当月造价信息未列风口、散流器成品子目，按市场中准价（含参考品牌）计
    return { price: price, source: 'market', basis: '信息价无风口成品子目，按市场价（' + cfg.brand + '）：面积' + G + '㎡ × ' + coef + '元/㎡ + ' + base + '元，×' + cfg.factor + '系数 = ' + price + '元/个' + note };
  }

  function valvePrice(it) {
    var G = it.area, s = it.sub, cfg = P.valve;
    if (!G) return null;
    var price = 0, basis = '';
    function tierOf(tbl) { for (var i = 0; i < tbl.length; i++) if (G <= tbl[i].max) return tbl[i]; return tbl[tbl.length - 1]; }
    if (s === 'overpressure') {
      price = (G * cfg.overpressure.coef + cfg.overpressure.base) * cfg.factor;
      basis = '面积' + G + '㎡ × ' + cfg.overpressure.coef + ' + ' + cfg.overpressure.base + '，×' + cfg.factor;
    } else if (s === 'cav') {
      var t0 = tierOf(cfg.multileaf);
      var base0 = (G * t0.coef + t0.base) * cfg.factor;
      price = base0 * cfg.cav.times;
      basis = '对开多叶调节阀价' + base0.toFixed(2) + '元 × ' + cfg.cav.times + '（定风量阀）';
    } else if (s === 'butterfly' || s === 'butterflyE') {
      var c1 = s === 'butterflyE' ? cfg.butterflyE : cfg.butterfly;
      price = (G * c1.coef + c1.base) * cfg.factor + c1.add;
      basis = '面积' + G + '㎡ × ' + c1.coef + ' + ' + c1.base + '，×' + cfg.factor + (c1.add ? ' + 电动执行机构' + c1.add : '');
    } else if (s === 'tee') {
      price = (G * cfg.tee.coef + cfg.tee.base) * cfg.factor + cfg.tee.add;
      basis = '面积' + G + '㎡ × ' + cfg.tee.coef + ' + ' + cfg.tee.base + '，×' + cfg.factor + ' + 三通附加' + cfg.tee.add;
    } else if (s === 'sealed') {
      var addE = s === 'sealed' ? 0 : 0;
      price = (G * cfg.sealed.coef + cfg.sealed.base) * cfg.factor + addE;
      basis = '面积' + G + '㎡ × ' + cfg.sealed.coef + ' + ' + cfg.sealed.base + '，×' + cfg.factor;
    } else {
      // 防火阀 / 止回阀 / 斜插板 / 对开多叶
      var tbl = (s === 'fire70') ? cfg.fire70 : (s === 'fire70e') ? cfg.fire70e
        : (s === 'fire280') ? cfg.fire280 : (s === 'fire280e') ? cfg.fire280e
          : (s === 'check') ? cfg.check : (s === 'sluice') ? [cfg.sluice]
            : (s === 'multileafE') ? cfg.multileafE : cfg.multileaf;
      var t = tierOf(tbl);
      price = (G * t.coef + t.base) * cfg.factor + (t.add || 0);
      basis = '面积' + G + '㎡ × ' + t.coef + ' + ' + t.base + '，×' + cfg.factor + (t.add ? ' + 电动执行机构' + t.add : '');
    }
    // 电动风阀均配执行机构，小规格阀体价低，按 500 元/个兜底（执行机构 300~400 元 + 阀体）
    if (/E$/.test(s) && price < 500) {
      basis += '，电动风阀最低按500元/个计';
      price = 500;
    }
    price = +price.toFixed(2);
    return { price: price, source: 'market', basis: '市场价（' + cfg.brand + '）：' + basis + ' = ' + price + '元/个' };
  }

  // 风管主材：镀锌钢板按板厚档，单价 = 板厚×7.85kg/㎡ × 天津市当月信息价（除税 元/kg）
  // 各材质风管主材价：镀锌钢板（含净化）走天津市信息价，其余走合理市场价
  function ductPrice(it) {
    syncDuct(it);
    var cat = it.category;
    var tiers = ductTiersOf(it);
    var ti = tierIndex(tiers, it.ductSize);
    var label = tiers[ti < 0 ? 0 : ti].label;

    if (cat === 'duct' || cat === 'ductClean') {
      if (!it.ductSize) {
        return { price: null, source: 'pending', basis: '未识别风管规格（如 1000×400 或 φ800），无法确定板厚档' };
      }
      var cfg = P.duct;
      var pl = it.plate || plateOfT(it.thk || 0.75);
      var price = +(pl.t * cfg.kgPerM2PerMm * pl.perKg).toFixed(2);
      var specTxt = cat === 'ductClean'
        ? ('周长' + it.ductSize + 'mm')
        : (it.sub === 'round' ? ('直径' + it.ductSize + 'mm') : ('长边长' + it.ductSize + 'mm'));
      return {
        price: price, source: 'info',
        basis: '天津市' + cfg.infoPeriod + '信息价（镀锌钢板 δ' + pl.t + 'mm 除税' + pl.info + '元/t）：' + specTxt +
          ' → 板厚δ' + pl.t + 'mm，' + pl.t + '×' + cfg.kgPerM2PerMm + '=' + (pl.t * cfg.kgPerM2PerMm).toFixed(2) + 'kg/㎡ × ' +
          pl.perKg + '元/kg = ' + price + '元/㎡' + (cat === 'ductClean' ? '（净化风管按优质镀锌钢板，同口径执行信息价）' : '')
      };
    }

    if (cat === 'ductSS') {
      var cs = P.ductSS;
      var kgS = it.thk * cs.kgPerM2PerMm;
      var pS = +(kgS * cs.perKg).toFixed(2);
      return {
        price: pS, source: 'market',
        basis: '市场价（' + cs.brand + '）：' + label + ' → 板厚' + it.thk + 'mm，' + it.thk + '×' + cs.kgPerM2PerMm + '=' +
          kgS.toFixed(2) + 'kg/㎡ × ' + cs.perKg + '元/kg = ' + pS + '元/㎡' + (it.thkName ? '' : '；名称未注壁厚，按最小档计')
      };
    }

    if (cat === 'ductPlastic') {
      var cp = P.ductPlastic;
      var kgP = it.thk * cp.kgPerM2PerMm;
      var pP = +(kgP * cp.perKg).toFixed(2);
      return {
        price: pP, source: 'market',
        basis: '市场价（' + cp.brand + '）：' + label + ' → 板厚' + it.thk + 'mm，' + it.thk + '×' + cp.kgPerM2PerMm + '=' +
          kgP.toFixed(2) + 'kg/㎡ × ' + cp.perKg + '元/kg = ' + pP + '元/㎡'
      };
    }

    if (cat === 'ductFrp') {
      var cf = P.ductFrp;
      return {
        price: cf.perM2, source: 'market',
        basis: '市场价（' + cf.brand + '）：' + label + ' 玻璃钢成品风管 δ4mm以内 ' + cf.perM2 + '元/㎡（含法兰、加固，按展开面积）'
      };
    }

    if (cat === 'ductComp') {
      var cc = P.ductComp;
      return {
        price: cc.perM2, source: 'market',
        basis: '市场价（' + cc.brand + '）：' + label + ' 酚醛复合板成品风管 板厚' + it.thk + 'mm ' + cc.perM2 + '元/㎡（含法兰、胶粘剂）'
      };
    }

    if (cat === 'ductFlex' && it.sub === 'interface') {
      var cj = P.ductFlex.joint;
      var mk = /帆布/.test(it.name) ? 'canvas' : (/三防/.test(it.name) ? 'composite' : (/铝箔|钢丝撑筋/.test(it.name) ? 'foil' : 'default'));
      var mu = cj.mats[mk];
      return {
        price: mu, source: 'market', brand: cj.brand,
        basis: '市场价（' + cj.brand + '）：' + cj.labels[mk] + ' 软管接口成品 ' + mu + '元/㎡（按展开面积，含下料、缝合/咬口、法兰连接）'
      };
    }

    if (cat === 'ductFlex') {
      var cx = P.ductFlex, d = it.ductSize || 0, row = null;
      for (var i = 0; i < cx.tiers.length; i++) if (d <= cx.tiers[i].max) { row = cx.tiers[i]; break; }
      if (!row) row = cx.tiers[cx.tiers.length - 1];
      return {
        price: row.price, source: 'market',
        basis: '市场价（' + cx.brand + '）：' + label + ' 柔性软风管 ' + row.price + '元/m（按中心线长度计）'
      };
    }

    return { price: null, source: 'pending', basis: '' };
  }


  function renfangPrice(it) {
    var d = it.dim.diameter, cfg = P.renfang;
    if (!d) return null;
    var add = it.sub === 'manualE' ? cfg.addE : 0;
    var price = +(Math.max(d * cfg.perMm, cfg.minPrice) + add).toFixed(2);
    return { price: price, source: 'market', basis: '市场价（' + cfg.brand + '）：直径' + d + 'mm × ' + cfg.perMm + '元/mm' + (add ? ' + 电动执行机构' + add : '') + ' = ' + price + '元/个（随直径单调）' };
  }

  // ============================================================
  // 提示
  // ============================================================
  function buildWarn(it, quota) {
    var w = [];
    if (it.category === 'fan' && it.fanAuto && !it.isToiletFan) {
      w.push(/排烟|消防/.test(it.name)
        ? '排烟/消防风机默认按轴流式（9-239~243），如实际为离心式请在"类型/选型"列切换'
        : '名称未注明风机类型，暂按轴流/斜流/混流式（9-239~243），如为离心式请在"类型/选型"列切换');
    }
    if (quota.noKw) w.push('名称未注制冷量（如 1200kW），已按本类最小档 ' + quota.code + ' 计列，请按实际制冷量核对');
    if (quota.noFlow) w.push('名称未注处理水量（如 300m³/h），已按最小档 ' + quota.code + ' 计列，请按实际水量核对');
    if (it.category === 'chiller' && it.chillerAuto) w.push('名称未注明活塞式/离心式/螺杆式，暂按活塞式（1-1130~1137）计列，可在"类型/选型"列切换');
    if (quota.needDn) w.push('未识别公称直径，请在名称中注明（如 DN100 / De110）');
    if (quota.noDn && it.category === 'waterValve') w.push('名称未注阀门公称直径（如 DN100），已按螺纹阀门最小档 8-579（DN15）计列，请核对');
    if (quota.noDn && (it.category === 'floatValve' || it.category === 'levelValve')) w.push('名称未注公称直径，已按本类最小档 ' + quota.code + ' 计列，请核对');
    if (quota.noDn && it.category === 'solenoidValve') w.push('名称未注电磁阀公称直径（如 DN50），已按螺纹最小档 8-603（DN15）计列，请核对');
    if (it.category === 'flushValve') w.push('口部冲洗阀按 8-1260（壁龛式）计列，如为地坑式请改选 8-1261');
    if (it.category === 'solenoidValve' && it.dn > 500) w.push('公称直径超 500mm，已取顶档 8-644，请核对');
    if (it.category === 'bracket') w.push('管道支架工程量按管道长度估算（0.45~3.2kg/m，按管径分档），请按图纸支架实际重量调整');
    if (it.category === 'insulRubber') w.push('橡塑保温按保温体积（m³）计，厚度按30mm 取定；若按管道长度计量请在单位列填 m、按面积填 m²，将自动折算体积');
    if (it.category === 'insulGlass') w.push('离心玻璃棉按保温体积（m³）计，厚度按定额40mm（面积×0.04）；若按风管面积计量请在单位列填 m²');
    if (PIPE && PIPE.LIST[it.category]) {
      var pw = PIPE.buildWarn(it, quota);
      if (pw) w.push(pw);
    }
    if (quota.noTier) {
      if (it.category === 'fan' || it.category === 'fume' || it.category === 'acu') w.push('未识别风量(m³/h)，请在名称中注明（如 5000m³/h）或手选定额');
      if (it.category === 'vent') w.push('未识别规格尺寸（如 800×400 或 φ400），请在名称中注明或手选定额');
      if (it.category === 'valve') w.push('未识别阀门规格：矩形写 800×400，圆形写 φ300 或「阀门-300」（-300 表示圆形风道直径300mm）');
      if (it.category === 'silencer') w.push('未识别消声器规格（长×宽），请核对名称');
      if (isDuctCat(it.category)) w.push('未识别风管规格（矩形写 1000×400，圆形写 φ800），已在"类型/选型"列给出形状，请补尺寸或在名称中注明');
      if (it.category === 'plenum') w.push('未识别静压箱尺寸（长×宽×高），请核对名称');
      if (it.category === 'renfang') w.push('未识别人防密闭阀直径（如 φ300），请核对名称');
    }
    if (quota.supp) w.push('未匹配到标准清单/定额，已按补充清单' + SUPP_LIST + '＋' + quota.code + '计列，请补录定额与单价依据');
    if (it.category === 'other') w.push('未识别项目类型，请手动确认清单与定额');
    if (quota.overRange) w.push('参数超本类最大档，已取顶档子目，请按基价表核对');
    if (quota.massTier && it.category === 'acu') w.push('名称未注设备质量（如 0.3t/300kg），空调器定额按质量分档，已按本安装方式最小档计列，请按设备样本核对');
    if (it.category === 'acu' && ['unit', 'pau', 'section'].indexOf(it.sub) < 0 && !it.airVolume && !parseCoolingKw(it.name) && !/(\d+(?:\.\d+)?)\s*(?:HP|hp|匹)/.test(it.name)) {
      w.push('未识别风量/制冷量/匹数，主材价待询价，建议名称补充（如 5000m³/h 或 5kW）');
    }
    if (quota.massAuto) w.push('设备质量按风量估算（吊顶式0.015、落地式0.025、墙上式0.012 t/1000m³·h⁻¹），已据此选档，请按实际重量核对');
    if (it.category === 'acu' && it.sub === 'pau') w.push('新风机组按组合式空调机组子目（9-257~264）套用，如基价表另有新风机组专用子目请手选');
    if (it.category === 'acu' && it.sub === 'split') w.push('分体空调按落地式空调器子目（9-251）套用，如按"空调器安装"其他子目计请手选');
    if (it.category === 'acu' && it.isVrf) w.push('多联机室内/室外机按安装方式（吊顶/落地/墙上）套空调器子目，设备价按HP/制冷量询价，如基价表另有多联机专用子目请手选');
    if (it.category === 'fcu' && !it.fcuModel) w.push('未识别风机盘管FP型号，主材按FP-85参考价计，请按实际型号核对');
    if (it.category === 'vent' && it.sub === 'diffuserRd' && /旋流/.test(it.name)) w.push('旋流风口暂按圆形散流器子目，如有专用子目请手选');
    if (it.category === 'valve' && it.sub === 'butterfly' && !/蝶阀/.test(it.name)) w.push('未识别阀型，暂按蝶阀（9-63~67），请核对');
    if (it.category === 'silencer' && !it.perimeter) w.push('未识别消声器截面（长×宽），主材价按0计，请核对名称');
    if (it.category === 'plenum' && it.sub === 'silencer') w.push('消声静压箱按截面积分档，截面积取名称前两维相乘（如 1200*1100*400 → 1.32㎡）');
    if (quota.plenumNoSize) w.push('未识别静压箱尺寸（长×宽），消声静压箱暂按最小档 0.8㎡以内计列，请按图核对截面积');
    // 风管类专项提示
    if (isDuctCat(it.category)) {
      if (quota.noSize) w.push('名称未注风管尺寸，已按该类最小定额子目计列，请按实际规格核对');
      if (quota.noThk) w.push('不锈钢风管名称未注壁厚，按最小档 ' + quota.code + ' 计列，请按实际直径与壁厚核对');
      if (it.category === 'ductClean' && it.sub === 'round') w.push('圆形净化风管执行矩形净化风管子目，按周长（π×直径）分档');
      if (it.category === 'ductSS' && it.sub === 'rect') w.push('不锈钢板矩形风管执行圆形风管子目，按长边长套用');
      if (it.category === 'ductFlex' && it.sub === 'interface') {
        if (it.jointArea > 0) w.push('帆布/三防复合布/带钢丝撑筋铝箔软风管按软管接口以展开面积（m²）计量，接口长度按 250mm 折算，请按实际接口尺寸核对');
        else w.push('未识别风口/软管尺寸，软管接口面积未能折算，工程量请按图填写（m²）');
      }
      else if (it.category === 'ductFlex') w.push('柔性软风管按中心线长度（m）计量，场外运输按 π×直径×长度 折算展开面积');
    }
    return w.join('；');
  }

  // ============================================================
  // 规格 / 特征
  // ============================================================
  function specText(it) {
    var d = it.dim;
    var dimStr = '';
    if (d.diameter) dimStr = 'φ' + d.diameter + 'mm';
    else if (d.length && d.width && d.height) dimStr = d.length + '×' + d.width + '×' + d.height + 'mm';
    else if (d.length && d.width) dimStr = d.length + '×' + d.width + 'mm';

    if (it.category === 'fan') {
      if (it.isToiletFan) return '卫生间通风器' + (it.airVolume ? ' 风量' + it.airVolume + 'm³/h' : '');
      return (it.airVolume ? '风量' + it.airVolume + 'm³/h ' : '') + (it.sub === 'centrifugal' ? '离心式' : '轴流式');
    }
    if (it.category === 'acu') {
      var lbl = { unit: '组合式空调机组', pau: '新风机组', ceiling: '吊顶式', floor: '落地式', wall: '墙上式', section: '分段组装式', split: '分体空调', vrf: '多联机' }[it.sub] || '';
      var hp = it.name.match(/(\d+(?:\.\d+)?)\s*(?:HP|hp|匹)/);
      if (hp) lbl += ' ' + hp[1] + 'HP';
      var massTxt = it.acuMassUsed ? ' 质量' + it.acuMassUsed + 't' : '';
      return (it.airVolume ? '风量' + it.airVolume + 'm³/h ' : '') + lbl + massTxt;
    }
    if (it.category === 'fcu') {
      var fl = { ceiling: '吊顶式', floor: '落地式', wall: '壁挂式', cassette: '卡式' }[it.sub] || '';
      return (it.fcuModel ? it.fcuModel + ' ' : '') + fl;
    }
    if (it.category === 'fume') return it.airVolume ? '风量' + it.airVolume + 'm³/h' : '';
    if (it.category === 'vav') return '变风量末端 ' + (it.airVolume ? '风量' + it.airVolume + 'm³/h' : '');
    if (it.category === 'heater' || it.category === 'dedust' || it.category === 'dehum' || it.category === 'filter') {
      return dimStr || (it.airVolume ? '风量' + it.airVolume + 'm³/h' : '');
    }
    // 人防密闭阀：只显示直径（周长无工程意义）
    if (it.category === 'renfang') return dimStr || '';
    if (it.category === 'chiller') {
      var ctn = { piston: '活塞式', centrifugal: '离心式', screw: '螺杆式' }[it.sub] || '';
      return (it.coolKw ? '制冷量' + it.coolKw + 'kW ' : '') + ctn;
    }
    if (it.category === 'heatpump') return it.coolKw ? '制冷量' + it.coolKw + 'kW 热泵机组' : '热泵机组';
    if (it.category === 'coolingTower') return it.waterFlow ? '处理水量' + it.waterFlow + 'm³/h' : '';
    if (it.category === 'waterValve') return it.dn ? 'DN' + it.dn : '';
    if (it.category === 'autoAir') return (it.dn ? 'DN' + it.dn + ' ' : 'DN25 ') + '自动排气阀/手动放风阀';
    if (it.category === 'tempValve') return (it.dn ? 'DN' + it.dn + ' ' : 'DN25 ') + '散热器温控阀';
    if (it.category === 'floatValve') return (it.dn ? 'DN' + it.dn + ' ' : '') + '法兰浮球阀';
    if (it.category === 'levelValve') return (it.dn ? 'DN' + it.dn + ' ' : '') + '法兰液压水位控制阀';
    if (it.category === 'flushValve') return '壁龛式 成套';
    if (it.category === 'solenoidValve') return it.dn ? 'DN' + it.dn : '';
    if (it.category === 'bracket') return '管道支吊架（型钢制作安装）';
    if (it.category === 'insulRubber') return '橡塑保温壳 δ30mm' + (it.dn ? ' 管道DN' + it.dn : '');
    if (it.category === 'insulGlass') return '带铝箔离心玻璃棉 δ40mm' + (it.dn ? ' 管道DN' + it.dn : '');
    if (PIPE && PIPE.LIST[it.category]) return PIPE.specCell(it) || '管径待识别';
    // 风管类：合并行显示定额档规格；未合并显示实际尺寸 + 板厚/壁厚
    if (isDuctCat(it.category)) {
      if (it.mergedSpec) return it.mergedSpec;
      var tt = ductThkText(it);
      var dl = ductTierLabel(it);
      var ja = (it.category === 'ductFlex' && it.sub === 'interface' && it.jointArea && it.jointConv)
        ? '（每个接口展开面积约' + it.jointArea + '㎡）' : '';
      return (dimStr || dl || '未识别规格') + (tt ? ' ' + tt : '') + ja;
    }
    // 风口/风阀/消声器/静压箱
    if (it.category === 'plenum') {
      return (dimStr || '') + (it.plenumArea ? '（截面积' + it.plenumArea + '㎡）' : '');
    }
    if (it.category === 'guideVane') {
      return (dimStr || '') + (it.vanePer ? '（导流叶片展开面积约' + it.vanePer + '㎡）' : '');
    }
    var extra = '';
    if (it.perimeter) extra = '（周长' + it.perimeter + 'mm）';
    return dimStr ? dimStr + extra : '';
  }

  function typeLabel(it) {
    if (it.category === 'chiller') return { piston: '活塞式冷水机组', centrifugal: '离心式冷水机组', screw: '螺杆式冷水机组' }[it.sub] || '';
    if (it.category === 'heatpump') return '热泵冷（热）水机组';
    if (it.category === 'coolingTower') return '玻璃钢冷却塔';
    if (it.category === 'waterValve') return it.dn ? (it.dn <= 50 ? '螺纹连接' : '焊接法兰连接') : '';
    if (it.category === 'autoAir') return '自动排气阀/手动放风阀';
    if (it.category === 'tempValve') return '散热器温控阀';
    if (it.category === 'floatValve') return '法兰浮球阀';
    if (it.category === 'levelValve') return '法兰液压水位控制阀';
    if (it.category === 'flushValve') return '口部冲洗阀';
    if (it.category === 'solenoidValve') return it.dn ? (it.dn <= 50 ? '螺纹连接' : '法兰连接') : '';
    if (it.category === 'guideVane') return '弯头导流叶片';
    if (it.category === 'bracket') return '支/吊架、基础型钢';
    if (it.category === 'insulRubber') return '橡塑保温壳安装';
    if (it.category === 'insulGlass') return '带铝箔离心玻璃棉安装';
    if (PIPE && PIPE.LIST[it.category]) {
      return (it.loc === 'out' ? '室外' : '室内') + ' ' + (PIPE.JOINT_CN2[it.joint] || PIPE.JOINT_CN[it.joint] || '');
    }
    var opts = TYPE_OPTS[it.category];
    if (!opts) return '';
    for (var i = 0; i < opts.length; i++) if (opts[i].v === it.sub) return opts[i].label;
    return '';
  }

  function generateFeature(format, it) {
    var lines = [];
    var push = function (label, val) {
      if (val === null || val === undefined || val === '') return;
      lines.push((lines.length + 1) + '.' + label + '：' + val);
    };
    if (PIPE && PIPE.LIST[it.category]) {
      push('名称', it.name);
      push('规格型号', PIPE.specCell(it) || '待识别');
      // 管道特征按"部位/材质/连接形式/介质/试压冲洗"拆成独立条目
      String(PIPE.featureText(it) || '').split('；').forEach(function (kv) {
        var p2 = kv.split(':');
        if (p2.length < 2 || !p2[0]) return;
        var k = p2[0].trim(), v = p2.slice(1).join(':').trim();
        if (k === '型号规格') return;                       // 已在"规格型号"列体现
        if (k === '材质') v = CAT_LABEL[it.category] || v;   // 用清单材质全称
        push(k, v);
      });
      push('品牌参考', it.brand);
      push('其他', CAT_WORK[it.category] || '');
      return lines.join('\n');
    }
    push('名称', it.name);
    push('规格型号', specText(it));
    push('类型', typeLabel(it));
    push('品牌参考', it.brand);
    push('其他', CAT_WORK[it.category] || '');
    return lines.join('\n');
  }

  // ============================================================
  // 主流程
  // ============================================================
  var PRICED_CATS = { fan: 1, acu: 1, fcu: 1, fume: 1, heater: 1, dedust: 1, dehum: 1, filter: 1, vav: 1, vent: 1, valve: 1, silencer: 1, plenum: 1, renfang: 1, duct: 1, ductClean: 1, ductSS: 1, ductPlastic: 1, ductFrp: 1, ductComp: 1, ductFlex: 1, transport: 1, guideVane: 1, chiller: 1, heatpump: 1, coolingTower: 1,
    waterValve: 1, autoAir: 1, tempValve: 1, floatValve: 1, levelValve: 1, flushValve: 1, solenoidValve: 1,
    bracket: 1, insulRubber: 1, insulGlass: 1, other: 1 };
  if (PIPE) Object.keys(PIPE.LIST).forEach(function (k) { PRICED_CATS[k] = 1; });

  // 补充定额编号：补1、补2……（同一行始终复用同一编号，切换类型不重排）
  function suppInfo(it) {
    if (!it.suppNo) { buSeq++; it.suppNo = buSeq; }
    var sp = specText(it);
    return {
      code: '补' + it.suppNo,
      name: '补充定额 补' + it.suppNo + '（' + (CAT_LABEL[it.category] || '') + (sp ? ' ' + sp : '') + '）'
    };
  }

  // 统一兜底：清单或定额任一未匹配 → 清单030806801 + 补N
  function applySupp(it, quota) {
    if (it.listCodeOrig === undefined) it.listCodeOrig = it.listCode;
    if (quota.keepList && it.listCode) return quota;   // 清单已确定（风管030702001），仅缺定额时不改清单
    if (quota.code && it.listCode) return quota;
    it.listCode = SUPP_LIST;
    if (quota.code) { quota.supp = true; return quota; }
    var si = suppInfo(it);
    return { code: si.code, name: si.name, inferred: false, supp: true };
  }

  // ============================================================
  // 列识别：兼容多种清单格式
  //   A序号/B项目名称/C数量（标准）
  //   A项目名称/B单位/C数量（老风口风阀模板，无序号列）
  //   A序号/B名称/C型号/D单位/E数量 ……
  // ============================================================
  var UNIT_WORDS = /^(个|台|套|组|根|樘|座|块|节|片|只|副|米|m|m2|m²|㎡|kg|吨|项|处|系统|段)$/i;

  function cellText(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }
  function isNumCell(v) {
    if (typeof v === 'number') return isFinite(v);
    return /^\s*-?\d+(\.\d+)?\s*$/.test(String(v === undefined || v === null ? '' : v));
  }
  function looksUnit(v) { return UNIT_WORDS.test(cellText(v)); }
  // 单位规范化：m2/㎡/米 → m²/m
  function normUnit(u) {
    var t = cellText(u);
    var map = { 'm2': 'm²', 'M2': 'm²', '㎡': 'm²', 'm²': 'm²', '平方米': 'm²', '米': 'm', 'm': 'm' };
    return map[t] || t;
  }
  function hasCn(v) { return /[\u4e00-\u9fa5]/.test(cellText(v)); }

  function detectColumns(aoa) {
    var res = { name: -1, qty: -1, seq: -1, unit: -1, start: 0 };
    var limit = Math.min(aoa.length, 8);
    for (var r = 0; r < limit; r++) {
      var row = aoa[r] || [];
      var m = { name: -1, qty: -1, seq: -1, unit: -1 };
      for (var c = 0; c < row.length; c++) {
        var t = cellText(row[c]).replace(/\s+/g, '');   // 兼容「项 目 名 称」这类带空格的表头
        if (!t || t.length > 12) continue;
        if (m.name < 0 && /名称|项目内容/.test(t)) m.name = c;
        if (m.qty < 0 && /数量|工程量/.test(t)) m.qty = c;
        if (m.seq < 0 && /序号|编号/.test(t)) m.seq = c;
        if (m.unit < 0 && /^单位$/.test(t)) m.unit = c;
      }
      if (m.name >= 0) {
        res.name = m.name; res.qty = m.qty; res.seq = m.seq; res.unit = m.unit; res.start = r + 1;
        return res;
      }
    }
    return res;
  }

  // 无表头时逐行判定名称列：优先能识别出类别的单元格，其次含中文的非数字单元格
  function pickNameCell(row) {
    var best = -1, bestScore = 0, n = Math.min(row.length, 6);
    for (var c = 0; c < n; c++) {
      var t = cellText(row[c]);
      if (!t) continue;
      if (looksUnit(t)) continue;
      var sc = 0;
      if (classify(t)) sc = 3;
      else if (hasCn(t) && !isNumCell(t)) sc = 2;
      else if (!isNumCell(t)) sc = 1;
      if (sc > bestScore) { bestScore = sc; best = c; }
    }
    return (bestScore >= 2) ? best : -1;
  }

  function parseRows(aoa) {
    buSeq = 0;
    var results = [];
    var autoIdx = 0;
    var curSystem = '';   // 当前系统分组名（来自清单里的分组标题行，如「给水管道」「中水管道」），用于管道支架按系统分套
    var cols = detectColumns(aoa);
    for (var r = 0; r < aoa.length; r++) {
      if (r < cols.start) continue;
      var row = aoa[r] || [];
      var nameCol, name;
      if (cols.name >= 0) {
        nameCol = cols.name;
        name = cellText(row[cols.name]);
      } else {
        nameCol = pickNameCell(row);
        name = nameCol >= 0 ? cellText(row[nameCol]) : '';
      }
      name = name.replace(/^\d{1,3}[、.．]\s*/, '');   // 去掉"1." "2、"式前缀
      if (!name) continue;
      if (/名称|项目内容|合计|小计|备注/.test(name) && !/\d/.test(name)) continue;

      var it = buildItem(name);

      // 工程量：优先用表头定位的列，否则取名称列之后（或整行）最后一个数字单元格
      var qty;
      if (cols.qty >= 0) {
        qty = parseFloat(cellText(row[cols.qty]));
      } else {
        for (var c2 = row.length - 1; c2 >= 0; c2--) {
          if (c2 === nameCol) continue;
          if (isNumCell(row[c2])) { qty = parseFloat(cellText(row[c2])); break; }
        }
      }

      // 分组标题行（如「给水管道」「中水管道」「管路及阀门」）：无序号、无工程量、名称不含数字，
      // 不是清单项——记为当前系统分组名后跳过，管道支架按系统分别补项
      var hasSeq = false;
      if (cols.seq >= 0) hasSeq = cellText(row[cols.seq]) !== '';
      else { for (var cs = 0; cs < nameCol; cs++) { if (cellText(row[cs]) !== '') { hasSeq = true; break; } } }
      var isTitle = !(!isNaN(qty) && qty > 0) && !/\d/.test(name);
      if (isTitle && !hasSeq) { curSystem = name; continue; }        // 无序号 → 分组标题，记系统名
      if (isTitle && it.category === 'other') continue;              // 有序号但无工程量的说明行 → 跳过

      autoIdx++;
      var seqRaw = cols.seq >= 0 ? row[cols.seq] : null;
      it.index = (seqRaw !== undefined && seqRaw !== null && cellText(seqRaw) !== '') ? cellText(seqRaw) : String(autoIdx);

      it.qtyWarn = false;
      if (isNaN(qty) || qty <= 0) { qty = 1; it.qtyWarn = true; }
      it.quantity = qty;

      // 单位：优先用表里的单位列，否则按类别默认
      var unitCell = '';
      if (cols.unit >= 0 && looksUnit(row[cols.unit])) unitCell = normUnit(row[cols.unit]);
      else {
        for (var c3 = 0; c3 < row.length; c3++) {
          if (c3 === nameCol) continue;
          if (looksUnit(row[c3])) { unitCell = normUnit(row[c3]); break; }
        }
      }
      var defUnit = '台';
      if (/^(vent|valve|silencer|plenum|renfang|waterValve|autoAir|tempValve|floatValve|levelValve|solenoidValve)$/.test(it.category)) defUnit = '个';
      else if (it.category === 'flushValve') defUnit = '套';
      else if (it.category === 'bracket') defUnit = 'kg';
      else if (it.category === 'insulRubber' || it.category === 'insulGlass') defUnit = 'm³';
      else if (it.category === 'guideVane') defUnit = 'm²';
      else if (it.category === 'ductFlex') defUnit = (it.sub === 'interface' ? 'm²' : 'm');
      else if (PIPE && PIPE.LIST[it.category]) defUnit = 'm';
      else if (isDuctCat(it.category)) defUnit = 'm²';
      it.unit = unitCell || defUnit;

      // 绝热行：若用户给的是面积(m²)或长度(m)，折算为保温体积(m³)
      if (it.category === 'insulRubber' || it.category === 'insulGlass') {
        var thkM = (it.insulThk || 30) / 1000;
        if (it.unit === 'm²') {
          it.quantity = +(it.quantity * thkM).toFixed(2);
          it.insulConv = '按面积' + qty + 'm² × 厚' + it.insulThk + 'mm 折算体积';
          it.unit = 'm³';
        } else if (it.unit === 'm' && it.dn > 0) {
          it.quantity = +(it.quantity * Math.PI * ((it.dn + it.insulThk) / 1000) * thkM).toFixed(2);
          it.insulConv = '按长度' + qty + 'm × π×(DN' + it.dn + '+δ' + it.insulThk + ') × δ 折算体积';
          it.unit = 'm³';
        }
      }

      // 软管接口（帆布/三防复合布/带钢丝撑筋铝箔软风管）：清单 030702008 按展开面积(m²)计
      // 上传单位为 个/台/套 时按 周长×0.25m（标准软接头长度 250mm）折算；单位 m 时按 长度×周长
      if (it.category === 'ductFlex' && it.sub === 'interface') {
        var perM = (it.perimeter || 0) / 1000;
        it.jointLen = 0.25;
        it.jointArea = perM > 0 ? +(perM * it.jointLen).toFixed(3) : 0;
        if (it.unit !== 'm²') {
          if (it.unit === 'm' && perM > 0) {
            it.quantity = +(it.quantity * perM).toFixed(2);
            it.jointConv = '按长度' + qty + 'm × 周长' + perM.toFixed(2) + 'm 折算展开面积';
          } else if (it.jointArea > 0) {
            it.jointConv = '按' + it.quantity + it.unit + ' × 每个接口展开面积约' + it.jointArea + '㎡（周长×0.25m）折算';
            it.quantity = +(it.quantity * it.jointArea).toFixed(2);
          } else {
            it.jointConv = '未识别风口尺寸，软管接口面积请按图填写（m²）';
          }
        }
        it.unit = 'm²';
      }

      // 弯头导流叶片：清单 030702009 按展开面积(m²)计；上传单位为台/个/组时按风管截面积×2.5 折算
      if (it.category === 'guideVane') {
        it.vanePer = +((it.area || 0) * 2.5).toFixed(3);
        if (it.unit !== 'm²') {
          if (it.vanePer > 0) {
            it.vaneConv = '按' + it.quantity + it.unit + ' × 展开面积约' + it.vanePer + '㎡ 折算';
            it.quantity = +(it.quantity * it.vanePer).toFixed(2);
          } else {
            it.vaneConv = '未识别规格，未能折算展开面积';
          }
        }
        it.unit = 'm²';
      }

      var quota = matchQuota(it);
      quota = applySupp(it, quota);
      it.quotaCode = quota.code;
      it.quotaName = quota.name;
      // 定额计量单位与系数（管道 10m、冲洗 100m、支架 100kg 等需换算）；定额表未标注的按清单单位、系数 1
      it.quotaUnit = quota.unit || it.unit;
      it.quotaFactor = quota.factor || 1;
      it.codeInferred = !!quota.inferred;
      it.supp = !!quota.supp;
      if (PIPE && PIPE.LIST[it.category]) it.extras = PIPE.buildExtraQuotas(it, quota);
      it.warn = buildWarn(it, quota);
      if (it.qtyWarn) it.warn = (it.warn ? it.warn + '；' : '') + '工程量缺失，暂按1' + it.unit + '计请核对';
      if (it.category === 'guideVane') {
        var gw = it.vanePer > 0 ? '导流叶片展开面积按风管截面积×2.5估算，请按图核对'
                                : '未识别风管规格，导流叶片工程量请按图填写（m²）';
        it.warn = (it.warn ? it.warn + '；' : '') + gw;
      }

      var info = lookupPrice(it);
      if (info && info.price !== null) {
        it.price = info.price;
        it.priceSource = info.source;
        it.priceBasis = info.basis || '';
        it.priceBrand = info.brand || '';
      } else {
        it.price = null;
        it.priceSource = PRICED_CATS[it.category] ? 'pending' : 'na';
        it.priceBasis = '';
      }

      it.features = generateFeature('guanglianda', it);
      it.system = curSystem;   // 所属系统分组，管道支架按系统分套
      results.push(it);
    }
    var out = withTransport(withBracket(mergeDucts(results)));
    // 有自动补项（支架/运输）插入时，清单序号统一重排为连续 1..n，否则保留用户原序号
    var hasAuto = false;
    for (var q = 0; q < out.length; q++) if (out[q].autoAdded) hasAuto = true;
    if (hasAuto) for (var q2 = 0; q2 < out.length; q2++) out[q2].index = String(q2 + 1);
    return out;
  }

  function recomputeQuota(it) {
    if (it.listCodeOrig !== undefined) it.listCode = it.listCodeOrig;
    var q = applySupp(it, matchQuota(it));
    it.supp = !!q.supp;
    it.quotaCode = q.code;
    it.quotaName = q.name;
    it.quotaUnit = q.unit || it.unit;
    it.quotaFactor = q.factor || 1;
    it.codeInferred = !!q.inferred;
    if (PIPE && PIPE.LIST[it.category]) { it.extras = PIPE.buildExtraQuotas(it, q); it.brand = PIPE.brandOf(it) || it.brand; }
    it.warn = buildWarn(it, q);
    if (it.qtyWarn) it.warn = (it.warn ? it.warn + '；' : '') + '工程量缺失，暂按1' + it.unit + '计请核对';
    if (isDuctCat(it.category) && it.mergedCount) {
      it.name = it.quotaName;
      var tt = ductThkText(it);
      it.mergedSpec = ductTierLabel(it) + (tt ? ' ' + tt : '');
      it.warn = '已合并' + it.mergedCount + '项相同定额（' + (it.mergedNames || []).join('、') + '）工程量合计' + it.quantity + (it.unit === 'm' ? 'm' : 'm²') +
        (it.warn ? '；' + it.warn : '');
    }
  }
  function recomputePrice(it) {
    var info = lookupPrice(it);
    if (info && info.price !== null) {
      it.price = info.price; it.priceSource = info.source; it.priceBasis = info.basis || '';
      it.priceBrand = info.brand || '';
    } else {
      it.price = null;
      it.priceSource = PRICED_CATS[it.category] ? 'pending' : 'na';
      it.priceBasis = '';
    }
  }

  // ============================================================
  // 渲染
  // ============================================================
  function priceText(item) {
    if (!PRICED_CATS[item.category]) return '<span class="tag tag-na">未计价</span>';
    if (item.priceSource === 'none') return '<span class="tag tag-na">无主材</span>';
    if (item.price === null) return '<span class="tag tag-pending">待询价</span>';
    var tip = item.priceBasis ? ' title="' + String(item.priceBasis).replace(/"/g, '&quot;') + '"' : '';
    var isInfo = item.priceSource === 'info';
    var brand = String(item.priceBrand || item.brand || '').replace(/（[^）]*）/g, '');
    var chips = brand ? brand.split('/').filter(function (x) { return x; }).slice(0, 3) : [];
    var brandHtml = '';
    if (!isInfo && chips.length) {
      brandHtml = ' ' + chips.map(function (b) {
        return '<span class="price-brand" title="' + esc(brand) + '">' + esc(b) + '</span>';
      }).join('');
    }
    return '<span class="tag ' + (isInfo ? 'tag-info' : 'tag-market') + '" ' + tip + '>' + (isInfo ? '信息价' : '市场价') + '</span> <span ' + tip + '>¥' + item.price.toFixed(2) + '</span>' + brandHtml;
  }
  function inferTag(it) {
    return it.codeInferred ? '<span class="tag tag-infer" title="定额编号为区间内按风量/周长/直径就近推算，请对照第九册子目表核对">推</span>' : '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function opt(v, cur, label) {
    return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + label + '</option>';
  }
  function sel(act, idx, html, cls) {
    return '<select class="cell-select' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" data-idx="' + idx + '">' + html + '</select>';
  }

  function layCell(it) {
    if (PIPE && PIPE.LIST[it.category]) {
      var locHtml = opt('in', it.loc, '室内') + opt('out', it.loc, '室外');
      var js = PIPE.jointsOf(it);
      var jointHtml = js.map(function (j) { return opt(j, it.joint, PIPE.JOINT_CN2[j] || PIPE.JOINT_CN[j] || j); }).join('');
      return '<div style="display:flex;flex-direction:column;gap:4px;">' + sel('ploc', it._i, locHtml) + sel('pjoint', it._i, jointHtml) + '</div>';
    }
    var opts = TYPE_OPTS[it.category];
    if (!opts) return '<span class="lay-static">—</span>';
    var h = '';
    for (var i = 0; i < opts.length; i++) h += opt(opts[i].v, it.sub, opts[i].label);
    return sel('sub', it._i, h, 'lay-sub');
  }

  function renderTable(data) {
    annotateListCode12(data);
    var tb = document.getElementById('tableBody');
    if (!tb) return;
    var html = '';
    for (var i = 0; i < data.length; i++) {
      var it = data[i];
      it._i = i;
      html += '<tr class="' + (it.warn ? 'row-warn' : '') + '">'
        + '<td>' + esc(it.index) + '</td>'
        + '<td class="cell-qcode col-lc">' + esc(it.listCode12 || it.listCode) + '</td>'
        + '<td class="cell-name">' + esc(it.name) + '</td>'
        + '<td class="cell-type">' + layCell(it) + '</td>'
        + '<td class="cell-spec">' + esc(specText(it)) + '</td>'
        + '<td class="cell-brand" title="' + esc(it.brand || '') + '">' + esc(brandShort(it.brand)) + '</td>'
        + '<td class="cell-qcode">' + esc(it.quotaCode || '—') + inferTag(it) + '</td>'
        + '<td class="cell-qname">' + esc(it.quotaName || '待人工处理') + '</td>'
        + '<td class="cell-price">' + priceText(it) + '</td>'
        + '<td>' + esc(it.unit) + '</td>'
        + '<td>' + it.quantity + '</td>'
        + '<td class="cell-warn">' + esc(it.warn) + '</td>'
        + '</tr>';
    }
    tb.innerHTML = html;
    bindRowSelects(data);
    updateSummary(data);
  }

  function updateSummary(data) {
    var n = data.length, dev = 0, ovo = 0, other = 0, duct = 0, pending = 0, total = 0;
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      if (isDuctCat(d.category) || d.category === 'transport' || d.category === 'bracket' || (PIPE && PIPE.LIST[d.category])) duct++;
      else if (d.category === 'vent' || d.category === 'valve' || d.category === 'renfang' ||
        d.category === 'waterValve' || d.category === 'autoAir' || d.category === 'tempValve' ||
        d.category === 'floatValve' || d.category === 'levelValve' ||
        d.category === 'flushValve' || d.category === 'solenoidValve') ovo++;
      else if (d.category === 'silencer' || d.category === 'plenum' || d.category === 'insulRubber' || d.category === 'insulGlass') other++;
      else dev++;
      if (PRICED_CATS[d.category] && d.price === null && d.priceSource !== 'none') pending++;
      if (d.price !== null && d.price !== undefined) total += d.price * d.quantity;
    }
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('totalCount', n);
    set('catDev', dev);
    set('catVent', ovo);
    set('catDuct', duct);
    set('catOther', other);
    set('pendingCount', pending);
    set('totalPrice', '¥' + total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }

  function bindRowSelects(data) {
    var tb = document.getElementById('tableBody');
    if (!tb) return;
    tb.onchange = function (e) {
      var s = e.target;
      if (!s || s.tagName !== 'SELECT') return;
      var idx = parseInt(s.getAttribute('data-idx'), 10);
      var it = data[idx];
      if (!it) return;
      var act = s.getAttribute('data-act');
      var reprice = false;
      if (act === 'sub') { it.sub = s.value; reprice = true; }
      if (act === 'ploc') {
        it.loc = s.value;
        var allow = PIPE.jointsOf(it);
        if (allow.indexOf(it.joint) < 0) { it.jointFallback = it.joint; it.joint = PIPE.defaultJoint(it); }
        reprice = true;
      }
      if (act === 'pjoint') { it.joint = s.value; it.jointFromName = true; it.jointFallback = null; reprice = true; }
      if (reprice) {
        recomputeQuota(it);
        recomputePrice(it);
        it.features = generateFeature('guanglianda', it);
        renderTable(data);
      }
    };
  }

  // ============================================================
  // 导出
  // ============================================================
  function num2(v) { return (v === null || v === undefined) ? '' : +Number(v).toFixed(2); }
  function round4(v) { return (v === null || v === undefined || isNaN(v)) ? '' : Math.round(Number(v) * 10000) / 10000; }

  // 清单编码统一补足 12 位：9 位标准码直接追加三位顺序号；
  // 不足 9 位的（如补充码 03B001）先右补 0 至 9 位，再追加顺序号，保证输出恒为 12 位。
  // 同一编码按清单出现顺序 001/002/003…递增，不同编码各自从 001 起；空编码保持空。
  function annotateListCode12(data) {
    var seq = {};
    data.forEach(function (it) {
      var c = String(it.listCode || '').trim();
      if (!c) { it.listCode12 = c; return; }
      seq[c] = (seq[c] || 0) + 1;
      var base = c.length < 9 ? c + new Array(10 - c.length).join('0') : c.slice(0, 9);
      it.listCode12 = base + ('00' + seq[c]).slice(-3);
    });
  }

  function exportGLD(data) {
    if (GS_MODE) return exportGLDGs(data);
    annotateListCode12(data);
    var rows = [];
    rows.push(['序号', '项目名称', '类型', '参数', '品牌参考', '规格', '规格补充', '工程量',
      '项目编码', '类型', '名称', '项目特征', '单位', '工程量', '主材单价']);
    var zIdx = 0;   // 子目下设备/主材编码流水号，保证每条编码唯一（Z00741-001、-002……）
    data.forEach(function (it) {
      var d = it.dim;
      var param = it.airVolume ? (it.airVolume + 'm³/h') : '';
      var dimStr = '';
      if (d.diameter) dimStr = 'φ' + d.diameter;
      else if (d.length && d.width) dimStr = d.length + '×' + d.width + (d.height ? '×' + d.height : '');
      if (isDuctCat(it.category) && it.mergedCount) dimStr = ductTierLabel(it);
      var sup = it.category === 'plenum' ? (it.plenumArea ? ('截面积' + it.plenumArea + '㎡') : '')
        : (it.perimeter ? ('周长' + it.perimeter + 'mm') : '');
      // A列序号：清单行为主序号，其下定额/附加定额/子目下设备行为子序号 1.1、1.2……
      var sub = 0;
      // 清单行
      rows.push([it.index, it.name, it.categoryLabel, param, it.brand || '', dimStr, sup, it.quantity,
        it.listCode12 || it.listCode, '清单行', it.name, it.features, it.unit, it.quantity,
        it.price === null ? '' : num2(it.price)]);
      // 定额行
      // 定额行：必须带「单位 + 工程量」，否则广联达导入时会把定额行识别成一级分部行，
      // 其下的主材行随之错判为清单行（其他四站均带单位与工程量）
      rows.push([it.index + '.' + (++sub), '', '', '', '', '', '', '',
        it.quotaCode || '', '定额行', it.quotaName || '（待人工处理）', '',
        it.quotaUnit || it.unit, round4(it.quantity / (it.quotaFactor || 1)), '']);
      // 子目下设备行（主材）：紧跟其对应定额行；场外运输等不设主材的子目跳过
      // 注意：项目特征列（L）必须留空——广联达只要看到该行有项目特征，就会判成清单行，
      // 主材规格改放「规格补充」列（G），与给排水/消防/电气三站保持一致
      if (it.priceSource !== 'none') {
        zIdx++;
        rows.push([it.index + '.' + (++sub), '', '', '', '', '', '', '',
          'Z00741-' + String(zIdx).padStart(3, '0'), '子目下设备', it.name, '', it.unit, it.quantity,
          it.price === null ? '' : num2(it.price)]);
      }
      // 附加定额行（管道：消毒冲洗 8-490、沟槽管件 8-220），本身无主材，排在主材行之后
      (it.extras || []).forEach(function (x) {
        rows.push([it.index + '.' + (++sub), '', '', '', '', '', '', '', x.code, '定额行', x.name, '',
          x.unit || it.unit, round4((x.qty || 0) / (x.factor || 1)), '']);
      });
    });
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 10 }, { wch: 34 }, { wch: 44 }, { wch: 6 }, { wch: 10 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '广联达组价');
    XLSX.writeFile(wb, '暖通专业智能组价_广联达_' + stamp() + '.xlsx');
  }

  function exportJianjing(data) {
    if (GS_MODE) return exportJianjingGs(data);
    annotateListCode12(data);
    var rows = [];
    rows.push(['序号', '项目编码', '项目名称', '项目特征', '单位', '工程量', '定额编码', '定额名称', '主材单价']);
    data.forEach(function (it) {
      var nm = it.category === 'transport' ? it.name : (it.name + '（' + it.categoryLabel + '）');
      rows.push([it.index, it.listCode12 || it.listCode, nm, it.features, it.unit, it.quantity,
        it.quotaCode || '', it.quotaName || '（待人工处理）', it.price === null ? '' : num2(it.price)]);
      (it.extras || []).forEach(function (x) {
        rows.push([it.index, it.listCode12 || it.listCode, nm, '', it.unit, it.quantity, x.code, x.name, '']);
      });
    });
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 30 }, { wch: 46 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 34 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '建经组价');
    XLSX.writeFile(wb, '暖通专业智能组价_建经_' + stamp() + '.xlsx');
  }

  // 概算模式广联达导出：删除清单行（清单编码整行）与「项目特征」整列，其余列顺序不变。
  // 每条项目以定额行为首行（A 列序号、B 列项目名称），主材/附加定额依次 1.1、1.2……
  function exportGLDGs(data) {
    var rows = [];
    rows.push(['序号', '项目名称', '类型', '参数', '品牌参考', '规格', '规格补充', '工程量',
      '项目编码', '类型', '名称', '单位', '工程量', '主材单价']);
    var zIdx = 0;
    data.forEach(function (it) {
      var d = it.dim;
      var param = it.airVolume ? (it.airVolume + 'm³/h') : '';
      var dimStr = '';
      if (d.diameter) dimStr = 'φ' + d.diameter;
      else if (d.length && d.width) dimStr = d.length + '×' + d.width + (d.height ? '×' + d.height : '');
      if (isDuctCat(it.category) && it.mergedCount) dimStr = ductTierLabel(it);
      var sup = it.category === 'plenum' ? (it.plenumArea ? ('截面积' + it.plenumArea + '㎡') : '')
        : (it.perimeter ? ('周长' + it.perimeter + 'mm') : '');
      var sub = 0;
      rows.push([it.index, it.name, it.categoryLabel, param, it.brand || '', dimStr, sup, it.quantity,
        it.quotaCode || '', '定额行', it.quotaName || '（待人工处理）', it.quotaUnit || it.unit,
        round4(it.quantity / (it.quotaFactor || 1)), '']);
      if (it.priceSource !== 'none') {
        zIdx++;
        rows.push([it.index + '.' + (++sub), '', '', '', '', '', '', '',
          'Z00741-' + String(zIdx).padStart(3, '0'), '子目下设备', it.name, it.unit, it.quantity,
          it.price === null ? '' : num2(it.price)]);
      }
      (it.extras || []).forEach(function (x) {
        rows.push([it.index + '.' + (++sub), '', '', '', '', '', '', '', x.code, '定额行', x.name,
          x.unit || it.unit, round4((x.qty || 0) / (x.factor || 1)), '']);
      });
    });
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 10 }, { wch: 34 }, { wch: 6 }, { wch: 10 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '定额报价表');
    XLSX.writeFile(wb, '概算_暖通专业定额报价表_广联达_' + stamp() + '.xlsx');
  }

  // 概算模式建经导出：删除「项目编码」「项目特征」两列，其余列与预算模式一致
  function exportJianjingGs(data) {
    annotateListCode12(data);
    var rows = [];
    rows.push(['序号', '项目名称', '单位', '工程量', '定额编码', '定额名称', '主材单价']);
    data.forEach(function (it) {
      var nm = it.category === 'transport' ? it.name : (it.name + '（' + it.categoryLabel + '）');
      rows.push([it.index, nm, it.unit, it.quantity, it.quotaCode || '', it.quotaName || '（待人工处理）',
        it.price === null ? '' : num2(it.price)]);
      (it.extras || []).forEach(function (x) {
        rows.push([it.index, nm, it.unit, it.quantity, x.code, x.name, '']);
      });
    });
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 34 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '定额报价表');
    XLSX.writeFile(wb, '概算_暖通专业定额报价表_建经_' + stamp() + '.xlsx');
  }

  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  // ============================================================
  // 页面交互
  // ============================================================
  var exportData = [];

  function currentPeriod() {
    var el = (typeof document !== 'undefined') && document.getElementById('periodSelect');
    if (el && el.value) return el.value;
    var arr = (typeof PIPE !== 'undefined' && PIPE.getPeriods) ? PIPE.getPeriods() : [];
    return (arr[0] || {}).period;
  }

  function initPeriodSelect() {
    var selEl = document.getElementById('periodSelect');
    if (!selEl) return;
    var arr = (typeof PIPE !== 'undefined' && PIPE.getPeriods) ? PIPE.getPeriods() : [];
    selEl.innerHTML = '';
    arr.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.period;
      o.textContent = p.releaseLabel || p.period;
      selEl.appendChild(o);
    });
    selEl.addEventListener('change', function () { refreshAll(); });
  }

  function currentFormat() {
    return (document.querySelector('input[name="software"]:checked') || {}).value || 'guanglianda';
  }

  function refreshAll() {
    if (!window._rawAOA) return;
    exportData = parseRows(window._rawAOA);
    renderTable(exportData);
    var area = document.getElementById('resultArea');
    var btn = document.getElementById('btnGroup');
    var bar = document.getElementById('statusBar');
    if (exportData.length) {
      area.style.display = 'block';
      btn.style.display = 'flex';
      bar.className = 'status-bar status-ok';
      bar.style.display = 'block';
      var mergedCnt = 0;
      exportData.forEach(function (x) { if (x.mergedCount) mergedCnt += x.mergedCount - 1; });
      bar.textContent = '成功解析 ' + exportData.length + ' 条' +
        (mergedCnt ? '（风管同定额已合并 ' + mergedCnt + ' 项）' : '') +
        '（通风机/空调器/风机盘管/油烟净化/各类风管/风口/风阀/消声器/静压箱/人防密闭阀/冷水机组/热泵机组/冷却塔/各类管道，风管类已自动计列场外运输，管道已自动计列消毒冲洗及沟槽管件）；风机请在"类型/选型"列确认轴流或离心；黄色行为需人工核对项';
    } else {
      area.style.display = 'none';
      btn.style.display = 'none';
      bar.className = 'status-bar status-err';
      bar.style.display = 'block';
      bar.textContent = '未在B列识别到暖通设备/风管/风口风阀项目名称，请检查表头是否为：A序号 / B项目名称 / C数量';
    }
  }

  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () {
    if (GS_MODE) {
      document.body.classList.add('gs-mode');
      var h1 = document.querySelector('.header h1');
      if (h1) h1.textContent = h1.textContent.replace('智能组价系统', '概算组价系统').replace('智能组价平台', '概算组价平台');
      var hd = document.querySelector('.header p');
      if (hd) hd.textContent = '概算计价：不套清单编码、不生成项目特征，按项目名称直接套用定额与主材 · 主材价优先信息价、其次市场价 · 全部本地计算';
      var tip = document.createElement('div');
      tip.className = 'gs-tip';
      tip.innerHTML = '📌 <b>概算模式</b>　不套用清单编码与项目特征：广联达导出已删除清单行与项目特征列，建经导出已删除清单编码列与项目特征列；主材价优先取天津市信息价，缺项按市场价。';
      var content = document.querySelector('.content');
      if (content) content.insertBefore(tip, content.firstChild);
    }
    var fileInput = document.getElementById('excelFile');
    var uploadArea = document.getElementById('uploadArea');

    fileInput.addEventListener('change', function (e) {
      if (e.target.files[0]) readFile(e.target.files[0]);
    });
    uploadArea.addEventListener('dragover', function (e) { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', function () { uploadArea.classList.remove('dragover'); });
    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
    });
    uploadArea.addEventListener('click', function () { fileInput.click(); });

    document.querySelectorAll('input[name="software"]').forEach(function (r) {
      r.addEventListener('change', function () { if (exportData.length) renderTable(exportData); });
    });

    document.getElementById('exportBtn').addEventListener('click', function () {
      if (!exportData.length) { alert('没有数据可导出'); return; }
      if (currentFormat() === 'jianjing') exportJianjing(exportData);
      else exportGLD(exportData);
    });
    document.getElementById('resetBtn').addEventListener('click', function () { location.reload(); });

    initPeriodSelect();
  });

  function setBar(cls, text) {
    var bar = document.getElementById('statusBar');
    if (!bar) return;
    bar.className = 'status-bar ' + cls;
    bar.style.display = 'block';
    bar.textContent = text;
  }

  // 精简库(xlsx.mini)不含 .xls(BIFF) 与部分编码表；遇到老格式时按需补载完整库
  var fullXlsxState = 0, fullXlsxCbs = [];
  function ensureFullXlsx(cb) {
    if (window.__xlsxFull) return cb(null);
    fullXlsxCbs.push(cb);
    if (fullXlsxState === 1) return;
    fullXlsxState = 1;
    var s = document.createElement('script');
    s.src = 'js/xlsx.full.min.js';
    s.onload = function () {
      window.__xlsxFull = true;
      fullXlsxState = 2;
      var l = fullXlsxCbs.slice(); fullXlsxCbs = [];
      l.forEach(function (f) { f(null); });
    };
    s.onerror = function () {
      fullXlsxState = 3;
      var l = fullXlsxCbs.slice(); fullXlsxCbs = [];
      l.forEach(function (f) { f(new Error('兼容组件加载失败，请检查网络后重试')); });
    };
    document.head.appendChild(s);
  }

  function parseWorkbook(buf) {
    var wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
    var ws = wb.Sheets[wb.SheetNames[0]];
    window._rawAOA = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    refreshAll();
  }

  function readFile(file) {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setBar('status-err', '请上传 .xlsx / .xls 文件');
      return;
    }
    var legacy = /\.xls$/i.test(file.name);
    var reader = new FileReader();
    reader.onload = function (e) {
      var buf = e.target.result;
      if (legacy) {
        setBar('status-loading', '正在加载 .xls 兼容组件…');
        ensureFullXlsx(function (err) {
          if (err) { setBar('status-err', err.message); return; }
          try { parseWorkbook(buf); } catch (err2) { setBar('status-err', '文件解析失败：' + err2.message); }
        });
        return;
      }
      try {
        parseWorkbook(buf);
      } catch (err) {
        // 个别 .xlsx（特殊编码/加密外壳）精简库解析不了，自动升级完整库重试一次
        ensureFullXlsx(function (e2) {
          if (e2) { setBar('status-err', '文件解析失败：' + err.message); return; }
          try { parseWorkbook(buf); } catch (err3) { setBar('status-err', '文件解析失败：' + err3.message); }
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // 本地调试/自动化句柄（纯前端本地计算）
  if (typeof window !== 'undefined') {
    window.__hvac = {
      parseRows: parseRows, matchQuota: matchQuota, buildItem: buildItem, classify: classify,
      recomputeQuota: recomputeQuota, recomputePrice: recomputePrice,
      exportGLD: exportGLD, exportJianjing: exportJianjing,
      getData: function () { return exportData; },
      setAOA: function (aoa) { window._rawAOA = aoa; refreshAll(); return exportData; },
      setSub: function (i, v) {
        var it = exportData[i]; it.sub = v;
        recomputeQuota(it); recomputePrice(it); it.features = generateFeature('guanglianda', it);
        renderTable(exportData);
      },
      setPipe: function (i, loc, joint) {
        var it = exportData[i];
        if (loc) it.loc = loc;
        if (joint) { it.joint = joint; it.jointFromName = true; it.jointFallback = null; }
        if (PIPE && PIPE.LIST[it.category]) {
          var allow = PIPE.jointsOf(it);
          if (allow.indexOf(it.joint) < 0) it.joint = PIPE.defaultJoint(it);
          it.brand = PIPE.brandOf(it) || it.brand;
        }
        recomputeQuota(it); recomputePrice(it); it.features = generateFeature('guanglianda', it);
        renderTable(exportData);
      },
      setDn: function (i, dn) {
        var it = exportData[i];
        it.dn = dn ? parseInt(dn, 10) : null;
        recomputeQuota(it); recomputePrice(it); it.features = generateFeature('guanglianda', it);
        renderTable(exportData);
      },
      withBracket: withBracket, valveWaterPrice: valveWaterPrice, bracketWeightPerM: bracketWeightPerM,
      PIPE: PIPE
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      annotateListCode12: annotateListCode12,
      classify: classify, buildItem: buildItem, matchQuota: matchQuota, lookupPrice: lookupPrice,
      parseRows: parseRows, parseAirVolume: parseAirVolume, parseDim: parseDim, parseCoolingKw: parseCoolingKw,
      calcPerimeter: calcPerimeter, calcArea: calcArea, LIST: LIST, LIST_NAME: LIST_NAME,
      TYPE_OPTS: TYPE_OPTS, specText: specText, recomputeQuota: recomputeQuota, recomputePrice: recomputePrice,
      CAT_LABEL: CAT_LABEL, mergeDucts: mergeDucts, withTransport: withTransport, ductTierLabel: ductTierLabel,
      ductShapeOf: ductShapeOf, ductTiersOf: ductTiersOf, ductMetricOf: ductMetricOf, isDuctCat: isDuctCat,
      DUCT_RECT_TIERS: DUCT_RECT_TIERS, DUCT_ROUND_TIERS: DUCT_ROUND_TIERS, DUCT_CLEAN_TIERS: DUCT_CLEAN_TIERS,
      DUCT_SS_TIERS: DUCT_SS_TIERS, DUCT_PL_ROUND: DUCT_PL_ROUND, DUCT_PL_RECT: DUCT_PL_RECT,
      DUCT_FRP_ROUND: DUCT_FRP_ROUND, DUCT_FRP_RECT: DUCT_FRP_RECT, DUCT_COMP_ROUND: DUCT_COMP_ROUND,
      DUCT_COMP_RECT: DUCT_COMP_RECT, DUCT_FLEX_TIERS: DUCT_FLEX_TIERS, generateFeature: generateFeature,
      buildWarn: buildWarn, exportGLD: exportGLD, exportJianjing: exportJianjing,
      exportGLDGs: exportGLDGs, exportJianjingGs: exportJianjingGs,
      CHILLER_TIERS: CHILLER_TIERS, HEATPUMP_TIERS: HEATPUMP_TIERS, TOWER_TIERS: TOWER_TIERS,
      parseChillerType: parseChillerType, parseWaterFlow: parseWaterFlow, equipPrice: equipPrice,
      typeLabel: typeLabel, PIPE: PIPE,
      WVALVE_THREAD: WVALVE_THREAD, WVALVE_FLANGE: WVALVE_FLANGE, FLOAT_TIERS: FLOAT_TIERS, LEVEL_TIERS: LEVEL_TIERS,
      SOL_THREAD: SOL_THREAD, SOL_FLANGE: SOL_FLANGE,
      parseValveDn: parseValveDn, parseValveDnStrict: parseValveDnStrict, parseWaterValveKind: parseWaterValveKind, isWaterValveName: isWaterValveName,
      valveWaterPrice: valveWaterPrice, withBracket: withBracket, bracketWeightPerM: bracketWeightPerM
    };
  }
})();
