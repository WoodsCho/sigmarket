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
  { symbol: "BTC", date: "2025/12/22", time: "18:00", price: "89,392", position: "LONG", isNew: false, icon: "₿" },
  { symbol: "ETH", date: "2025/12/22", time: "18:15", price: "3,034", position: "LONG", isNew: false, icon: "Ξ" },
  { symbol: "XRP", date: "2025/12/22", time: "18:00", price: "1.9164", position: "LONG", isNew: false, icon: "✕" },
  { symbol: "SOL", date: "2025/12/22", time: "18:00", price: "126", position: "LONG", isNew: false, icon: "◎" },
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
        const mapped: Signal[] = data.signals.map((item: any) => ({
          id: item.id,
          symbol: item.symbol,
          date: item.date,
          time: item.time,
          price: item.price,
          position: (item.position as "LONG" | "SHORT") || "LONG",
          isNew: item.isNew ?? false,
          icon: item.icon || SYMBOL_ICONS[item.symbol] || "●",
          source: item.source || "tradingview",
        }));
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

  return { signals, isLoading, isLive };
}
