import { sellWithOrca } from './sell';

// Example values (replace with real ones for your wallet and token)
const tokenMint = 'So11111111111111111111111111111111111111112'; // SOL mint or your token mint
const amountIn = 0.01; // Amount to sell

(async () => {
  try {
    await sellWithOrca(tokenMint, amountIn);
  } catch (err) {
    console.error('Test failed:', err);
  }
})();
