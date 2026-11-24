/* ============================================================
 * 暖通专业智能组价系统 - 管道模块（复用给排水站口径）
 * 清单：天津2025清单计价规范 附录K 给排水、采暖、燃气工程 031001001~031001008
 * 定额：2020预算基价 第八册（给排水、采暖、燃气工程）8-xxx
 * 主材：天津市造价信息 除税价（元/m），与给排水站同一价格库
 * 说明：暖通站的水管（冷冻水/冷却水/冷凝水/采暖水）清单、定额、主材价
 *       与给排水站完全一致，故整段复用，避免两站口径漂移。
 * ============================================================ */
(function () {
  'use strict';

  var PRICE_BOOK = (typeof window !== 'undefined' && window.PIPE_PRICE_PERIODS) ? window.PIPE_PRICE_PERIODS
    : (typeof require !== 'undefined' ? require('../data/prices.js').PIPE_PRICE_PERIODS : []);

  var LIST = {
    castIron: { code: '031001001', name: '铸铁管' },
    galv: { code: '031001002', name: '镀锌钢管' },
    seamless: { code: '031001003', name: '无缝钢管' },
    welded: { code: '031001004', name: '焊接钢管' },
    copper: { code: '031001005', name: '铜管' },
    stainless: { code: '031001006', name: '不锈钢管' },
    composite: { code: '031001007', name: '复合管' },
    plastic: { code: '031001008', name: '塑料管' },
    // 补充规则（2026-11-24 主人指定口径）
    preInsul: { code: '030801020', name: '低压直埋保温管道' },
    ppDrain: { code: '031001008', name: '塑料管' },
    levelGauge: { code: '031002001', name: '金属阀门' },
    pressGauge: { code: '030601002', name: '压力仪表' },
    pressGaugeElec: { code: '030601002', name: '压力仪表' },
    flexJoint: { code: '031002008', name: '软接头（软管）' }
  };

  // 沟槽管件 8-220~ / 管道消毒冲洗 8-490~
  var GROOVE_FITTING = { start: 220, dns: [65, 80, 100, 125, 150, 200, 250], name: '室内管道 钢管沟槽连接管件', unit: '10个', factor: 10 };
  var PIPE_FLUSH = { start: 490, dns: [50, 100, 200, 300, 400, 500], name: '管道消毒冲洗', unit: '100m', factor: 100 };
  var PLASTIC_OUT_DNS = [32, 40, 50, 63, 75, 90, 110, 125, 160, 200, 250, 315];
  var PLASTIC_IN_DNS = [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 160];
  var PLASTIC_DRAIN_DNS = [50, 75, 110, 160, 200, 250];
  var PIPE_GROUPS = {
    seamless: [
      { loc: 'out', joint: 'weld', start: 23, dns: [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400], name: '室外管道 钢管(焊接)' },
      { loc: 'in', joint: 'weld', start: 195, dns: [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300], name: '室内管道 钢管(焊接)' },
      { loc: 'in', joint: 'groove', start: 206, dns: [65, 80, 100, 125, 150, 200, 250], name: '室内管道 钢管(沟槽连接)' }
    ],
    welded: [
      { loc: 'out', joint: 'weld', start: 23, dns: [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400], name: '室外管道 钢管(焊接)' },
      { loc: 'in', joint: 'weld', start: 195, dns: [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300], name: '室内管道 钢管(焊接)' },
      { loc: 'in', joint: 'groove', start: 206, dns: [65, 80, 100, 125, 150, 200, 250], name: '室内管道 钢管(沟槽连接)' }
    ],
    copper: [
      { loc: 'in', joint: 'press', start: 309, dns: [18, 22, 28, 35, 42, 54, 76, 89, 108], name: '室内管道 铜管(卡压连接)' },
      { loc: 'in', joint: 'oxy', start: 318, dns: [18, 22, 28, 35, 42, 54, 76, 89, 108], name: '室内管道 铜管(氧乙炔焊)' },
      { loc: 'in', joint: 'braze', start: 327, dns: [18, 22, 28, 35, 42, 54, 76, 89, 108], name: '室内管道 铜管(钎焊)' }
    ],
    stainless: [
      { loc: 'in', joint: 'press', start: 261, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100], name: '室内管道 薄壁不锈钢管(卡压连接)' },
      { loc: 'in', joint: 'sleeve', start: 270, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100], name: '室内管道 薄壁不锈钢管(卡套连接)' },
      { loc: 'in', joint: 'argon', start: 279, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100], name: '室内管道 薄壁不锈钢管(承插氩弧焊)' },
      { loc: 'in', joint: 'thread', start: 288, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100], name: '室内管道 不锈钢管(螺纹连接)' },
      { loc: 'in', joint: 'arc', start: 297, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200], name: '室内管道 不锈钢管(对接电弧焊)' },
      { loc: 'in', joint: 'argon', medium: 'gas', start: 1141, dns: [25, 32, 40, 50, 65, 80, 100], name: '室内燃气不锈钢管(承插氩弧焊)' },
      { loc: 'in', joint: 'sleeve', medium: 'gas', start: 1148, dns: [15, 20, 25, 32, 40, 50], name: '室内燃气不锈钢管(卡套连接)' },
      { loc: 'in', joint: 'press', medium: 'gas', start: 1154, dns: [15, 20, 25, 32, 40, 50], name: '室内燃气不锈钢管(卡压连接)' }
    ],
    composite: [
      { loc: 'out', joint: 'electro', start: 81, dns: [32, 40, 50, 63, 75, 90, 110, 125, 160], name: '室外管道 钢骨架塑料复合管(电熔连接)' },
      { loc: 'in', joint: 'press', start: 227, dns: [20, 25, 32, 40, 50, 63], name: '室内管道 铝塑复合管(卡压连接)' },
      { loc: 'in', joint: 'sleeve', start: 233, dns: [20, 25, 32, 40, 50, 63], name: '室内管道 铝塑复合管(卡套连接)' },
      { loc: 'in', joint: 'fusion', start: 239, dns: [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 160], name: '室内管道 铝塑复合管(热熔连接)' },
      { loc: 'in', joint: 'electro', start: 250, dns: [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 160], name: '室内管道 钢骨架塑料复合管(电熔连接)' }
    ],
    plastic: [
      { loc: 'out', joint: 'fusion', start: 36, dns: PLASTIC_OUT_DNS, name: '室外管道 塑料给水管(热熔连接)' },
      { loc: 'out', joint: 'electro', start: 48, dns: PLASTIC_OUT_DNS, name: '室外管道 塑料给水管(电熔连接)' },
      { loc: 'out', joint: 'glue', start: 60, dns: PLASTIC_OUT_DNS, name: '室外管道 塑料给水管(粘接)' },
      { loc: 'in', joint: 'fusion', start: 410, dns: PLASTIC_IN_DNS, name: '室内管道 塑料给水管(热熔连接)' },
      { loc: 'in', joint: 'electro', start: 421, dns: PLASTIC_IN_DNS, name: '室内管道 塑料给水管(电熔连接)' },
      { loc: 'in', joint: 'glue', start: 432, dns: PLASTIC_IN_DNS, name: '室内管道 塑料给水管(粘接)' },
      { loc: 'in', joint: 'glue', medium: 'drain', start: 377, dns: PLASTIC_DRAIN_DNS, name: '室内管道 塑料排水管(粘接)' },
      { loc: 'in', joint: 'fusion', medium: 'drain', start: 383, dns: PLASTIC_DRAIN_DNS, name: '室内管道 塑料排水管(热熔连接)' },
      { loc: 'in', joint: 'glue', medium: 'rain', start: 405, dns: [75, 110, 160, 200, 250], name: '室内管道 塑料雨水管(粘接)' }
    ]
  };
  var JOINT_CN2 = {
    weld: '焊接', groove: '沟槽连接（卡箍）', press: '卡压连接', sleeve: '卡套连接',
    argon: '承插氩弧焊', thread: '螺纹连接', arc: '对接电弧焊', oxy: '氧乙炔焊',
    braze: '钎焊', fusion: '热熔连接', electro: '电熔连接', glue: '粘接'
  };

  // 铸铁管定额矩阵：start 为该接口形式首个子目号，dns 依次对应公称直径档
  var CAST_IRON = {
    out_water: {
      lead: { start: 90, dns: [75, 100, 150, 200, 250, 300, 350, 400, 450, 500], name: '室外管道 承插铸铁给水管(青铅接口)' },
      expand: { start: 100, dns: [75, 100, 150, 200, 250, 300, 350, 400, 450, 500], name: '室外管道 承插铸铁给水管(膨胀水泥接口)' },
      asbestos: { start: 110, dns: [75, 100, 150, 200, 250, 300, 350, 400, 450, 500], name: '室外管道 承插铸铁给水管(石棉水泥接口)' },
      rubber: { start: 120, dns: [100, 150, 200, 250, 300, 350, 400, 450, 500], name: '室外管道 承插铸铁给水管(胶圈接口)' }
    },
    out_drain: {
      asbestos: { start: 129, dns: [50, 75, 100, 125, 150, 200], name: '室外管道 承插铸铁排水管(石棉水泥接口)' },
      cement: { start: 135, dns: [50, 75, 100, 125, 150, 200], name: '室外管道 承插铸铁排水管(水泥接口)' }
    },
    in_water: {
      lead: { start: 336, dns: [75, 100, 150, 200, 250, 300], name: '室内管道 承插铸铁给水管(青铅接口)' },
      expand: { start: 342, dns: [75, 100, 150, 200, 250, 300], name: '室内管道 承插铸铁给水管(膨胀水泥接口)' },
      asbestos: { start: 348, dns: [75, 100, 150, 200, 250, 300], name: '室内管道 承插铸铁给水管(石棉水泥接口)' }
    },
    in_drain: {
      asbestos: { start: 354, dns: [50, 75, 100, 150, 200, 250], name: '室内管道 承插铸铁排水管(石棉水泥接口)' },
      cement: { start: 360, dns: [50, 75, 100, 150, 200, 250], name: '室内管道 承插铸铁排水管(水泥接口)' }
    }
  };

  var GALV = {
    out_water: { thread: { start: 1, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150], name: '室外管道 镀锌钢管(螺纹连接)' } },
    in_water: { thread: { start: 173, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150], name: '室内管道 镀锌钢管(螺纹连接)' } },
    out_gas: { thread: { start: 1128, dns: [25, 32, 40, 50], name: '室外燃气镀锌钢管(螺纹连接)' } },
    in_gas: { thread: { start: 1132, dns: [15, 20, 25, 32, 40, 50, 65, 80, 100], name: '室内燃气镀锌钢管(螺纹连接)' } }
  };

  var JOINT_CN = { lead: '青铅接口', expand: '膨胀水泥接口', asbestos: '石棉水泥接口', rubber: '胶圈接口', cement: '水泥接口', thread: '螺纹连接', gas_thread: '螺纹连接（燃气）' };
  var JOINT_ORDER = ['asbestos', 'cement', 'lead', 'expand', 'rubber'];
  var JOINT_ORDER_GALV = ['thread', 'gas_thread'];
  var LOC_CN = { in: '室内', out: '室外' };
  var MEDIUM_CN = { water: '给水', drain: '排水', gas: '燃气' };
  var CAT_LABEL = {
    castIron: '铸铁管', galv: '镀锌钢管', seamless: '无缝钢管', welded: '焊接钢管',
    copper: '铜管', stainless: '不锈钢管', composite: '复合管', plastic: '塑料管',
    preInsul: '直埋保温管', ppDrain: 'PP排水管', levelGauge: '液位计',
    pressGauge: '压力表', pressGaugeElec: '电接点压力表', flexJoint: '软接头'
  };
  var CAT_WORK = {
    castIron: '管道切管、套丝/承插、接口、管道安装、水压试验',
    galv: '管道切管、套丝、管件安装、管道安装、水压试验',
    seamless: '管道切管、坡口、焊接、管件安装、管道安装、水压试验',
    welded: '管道切管、坡口、焊接、管件安装、管道安装、水压试验',
    copper: '管道切管、连接、管件安装、管道安装、水压试验',
    stainless: '管道切管、连接、管件安装、管道安装、水压试验',
    composite: '管道切管、连接、管件安装、管道安装、水压试验',
    plastic: '管道切管、热熔/粘接、管件安装、管道安装、灌水试验',
    preInsul: '管道切管、坡口、焊接、接口保温、管道安装、水压试验、冲洗',
    ppDrain: '管道切管、粘接、管件安装、管道安装、灌水试验、通球试验',
    levelGauge: '仪表安装、接线、调试',
    pressGauge: '仪表安装、校验',
    pressGaugeElec: '仪表安装、接线、校验',
    flexJoint: '软接头安装、试压'
  };

  function ruleTable(it) { return it && it.category === 'galv' ? GALV : CAST_IRON; }
  function pipeKey(it) {
    var loc = it.loc === 'out' ? 'out_' : 'in_';
    if (it.category === 'galv') return loc + (it.joint === 'gas_thread' ? 'gas' : 'water');
    return loc + (it.medium === 'drain' ? 'drain' : 'water');
  }
  var JOINT_PREFER = ['weld', 'groove', 'press', 'fusion', 'electro', 'glue', 'argon', 'arc', 'sleeve', 'thread', 'oxy', 'braze'];
  function jointsOf(it) {
    if (it && it.category === 'galv') return ['thread', 'gas_thread'];
    if (it && PIPE_GROUPS[it.category]) {
      var gs = PIPE_GROUPS[it.category];
      var mk = mediumKeyOf(it);
      var out = [];
      gs.forEach(function (g) {
        if (g.loc !== it.loc) return;
        if ((g.medium || 'water') !== mk) return;
        if (out.indexOf(g.joint) < 0) out.push(g.joint);
      });
      if (!out.length) {
        gs.forEach(function (g) {
          if (g.loc !== it.loc) return;
          var m = g.medium || 'water';
          if (m === 'gas') return;
          if (out.indexOf(g.joint) < 0) out.push(g.joint);
        });
      }
      out.sort(function (a, b) { return JOINT_PREFER.indexOf(a) - JOINT_PREFER.indexOf(b); });
      return out;
    }
    var tbl = ruleTable(it)[pipeKey(it)] || {};
    var order = it && it.category === 'galv' ? JOINT_ORDER_GALV : JOINT_ORDER;
    return order.filter(function (j) { return !!tbl[j]; });
  }
  function defaultJoint(it) {
    var list = jointsOf(it);
    if (it && it.category === 'galv') return list.indexOf('thread') >= 0 ? 'thread' : (list[0] || 'thread');
    if (it && PIPE_GROUPS[it.category]) {
      var pj = parsePipeJoint(it.name || '');
      if (pj && list.indexOf(pj) >= 0) return pj;
      return list[0] || '';
    }
    return list.indexOf('asbestos') >= 0 ? 'asbestos' : (list[0] || 'asbestos');
  }

  function isCastIron(name) {
    return /铸铁|离心浇筑灰口铁|机制离心|球墨铸铁|灰口铁/.test(name || '');
  }
  function parseDN(name) {
    var s = String(name || '').replace(/[（(]/g, ' ').replace(/[）)]/g, ' ');
    var m = s.match(/(?:DN|dn|De|de|D|Φ|φ|Ø)\s*[-－]?\s*(\d{2,4})/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/(\d{2,4})\s*(?:mm|MM|毫米)/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/[×xX*]\s*(\d{2,3})\b/);
    if (m) return parseInt(m[1], 10);
    return null;
  }
  function parseMedium(name) {
    var s = name || '';
    if (/燃气|煤气|天然气|液化气|气源|瓦斯/.test(s)) return 'gas';
    if (/排水|污水|废水|雨水|冷凝水|冷凝|通气管|透气|地漏|潜污/.test(s)) return 'drain';
    if (/给水|生活给水|生产给水|消防|消火栓|喷淋|中水|冷冻水|冷却水|采暖|热水|空调水/.test(s)) return 'water';
    return 'water';
  }
  function parseLoc(name) {
    var s = name || '';
    if (/室外|户外|室外埋地|埋地|外网|庭院|厂区|小区|室外管网|屋面/.test(s)) return 'out';
    if (/室内|楼内|管井|地库|地下车库|卫生间|厨房|设备间|管道井|机房|竖井/.test(s)) return 'in';
    return 'in';
  }
  function parseJoint(name) {
    var s = name || '';
    if (/青铅/.test(s)) return 'lead';
    if (/膨胀水泥/.test(s)) return 'expand';
    if (/石棉水泥|石棉/.test(s)) return 'asbestos';
    if (/胶圈|橡胶圈|柔性接口|卡箍|机械接口|法兰接口/.test(s)) return 'rubber';
    if (/水泥接口|水泥捻口|水泥/.test(s)) return 'cement';
    return null;
  }
  function materialOf(name) {
    var s = name || '';
    if (isCastIron(s)) return '铸铁';
    if (/不锈钢/.test(s)) return '不锈钢';
    if (/无缝/.test(s)) return '无缝钢';
    if (/镀锌钢管|热浸镀锌|热镀锌|镀锌焊接钢管|内外壁热浸镀锌|镀锌管/.test(s)) return '镀锌钢';
    if (/复合管|钢塑|铝塑|衬塑|涂塑/.test(s)) return '复合';
    if (/铜管|紫铜|黄铜管/.test(s)) return '铜';
    if (/PPR|PP-R|PE管|HDPE|PVC|UPVC|U-PVC|PB管|PEX|塑料管|塑料给水|塑料排水|塑料雨水/.test(s)) return '塑料';
    if (/焊接钢管|钢管/.test(s)) return '焊接钢';
    return '其他';
  }
  function parsePipeJoint(name) {
    var s = name || '';
    if (/沟槽|卡箍|卡环|机械卡箍/.test(s)) return 'groove';
    if (/卡压|卡凸/.test(s)) return 'press';
    if (/卡套/.test(s)) return 'sleeve';
    if (/承插氩弧焊|氩弧焊|氩电联焊/.test(s)) return 'argon';
    if (/对接电弧焊|电弧焊|手工电弧焊/.test(s)) return 'arc';
    if (/氧乙炔焊|气焊/.test(s)) return 'oxy';
    if (/钎焊|银钎焊/.test(s)) return 'braze';
    if (/电熔/.test(s)) return 'electro';
    if (/热熔/.test(s)) return 'fusion';
    if (/粘接|胶粘|承插粘接/.test(s)) return 'glue';
    if (/螺纹|丝扣|丝接/.test(s)) return 'thread';
    if (/焊接|焊口/.test(s)) return 'weld';
    return null;
  }
  function mediumKeyOf(it) {
    if (it.medium === 'gas') return 'gas';
    if (it.medium === 'drain') return it.isRain ? 'rain' : 'drain';
    return 'water';
  }
  var MAT_CAT = { '无缝钢': 'seamless', '焊接钢': 'welded', '铜': 'copper', '不锈钢': 'stainless', '复合': 'composite', '塑料': 'plastic' };

  // ---------- 名称识别：是否属于"管道"（并排除风管/风道）----------
  // 补充规则类别（2026-11-24）：直埋保温管 / PP排水管 / 液位计 / 压力表 / 软接头
  function classifySpecial(name) {
    if (!name) return '';
    var n = String(name);
    if (/电接点压力表/.test(n)) return 'pressGaugeElec';
    if (/压力表|真空表/.test(n)) return 'pressGauge';
    if (/液位计/.test(n)) return 'levelGauge';
    if (/可曲挠|橡胶软接头|软接头|软管接头/.test(n)) {
      // 风管软接头（帆布/三防布/带规格尺寸）属风管，不归管道软接头
      if (/帆布|三防布|复合布|钢丝撑筋|风管|风道|风阀/.test(n)) return '';
      if (/[×xX*]\s*\d{2,3}/.test(n)) return '';
      return 'flexJoint';
    }
    if (/直埋保温管|预制直埋保温|直埋预制保温|聚氨酯保温管/.test(n)) return 'preInsul';
    if (/PP\s*排水|PP\s*静音|静音管|PP\s*管/i.test(n)) return 'ppDrain';
    return '';
  }
  function isSpecialCat(cat) {
    return cat === 'preInsul' || cat === 'ppDrain' || cat === 'levelGauge' ||
      cat === 'pressGauge' || cat === 'pressGaugeElec' || cat === 'flexJoint';
  }

  function classify(name) {
    if (!name) return null;
    var s = String(name);
    var spc = classifySpecial(s);
    if (spc) return spc;
    // 风管/风道不归管道
    if (/风管|风道|通风管道|软管|软接|法兰|支架|吊架|套管|保温|刷漆|除锈|水表|阀门|阀|泵|机组|末端|盘管|风口/.test(s)) return null;
    var mat = materialOf(s);
    if (mat === '铸铁') return 'castIron';
    if (mat === '镀锌钢') return 'galv';
    if (mat === '不锈钢') return 'stainless';
    if (mat === '无缝钢') return 'seamless';
    if (mat === '焊接钢') return 'welded';
    if (mat === '铜') return 'copper';
    if (mat === '复合') return 'composite';
    if (mat === '塑料') return 'plastic';
    // 名称只写"管道/水管/冷凝水管"未注材质：按镀锌钢管（暖通水系统最常用）处理
    if (/(?:空调水|冷冻水|冷却水|冷凝水|采暖|热水|给水|排水)(?:管|管道)/.test(s)) return 'galv';
    return null;
  }

  function buildItem(name) {
    if (!name) return null;
    var it = {};
    it.name = name;
    it.material = materialOf(name);
    it.dn = parseDN(name);
    it.medium = parseMedium(name);
    it.loc = parseLoc(name);
    it.isRain = /雨水/.test(name);
    it.mediumAmbiguous = !/排水|污水|废水|雨水|给水|消防|消火栓|喷淋|中水|冷凝|燃气|煤气|天然气|液化气|冷冻水|冷却水|采暖/.test(name);
    it.locAmbiguous = !/室内|室外|户外|外网|庭院|楼内|管井|地库|屋面/.test(name);

    var cat = classify(name);
    it.category = cat || 'other';
    if (cat && isSpecialCat(cat)) {
      it.special = true;
      it.listCode = LIST[cat].code;
      it.listName = LIST[cat].name;
      it.categoryLabel = CAT_LABEL[cat];
      it.joint = null;
      if (cat === 'preInsul') {
        it.unit = 'm'; it.material = '保温管'; it.loc = 'out'; it.medium = 'water';
        it.locAmbiguous = false; it.mediumAmbiguous = false;
      } else if (cat === 'ppDrain') {
        it.unit = 'm'; it.material = '塑料'; it.loc = 'in'; it.medium = 'drain'; it.joint = 'glue';
        it.isRain = /雨水/.test(name);
        it.materialLabel = /静音/.test(name) ? 'PP排水静音管' : 'PP排水管';
        it.locAmbiguous = false; it.mediumAmbiguous = false;
      } else if (cat === 'flexJoint') {
        it.unit = '个'; it.material = '橡胶'; it.loc = 'in'; it.medium = 'water';
        it.joint = (it.dn > 0 && it.dn >= 50) ? 'flange' : 'thread';
        it.materialLabel = '可曲挠橡胶软接头';
        it.locAmbiguous = false; it.mediumAmbiguous = false;
      } else {
        it.unit = '台'; it.material = '仪表'; it.loc = 'in'; it.medium = 'water';
        it.materialLabel = { levelGauge: '玻璃管（板）液位计', pressGauge: '压力表', pressGaugeElec: '电接点压力表' }[cat];
        it.locAmbiguous = false; it.mediumAmbiguous = false;
      }
      return it;
    }
    if (!cat) {
      it.listCode = '';
      it.listName = '';
      it.joint = null;
      it.unit = 'm';
      return it;
    }
    it.listCode = LIST[cat].code;
    it.listName = LIST[cat].name;
    it.categoryLabel = CAT_LABEL[cat];

    if (cat === 'castIron') {
      var j = parseJoint(name);
      it.jointAuto = j || defaultJoint(it);
      it.joint = it.jointAuto;
      it.jointFromName = !!j;
      var allow = jointsOf(it);
      if (allow.indexOf(it.joint) < 0) { it.jointFallback = it.joint; it.joint = defaultJoint(it); }
    } else if (cat === 'galv') {
      var isGas = /燃气|煤气|天然气|液化气|气源|瓦斯/.test(name);
      it.medium = isGas ? 'gas' : 'water';
      it.jointAuto = isGas ? 'gas_thread' : 'thread';
      it.joint = it.jointAuto;
      it.jointFromName = isGas;
      it.jointFallback = null;
    } else {
      it.medium = /燃气|煤气|天然气|液化气|气源|瓦斯/.test(name) ? 'gas' : (it.isRain ? 'drain' : it.medium);
      var pj = parsePipeJoint(name);
      it.jointAuto = pj || defaultJoint(it);
      it.joint = it.jointAuto;
      it.jointFromName = !!pj;
      var allow2 = jointsOf(it);
      if (allow2.indexOf(it.joint) < 0) { it.jointFallback = it.joint; it.joint = defaultJoint(it); }
      if (cat === 'plastic') {
        if (it.medium === 'drain') it.plasticKind = 'pvcDrain';
        else if (/PPR|PP-R/.test(name)) it.plasticKind = 'ppr';
        else if (/PE|HDPE/.test(name)) it.plasticKind = 'pe';
        else if (/PVC|UPVC|U-PVC/.test(name)) it.plasticKind = 'pvc';
        else it.plasticKind = 'ppr';
      }
      if (cat === 'composite') it.compositeKind = /钢骨架|钢塑|衬塑|涂塑/.test(name) ? 'steelmesh' : 'alplastic';
    }
    it.unit = 'm';
    return it;
  }

  function tierOf(dns, dn) {
    if (dn === null || dn === undefined || isNaN(dn)) return null;
    for (var i = 0; i < dns.length; i++) if (dn <= dns[i]) return { idx: i, dn: dns[i], exact: dns[i] === dn };
    return { idx: dns.length - 1, dn: dns[dns.length - 1], exact: false, overflow: true };
  }
  function groupOf(it) {
    var gs = PIPE_GROUPS[it.category];
    if (!gs) return null;
    var mk = mediumKeyOf(it);
    var hit = null;
    gs.forEach(function (g) { if (!hit && g.loc === it.loc && (g.medium || 'water') === mk && g.joint === it.joint) hit = g; });
    if (!hit) gs.forEach(function (g) { if (!hit && g.loc === it.loc && (g.medium || 'water') === mk) hit = g; });
    if (!hit) gs.forEach(function (g) { if (!hit && g.loc === it.loc) hit = g; });
    return hit;
  }

  // ---------- 补充规则定额匹配（2026-11-24）----------
  var PREINSUL_DNS = [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400];
  var PPDRAIN_DNS = [50, 75, 110, 160, 200, 250];
  var FLEX_THREAD_DNS = [15, 20, 25, 32, 40];
  var FLEX_FLANGE_DNS = [50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400];
  function matchSpecialQuota(it) {
    var c = it.category;
    if (c === 'preInsul') {
      if (!(it.dn > 0)) return { code: '', name: '室外管道 直埋式预制保温管（管径待识别）', inferred: false, needDn: true, keepList: true };
      var t = tierOf(PREINSUL_DNS, it.dn);
      return { code: '8-' + (141 + t.idx), name: '室外管道 直埋式预制保温管 公称直径' + t.dn + 'mm以内',
        inferred: !t.exact, dnTier: t.dn, unit: '10m', factor: 10, keepList: true };
    }
    if (c === 'ppDrain') {
      if (!(it.dn > 0)) return { code: '', name: '室内管道 塑料排水管（粘接）（管径待识别）', inferred: false, needDn: true, keepList: true };
      var t2 = tierOf(PPDRAIN_DNS, it.dn);
      return { code: '8-' + (377 + t2.idx), name: '室内管道 塑料排水管（粘接）公称外径' + t2.dn + 'mm以内',
        inferred: !t2.exact, dnTier: t2.dn, unit: '10m', factor: 10, keepList: true };
    }
    if (c === 'levelGauge') return { code: '10-77', name: '物位检测仪表 直读玻璃管（板）液位计 管（板）长度1700mm以内', inferred: false, unit: '台', factor: 1, keepList: true };
    if (c === 'pressGauge') return { code: '10-25', name: '压力仪表 压力表、真空表 就地', inferred: false, unit: '台', factor: 1, keepList: true };
    if (c === 'pressGaugeElec') return { code: '10-31', name: '压力仪表 电接点压力表', inferred: false, unit: '台', factor: 1, keepList: true };
    if (c === 'flexJoint') {
      if (!(it.dn > 0)) return { code: '', name: '可曲挠橡胶软接头（管径待识别）', inferred: false, needDn: true, keepList: true };
      if (it.dn < 50) {
        var t3 = tierOf(FLEX_THREAD_DNS, it.dn);
        return { code: '8-' + (812 + t3.idx), name: '橡胶软接头（螺纹连接）公称直径' + t3.dn + 'mm以内',
          inferred: !t3.exact, dnTier: t3.dn, unit: '个', factor: 1, keepList: true };
      }
      var t4 = tierOf(FLEX_FLANGE_DNS, it.dn);
      return { code: '8-' + (819 + t4.idx), name: '橡胶软接头（法兰连接）公称直径' + t4.dn + 'mm以内',
        inferred: !t4.exact, dnTier: t4.dn, unit: '个', factor: 1, keepList: true };
    }
    return { code: '', name: '', inferred: false };
  }

  // ---------- 定额匹配 ----------
  function matchQuota(it) {
    if (!it) return { code: '', name: '', inferred: false };
    if (isSpecialCat(it.category)) return matchSpecialQuota(it);
    if (PIPE_GROUPS[it.category]) {
      var g = groupOf(it);
      if (!g) return { code: '', name: '', inferred: false };
      if (it.dn === null || it.dn === undefined || isNaN(it.dn)) {
        return { code: '', name: g.name + '（管径待识别）', inferred: false, needDn: true, keepList: true };
      }
      var t = tierOf(g.dns, it.dn);
      var dnLabel = (it.category === 'copper' || it.category === 'plastic' || it.category === 'composite') ? '公称外径' : '公称直径';
      return {
        code: '8-' + (g.start + t.idx), name: g.name + ' ' + dnLabel + t.dn + 'mm以内',
        inferred: !t.exact, dnTier: t.dn, unit: '10m', factor: 10, group: g, keepList: true
      };
    }
    if (it.category !== 'castIron' && it.category !== 'galv') return { code: '', name: '', inferred: false };
    var tbl = ruleTable(it)[pipeKey(it)];
    if (!tbl) return { code: '', name: '', inferred: false };
    var def = tbl[it.joint] || tbl[defaultJoint(it)];
    if (!def) return { code: '', name: '', inferred: false };
    if (it.dn === null || it.dn === undefined || isNaN(it.dn)) {
      return { code: '', name: def.name + '（管径待识别）', inferred: false, needDn: true, keepList: true };
    }
    var idx = -1;
    for (var i = 0; i < def.dns.length; i++) { if (it.dn <= def.dns[i]) { idx = i; break; } }
    var inferred = false;
    if (idx < 0) { idx = def.dns.length - 1; inferred = true; }
    else if (def.dns[idx] !== it.dn) inferred = true;
    var dn = def.dns[idx];
    return {
      code: '8-' + (def.start + idx), name: def.name + ' 公称直径' + dn + 'mm以内',
      inferred: inferred, dnTier: dn, unit: '10m', factor: 10, keepList: true
    };
  }

  // ---------- 附加定额（沟槽管件 / 管道消毒冲洗）----------
  function buildExtraQuotas(it, quota) {
    var arr = [];
    if (!quota || !quota.code) return arr;
    if (it && isSpecialCat(it.category)) return arr;   // 补充规则类别不计消毒冲洗/沟槽管件
    var tierDn = quota.dnTier || it.dn;
    if (it.joint === 'groove') {
      var f = tierOf(GROOVE_FITTING.dns, tierDn);
      if (f) {
        var cnt = Math.max(1, Math.ceil(it.quantity / 6));
        arr.push({
          role: 'fitting', code: '8-' + (GROOVE_FITTING.start + f.idx),
          name: GROOVE_FITTING.name + ' 公称直径' + f.dn + 'mm以内',
          unit: GROOVE_FITTING.unit, factor: GROOVE_FITTING.factor,
          qty: cnt, note: '管件数量按6m定尺估算（每6m一个管件），请按图纸调整'
        });
      }
    }
    var fl = tierOf(PIPE_FLUSH.dns, tierDn);
    if (fl) {
      arr.push({
        role: 'flush', code: '8-' + (PIPE_FLUSH.start + fl.idx),
        name: PIPE_FLUSH.name + ' 公称直径' + fl.dn + 'mm以内',
        unit: PIPE_FLUSH.unit, factor: PIPE_FLUSH.factor, qty: it.quantity, note: ''
      });
    }
    return arr;
  }

  // ---------- 主材价 ----------
  function getPeriods() { return PRICE_BOOK || []; }
  function getPeriod(periodKey) {
    var arr = getPeriods();
    if (!arr.length) return null;
    for (var i = 0; i < arr.length; i++) if (arr[i].period === periodKey) return arr[i];
    return arr[0];
  }
  function interpPrice(table, key) {
    var keys = Object.keys(table).map(Number).sort(function (a, b) { return a - b; });
    if (!keys.length) return null;
    if (table[key] !== undefined) return { price: table[key], exact: true, tier: key };
    for (var i = 0; i < keys.length; i++) if (key <= keys[i]) return { price: table[keys[i]], exact: false, tier: keys[i] };
    var last = keys[keys.length - 1];
    return { price: table[last], exact: false, tier: last, overflow: true };
  }
  function grpOf(p, it) {
    if (!p) return null;
    if (it.category === 'castIron') return it.medium === 'drain' ? p.castIron.drain : p.castIron.water;
    if (it.category === 'galv') return p.galv;
    if (it.category === 'seamless') return p.seamless;
    if (it.category === 'welded') return p.welded;
    if (it.category === 'copper') return p.copper;
    if (it.category === 'stainless') return p.stainless;
    if (it.category === 'composite') return (p.composite || {})[it.compositeKind || 'alplastic'];
    if (it.category === 'plastic') return (p.plastic || {})[it.plasticKind || 'ppr'];
    return null;
  }
  function priceLabel(it) {
    if (it.category === 'castIron') return '铸铁' + MEDIUM_CN[it.medium] + '管';
    if (it.category === 'galv') return '镀锌钢管（' + (it.joint === 'gas_thread' ? '燃气' : '给水') + '）';
    if (it.category === 'seamless') return '无缝钢管';
    if (it.category === 'welded') return '焊接钢管';
    if (it.category === 'copper') return '铜管';
    if (it.category === 'stainless') return '不锈钢管';
    if (it.category === 'composite') return it.compositeKind === 'steelmesh' ? '钢骨架塑料复合管' : '铝塑复合管';
    if (it.category === 'plastic') return { ppr: 'PPR给水管', pe: 'PE给水管', pvc: 'PVC-U给水管', pvcDrain: 'PVC-U排水管' }[it.plasticKind || 'ppr'];
    return '';
  }
  function dnLabelOf(it) {
    return (it.category === 'plastic' || it.category === 'composite') ? 'De' : 'DN';
  }
  // 直埋式预制保温管市场价（除税，元/m）
  var PREINSUL_PRICE = { 32: 55, 40: 65, 50: 78, 65: 98, 80: 118, 100: 145, 125: 185,
    150: 225, 200: 320, 250: 420, 300: 530, 350: 650, 400: 780 };
  // PP 排水（静音）管价格体系（主人指定）：管道 + 管件双主材
  var PP_PIPE_PRICE = { 50: 12.851, 75: 24.097, 100: 40.16, 150: 58.5 };
  var PP_FIT_PRICE = { 50: 6.108, 75: 10.682, 100: 19.867, 150: 32.54 };
  // 可曲挠橡胶软接头市场价（信息价缺项，除税，元/个）
  var FLEX_JOINT_PRICE = { 15: 22, 20: 26, 25: 32, 32: 42, 40: 52, 50: 68, 65: 95, 80: 120,
    100: 165, 125: 210, 150: 265, 200: 390, 250: 540, 300: 720, 350: 920, 400: 1150 };
  function ppInterp(tbl, dn) {
    var ks = [50, 75, 100, 150];
    if (!(dn > 0)) return null;
    if (dn <= ks[0]) return tbl[ks[0]];
    for (var i = 0; i < ks.length - 1; i++) {
      if (dn <= ks[i + 1]) {
        var a = ks[i], b = ks[i + 1];
        return tbl[a] + (dn - a) / (b - a) * (tbl[b] - tbl[a]);
      }
    }
    return tbl[150] + (dn - 150) / 50 * (tbl[150] - tbl[100]);
  }
  function specialPrice(it) {
    var c = it.category, t = it.dnTier || it.dn;
    if (c === 'preInsul') {
      if (!(t > 0)) return null;
      var pp = PREINSUL_PRICE[t];
      if (!pp) return null;
      return { price: pp, source: 'market', brand: '',
        basis: '直埋式预制保温管 DN' + t + '：国产中高档市场价（聚氨酯保温+HDPE外护）' + pp.toFixed(2) + '元/m（除税）' };
    }
    if (c === 'ppDrain') {
      var d = it.dn;
      if (!(d > 0)) return null;
      var a = ppInterp(PP_PIPE_PRICE, d), b = ppInterp(PP_FIT_PRICE, d);
      if (a === null || b === null) return null;
      a = Math.round(a * 1000) / 1000;
      b = Math.round(b * 1000) / 1000;
      it.mat2 = { name: it.name + '管件', price: b };
      return { price: a, source: 'fixed', brand: '',
        basis: 'PP排水静音管 DN' + d + '：管材 ' + a.toFixed(3) + '元/m、管件 ' + b.toFixed(3) + '元/m（主人指定价格体系，其余管径按同体系分段折算）' };
    }
    if (c === 'levelGauge') return { price: 542.268, source: 'fixed', brand: '', basis: '玻璃管（板）液位计 1700mm以内：主人指定主材价542.268元/台' };
    if (c === 'pressGauge') return { price: 47.86, source: 'fixed', brand: '', basis: '压力表（就地）：主人指定主材价47.86元/台' };
    if (c === 'pressGaugeElec') return { price: 60.503, source: 'fixed', brand: '', basis: '电接点压力表：主人指定主材价60.503元/台' };
    if (c === 'flexJoint') {
      if (!(t > 0)) return null;
      var fp = FLEX_JOINT_PRICE[t];
      if (!fp) return null;
      return { price: fp, source: 'market', brand: '',
        basis: '可曲挠橡胶软接头 DN' + t + '：信息价缺项，按国产中高档市场价' + fp.toFixed(2) + '元/个（除税）' };
    }
    return null;
  }

  function lookupPrice(it, periodKey) {
    if (it && isSpecialCat(it.category)) return specialPrice(it);
    var p = getPeriod(periodKey);
    if (!p) return null;
    if (it.dn === null || it.dn === undefined || isNaN(it.dn)) return null;
    var grp = grpOf(p, it);
    if (!grp || !grp.price) return null;
    var r = interpPrice(grp.price, it.dn);
    if (!r) return null;
    var dl = dnLabelOf(it);
    var isInfo = !!(grp.infoDns && grp.infoDns.indexOf(r.tier) >= 0);
    if (isInfo) {
      return {
        price: r.price, source: 'info', brand: '',
        basis: priceLabel(it) + ' ' + dl + it.dn + '：天津市工程造价信息（除税）' + r.price.toFixed(2) + '元/m' +
          (r.exact ? '' : '；信息价无' + dl + it.dn + '档，按' + dl + r.tier + '档取定')
      };
    }
    var basis = priceLabel(it) + ' ' + dl + it.dn + '：' + grp.brand + '，' + r.price.toFixed(2) + '元/m（除税）' +
      (r.exact ? '' : '；价格库无' + dl + it.dn + '档，按' + dl + r.tier + '档就近取定') +
      (r.overflow ? '；已超常用最大档，请核对' : '');
    return { price: r.price, source: 'market', basis: basis, brand: grp.brand };
  }
  function brandOf(it) {
    var p = getPeriod();
    var grp = grpOf(p, it);
    if (!grp) return '';
    var r = interpPrice(grp.price, it.dn);
    if (r && grp.infoDns && grp.infoDns.indexOf(r.tier) >= 0) return '';
    return grp.brand;
  }
  function isPriced(it) { return !!(it && (it.category === 'castIron' || it.category === 'galv' || PIPE_GROUPS[it.category] || isSpecialCat(it.category))); }

  // ---------- 规格 / 特征 / 提示 ----------
  function specCell(it) {
    if (it.category === 'levelGauge') return '管（板）长度1700mm以内';
    if (it.category === 'pressGauge') return '就地 0~1.6MPa';
    if (it.category === 'pressGaugeElec') return '电接点 0~1.6MPa';
    if (it.category === 'ppDrain') return it.dn ? 'De' + it.dn : '';
    if (it.dn === null || it.dn === undefined || isNaN(it.dn)) return '';
    return dnLabelOf(it) + it.dn;
  }
  function typeLabel(it) {
    if (it.category === 'preInsul') return '直埋式预制保温管（焊接）';
    if (it.category === 'ppDrain') return (it.materialLabel || 'PP排水管') + '（粘接）';
    if (it.category === 'levelGauge') return '直读玻璃管（板）液位计';
    if (it.category === 'pressGauge') return '压力表、真空表 就地';
    if (it.category === 'pressGaugeElec') return '电接点压力表';
    if (it.category === 'flexJoint') return ((it.dnTier || it.dn) >= 50 ? '法兰连接' : '螺纹连接');
    return '';
  }
  function featureText(it) {
    if (it.category === 'preInsul') {
      return '安装部位:室外；材质:直埋式预制保温管；型号规格:DN' + (it.dnTier || it.dn) +
        '；连接形式:焊接；结构:工作管+聚氨酯保温层+HDPE外护管；其他:管道安装、接口保温、水压试验、冲洗';
    }
    if (it.category === 'ppDrain') {
      return '安装部位:室内；材质:' + (it.materialLabel || 'PP排水管') + '；型号规格:De' + (it.dnTier || it.dn) +
        '；连接形式:粘接；输送介质:' + (it.isRain ? '雨水' : '排水') + '；主材:管材+管件双主材；其他:灌水试验、通球试验';
    }
    if (it.category === 'levelGauge') {
      return '材质:直读玻璃管（板）液位计；型号规格:管（板）长度1700mm以内；其他:仪表安装、接线、调试';
    }
    if (it.category === 'pressGauge') {
      return '材质:压力仪表；型号规格:压力表、真空表 就地安装；其他:仪表安装、校验';
    }
    if (it.category === 'pressGaugeElec') {
      return '材质:压力仪表；型号规格:电接点压力表；其他:仪表安装、接线、校验';
    }
    if (it.category === 'flexJoint') {
      return '材质:可曲挠橡胶软接头；型号规格:DN' + (it.dnTier || it.dn) +
        '；连接形式:' + ((it.dnTier || it.dn) >= 50 ? '法兰连接' : '螺纹连接') + '；其他:安装、试压';
    }
    var parts = [];
    parts.push('安装部位:' + (it.loc === 'out' ? '室外' : '室内'));
    parts.push('材质:' + (it.material && it.material !== '其他' ? it.material : CAT_LABEL[it.category]));
    if (it.dn) parts.push('型号规格:' + specCell(it));
    if (it.category === 'castIron') {
      parts.push('连接形式:承插');
      parts.push('接口材料:' + (JOINT_CN[it.joint] || '石棉水泥接口'));
      parts.push(it.medium === 'drain' ? '灌水试验、通球试验' : '水压试验、水冲洗');
    } else if (it.category === 'galv') {
      parts.push('连接形式:螺纹连接');
      parts.push('接口材料:' + (it.joint === 'gas_thread' ? '聚四氟乙烯生料带（燃气管道）' : '铅油麻丝、聚四氟乙烯生料带'));
      parts.push(it.joint === 'gas_thread' ? '气压试验、空气吹扫' : '水压试验、水冲洗');
    } else if (PIPE_GROUPS[it.category]) {
      parts.push('连接形式:' + (JOINT_CN2[it.joint] || '焊接'));
      if (it.joint === 'groove') parts.push('沟槽管件另计');
      else if (it.joint === 'weld' || it.joint === 'arc' || it.joint === 'argon' || it.joint === 'oxy' || it.joint === 'braze') parts.push('接口材料:焊条/焊丝');
      if (it.medium === 'gas') parts.push('气压试验、空气吹扫');
      else if (it.medium === 'drain') parts.push('灌水试验、通球试验');
      else parts.push('水压试验、水冲洗、消毒冲洗');
    }
    return parts.join('；');
  }
  function buildWarn(it, quota) {
    var w = [];
    if (!isPriced(it)) return '该管材（' + (it.material || '未识别') + '）暂未纳入自动匹配，请手工套用';
    if (it.category === 'levelGauge' || it.category === 'pressGauge' || it.category === 'pressGaugeElec') {
      return w.join('；');
    }
    if (it.dn === null || it.dn === undefined || isNaN(it.dn)) w.push('未识别公称直径，请在名称中注明（如 DN100 / De110）');
    if (it.jointFallback) w.push('所选' + LOC_CN[it.loc] + MEDIUM_CN[it.medium] + '无' + (JOINT_CN[it.jointFallback] || JOINT_CN2[it.jointFallback]) + '子目，已按' + (JOINT_CN[it.joint] || JOINT_CN2[it.joint]) + '套用，请核对');
    if (it.category === 'galv' && it.joint === 'gas_thread') {
      var gasRange = it.loc === 'out' ? 'DN25~50' : 'DN15~100';
      if (it.dn !== null && (it.loc === 'out' ? (it.dn < 25 || it.dn > 50) : (it.dn < 15 || it.dn > 100))) {
        w.push('燃气镀锌钢管' + LOC_CN[it.loc] + '子目仅' + gasRange + '，DN' + it.dn + '超出范围，请核对');
      }
    }
    if (it.dn !== null && quota && quota.code && quota.dnTier && quota.dnTier !== it.dn) w.push('DN' + it.dn + '无对应档，按 DN' + quota.dnTier + '以内子目套用，请核对');
    if (PIPE_GROUPS[it.category]) {
      if (it.category === 'copper' && it.loc === 'out') w.push('第八册铜管无室外子目，已按室内铜管子目套用，请核对');
      if (it.loc === 'out' && it.joint === 'groove') w.push('室外管道无沟槽连接子目，已按室外钢管(焊接)套用，请核对');
      if (it.category === 'plastic' && it.isRain && it.joint === 'fusion') w.push('塑料雨水管无热熔子目，已按粘接或排水热熔子目套用，请核对');
      if (it.joint === 'groove') w.push('沟槽连接已附加管件定额' + ((it.extras || [])[0] ? ' ' + it.extras[0].code : '') + '，管件数量按6m定尺估算');
      if (it.medium === 'drain' || it.medium === 'gas') w.push('已附加管道消毒冲洗，排水/燃气管一般不计取，如无需请删除该定额行');
    }
    if (it.mediumAmbiguous) {
      if (it.category === 'galv') w.push('名称未注明给水/燃气，按给水（普通螺纹连接）套用，燃气管道请在选型列切换连接方式');
      else w.push('名称未注明给水/排水，按' + MEDIUM_CN[it.medium] + '套用，如不符请在名称中注明');
    }
    if (it.locAmbiguous) w.push('名称未注明室内/室外，按室内套用，可在选型列切换');
    return w.join('；');
  }

  var API = {
    LIST: LIST, CAT_LABEL: CAT_LABEL, CAT_WORK: CAT_WORK, PIPE_GROUPS: PIPE_GROUPS,
    JOINT_CN: JOINT_CN, JOINT_CN2: JOINT_CN2, LOC_CN: LOC_CN, MEDIUM_CN: MEDIUM_CN,
    classify: classify, classifySpecial: classifySpecial, isSpecialCat: isSpecialCat,
    buildItem: buildItem, matchQuota: matchQuota, buildExtraQuotas: buildExtraQuotas,
    typeLabel: typeLabel,
    lookupPrice: lookupPrice, brandOf: brandOf, isPriced: isPriced, specCell: specCell,
    featureText: featureText, buildWarn: buildWarn, jointsOf: jointsOf, defaultJoint: defaultJoint,
    getPeriods: getPeriods, tierOf: tierOf, parseDN: parseDN, materialOf: materialOf,
    GROOVE_FITTING: GROOVE_FITTING, PIPE_FLUSH: PIPE_FLUSH
  };
  if (typeof window !== 'undefined') window.HVAC_PIPE = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
