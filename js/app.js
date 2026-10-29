/* ============================================================
 * 暖通专业智能组价系统
 * 天津2025清单计价规范 / 2020预算基价 第九册（通风空调工程）
 * 输入：A列序号 / B列项目名称 / C列数量
 * 输出：清单编码 + 定额编码 + 主材价 + 项目特征，支持广联达 / 建经 双格式导出
 * ============================================================ */
(function () {
  'use strict';

  var P = (typeof window !== 'undefined' && window.HVAC_PRICES) ? window.HVAC_PRICES
    : (typeof require !== 'undefined' ? require('../data/prices.js') : {});

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
    duct: ''                // 风管：未匹配标准定额 → 统一套补充清单030806801 + 补N
  };
  var LIST_NAME = {
    heater: '空气加热器、冷却器', dedust: '除尘设备', acu: '空调器', fcu: '风机盘管',
    dehum: '除湿机', filter: '过滤吸收器', fume: '油烟净化器', vav: '变风量末端',
    fan: '通风机', valve: '碳钢阀门', vent: '风口', silencer: '消声器',
    plenum: '静压箱', renfang: '人防手动密闭阀'
  };

  // 未匹配清单/定额时统一套用的补充清单编码
  var SUPP_LIST = '030806801';
  var buSeq = 0;   // 补充定额流水号：补1、补2、补3……

  var CAT_LABEL = {
    fan: '通风机', acu: '空调器', fcu: '风机盘管', fume: '油烟净化',
    heater: '空气加热/冷却器', dedust: '除尘设备', dehum: '除湿机', filter: '过滤吸收器',
    vav: '变风量末端', vent: '风口', valve: '风阀', silencer: '消声器',
    plenum: '静压箱', renfang: '人防密闭阀', other: '其他（未匹配）'
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
    plenum: '静压箱制作（成品）、安装、固定',
    renfang: '阀体安装、固定、密闭检查',
    duct: '风管制作（成品采购）、法兰/咬口、安装、固定、漏光漏风试验',
    other: '待补充：请按实际做法填写工作内容'
  };

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
  var O_DIFF_RD = [T(628, '9-105', '直径200mm以内'), T(1131, '9-106', '直径360mm以内'), T(Infinity, '9-107', '直径360mm以外')];
  var O_LOUVER_ADJ = [T(800, '9-122', '800mm以内'), T(1200, '9-123', '1200mm以内'), T(1800, '9-124', '1800mm以内'), T(2400, '9-125', '2400mm以内'), T(3200, '9-126', '3200mm以内'), T(Infinity, '9-127', '3200mm以外')];
  var O_ROUND_ADJ = [T(800, '9-128', '800mm以内'), T(1200, '9-129', '1200mm以内'), T(1800, '9-130', '1800mm以内'), T(2400, '9-131', '2400mm以内'), T(3200, '9-132', '3200mm以内'), T(4000, '9-133', '4000mm以内'), T(Infinity, '9-134', '4000mm以外')];
  var O_PLATE = [T(800, '9-140', '800mm以内'), T(1280, '9-141', '1280mm以内'), T(1600, '9-142', '1600mm以内'), T(2000, '9-143', '2000mm以内'), T(2800, '9-144', '2800mm以内'), T(3200, '9-145', '3200mm以内'), T(Infinity, '9-146', '3200mm以外')];
  var O_MULTI = [T(1200, '9-147', '1200mm以内'), T(2000, '9-148', '2000mm以内'), T(2600, '9-149', '2600mm以内'), T(3200, '9-150', '3200mm以内'), T(3800, '9-151', '3800mm以内'), T(4400, '9-152', '4400mm以内'), T(4800, '9-153', '4800mm以内'), T(Infinity, '9-154', '4800mm以外')];

  // 消声器（周长分档，mm）
  var S_MICRO = [T(1800, '9-190', '1800mm以内'), T(2800, '9-191', '2800mm以内'), T(3800, '9-192', '3800mm以内'), T(4800, '9-193', '4800mm以内'), T(6000, '9-194', '6000mm以内'), T(Infinity, '9-195', '6000mm以外')];
  var S_IMPED = [T(2200, '9-196', '2200mm以内'), T(3000, '9-197', '3000mm以内'), T(3800, '9-198', '3800mm以内'), T(4800, '9-199', '4800mm以内'), T(Infinity, '9-200', '4800mm以外')];
  var S_PIPE = [T(1280, '9-201', '1280mm以内'), T(2000, '9-202', '2000mm以内'), T(3000, '9-203', '3000mm以内'), T(Infinity, '9-204', '3000mm以外')];

  // 静压箱（截面积分档，m²）
  var PLENUM_TIERS = [T(0.8, '9-213', '0.8m²以内'), T(3.5, '9-214', '3.5m²以内'), T(Infinity, '9-215', '3.5m²以外')];

  // 人防手动密闭阀（直径分档，mm）
  var RF_TIERS = [T(200, '9-423', '200mm以内'), T(300, '9-424', '300mm以内'), T(400, '9-425', '400mm以内'), T(500, '9-426', '500mm以内'), T(600, '9-427', '600mm以内'), T(800, '9-428', '800mm以内'), T(Infinity, '9-429', '800mm以外')];

  // ============================================================
  // 类型下拉选项（输出页面手动选择）
  // ============================================================
  var TYPE_OPTS = {
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
      { v: 'split', label: '分体空调' },
      { v: 'vrf', label: '多联机VRF' }
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

  // 风机类型
  function parseFanType(name) {
    if (/离心/.test(name)) return 'centrifugal';
    if (/轴流|斜流|混流/.test(name)) return 'axial';
    return null;
  }

  // 空调器形式
  function parseAcuForm(name) {
    if (/多联|VRF|室外机|室内机/.test(name)) return 'vrf';
    if (/组合式|空调机组|恒温恒湿|精密空调/.test(name)) return 'unit';
    if (/新风/.test(name)) return 'pau';
    if (/吊顶/.test(name)) return 'ceiling';
    if (/落地|柜式/.test(name)) return 'floor';
    if (/墙上|壁挂|壁装/.test(name)) return 'wall';
    if (/分体|空气幕/.test(name)) return 'split';
    return null;
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
    if (/圆形散流器/.test(name)) return 'diffuserRd';
    if (/旋流/.test(name)) return 'diffuserRd';
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
  function classify(name) {
    if (!name) return null;
    var n = String(name);

    // 静压箱、消声器优先
    if (/静压箱/.test(n)) return 'plenum';
    if (/消声器|消声弯头|消声静压/.test(n)) return 'silencer';
    // 人防密闭阀
    if (/人防/.test(n) && /密闭|阀门|阀/.test(n)) return 'renfang';
    // 风口类（防火风口、多叶送/排烟口、板式排烟口、散流器、百叶、风口）
    if (/防火风口/.test(n)) return 'vent';
    if (/多叶送|多叶排烟|多叶送风|多叶排风/.test(n)) return 'vent';
    if (/板式排烟口/.test(n)) return 'vent';
    if (/散流器|旋流/.test(n)) return 'vent';
    if (/风口/.test(n)) return 'vent';
    if (/百叶/.test(n) && !/阀/.test(n)) return 'vent';
    // 风阀类
    if (/阀/.test(n)) return 'valve';
    // 风管类（风管机属空调器，需先排除）
    if (/风管机/.test(n)) return 'acu';
    if (/风管|风道|通风管道|送风管道|排风管道|排烟管道|送回风管/.test(n)) return 'duct';

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

    if (category === 'duct') {
      it.unit = 'm²';
      it.brand = P.duct.brand;
      var dp = calcPerimeter(it.dim);
      it.ductPeri = dp;
      it.plate = ductPlate(dp);
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
      it.brand = (it.sub === 'pau') ? P.pau.brand : (it.sub === 'unit' ? P.ahu.brand : '国产中高档');
    }
    if (category === 'fcu') {
      it.sub = parseFcuMount(name);
      it.fcuModel = (name.match(/FP[\s-]*\d{2,3}/i) || [''])[0].replace(/\s+/g, '').toUpperCase();
      it.brand = P.fcu.brand;
    }
    if (category === 'fume') it.brand = P.fume.brand;
    if (category === 'vent') { it.sub = parseVentType(name); it.brand = P.vent.brand; }
    if (category === 'valve') { it.sub = parseValveType(name); it.brand = P.valve.brand; }
    if (category === 'silencer') { it.sub = parseSilencerType(name); it.brand = P.silencer.brand; }
    if (category === 'plenum') it.brand = P.plenum.brand;
    if (category === 'renfang') { it.sub = /电动/.test(name) ? 'manualE' : 'manual'; it.brand = P.renfang.brand; }

    it.perimeter = calcPerimeter(it.dim);
    it.area = calcArea(it.dim);
    it.surface = calcSurface(it.dim);
    it.sectionArea = calcSection(it.dim);
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
      if (s === 'ceiling') return { code: '9-248', name: '吊顶式空调器安装 质量0.15t以内', inferred: true, massTier: true };
      if (s === 'floor') return { code: '9-251', name: '落地式空调器安装 质量1.0t以内', inferred: true, massTier: true };
      if (s === 'wall') return { code: '9-254', name: '墙上式空调器安装 质量0.1t以内', inferred: true, massTier: true };
      if (s === 'split') return { code: '9-251', name: '落地式空调器安装 质量1.0t以内（分体空调按落地式套用）', inferred: true, massTier: true };
      if (s === 'vrf') return { code: '9-251', name: '落地式空调器安装 质量1.0t以内（多联机按落地式套用）', inferred: true, massTier: true, vrf: true };
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
      var q5 = pick(PLENUM_TIERS, it.sectionArea, '静压箱安装 截面积');
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

    return { code: '', name: '' };
  }

  // ============================================================
  // 主材价
  // ============================================================
  function coefByVolume(table, v) {
    for (var i = 0; i < table.length; i++) if (v <= table[i].max) return table[i];
    return table[table.length - 1];
  }

  function lookupPrice(it) {
    var s = it.sub;

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
      if (s === 'split') {
        var kwS = parseCoolingKw(it.name);
        if (kwS) {
          var prS = Math.round(kwS * 800);
          return { price: prS, source: 'market', basis: '市场价（' + P.acuUnit.brand + '）：分体空调 制冷量' + kwS + 'kW × 800元/kW = ' + prS + '元/台' };
        }
        return { price: 4200, source: 'market', basis: '市场价（国产中高档）：分体空调（壁挂/柜式）含安装辅材 4200元/台' };
      }
      if (s === 'vrf') {
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
    if (it.category === 'duct') return ductPrice(it);
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
      var pp = +(sf * P.plenum.coef * P.plenum.factor).toFixed(2);
      return { price: pp, source: 'market', basis: '市场价：展开面积' + sf + '㎡ × ' + P.plenum.coef + '元/㎡ × ' + P.plenum.factor + '系数 = ' + pp + '元/个' };
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
    return { price: price, source: 'market', basis: '市场价（' + cfg.brand + '）：面积' + G + '㎡ × ' + coef + '元/㎡ + ' + base + '元，×' + cfg.factor + '系数 = ' + price + '元/个' + note };
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
    price = +price.toFixed(2);
    return { price: price, source: 'market', basis: '市场价（' + cfg.brand + '）：' + basis + ' = ' + price + '元/个' };
  }

  // 风管板厚档：按风管周长(mm)推定，符合《通风与空调工程施工质量验收规范》常用板厚
  function ductPlate(peri) {
    var pl = P.duct.plates;
    for (var i = 0; i < pl.length; i++) if (peri <= pl[i].max) return pl[i];
    return pl[pl.length - 1];
  }

  function ductPrice(it) {
    var cfg = P.duct, pl = it.plate || ductPlate(it.ductPeri || 0);
    var price = +(pl.kg * cfg.perKg).toFixed(2);
    var spec = it.ductPeri ? '周长' + it.ductPeri + 'mm' : '未识别规格';
    return {
      price: price, source: 'market',
      basis: '市场价（' + cfg.brand + '）：' + spec + '→ 板厚δ' + pl.t + 'mm（' + pl.kg + 'kg/㎡）× ' + cfg.perKg + '元/kg = ' + price + '元/㎡'
    };
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
    if (quota.noTier) {
      if (it.category === 'fan' || it.category === 'fume' || it.category === 'acu') w.push('未识别风量(m³/h)，请在名称中注明（如 5000m³/h）或手选定额');
      if (it.category === 'vent' || it.category === 'valve') w.push('未识别规格尺寸（如 800×400 或 φ400），请在名称中注明或手选定额');
      if (it.category === 'silencer') w.push('未识别消声器规格（长×宽），请核对名称');
      if (it.category === 'duct') w.push('未识别风管规格（如 1000×400），板厚按最小档计，请核对名称');
      if (it.category === 'plenum') w.push('未识别静压箱尺寸（长×宽×高），请核对名称');
      if (it.category === 'renfang') w.push('未识别人防密闭阀直径（如 φ300），请核对名称');
    }
    if (quota.supp) w.push('未匹配到标准清单/定额，已按补充清单' + SUPP_LIST + '＋' + quota.code + '计列，请补录定额与单价依据');
    if (it.category === 'other') w.push('未识别项目类型，请手动确认清单与定额');
    if (quota.overRange) w.push('参数超本类最大档，已取顶档子目，请按基价表核对');
    if (quota.massTier) w.push('空调器定额按设备质量分档（0.15t/0.3t/0.5t…），名称未注质量，暂按最小档，请按实际重量核对');
    if (it.category === 'acu' && it.sub === 'pau') w.push('新风机组按组合式空调机组子目（9-257~264）套用，如基价表另有新风机组专用子目请手选');
    if (it.category === 'acu' && it.sub === 'split') w.push('分体空调按落地式空调器子目（9-251）套用，如按"空调器安装"其他子目计请手选');
    if (it.category === 'acu' && it.sub === 'vrf') w.push('多联机室内/室外机按落地式空调器子目（9-251）套用，设备价按HP询价，如基价表另有多联机子目请手选');
    if (it.category === 'fcu' && !it.fcuModel) w.push('未识别风机盘管FP型号，主材按FP-85参考价计，请按实际型号核对');
    if (it.category === 'vent' && it.sub === 'diffuserRd' && /旋流/.test(it.name)) w.push('旋流风口暂按圆形散流器子目，如有专用子目请手选');
    if (it.category === 'valve' && it.sub === 'butterfly' && !/蝶阀/.test(it.name)) w.push('未识别阀型，暂按蝶阀（9-63~67），请核对');
    if (it.category === 'silencer' && !it.perimeter) w.push('未识别消声器截面（长×宽），主材价按0计，请核对名称');
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
      var lbl = { unit: '组合式空调机组', pau: '新风机组', ceiling: '吊顶式', floor: '落地式', wall: '墙上式', split: '分体空调', vrf: '多联机' }[it.sub] || '';
      var hp = it.name.match(/(\d+(?:\.\d+)?)\s*(?:HP|hp|匹)/);
      if (hp) lbl += ' ' + hp[1] + 'HP';
      return (it.airVolume ? '风量' + it.airVolume + 'm³/h ' : '') + lbl;
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
    // 风管：规格 + 板厚
    if (it.category === 'duct') {
      return (dimStr || '未识别规格') + (it.plate ? ' δ' + Number(it.plate.t).toFixed(2) + 'mm' : '');
    }
    // 风口/风阀/消声器/静压箱
    if (it.category === 'plenum') {
      return (dimStr || '') + (it.sectionArea ? '（截面积' + it.sectionArea + '㎡）' : '');
    }
    var extra = '';
    if (it.perimeter) extra = '（周长' + it.perimeter + 'mm）';
    return dimStr ? dimStr + extra : '';
  }

  function typeLabel(it) {
    var opts = TYPE_OPTS[it.category];
    if (!opts) return '';
    for (var i = 0; i < opts.length; i++) if (opts[i].v === it.sub) return opts[i].label;
    return '';
  }

  function generateFeature(format, it) {
    var lines = [];
    lines.push('1.名称：' + it.name);
    var sp = specText(it);
    if (sp) lines.push('2.规格型号：' + sp);
    var tl = typeLabel(it);
    if (tl) lines.push('3.类型：' + tl);
    if (it.brand) lines.push('4.品牌参考：' + it.brand);
    lines.push('5.其他：' + (CAT_WORK[it.category] || ''));
    return lines.join('\n');
  }

  // ============================================================
  // 主流程
  // ============================================================
  var PRICED_CATS = { fan: 1, acu: 1, fcu: 1, fume: 1, heater: 1, dedust: 1, dehum: 1, filter: 1, vav: 1, vent: 1, valve: 1, silencer: 1, plenum: 1, renfang: 1, duct: 1, other: 1 };

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
        var t = cellText(row[c]);
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

      if (it.category === 'other') {
        // 既无工程量又不含数字，视为标题/说明行跳过
        if (!(!isNaN(qty) && qty > 0) && !/\d/.test(name)) continue;
      }

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
      it.unit = unitCell || ((it.category === 'vent' || it.category === 'valve' || it.category === 'silencer' ||
        it.category === 'plenum' || it.category === 'renfang') ? '个'
        : (it.category === 'duct' ? 'm²' : '台'));

      var quota = matchQuota(it);
      quota = applySupp(it, quota);
      it.quotaCode = quota.code;
      it.quotaName = quota.name;
      it.codeInferred = !!quota.inferred;
      it.supp = !!quota.supp;
      it.warn = buildWarn(it, quota);
      if (it.qtyWarn) it.warn = (it.warn ? it.warn + '；' : '') + '工程量缺失，暂按1' + it.unit + '计请核对';

      var info = lookupPrice(it);
      if (info && info.price !== null) {
        it.price = info.price;
        it.priceSource = info.source;
        it.priceBasis = info.basis || '';
      } else {
        it.price = null;
        it.priceSource = PRICED_CATS[it.category] ? 'pending' : 'na';
        it.priceBasis = '';
      }

      it.features = generateFeature('guanglianda', it);
      results.push(it);
    }
    return results;
  }

  function recomputeQuota(it) {
    if (it.listCodeOrig !== undefined) it.listCode = it.listCodeOrig;
    var q = applySupp(it, matchQuota(it));
    it.supp = !!q.supp;
    it.quotaCode = q.code;
    it.quotaName = q.name;
    it.codeInferred = !!q.inferred;
    it.warn = buildWarn(it, q);
    if (it.qtyWarn) it.warn = (it.warn ? it.warn + '；' : '') + '工程量缺失，暂按1' + it.unit + '计请核对';
  }
  function recomputePrice(it) {
    var info = lookupPrice(it);
    if (info && info.price !== null) {
      it.price = info.price; it.priceSource = info.source; it.priceBasis = info.basis || '';
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
    return '<span class="tag tag-market" ' + tip + '>市场价</span> <span ' + tip + '>¥' + item.price.toFixed(2) + '</span>';
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
    var opts = TYPE_OPTS[it.category];
    if (!opts) return '<span class="lay-static">—</span>';
    var h = '';
    for (var i = 0; i < opts.length; i++) h += opt(opts[i].v, it.sub, opts[i].label);
    return sel('sub', it._i, h, 'lay-sub');
  }

  function renderTable(data) {
    var tb = document.getElementById('tableBody');
    if (!tb) return;
    var html = '';
    for (var i = 0; i < data.length; i++) {
      var it = data[i];
      it._i = i;
      html += '<tr class="' + (it.warn ? 'row-warn' : '') + '">'
        + '<td>' + esc(it.index) + '</td>'
        + '<td class="cell-qcode">' + esc(it.listCode) + '</td>'
        + '<td class="cell-name">' + esc(it.name) + '</td>'
        + '<td class="cell-type">' + layCell(it) + '</td>'
        + '<td class="cell-spec">' + esc(specText(it)) + '</td>'
        + '<td class="cell-brand">' + esc(it.brand || '') + '</td>'
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
      if (d.category === 'vent' || d.category === 'valve' || d.category === 'renfang') ovo++;
      else if (d.category === 'silencer' || d.category === 'plenum') other++;
      else if (d.category === 'duct') duct++;
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

  function exportGLD(data) {
    var rows = [];
    rows.push(['序号', '项目名称', '类型', '参数', '品牌参考', '规格', '规格补充', '工程量',
      '项目编码', '类型', '名称', '项目特征', '单位', '工程量', '主材单价']);
    data.forEach(function (it) {
      var d = it.dim;
      var param = it.airVolume ? (it.airVolume + 'm³/h') : '';
      var dimStr = '';
      if (d.diameter) dimStr = 'φ' + d.diameter;
      else if (d.length && d.width) dimStr = d.length + '×' + d.width + (d.height ? '×' + d.height : '');
      var sup = it.category === 'plenum' ? (it.sectionArea ? ('截面积' + it.sectionArea + '㎡') : '')
        : (it.perimeter ? ('周长' + it.perimeter + 'mm') : '');
      // 清单行
      rows.push([it.index, it.name, it.categoryLabel, param, it.brand || '', dimStr, sup, it.quantity,
        it.listCode, '清单', LIST_NAME[it.category] || it.categoryLabel, it.features, it.unit, it.quantity, '']);
      // 定额行
      rows.push(['', '', '', '', '', '', '', '',
        it.quotaCode || '', '定额', it.quotaName || '（待人工处理）', '', '', '', '']);
      // 子目下设备行（主材）
      rows.push(['', '', '', '', '', '', '', '',
        'Z00741', '子目下设备', it.brand || '主材', '主材：' + (specText(it) || it.name), it.unit, it.quantity,
        it.price === null ? '' : num2(it.price)]);
    });
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 10 }, { wch: 34 }, { wch: 44 }, { wch: 6 }, { wch: 10 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '广联达组价');
    XLSX.writeFile(wb, '暖通专业智能组价_广联达_' + stamp() + '.xlsx');
  }

  function exportJianjing(data) {
    var rows = [];
    rows.push(['序号', '项目编码', '项目名称', '项目特征', '单位', '工程量', '定额编码', '定额名称', '主材单价']);
    data.forEach(function (it) {
      rows.push([it.index, it.listCode, it.name + '（' + it.categoryLabel + '）', it.features, it.unit, it.quantity,
        it.quotaCode || '', it.quotaName || '（待人工处理）', it.price === null ? '' : num2(it.price)]);
    });
    var ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 30 }, { wch: 46 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 34 }, { wch: 12 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '建经组价');
    XLSX.writeFile(wb, '暖通专业智能组价_建经_' + stamp() + '.xlsx');
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
      bar.textContent = '成功解析 ' + exportData.length + ' 条（通风机/空调器/风机盘管/油烟净化/风口/风阀/消声器/静压箱/人防密闭阀）；风机请在"类型/选型"列确认轴流或离心；黄色行为需人工核对项';
    } else {
      area.style.display = 'none';
      btn.style.display = 'none';
      bar.className = 'status-bar status-err';
      bar.style.display = 'block';
      bar.textContent = '未在B列识别到暖通设备/风口风阀项目名称，请检查表头是否为：A序号 / B项目名称 / C数量';
    }
  }

  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () {
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
  });

  function readFile(file) {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      var bar = document.getElementById('statusBar');
      bar.className = 'status-bar status-err';
      bar.style.display = 'block';
      bar.textContent = '请上传 .xlsx / .xls 文件';
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        window._rawAOA = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        refreshAll();
      } catch (err) {
        var b2 = document.getElementById('statusBar');
        b2.className = 'status-bar status-err';
        b2.style.display = 'block';
        b2.textContent = '文件解析失败：' + err.message;
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
      }
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      classify: classify, buildItem: buildItem, matchQuota: matchQuota, lookupPrice: lookupPrice,
      parseRows: parseRows, parseAirVolume: parseAirVolume, parseDim: parseDim, parseCoolingKw: parseCoolingKw,
      calcPerimeter: calcPerimeter, calcArea: calcArea, LIST: LIST, LIST_NAME: LIST_NAME,
      TYPE_OPTS: TYPE_OPTS, specText: specText, recomputeQuota: recomputeQuota, recomputePrice: recomputePrice,
      CAT_LABEL: CAT_LABEL
    };
  }
})();
