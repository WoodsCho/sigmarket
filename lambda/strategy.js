function run(candles) {
  // candles = [{ time: Unix초(number), open, high, low, close }, ...]
  // 시간순 오름차순 정렬 보장됨

  // ── 헬퍼 함수 ─────────────────────────────────────────────────────────

  function highest(arr, i, n) {
    const start = Math.max(0, i - n + 1);
    let max = -Infinity;
    for (let j = start; j <= i; j++) if (arr[j] > max) max = arr[j];
    return max;
  }

  function lowest(arr, i, n) {
    const start = Math.max(0, i - n + 1);
    let min = Infinity;
    for (let j = start; j <= i; j++) if (arr[j] < min) min = arr[j];
    return min;
  }

  // barssince(cond): i 이전에 condArr[j]가 마지막으로 true였던 거리
  function barssince(condArr, i) {
    for (let j = i - 1; j >= 0; j--) {
      if (condArr[j]) return i - j;
    }
    return i + 1;
  }

  // valuewhen(cond, src, i, n): i 이하에서 n번째(0-indexed) 조건 성립 시의 src 값
  function valuewhen(condArr, srcArr, i, n) {
    let count = 0;
    for (let j = i; j >= 0; j--) {
      if (condArr[j]) {
        if (count === n) return srcArr[j];
        count++;
      }
    }
    return srcArr[0] ?? 0;
  }

  // ── f_darvas(_len) 구현 ───────────────────────────────────────────────
  // PineScript 원본:
  //   _ll   = ta.lowest(low, _len)
  //   _k1   = ta.highest(high, _len)
  //   _k2   = ta.highest(high, _len - 1)
  //   _k3   = ta.highest(high, _len - 2)
  //   _nh   = ta.valuewhen(high > _k1[1], high, 0)
  //   _box1 = _k3 < _k2
  //   _top  = ta.valuewhen(barssince(high > _k1[1]) == _len-2 and _box1, _nh, 0)
  //   _btm  = ta.valuewhen(barssince(high > _k1[1]) == _len-2 and _box1, _ll, 0)
  function f_darvas(_len) {
    const n     = candles.length;
    const highs = candles.map(c => c.high);
    const lows  = candles.map(c => c.low);

    // high > k1[1]: 현재 고가가 이전 봉 기준 _len 최고가를 초과하는지
    const highGtK1Prev = new Array(n).fill(false);
    for (let i = 1; i < n; i++) {
      highGtK1Prev[i] = highs[i] > highest(highs, i - 1, _len);
    }

    // _nh[i]: 가장 최근 high > k1_prev 성립 시의 high 값
    const nhArr = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      nhArr[i] = valuewhen(highGtK1Prev, highs, i, 0);
    }

    // _ll[i]: ta.lowest(low, _len)
    const llArr = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      llArr[i] = lowest(lows, i, _len);
    }

    // 다르바스 박스 성립 조건:
    //   barssince(high > k1_prev) == _len - 2  AND  _k3 < _k2
    const topBtmCond = new Array(n).fill(false);
    for (let i = 0; i < n; i++) {
      const _k2  = highest(highs, i, _len - 1);
      const _k3  = highest(highs, i, _len - 2);
      const bs   = barssince(highGtK1Prev, i);
      topBtmCond[i] = (bs === _len - 2) && (_k3 < _k2);
    }

    // top/btm: 조건 성립 시점의 _nh / _ll 값을 유지 (valuewhen)
    const tops = new Array(n).fill(0);
    const btms = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      tops[i] = valuewhen(topBtmCond, nhArr, i, 0);
      btms[i] = valuewhen(topBtmCond, llArr, i, 0);
    }

    return { tops, btms };
  }

  // ── 3개 박스 계산 ─────────────────────────────────────────────────────
  // request.security 대신 동일 candles에 하드코딩된 len 적용
  //   Box1 (Yellow): b1_tf = "5S",  b1_len = 20
  //   Box2 (Lime):   b2_tf = "1",   b2_len = 28
  //   Box3 (Red):    b3_tf = "5",   b3_len = 89
  const box1 = f_darvas(20);
  const box2 = f_darvas(28);
  const box3 = f_darvas(89);

  // ── 시그널 생성 (sig_type = "Full (1.0)") ────────────────────────────
  // top_target    = top + height        (= top + (top - bottom))
  // bottom_target = bottom - height     (= bottom - (top - bottom))
  //
  // Long:  ta.crossover(high, top_target)    → prev_h <= prev_tt AND cur_h > cur_tt
  // Short: ta.crossunder(low, bottom_target) → prev_l >= prev_tb AND cur_l < cur_tb
  //
  // 3개 박스 중 하나라도 조건 성립 시 시그널

  const results = [];
  for (let i = 0; i < candles.length; i++) {
    const h = candles[i].high;
    const l = candles[i].low;

    // 현재 봉 top/bottom 타겟
    const t1 = box1.tops[i], bt1 = box1.btms[i], h1 = t1 - bt1;
    const t2 = box2.tops[i], bt2 = box2.btms[i], h2 = t2 - bt2;
    const t3 = box3.tops[i], bt3 = box3.btms[i], h3 = t3 - bt3;
    const tt1 = t1 + h1, tb1 = bt1 - h1;
    const tt2 = t2 + h2, tb2 = bt2 - h2;
    const tt3 = t3 + h3, tb3 = bt3 - h3;

    let s1_L = false, s1_S = false;
    let s2_L = false, s2_S = false;
    let s3_L = false, s3_S = false;

    if (i > 0) {
      const ph = candles[i - 1].high;
      const pl = candles[i - 1].low;

      // 이전 봉 top/bottom 타겟
      const pt1 = box1.tops[i-1], pbt1 = box1.btms[i-1], ph1 = pt1 - pbt1;
      const pt2 = box2.tops[i-1], pbt2 = box2.btms[i-1], ph2 = pt2 - pbt2;
      const pt3 = box3.tops[i-1], pbt3 = box3.btms[i-1], ph3 = pt3 - pbt3;
      const ptt1 = pt1 + ph1, ptb1 = pbt1 - ph1;
      const ptt2 = pt2 + ph2, ptb2 = pbt2 - ph2;
      const ptt3 = pt3 + ph3, ptb3 = pbt3 - ph3;

      // crossover(high, target) / crossunder(low, target)
      s1_L = ph <= ptt1 && h > tt1;
      s1_S = pl >= ptb1 && l < tb1;
      s2_L = ph <= ptt2 && h > tt2;
      s2_S = pl >= ptb2 && l < tb2;
      s3_L = ph <= ptt3 && h > tt3;
      s3_S = pl >= ptb3 && l < tb3;
    }

    results.push({
      time:  candles[i].time,
      close: candles[i].close,
      long:  s1_L || s2_L || s3_L,   // 상단 돌파 (BUY)
      short: s1_S || s2_S || s3_S,   // 하단 돌파 (SELL)
    });
  }

  // ── 박스 레벨 데이터 (top/mid/btm × 3박스) ────────────────────────────
  const b1levels = [], b2levels = [], b3levels = [];
  for (let i = 0; i < candles.length; i++) {
    const t = candles[i].time;
    if (box1.tops[i] > 0 && box1.btms[i] > 0) {
      b1levels.push({ time: t, top: box1.tops[i], mid: (box1.tops[i] + box1.btms[i]) / 2, btm: box1.btms[i] });
    }
    if (box2.tops[i] > 0 && box2.btms[i] > 0) {
      b2levels.push({ time: t, top: box2.tops[i], mid: (box2.tops[i] + box2.btms[i]) / 2, btm: box2.btms[i] });
    }
    if (box3.tops[i] > 0 && box3.btms[i] > 0) {
      b3levels.push({ time: t, top: box3.tops[i], mid: (box3.tops[i] + box3.btms[i]) / 2, btm: box3.btms[i] });
    }
  }

  return {
    signals: results,
    lines: { b1: b1levels, b2: b2levels, b3: b3levels },
  };
}
