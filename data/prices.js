/* ============================================================
 * 暖通专业智能组价系统 - 价格与系数库
 * 口径：主材（设备）购置价，国产中高档/合资品牌市场参考价，含税口径按 0.5 系数折减
 * 说明：暖通设备与风口风阀无官方月度信息价，全部按市场参考价（priceSource = market）
 * 维护：新增/调整价格只改本文件，app.js 不写死单价
 * ============================================================ */
(function (root) {
  var HVAC_PRICES = {

    /* ---------- 风机类：设备单价 = 风量(m³/h) × 系数 ---------- */
    fan: {
      brand: '亿利达（国产中高档）',
      axial: [ // 轴流/斜流/混流
        { max: 5000, coef: 0.38 },
        { max: 10000, coef: 0.36 },
        { max: 20000, coef: 0.34 },
        { max: 30000, coef: 0.35 },
        { max: 50000, coef: 0.28 },
        { max: 80000, coef: 0.24 },
        { max: Infinity, coef: 0.20 }
      ],
      centrifugal: [
        { max: 4500, coef: 0.55 },
        { max: 10000, coef: 0.45 },
        { max: 20000, coef: 0.38 },
        { max: Infinity, coef: 0.30 }
      ],
      toilet: { price: 180, label: '卫生间通风器/排气扇（含止回阀）' }
    },

    /* ---------- 新风机组 PAU ---------- */
    pau: {
      brand: '麦克维尔（合资）',
      table: [
        { max: 2000, coef: 4.2 },
        { max: 5000, coef: 3.5 },
        { max: 10000, coef: 3.0 },
        { max: 15000, coef: 2.8 },
        { max: Infinity, coef: 2.4 }
      ]
    },

    /* ---------- 组合式空调机组 AHU ---------- */
    ahu: {
      brand: '约克（合资）',
      table: [
        { max: 4000, coef: 4.0 },
        { max: 10000, coef: 3.2 },
        { max: 20000, coef: 2.8 },
        { max: 40000, coef: 2.5 },
        { max: 80000, coef: 2.2 },
        { max: Infinity, coef: 1.8 }
      ]
    },

    /* ---------- 吊顶/落地/墙上式空调器、多联机：按制冷量 kW 或风量参考 ---------- */
    acuUnit: {
      ceiling: { perKw: 1300, perVol: 3.2, label: '吊顶式空调器（风管机）' },
      floor: { perKw: 760, perVol: 3.6, label: '落地式空调器（柜机）' },
      wall: { perKw: 800, perVol: 3.4, label: '墙上式空调器（壁挂机）' },
      brand: '格力/美的（国产中高档）'
    },

    /* ---------- 风机盘管：按型号一口价 ---------- */
    fcu: {
      brand: '开利（合资）',
      table: [
        { type: 'FP-34', price: 850 },
        { type: 'FP-51', price: 980 },
        { type: 'FP-68', price: 1150 },
        { type: 'FP-85', price: 1350 },
        { type: 'FP-102', price: 1580 },
        { type: 'FP-136', price: 1850 },
        { type: 'FP-170', price: 2200 },
        { type: 'FP-204', price: 2650 },
        { type: 'FP-238', price: 3100 }
      ],
      fallback: { price: 1350, type: 'FP-85' }
    },

    /* ---------- 油烟净化机组 ---------- */
    fume: {
      brand: '科蓝（国产中高档）',
      table: [
        { max: 4000, coef: 3.0 },
        { max: 8000, coef: 2.6 },
        { max: 15000, coef: 2.3 },
        { max: 30000, coef: 2.0 },
        { max: Infinity, coef: 1.8 }
      ]
    },

    /* ---------- 风口 / 风阀 / 消声器 / 静压箱 计价系数 ----------
     * 风口风阀：主材 = (面积㎡ × coef + base) × 0.5
     * 消声器  ：主材 = 周长(m) × 580 × 0.5 / 1000   （沿用原站口径）
     * 静压箱  ：主材 = 展开面积㎡ × 480 × 0.5
     */
    vent: {
      brand: '国产中高档',
      factor: 0.5,
      coef: {
        louver1: { coef: 660, base: 66, label: '单层百叶风口' },
        louver2: { coef: 720, base: 72, label: '双层百叶风口' },
        rain: { coef: 720, base: 840, label: '防雨百叶风口' },
        autodrop: { coef: 969, base: 66, label: '自垂式百叶风口' },
        hinge: { coef: 900, base: 96, label: '门铰式回风口' },
        ventE: { coef: 660, base: 66, label: '电动风口' },
        fireVent: { coef: 660, base: 66, label: '防火风口（按单层百叶）' },
        diffuserSq: { coef: 1020, base: 96, label: '方形散流器' },
        diffuserRd: { coef: 1020, base: 96, label: '圆形散流器' },
        louverAdj: { coef: 660, base: 66, label: '带调节阀百叶风口' },
        roundAdj: { coef: 1020, base: 96, label: '圆形带调节阀风口' },
        multileafOutlet: { coef: 1992, base: 696, label: '多叶送/排烟口' },
        plateOutlet: { coef: 1896, base: 660, label: '板式排烟口' }
      },
      // 面积分档修正（多叶/板式：小于0.5㎡ 用高档系数）
      smallArea: 0.5,
      multileafBig: { coef: 1928, base: 728 },
      plateBig: { coef: 1836, base: 696 },
      diffuserAdjTimes: 2.1,          // 散流器带调节阀 = 散流器价 × 2.1
      ventEAdd: [{ max: 1, add: 200 }, { max: Infinity, add: 350 }]
    },

    valve: {
      brand: '国产中高档',
      factor: 0.5,
      fire70: [
        { max: 0.5, coef: 1480, base: 220 },
        { max: 1, coef: 1418, base: 260 },
        { max: Infinity, coef: 1380, base: 280 }
      ],
      fire70e: [
        { max: 1, coef: 1418, base: 260, add: 400 },
        { max: Infinity, coef: 1418, base: 260, add: 1200 }
      ],
      fire280: [
        { max: 0.5, coef: 2040, base: 312 },
        { max: 1, coef: 1800, base: 420 },
        { max: Infinity, coef: 1620, base: 610 }
      ],
      fire280e: [
        { max: 1, coef: 1800, base: 420, add: 550 },
        { max: Infinity, coef: 1620, base: 610, add: 1200 }
      ],
      butterfly: { coef: 950, base: 80, add: 0 },
      butterflyE: { coef: 950, base: 80, add: 200 },
      check: [
        { max: 1.5, coef: 1230, base: 130 },
        { max: Infinity, coef: 1200, base: 130 }
      ],
      sluice: { coef: 1100, base: 120 },
      multileaf: [
        { max: 0.5, coef: 1050, base: 120 },
        { max: Infinity, coef: 1000, base: 100 }
      ],
      multileafE: [
        { max: 1, coef: 1992, base: 696, add: 400 },
        { max: Infinity, coef: 1992, base: 696, add: 1200 }
      ],
      tee: { coef: 1000, base: 100, add: 100 },
      sealed: { coef: 1200, base: 120, add: 0, addE: 400 },
      cav: { times: 4 },              // 定风量阀 = 对开多叶调节阀价 × 4
      overpressure: { coef: 800, base: 80 }
    },

    /* 人防手动密闭阀：整类统一标准 = 直径(mm) × 单价，尺寸越大价越高，保证单调 */
    renfang: {
      brand: '国产人防（3C认证）',
      perMm: 2.6,
      minPrice: 380,
      addE: 400
    },

  // 风管（镀锌钢板）：按板厚档给主材价（元/m²），板厚按风管周长推定
  duct: {
    brand: '国产镀锌钢板（首钢/鞍钢）',
    perKg: 5.2,
    plates: [
      { max: 2000, t: 0.75, kg: 5.89 },
      { max: 4000, t: 1.00, kg: 7.85 },
      { max: 99999, t: 1.20, kg: 9.42 }
    ]
  },

    /* 消声器：整类统一标准 = 周长(m) × 单价（按1m标准节长），随截面单调递增 */
    silencer: {
      brand: '国产中高档',
      perM: 560,
      typeCoef: { micro: 1.0, impedance: 1.15, pipe: 0.85 },
      typeName: { micro: '微穿孔板', impedance: '阻抗式', pipe: '管式' }
    },

    /* 补齐原无参考价的设备（统一按风量/参数线性计价，保证同类单调） */
    vav: { brand: '国产中高档', perVol: 2.2, minPrice: 1800, fallback: 2200 },
    dehum: { brand: '国产中高档', perKg: 1500, perVol: 2.6, fallback: 6000 },
    filterAbs: { brand: '国产人防（3C认证）', perVol: 6.0, fallback: 6000 },
    heater: { brand: '国产中高档', perVol: 1.0, fallback: 8000 },
    dedust: { brand: '国产中高档', perVol: 5.0, fallback: 15000 },
    vrf: { brand: '国产中高档', perHp: 3500, perKw: 900, fallback: 25000 },
    plenum: { brand: '国产中高档', coef: 480, factor: 0.5 }
  };

  root.HVAC_PRICES = HVAC_PRICES;
  if (typeof module !== 'undefined' && module.exports) module.exports = HVAC_PRICES;
})(typeof window !== 'undefined' ? window : global);
