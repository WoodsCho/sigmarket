import { useState, useEffect, useCallback } from "react";
import type { Indicator } from "../types";
import { indicators as DEFAULT_INDICATORS } from "../data";

// ============================================
// API 설정: indicators 전용 API Gateway URL
// 미설정 시 기존 API_URL + /indicators 사용
// ============================================
const API_URL = import.meta.env.VITE_INDICATORS_API_URL
  || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/indicators` : "");

export function useIndicators() {
  const [indicators, setIndicators] = useState<Indicator[]>(DEFAULT_INDICATORS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchIndicators = useCallback(async () => {
    if (!API_URL) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(API_URL);
      if (res.status === 403 || res.status === 404) {
        console.warn(`Indicators API 미설정 (${res.status}), 더미 데이터 사용`);
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.indicators && data.indicators.length > 0) {
        const mapped: Indicator[] = data.indicators.map((item: any) => ({
          id: item.id,
          name: item.name,
          subtitle: item.subtitle || "",
          content: item.content || "",
          image: item.image || undefined,
          scores: Array.isArray(item.scores)
            ? item.scores
            : typeof item.scores === "string"
              ? JSON.parse(item.scores)
              : [],
          marketFit: Array.isArray(item.marketFit)
            ? item.marketFit
            : typeof item.marketFit === "string"
              ? JSON.parse(item.marketFit)
              : [],
          tags: Array.isArray(item.tags)
            ? item.tags
            : typeof item.tags === "string"
              ? JSON.parse(item.tags)
              : [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
        setIndicators(mapped);
        setIsLive(true);
      }
    } catch (err) {
      console.warn("Indicators API 연결 실패, 더미 데이터 사용:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  return { indicators, isLoading, isLive };
}
