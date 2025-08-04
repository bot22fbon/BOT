// Script to test all buy/sell sources for diagnostics
import { unifiedBuy, unifiedSell } from './tradeSources';
import * as tradeSources from './tradeSources';

const TEST_TOKEN = 'So11111111111111111111111111111111111111112'; // Example SOL token address
const TEST_AMOUNT = 0.001;
const TEST_SECRET_UINT8 = Uint8Array.from([
  231,190,238,91,121,250,238,199,197,48,25,20,57,42,80,43,244,175,204,152,66,63,171,199,48,76,146,17,56,241,17,220,49,219,152,54,230,50,52,238,79,188,19,124,177,165,236,53,235,211,130,150,185,97,210,139,186,16,10,41,20,220,102,226
]);
const TEST_SECRET = Buffer.from(TEST_SECRET_UINT8).toString('base64');

async function testBuySources() {
  console.log('--- Testing Buy Sources ---');
  const sources = tradeSources.BUY_SOURCES;
  const sourceNames = ['Jupiter', 'Raydium', 'DexScreener'];
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    const name = sourceNames[i] || `Source${i+1}`;
    try {
      if (typeof src.buy !== 'function') {
        console.error(`[BUY][${name}] No buy function.`);
        continue;
      }
      const result = await src.buy(TEST_TOKEN, TEST_AMOUNT, TEST_SECRET);
      console.log(`[BUY][${name}] Result:`, result);
    } catch (e) {
      console.error(`[BUY][${name}] Error:`, e);
    }
  }
}

async function testSellSources() {
  console.log('--- Testing Sell Sources ---');
  const sources = tradeSources.SELL_SOURCES;
  const sourceNames = ['Jupiter', 'Raydium', 'DexScreener'];
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    const name = sourceNames[i] || `Source${i+1}`;
    try {
      if (typeof src.sell !== 'function') {
        console.error(`[SELL][${name}] No sell function.`);
        continue;
      }
      const result = await src.sell(TEST_TOKEN, TEST_AMOUNT, TEST_SECRET);
      console.log(`[SELL][${name}] Result:`, result);
    } catch (e) {
      console.error(`[SELL][${name}] Error:`, e);
    }
  }
}

(async () => {
  await testBuySources();
  await testSellSources();
  console.log('--- Source testing complete ---');
})();
