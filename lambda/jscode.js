/**
 * Sigma Box Master - JavaScript Implementation
 * * 입력 데이터(OHLCV 배열)를 받아 Sigma Box의 상/하단, 미들, 익스텐션 라인 및 시그널을 반환합니다.
 * 참고: 파인스크립트의 request.security(MTF) 기능은 자바스크립트에서 직접 구현하기 까다로우므로, 
 * 각 타임프레임별로 캔들 데이터(data array)를 준비하여 각각 calculateBox 엔진에 넣어 연산해야 합니다.
 */

class SigmaBoxMaster {
    
    // 배열에서 특정 기간(length) 동안의 최고가를 구하는 헬퍼 함수
    static highest(data, currentIndex, length, key = 'high') {
        let start = Math.max(0, currentIndex - length + 1);
        let maxVal = -Infinity;
        for (let i = start; i <= currentIndex; i++) {
            if (data[i][key] > maxVal) maxVal = data[i][key];
        }
        return maxVal;
    }

    // 배열에서 특정 기간(length) 동안의 최저가를 구하는 헬퍼 함수
    static lowest(data, currentIndex, length, key = 'low') {
        let start = Math.max(0, currentIndex - length + 1);
        let minVal = Infinity;
        for (let i = start; i <= currentIndex; i++) {
            if (data[i][key] < minVal) minVal = data[i][key];
        }
        return minVal;
    }

    // 크로스오버 (Crossover) 판별 함수
    static crossover(currentValue, previousValue, currentTarget, previousTarget) {
        if (previousValue === null || previousTarget === null || currentValue === null || currentTarget === null) return false;
        return previousValue <= previousTarget && currentValue > currentTarget;
    }

    // 크로스언더 (Crossunder) 판별 함수
    static crossunder(currentValue, previousValue, currentTarget, previousTarget) {
        if (previousValue === null || previousTarget === null || currentValue === null || currentTarget === null) return false;
        return previousValue >= previousTarget && currentValue < currentTarget;
    }

    /**
     * 핵심 연산 엔진: f_darvas 로직 포팅
     * @param {Array} data - [{time, open, high, low, close}, ...] 형태의 배열
     * @param {Number} length - 박스 기간 설정값
     * @returns {Array} - 각 캔들별 박스 좌표가 담긴 배열
     */
    static calculateBoxData(data, length) {
        let results = [];
        let prev_k1 = null;
        let nh = 0;
        let bars_since = 0;
        let current_top = null;
        let current_btm = null;

        for (let i = 0; i < data.length; i++) {
            let currentCandle = data[i];

            // 데이터가 length 만큼 누적되지 않았을 때의 예외 처리
            if (i < length) {
                prev_k1 = this.highest(data, i, i + 1);
                results.push({ top: null, btm: null, mid: null, height: null });
                continue;
            }

            let ll = this.lowest(data, i, length);
            let k1 = this.highest(data, i, length);
            let k2 = this.highest(data, i, length - 1);
            let k3 = this.highest(data, i, length - 2);

            // _nh = ta.valuewhen(high > _k1[1], high, 0)
            if (prev_k1 !== null && currentCandle.high > prev_k1) {
                nh = currentCandle.high;
                bars_since = 0;
            } else {
                bars_since++;
            }

            // _box1 = _k3 < _k2
            let box1 = k3 < k2;

            // _top & _btm 업데이트 로직
            if (bars_since === length - 2 && box1) {
                current_top = nh;
                current_btm = ll;
            }

            prev_k1 = k1;

            let mid = (current_top !== null && current_btm !== null) ? (current_top + current_btm) / 2.0 : null;
            let height = (current_top !== null && current_btm !== null) ? (current_top - current_btm) : null;

            results.push({
                top: current_top,
                btm: current_btm,
                mid: mid,
                height: height
            });
        }
        return results;
    }

    /**
     * 시그널 타겟 및 시그널 발생 여부 연산 (Full / Middle / Original 설정 대응)
     */
    static calculateSignals(data, boxData, sigType = 1.0) {
        // sigType: "Original" = 0.0, "Middle" = 0.5, "Full" = 1.0
        let signals = [];
        let prev_high = null;
        let prev_low = null;
        let prev_tt = null;
        let prev_tb = null;

        for (let i = 0; i < data.length; i++) {
            let candle = data[i];
            let box = boxData[i];

            let tt = null;
            let tb = null;
            let isLong = false;
            let isShort = false;

            if (box.top !== null && box.btm !== null) {
                tt = box.top + (box.height * sigType);
                tb = box.btm - (box.height * sigType);

                isLong = this.crossover(candle.high, prev_high, tt, prev_tt);
                isShort = this.crossunder(candle.low, prev_low, tb, prev_tb);
            }

            signals.push({
                targetTop: tt,
                targetBottom: tb,
                longSignal: isLong,
                shortSignal: isShort
            });

            prev_high = candle.high;
            prev_low = candle.low;
            prev_tt = tt;
            prev_tb = tb;
        }

        return signals;
    }

    /**
     * 메인 실행 함수 (데이터와 사용자 설정을 넣어 전체 결과를 뽑아냄)
     * 파인스크립트와 달리 MTF 데이터는 외부에서 미리 맞춰서 들어온다고 가정합니다.
     */
    static run(chartData, config) {
        // 1. Box 1 (Yellow) 연산
        let b1_data = this.calculateBoxData(chartData, config.b1.length);
        let b1_signals = this.calculateSignals(chartData, b1_data, config.b1.sigType);

        // 2. Box 2 (Lime) 연산
        let b2_data = this.calculateBoxData(chartData, config.b2.length);
        let b2_signals = this.calculateSignals(chartData, b2_data, config.b2.sigType);

        // 3. Box 3 (Red) 연산
        let b3_data = this.calculateBoxData(chartData, config.b3.length);
        let b3_signals = this.calculateSignals(chartData, b3_data, config.b3.sigType);

        // 최종적으로 차트에 그리기 위한 데이터 결합
        let finalOutput = [];
        for (let i = 0; i < chartData.length; i++) {
            finalOutput.push({
                time: chartData[i].time,
                box1: {
                    ...b1_data[i],
                    signal: b1_signals[i],
                    // 시각화용 Ext 라인 예시 (Top Ext 2.0배)
                    extTop: b1_data[i].top !== null ? b1_data[i].top + (b1_data[i].height * 2.0) : null,
                    extBtm: b1_data[i].btm !== null ? b1_data[i].btm - (b1_data[i].height * 2.0) : null
                },
                box2: {
                    ...b2_data[i],
                    signal: b2_signals[i]
                },
                box3: {
                    ...b3_data[i],
                    signal: b3_signals[i]
                }
            });
        }
        return finalOutput;
    }
}

// ==========================================
// 💡 사용 예시 (How to Use)
// ==========================================

// 1. 캔들 데이터 배열 (예시)
const mockData = [
    { time: '2026-04-01T09:00:00Z', open: 100, high: 105, low: 95, close: 102 },
    { time: '2026-04-01T09:01:00Z', open: 102, high: 108, low: 100, close: 107 },
    { time: '2026-04-01T09:02:00Z', open: 107, high: 110, low: 106, close: 109 },
    { time: '2026-04-01T09:03:00Z', open: 109, high: 112, low: 108, close: 111 },
    { time: '2026-04-01T09:04:00Z', open: 111, high: 115, low: 110, close: 110 },
    { time: '2026-04-01T09:05:00Z', open: 110, high: 111, low: 100, close: 105 },
    // ... 수백 개의 캔들 데이터가 들어갑니다.
];

// 2. 사용자 설정 (입력창 대체)
const config = {
    b1: { length: 5, sigType: 1.0 }, // 1.0 = Full, 0.5 = Middle, 0.0 = Original
    b2: { length: 6, sigType: 1.0 },
    b3: { length: 98, sigType: 1.0 }
};

// 3. 엔진 구동
const result = SigmaBoxMaster.run(mockData, config);

// 4. 결과 확인 (마지막 캔들 데이터 출력)
console.log(result[result.length - 1]);