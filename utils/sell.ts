import { getConnection, loadKeypair } from '../wallet';
import { Network, getOrca, OrcaPoolConfig } from '@orca-so/sdk';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';

export async function sellWithOrca(tokenMint: string, amountIn: number) {
  const connection = getConnection();
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY is not set in the environment file');
  const wallet = loadKeypair(JSON.parse(process.env.PRIVATE_KEY));
  const network = process.env.NETWORK === 'devnet' ? Network.DEVNET : Network.MAINNET;
  const orca = getOrca(connection, network);
  const userPublicKey = wallet.publicKey;
// Automatically detect the correct pool (SOL/tokenMint)
  let pool = null;
  let foundConfig = null;
  for (const [key, value] of Object.entries(OrcaPoolConfig)) {
    try {
      const p = orca.getPool(value);
      const tokenAMint = p.getTokenA().mint.toBase58();
      const tokenBMint = p.getTokenB().mint.toBase58();
      if (
        (tokenAMint === tokenMint || tokenBMint === tokenMint) &&
        (tokenAMint === 'So11111111111111111111111111111111111111112' || tokenBMint === 'So11111111111111111111111111111111111111112')
      ) {
        pool = p;
        foundConfig = value;
        break;
      }
    } catch (e) { continue; }
  }
  if (!pool) {
    const orcaUiUrl = `https://www.orca.so/create-pool?baseMint=${tokenMint}&quoteMint=So11111111111111111111111111111111111111112`;
    console.error('🚫 لم يتم العثور على زوج تداول لهذا التوكن على Orca.');
    console.error('🔗 يمكنك إنشاء pool يدوياً عبر الرابط التالي:');
    console.error(orcaUiUrl);
    throw new Error('You must create a pool for this token on Orca before trading.');
  }
  const tokenAccountAddress = getAssociatedTokenAddress(
    pool.getTokenA().mint,
    userPublicKey
  );
  const tokenAmount = await getTokenAccount(
    connection,
    tokenAccountAddress
  );
  if (Number(tokenAmount.amount) < amountIn) {
    throw new Error(`Insufficient balance to sell. Current balance: ${Number(tokenAmount.amount)}`);
  }
  const amount = new Decimal(amountIn.toString());
  const slippage = new Decimal(process.env.SLIPPAGE || '0.1');
  try {
    const swapPayload = await pool.swap(wallet, pool.getTokenA(), amount, slippage);
    const tx = await swapPayload.execute();
    console.log(`✅ Token sold! Transaction: https://solscan.io/tx/${tx}`);
  } catch (err) {
    console.error('❌ Swap execution failed:', err);
    throw err;
  }
}

// Local function to calculate associated token address
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

// Local function to fetch associated token account data
async function getTokenAccount(connection: Connection, tokenAccountAddress: PublicKey) {
  const accountInfo = await connection.getParsedAccountInfo(tokenAccountAddress);
  if (!accountInfo.value || !('data' in accountInfo.value)) throw new Error('Token account not found');
  const data = (accountInfo.value.data as any).parsed?.info;
  if (!data) throw new Error('No valid data in token account');
  return { amount: data.tokenAmount?.amount || 0 };
}
