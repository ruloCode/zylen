/**
 * useSignedPhotos — resuelve paths del bucket privado progress-photos a
 * signed URLs (lote único por render-cycle; el servicio cachea en memoria).
 * `expo-image` debe usar `cacheKey: path` para que el caché de disco
 * sobreviva la rotación de firmas.
 */

import { useEffect, useState } from 'react';
import { signPhotoUrls } from '@/services/supabase/posts.service';

export function useSignedPhotos(paths: Array<string | undefined>): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const wanted = paths.filter((p): p is string => !!p);
  const key = wanted.join('|');

  useEffect(() => {
    const missing = wanted.filter((p) => !urls[p]);
    if (missing.length === 0) return;
    let cancelled = false;
    void signPhotoUrls(missing).then((map) => {
      if (cancelled || map.size === 0) return;
      setUrls((prev) => {
        const next = { ...prev };
        map.forEach((url, path) => {
          next[path] = url;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // `urls` queda fuera a propósito: solo re-firma cuando cambian los paths
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
