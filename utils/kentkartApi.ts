// Kentkart API yardımcıları: ortak sabitler, zaman aşımı ve token yenileme
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kentkart istemcilerinin kullandığı ortak sabitler
export const REGION = '028';
export const AUTH_TYPE = '4';
export const LANG = 'tr';

// Her istek tipi kendi sürüm string'ini kullanır (değerler mevcut davranışla birebir aynıdır;
// Kentkart bir gün sürüm kontrolü yaparsa sadece buradaki sabitler güncellenir)
export const VERSION_ACCOUNT = 'Web_1.7.2(24)_1.0_FIREFOX_kentkart';
export const VERSION_AUTH = 'Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart';
export const VERSION_SERVICE = 'Web_2.0.7(27)_1.0_FIREFOX_kentkart.web.gaziantepkart';

export const SERVICE_BASE = 'https://service.kentkart.com/rl1';
export const AUTH_BASE = 'https://auth.kentkart.com/rl1';

/**
 * React Native (Hermes) içinde AbortSignal.timeout bulunmaz; o yüzden
 * zaman aşımını AbortController + setTimeout ile kendimiz kuruyoruz.
 */
export function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: options.signal ?? controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

async function getJson(resp: Response): Promise<any> {
  try {
    return await resp.json();
  } catch {
    throw new Error('Sunucu yanıtı çözümlenemedi.');
  }
}

/**
 * refreshToken ile sessiz oturum yenileme.
 * Başarılıysa yeni accessToken döner (ve AsyncStorage güncellenir);
 * başarısızsa null döner ve çağıran taraf mevcut davranışa (login'e yönlendirme) geri düşer.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    const resp = await fetchWithTimeout(
      `${AUTH_BASE}/oauth/token?region=${REGION}&authType=${AUTH_TYPE}&version=${VERSION_AUTH}&lang=${LANG}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
          'Content-Type': 'application/json',
        },
        referrer: 'https://m.kentkart.com/',
        body: JSON.stringify({
          clientId: 'rH7S2',
          clientSecret: 'Om121T12fSv1j66kp9Un5vE9IMkJ3639',
          redirectUri: 'm.kentkart.com',
          refreshToken,
          grantType: 'refreshToken',
        }),
      },
      15000
    );
    const data = await getJson(resp);
    if (data?.result?.code == 0 && data?.accessToken) {
      await AsyncStorage.setItem('apiKey', data.accessToken);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }
      return data.accessToken;
    }
    return null;
  } catch {
    // Yenileme başarısız: sessizce null dön, çağıran taraf login'e yönlendirir
    return null;
  }
}

export type AuthorizedResult = {
  data: any;
  /** Sunucu token geçersiz (code "33") döndü ve yenileme başarısız oldu */
  tokenInvalid: boolean;
  /** Cihazda hiç token yok */
  noToken: boolean;
};

/**
 * Bearer token ile yetkili Kentkart isteği.
 * Token geçersizse (result.code === "33") önce sessizce yenilenir ve istek bir kez daha denenir;
 * yenileme başarısız olursa tokenInvalid=true döner (çağıran taraf login'e yönlendirir).
 */
export async function authorizedKentkartFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<AuthorizedResult> {
  const token = await AsyncStorage.getItem('apiKey');
  if (!token) {
    return { data: null, tokenInvalid: true, noToken: true };
  }

  const send = async (t: string) => {
    const resp = await fetchWithTimeout(
      url,
      {
        ...options,
        headers: {
          Accept: 'application/json, text/plain, */*',
          ...(options.headers || {}),
          Authorization: `Bearer ${t}`,
        },
      },
      timeoutMs
    );
    return getJson(resp);
  };

  const data = await send(token);
  if (data?.result?.code === '33') {
    const yeniToken = await refreshAccessToken();
    if (yeniToken) {
      return { data: await send(yeniToken), tokenInvalid: false, noToken: false };
    }
    return { data, tokenInvalid: true, noToken: false };
  }
  return { data, tokenInvalid: false, noToken: false };
}
