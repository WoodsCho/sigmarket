import { useState, useEffect, useCallback } from "react";
import type { Signal } from "../types";

// ============================================
// API 설정: AWS 콘솔에서 API Gateway 배포 후 URL 입력
// ============================================
const API_URL = import.meta.env.VITE_API_URL || "";

// 폴링 주기 (밀리초) - 기본 30초
const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL) || 30000;

// 심볼별 아이콘 매핑
const SYMBOL_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  XRP: "✕",
  SOL: "◎",
  BNB: "◆",
  ADA: "◇",
  DOGE: "Ð",
  DOT: "●",
  AVAX: "▲",
  MATIC: "◈",
};

// 기본 시그널 (API 미연결 시 데모 표시)
const DEFAULT_SIGNALS: Signal[] = [
  { symbol: "BTC/USDT", date: "2025/12/22", time: "18:00", price: "68,240.50", position: "LONG", isNew: true, icon: "₿", exchange: "Binance", indicator: "시그마 메서드 1차눌림", timeAgo: "방금 전" },
  { symbol: "ETH/USDT", date: "2025/12/22", time: "18:15", price: "3,450.20", position: "SHORT", isNew: false, icon: "Ξ", exchange: "Binance", indicator: "Box Trend", timeAgo: "3분 전" },
  { symbol: "SOL/USDT", date: "2025/12/22", time: "18:00", price: "142.30", position: "LONG", isNew: false, icon: "◎", exchange: "Bybit", indicator: "시그마 코어", timeAgo: "12분 전" },
  { symbol: "SIREN/USDT", date: "2025/12/22", time: "18:00", price: "0.4500", position: "LONG", isNew: false, icon: "●", exchange: "OKX", indicator: "시그마 메서드 3차눌림", timeAgo: "28분 전" },
];

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>(DEFAULT_SIGNALS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  const fetchSignals = useCallback(async () => {
    if (!API_URL || !apiAvailable) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(API_URL);
      if (res.status === 403 || res.status === 404) {
        // API 엔드포인트 미설정 — 폴링 중단
        console.warn("API 엔드포인트 미설정 (${res.status}), 데모 모드로 전환");
        setApiAvailable(false);
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.signals && data.signals.length > 0) {
        const mapped: Signal[] = data.signals.map((item: any) => {
          // timeAgo 계산
          let timeAgo = "";
          if (item.createdAt) {
            const diff = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 1000);
            if (diff < 60) timeAgo = "방금 전";
            else if (diff < 3600) timeAgo = `${Math.floor(diff / 60)}분 전`;
            else if (diff < 86400) timeAgo = `${Math.floor(diff / 3600)}시간 전`;
            else timeAgo = `${Math.floor(diff / 86400)}일 전`;
          }

          // symbol 정규화: 다양한 형식 → "BASE/QUOTE"
          // 예) "RAYUSDT.P" → "RAY/USDT", "BTCUSDT" → "BTC/USDT", "BTC/USDT" → "BTC/USDT"
          const rawSymbol = (item.symbol || "").toUpperCase()
          let displaySymbol = rawSymbol
          if (!rawSymbol.includes("/")) {
            // .P (perpetual) 같은 접미사 제거
            const stripped = rawSymbol.replace(/\.(P|PERP|SWAP)$/i, "")
            // 알려진 quote 통화 목록으로 BASE/QUOTE 분리
            const quotes = ["USDT", "USDC", "BTC", "ETH", "BNB", "BUSD"]
            const matched = quotes.find(q => stripped.endsWith(q))
            if (matched) {
              const base = stripped.slice(0, stripped.length - matched.length)
              displaySymbol = `${base}/${matched}`
            } else {
              displaySymbol = `${stripped}/USDT`
            }
          }

          return {
            id: item.id,
            symbol: displaySymbol,
            date: item.date,
            time: item.time,
            price: item.price,
            position: (item.position as "LONG" | "SHORT") || "LONG",
            isNew: item.isNew ?? false,
            icon: item.icon || SYMBOL_ICONS[displaySymbol.split("/")[0]] || "●",
            source: item.source || "tradingview",
            exchange: item.exchange || "",
            indicator: item.indicator || "",
            timeAgo,
            createdAt: item.createdAt || "",
            status: item.status || "",
            profitRate: item.profitRate,
            exitPrice: item.exitPrice,
            exitDate: item.exitDate,
            exitTime: item.exitTime,
          };
        });
        setSignals(mapped);
        setIsLive(true);
      }
    } catch (err) {
      console.warn("API 연결 실패, 데모 시그널 사용:", err);
    } finally {
      setIsLoading(false);
    }
  }, [apiAvailable]);

  useEffect(() => {
    fetchSignals();

    // API가 사용 가능할 때만 폴링
    if (API_URL && apiAvailable) {
      const interval = setInterval(fetchSignals, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [fetchSignals]);

  // createdAt 기준으로 timeAgo 재계산 (API fetch 없이)
  useEffect(() => {
    const calcTimeAgo = (createdAt: string) => {
      if (!createdAt) return "";
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) return "방금 전";
      if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
      return `${Math.floor(diff / 86400)}일 전`;
    };

    const update = () => {
      setSignals(prev => prev.map(s => ({ ...s, timeAgo: calcTimeAgo(s.createdAt || "") })));
    };

    update(); // 마운트 즉시 1회 실행
    const ticker = setInterval(update, 30000); // 30초마다 재계산

    return () => clearInterval(ticker);
  }, []);

  return { signals, isLoading, isLive };
}
