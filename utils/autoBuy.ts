
import { getConnection, loadKeypair } from '../wallet';
import { PublicKey, Connection } from '@solana/web3.js';
import { Network, getOrca, OrcaPoolConfig } from '@orca-so/sdk';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
// Local function to fetch associated token account data
async function getTokenAccount(connection: Connection, tokenAccountAddress: PublicKey) {
  const accountInfo = await connection.getParsedAccountInfo(tokenAccountAddress);
  if (!accountInfo.value || !('data' in accountInfo.value)) throw new Error('Token account not found');
  const data = (accountInfo.value.data as any).parsed?.info;
  if (!data) throw new Error('No valid data in token account');
  return { amount: data.tokenAmount?.amount || 0 };
}

// Local function to calculate associated token address
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

import Decimal from 'decimal.js';

// Auto-buy token via Orca
export async function autoBuy(tokenMint: string, solAmount: number, secretKey: string): Promise<string> {
  // Check required environment variables
  if (!secretKey) throw new Error('User secret key not provided.');
  if (!process.env.NETWORK) throw new Error('NETWORK is not set in the environment file.');
  // Optional slippage, but should be validated
  const slippageValue = process.env.SLIPPAGE ? Number(process.env.SLIPPAGE) : 0.01;
  if (isNaN(slippageValue) || slippageValue <= 0 || slippageValue > 0.5) throw new Error('Invalid SLIPPAGE (recommended between 0.001 and 0.5)');

  try {
    const connection = getConnection();
    let wallet;
    try {
      const secret = Buffer.from(secretKey, 'base64');
      wallet = loadKeypair(Array.from(secret));
    } catch (e) {
      throw new Error('Failed to load secret key. Please check secretKey validity');
    }
    const network = process.env.NETWORK === 'devnet' ? Network.DEVNET : Network.MAINNET;
    const orca = getOrca(connection, network);
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
      console.error('🚫 No trading pair found for this token on Orca.');
      console.error('🔗 You can manually create a pool using the following link:');
      console.error(orcaUiUrl);
      throw new Error('You must create a pool for this token on Orca before trading.');
    }
    const amount = new Decimal((solAmount * 1e9).toString()); // SOL to lamports
    const slippage = new Decimal(slippageValue);
    const swapPayload = await pool.swap(wallet, pool.getTokenB(), amount, slippage);
    const tx = await swapPayload.execute();
    return tx;
  } catch (err) {
    console.error('❌ Error during autoBuy execution:', err);
    throw err;
  }
}
// Fetch the amount of token owned after purchase
export async function getBoughtAmount(tokenMint: string, owner: string): Promise<number> {
  const connection = getConnection();
  const token = new PublicKey(tokenMint);
  const ownerPk = new PublicKey(owner);
  const tokenAccountAddress = getAssociatedTokenAddress(token, ownerPk);
  const tokenAmount = await getTokenAccount(connection, tokenAccountAddress);
  return Number(tokenAmount.amount);
}
