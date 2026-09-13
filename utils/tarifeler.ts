import AsyncStorage from '@react-native-async-storage/async-storage';
import * as cheerio from 'cheerio/slim';

// Ücret tarifesi veri modeli
export type Tarifeler = {
  ogrenci: number;
  tam: number;
};

const TARIFF_URL = 'https://gaziantepkart.com.tr/'; //'https://acikveriapi.gaziantep.bel.tr/api/Ulasim/UcretTarifesi';
const TARIFF_CACHE_KEY = 'ucretTarifesiCache';
// Tarifeler nadiren değişir; 24 saat boyunca önbellekten kullanılır
const TARIFF_TTL_MS = 24 * 60 * 60 * 1000;
// Cache formatı değiştiğinde eski kayıtları otomatik geçersiz kılmak için
const TARIFF_CACHE_VERSION = 2;
// "Belediye (Şehir İçi)" tarifesini API'nin döndürdüğü tek tipe göre bul
const SEHIR_ICI_TYPE = 'Belediye (Şehir İçi)';
// Metro konsolunda takibi kolaylaştırmak için log etiketi
const LOG_TAG = '[Tarife]';

type TarifeApiItem = {
  type?: string;
  student?: number | string;
  full?: number | string;
};

type TarifeCache = {
  surum: number; // cache format sürümü
  tarifeler: Tarifeler;
  kayitTarihi: number; // epoch ms
};

function toNumberOr(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : fallback;
}

// API bazı type değerlerinde HTML etiketi döndürüyor (<strong>...</strong> gibi); temizle
function normalizeType(type: unknown): string {
  return typeof type === 'string' ? type.replace(/<[^>]*>/g, '').trim() : '';
}

/**
 * "Belediye (Şehir İçi)" tarifesi yanıt içinde birden fazla kez geçebilir
 * (Gaziantep Kart bölümü ve Kredi Kartı bölümü). Uygulama Gaziantep Kart
 * kullandığı için sayısal değere sahip İLK eşleşmeyi alıyoruz. Bölüm
 * başlıklarının (full: null / "Ücretsiz" gibi) atlanmasını da bu sağlar.
 */
async function extractSehirIciTarife(payload: string): Promise<any> {
  let $ = await cheerio.load(payload);

  const tarifeler = {
    ogrenci: toNumberOr($("tr").eq(2).children().eq(3).text(), 0),
    tam: toNumberOr($("tr").eq(2).children().eq(1).text(), 0),
  };
  // Tamamı 0 olan bir tarife geçerli kabul edilmez (0 TL göstermek yerine varsayılanı koru)
  if (tarifeler.ogrenci === 0 && tarifeler.tam === 0) return null;
  return tarifeler;
}

function isValidTarifeler(t: unknown): t is Tarifeler {
  const tarifeler = t as Tarifeler | null;
  return (
    !!tarifeler &&
    typeof tarifeler.ogrenci === 'number' &&
    typeof tarifeler.tam === 'number' &&
    (tarifeler.ogrenci > 0 || tarifeler.tam > 0)
  );
}

async function readCache(): Promise<TarifeCache | null> {
  try {
    const raw = await AsyncStorage.getItem(TARIFF_CACHE_KEY);
    if (!raw) {
      console.log(`${LOG_TAG} Önbellek boş, ağdan çekilecek`);
      return null;
    }
    const parsed = JSON.parse(raw) as TarifeCache;
    if (
      !parsed ||
      parsed.surum !== TARIFF_CACHE_VERSION ||
      typeof parsed.kayitTarihi !== 'number' ||
      !isValidTarifeler(parsed.tarifeler)
    ) {
      console.log(
        `${LOG_TAG} Önbellek geçersiz (sürüm/format/0 TL), siliniyor ve ağdan çekilecek:`,
        raw
      );
      await AsyncStorage.removeItem(TARIFF_CACHE_KEY).catch(() => {});
      return null;
    }
    return parsed;
  } catch (e) {
    console.log(`${LOG_TAG} Önbellek okunamadı:`, e);
    return null;
  }
}

async function writeCache(tarifeler: Tarifeler): Promise<void> {
  try {
    const cache: TarifeCache = {
      surum: TARIFF_CACHE_VERSION,
      tarifeler,
      kayitTarihi: Date.now(),
    };
    await AsyncStorage.setItem(TARIFF_CACHE_KEY, JSON.stringify(cache));
    console.log(`${LOG_TAG} Önbelleğe yazıldı:`, JSON.stringify(tarifeler));
  } catch {
    // Önbelleğe yazılamadıysa sessizce geç; uygulama çalışmaya devam eder
  }
}

/**
 * React Native (Hermes) içinde AbortSignal.timeout bulunmaz; o yüzden
 * zaman aşımını AbortController + setTimeout ile kendimiz kuruyoruz.
 */
function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Ücret tarifelerini getirir.
 * - Geçerli ve 24 saatten yeni önbellek varsa ağ isteği hiç yapılmaz.
 * - Önbellek geçersizse (0 TL dahil) silinir ve mutlaka ağdan taze veri çekilir.
 * - Ağ hatası durumunda bayat (eski) önbellek varsa onunla devam edilir.
 * - Hiçbir veri yoksa null döner; çağıran taraf varsayılan değerleri kullanır.
 */
export async function fetchUcretTarifesi(): Promise<Tarifeler | null> {
  // 1) Güncel ve geçerli önbellek varsa hemen dön
  const cache = await readCache();
  if (cache && Date.now() - cache.kayitTarihi < TARIFF_TTL_MS) {
    console.log(`${LOG_TAG} Önbellekten kullanılıyor:`, JSON.stringify(cache.tarifeler));
    return cache.tarifeler;
  }

  // 2) Ağdan çek (10 sn zaman aşımı) — önbellek yok/geçersizse (0 TL dahil) her zaman buraya düşer
  try {
    console.log(`${LOG_TAG} Ağdan çekiliyor: ${TARIFF_URL}`);
    const resp = await fetchWithTimeout(TARIFF_URL, 10_000);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const tarifeler = await extractSehirIciTarife(await resp.text());
    if (!tarifeler) throw new Error('Tarife verisi bulunamadı');
    await writeCache(tarifeler);
    console.log(`${LOG_TAG} Ağdan alındı:`, JSON.stringify(tarifeler));
    return tarifeler;
  } catch (e) {
    console.log(`${LOG_TAG} Ağ hatası:`, e);
    // 3) Ağ başarısız: bayat önbellek varsa onu kullan, yoksa null
    if (cache) {
      console.log(`${LOG_TAG} Bayat önbellekle devam ediliyor:`, JSON.stringify(cache.tarifeler));
      return cache.tarifeler;
    }
    console.log(`${LOG_TAG} Önbellek de yok, tarifeler null döndü (0 TL gösterilebilir)`);
    return null;
  }
}
