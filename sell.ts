import { getConnection, loadKeypair } from './wallet';
import { Network, getOrca, OrcaPoolConfig } from '@orca-so/sdk';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import Decimal from 'decimal.js';
import { Connection, PublicKey } from '@solana/web3.js';

export async function sellWithOrca(tokenMint: string, amountIn: number) {
  try {
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
      console.error('🚫 No trading pair found for this token on Orca.');
      console.error('🔗 You can manually create a pool using the following link:');
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
    const swapPayload = await pool.swap(wallet, pool.getTokenA(), amount, slippage);
    const tx = await swapPayload.execute();
    console.log(`✅ Token sold! Transaction: https://solscan.io/tx/${tx}`);
  } catch (err) {
    console.error('❌ Swap execution failed:', err);
    throw err;
  }

// Local function to calculate associated token address
function getAssociatedTokenAddress(mint: any, owner: any): any {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

// Local function to fetch associated token account data
async function getTokenAccount(connection: any, tokenAccountAddress: any) {
  const accountInfo = await connection.getParsedAccountInfo(tokenAccountAddress);
  if (!accountInfo.value || !('data' in accountInfo.value)) throw new Error('Token account not found');
  const data = (accountInfo.value.data as any).parsed?.info;
  if (!data) throw new Error('No valid data in token account');
  return { amount: data.tokenAmount?.amount || 0 };
}
}
