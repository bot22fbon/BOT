// mockLiveMarket.ts
// محرك بيانات سوقية لحظية لمحاكاة سوق العملات الرقمية بدقة وواقعية



import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export interface MockToken {
  address: string;
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  ageMinutes: number;
}



let tokens: MockToken[] = [];
let fetchError: string | null = null;

async function fetchTokensFromSources() {
  try {
    // DexScreener endpoint from .env
    const dexEndpoint = process.env.DEXSCREENER_API_ENDPOINT;
    if (!dexEndpoint) throw new Error('DEXSCREENER_API_ENDPOINT not set in .env');
    const dexRes = await fetch(dexEndpoint);
    if (!dexRes.ok) throw new Error('DexScreener fetch failed');
    const dexData = await dexRes.json();
    const dexTokens: MockToken[] = (dexData.pairs || []).slice(0, 50).map((p: any) => ({
      address: p.baseToken?.address || p.address || '',
      symbol: p.baseToken?.symbol || p.symbol || '',
      price: parseFloat(p.priceUsd) || 0,
      volume24h: parseFloat(p.volume?.h24) || 0,
      marketCap: parseFloat(p.liquidity?.usd) || 0,
      holders: 0,
      ageMinutes: 0
    }));
    console.log('DexScreener tokens fetched:', dexTokens.slice(0, 5));

    // CoinGecko endpoint from .env or default
    const cgEndpoint = process.env.COINGECKO_API_ENDPOINT || 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1';
    const cgRes = await fetch(cgEndpoint);
    if (!cgRes.ok) throw new Error('CoinGecko fetch failed');
    const cgData = await cgRes.json();
    const cgTokens: MockToken[] = (cgData || []).map((c: any) => ({
      address: c.id,
      symbol: c.symbol ? c.symbol.toUpperCase() : '',
      price: c.current_price || 0,
      volume24h: c.total_volume || 0,
      marketCap: c.market_cap || 0,
      holders: 0,
      ageMinutes: 0
    }));
    console.log('CoinGecko tokens fetched:', cgTokens.slice(0, 5));

    tokens = [...dexTokens, ...cgTokens];
    if (!tokens.length) throw new Error('No tokens fetched from sources');
  } catch (e: any) {
    fetchError = e?.message || String(e);
    tokens = [];
  }
}

// جلب البيانات عند بدء التشغيل (متزامن)
const fetchPromise = fetchTokensFromSources();


// تحديث الأسعار بشكل لحظي (تحديث من المصدر كل 60 ثانية)
setInterval(() => {
  fetchTokensFromSources();
}, 60000);


export async function getLiveTokens(): Promise<MockToken[]> {
  await fetchPromise;
  if (fetchError) throw new Error('فشل جلب البيانات: ' + fetchError);
  return tokens;
}


export async function getTokenByAddress(address: string): Promise<MockToken | undefined> {
  await fetchPromise;
  return tokens.find(t => t.address === address);
}


export async function simulateBuy(address: string, amount: number): Promise<{ success: boolean; price: number; tx: string }> {
  // تنفيذ فعلي عبر unifiedBuy
  try {
    const { unifiedBuy } = await import('./tradeSources');
    // يجب توفير secret من المستخدم (هنا مثال: من env)
    const secret = process.env.USER_SECRET;
    if (!secret) throw new Error('USER_SECRET غير معرف في البيئة');
    const result = await unifiedBuy(address, amount, secret);
    // result يجب أن يحتوي على tx وسعر فعلي
    // جلب السعر من التوكن إذا لم يكن موجوداً في النتيجة
    const token = await getTokenByAddress(address);
    const price = token?.price ?? 0;
    return {
      success: !!result?.tx,
      price,
      tx: result?.tx ?? ''
    };
  } catch (e: any) {
    return { success: false, price: 0, tx: '' };
  }
}


export async function simulateSell(address: string, amount: number): Promise<{ success: boolean; price: number; tx: string }> {
  // تنفيذ فعلي عبر unifiedSell
  try {
    const { unifiedSell } = await import('./tradeSources');
    const secret = process.env.USER_SECRET;
    if (!secret) throw new Error('USER_SECRET غير معرف في البيئة');
    const result = await unifiedSell(address, amount, secret);
    const token = await getTokenByAddress(address);
    const price = token?.price ?? 0;
    return {
      success: !!result?.tx,
      price,
      tx: result?.tx ?? ''
    };
  } catch (e: any) {
    return { success: false, price: 0, tx: '' };
  }
}
