/**
 * سرویس‌یار - هوک‌های React برای فراخوانی API
 */
import { useState, useEffect, useCallback } from 'react';

/** هوک عمومی برای واکشی داده */
export function useFetch<T>(
  fetcher: () => Promise<{ success: boolean; data?: T; message?: string }>,
  deps: unknown[] = []
) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (res.success && res.data !== undefined) {
        setData(res.data);
      } else {
        setError(res.message ?? 'خطا در دریافت داده');
      }
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

/** هوک برای عملیات‌های mutation */
export function useMutation<TInput, TOutput = unknown>(
  mutator: (input: TInput) => Promise<{ success: boolean; data?: TOutput; message?: string }>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const execute = async (input: TInput): Promise<{ success: boolean; data?: TOutput }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutator(input);
      if (!res.success) setError(res.message ?? 'عملیات ناموفق');
      return res;
    } catch {
      setError('خطا در اتصال به سرور');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
