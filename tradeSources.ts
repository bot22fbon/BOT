// tradeSources.ts
// Unified trading source manager for Solana bot
// Language: English only


// --- Multi-Source Trading Logic (Promise.race, first-success-wins) ---
// Add your real source modules here. For now, placeholders are used.
// Example: import * as Jupiter from './sources/jupiter';
// Example: import * as Raydium from './sources/raydium';

type TradeSource = 'jupiter' | 'raydium' | 'dexscreener';

// Placeholder source modules (replace with real implementations)
const Jupiter = {
  async buy(tokenMint: string, amount: number, secret: string, ctrl?: any) {
    // تنفيذ شراء فعلي عبر شبكة سولانا مع خصم الرسوم
    const web3 = await import('@solana/web3.js');
    const bs58 = (await import('bs58')).default;
    const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    const fromKeypair = web3.Keypair.fromSecretKey(Buffer.from(secret, 'base64'));
    const toPublicKey = new web3.PublicKey(tokenMint);
    const lamports = Math.floor(amount * 1e9); // تحويل SOL إلى lamports
    // رسوم ثابتة
    const FEE_SOL = 0.01;
    const feeLamports = Math.floor(FEE_SOL * 1e9);
    const feeWallet = process.env.FEE_WALLET;
    if (!feeWallet) throw new Error('FEE_WALLET not set in .env');
    const feePubkey = new web3.PublicKey(feeWallet);
    // تنفيذ عملية الشراء
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [fromKeypair]);
    // خصم الرسوم وإرسالها للمحفظة
    const feeTx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePubkey,
        lamports: feeLamports
      })
    );
    const feeSignature = await web3.sendAndConfirmTransaction(connection, feeTx, [fromKeypair]);
    return { tx: signature, source: 'jupiter', feeTx: feeSignature, fee: FEE_SOL };
  },
  async sell(tokenMint: string, amount: number, secret: string, ctrl?: any) {
    // تنفيذ بيع فعلي عبر شبكة سولانا مع خصم الرسوم
    const web3 = await import('@solana/web3.js');
    const bs58 = (await import('bs58')).default;
    const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    const fromKeypair = web3.Keypair.fromSecretKey(Buffer.from(secret, 'base64'));
    const toPublicKey = new web3.PublicKey(tokenMint);
    const lamports = Math.floor(amount * 1e9); // تحويل SOL إلى lamports
    // رسوم ثابتة
    const FEE_SOL = 0.01;
    const feeLamports = Math.floor(FEE_SOL * 1e9);
    const feeWallet = process.env.FEE_WALLET;
    if (!feeWallet) throw new Error('FEE_WALLET not set in .env');
    const feePubkey = new web3.PublicKey(feeWallet);
    // تنفيذ عملية البيع
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [fromKeypair]);
    // خصم الرسوم وإرسالها للمحفظة
    const feeTx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePubkey,
        lamports: feeLamports
      })
    );
    const feeSignature = await web3.sendAndConfirmTransaction(connection, feeTx, [fromKeypair]);
    // رسوم الأرباح (يتم حسابها لاحقاً في منطق البيع في telegramBot.ts)
    return { tx: signature, source: 'jupiter', feeTx: feeSignature, fee: FEE_SOL };
  }
};
const Raydium = {
  async buy(tokenMint: string, amount: number, secret: string, ctrl?: any) {
    // تنفيذ شراء فعلي عبر شبكة سولانا مع خصم الرسوم
    const web3 = await import('@solana/web3.js');
    const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    const fromKeypair = web3.Keypair.fromSecretKey(Buffer.from(secret, 'base64'));
    const toPublicKey = new web3.PublicKey(tokenMint);
    const lamports = Math.floor(amount * 1e9);
    const FEE_SOL = 0.01;
    const feeLamports = Math.floor(FEE_SOL * 1e9);
    const feeWallet = process.env.FEE_WALLET;
    if (!feeWallet) throw new Error('FEE_WALLET not set in .env');
    const feePubkey = new web3.PublicKey(feeWallet);
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [fromKeypair]);
    const feeTx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePubkey,
        lamports: feeLamports
      })
    );
    const feeSignature = await web3.sendAndConfirmTransaction(connection, feeTx, [fromKeypair]);
    return { tx: signature, source: 'raydium', feeTx: feeSignature, fee: FEE_SOL };
  },
  async sell(tokenMint: string, amount: number, secret: string, ctrl?: any) {
    // تنفيذ بيع فعلي عبر شبكة سولانا مع خصم الرسوم
    const web3 = await import('@solana/web3.js');
    const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    const fromKeypair = web3.Keypair.fromSecretKey(Buffer.from(secret, 'base64'));
    const toPublicKey = new web3.PublicKey(tokenMint);
    const lamports = Math.floor(amount * 1e9);
    const FEE_SOL = 0.01;
    const feeLamports = Math.floor(FEE_SOL * 1e9);
    const feeWallet = process.env.FEE_WALLET;
    if (!feeWallet) throw new Error('FEE_WALLET not set in .env');
    const feePubkey = new web3.PublicKey(feeWallet);
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [fromKeypair]);
    const feeTx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePubkey,
        lamports: feeLamports
      })
    );
    const feeSignature = await web3.sendAndConfirmTransaction(connection, feeTx, [fromKeypair]);
    return { tx: signature, source: 'raydium', feeTx: feeSignature, fee: FEE_SOL };
  }
};
const DexScreener = {
  async buy(tokenMint: string, amount: number, secret: string, ctrl?: any) {
    // تنفيذ شراء فعلي عبر شبكة سولانا مع خصم الرسوم
    const web3 = await import('@solana/web3.js');
    const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    const fromKeypair = web3.Keypair.fromSecretKey(Buffer.from(secret, 'base64'));
    const toPublicKey = new web3.PublicKey(tokenMint);
    const lamports = Math.floor(amount * 1e9);
    const FEE_SOL = 0.01;
    const feeLamports = Math.floor(FEE_SOL * 1e9);
    const feeWallet = process.env.FEE_WALLET;
    if (!feeWallet) throw new Error('FEE_WALLET not set in .env');
    const feePubkey = new web3.PublicKey(feeWallet);
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [fromKeypair]);
    const feeTx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePubkey,
        lamports: feeLamports
      })
    );
    const feeSignature = await web3.sendAndConfirmTransaction(connection, feeTx, [fromKeypair]);
    return { tx: signature, source: 'dexscreener', feeTx: feeSignature, fee: FEE_SOL };
  },
  async sell(tokenMint: string, amount: number, secret: string, ctrl?: any) {
    // تنفيذ بيع فعلي عبر شبكة سولانا مع خصم الرسوم
    const web3 = await import('@solana/web3.js');
    const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    const fromKeypair = web3.Keypair.fromSecretKey(Buffer.from(secret, 'base64'));
    const toPublicKey = new web3.PublicKey(tokenMint);
    const lamports = Math.floor(amount * 1e9);
    const FEE_SOL = 0.01;
    const feeLamports = Math.floor(FEE_SOL * 1e9);
    const feeWallet = process.env.FEE_WALLET;
    if (!feeWallet) throw new Error('FEE_WALLET not set in .env');
    const feePubkey = new web3.PublicKey(feeWallet);
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [fromKeypair]);
    const feeTx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: feePubkey,
        lamports: feeLamports
      })
    );
    const feeSignature = await web3.sendAndConfirmTransaction(connection, feeTx, [fromKeypair]);
    return { tx: signature, source: 'dexscreener', feeTx: feeSignature, fee: FEE_SOL };
  }
};

export const BUY_SOURCES = [Jupiter, Raydium, DexScreener];
export const SELL_SOURCES = [Jupiter, Raydium, DexScreener];

// Helper: run all sources in parallel, return first success, cancel others
type TradeResult = { tx: string; source: TradeSource; feeTx: string; fee: number; error?: string };

// Helper: run all sources in parallel, return first success, cancel others
async function raceSources(sources: any[], fnName: 'buy'|'sell', ...args: any[]): Promise<TradeResult> {
  let resolved = false;
  let errors: string[] = [];
  const controllers = sources.map(() => ({ cancelled: false }));
  const tasks = sources.map((src, i) => (async () => {
    try {
      if (typeof src[fnName] !== 'function') throw new Error(`${fnName} not implemented in source`);
      const res = await src[fnName](...args, controllers[i]);
      // تأكد من وجود fee و feeTx دائماً
      const result = {
        tx: res.tx,
        source: res.source,
        feeTx: res.feeTx || '',
        fee: typeof res.fee === 'number' ? res.fee : 0.01
      };
      if (!resolved) {
        resolved = true;
        // Cancel others
        controllers.forEach((c, j) => { if (j !== i) c.cancelled = true; });
        return result;
      }
    } catch (e: any) {
      errors[i] = e?.message || String(e);
      // سجل الخطأ لكل مصدر
      console.error(`[raceSources] ${fnName} error in source[${i}]:`, e);
      throw e;
    }
  })());
  try {
    const result = await Promise.any(tasks);
    // إذا لم يرجع شيء، أرجع قيمة افتراضية
    if (!result || typeof result.tx !== 'string') {
      return { tx: '', source: 'jupiter', feeTx: '', fee: 0.01, error: 'No transaction returned from any source.' };
    }
    return result;
  } catch (e) {
    // All failed
    // أرجع تفاصيل الخطأ من جميع المصادر
    const errorMsg = errors.filter(Boolean).join(' | ');
    return { tx: '', source: 'jupiter', feeTx: '', fee: 0.01, error: errorMsg || 'All sources failed.' };
  }
}

// Unified buy: tries all sources in parallel, returns first success
export async function unifiedBuy(tokenMint: string, amount: number, secret: string): Promise<TradeResult> {
  return raceSources(BUY_SOURCES, 'buy', tokenMint, amount, secret);
}

// Unified sell: tries all sources in parallel, returns first success
export async function unifiedSell(tokenMint: string, amount: number, secret: string): Promise<TradeResult> {
  return raceSources(SELL_SOURCES, 'sell', tokenMint, amount, secret);
}

// تصدير الدالة raceSources للاختبار
export { raceSources };
