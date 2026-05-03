import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';
import { logger } from '../lib/logger';
import { solanaAnchorSuccessCounter, solanaAnchorFailureCounter } from '../lib/metrics';
import { queryOne } from '../db/db';

// In-memory idempotency cache (CP-04)
const anchoredHashes = new Map<string, string>();

export const SolanaAnchor = {
  async anchorAuditHash(sessionId: string, rootHash: string): Promise<string> {
    // CP-04: Idempotency check — don't anchor the same hash twice
    const existing = anchoredHashes.get(rootHash);
    if (existing) {
      logger.info({ event: 'solana_anchor_skipped_duplicate', session_id: sessionId, existing_tx: existing });
      return existing;
    }

    // Also check DB
    const session = await queryOne<{ solana_tx_signature: string | null }>(
      'SELECT solana_tx_signature FROM sessions WHERE id = $1',
      [sessionId]
    );
    if (session?.solana_tx_signature) {
      anchoredHashes.set(rootHash, session.solana_tx_signature);
      return session.solana_tx_signature;
    }

    const privateKeyBase64 = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKeyBase64) {
      throw new Error('SOLANA_PRIVATE_KEY not configured');
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const payer = Keypair.fromSecretKey(Buffer.from(privateKeyBase64, 'base64'));

    const memo = JSON.stringify({
      app: 'loanwizard-os',
      session: sessionId.slice(0, 8), // partial ID only — no full UUID on-chain
      hash: rootHash,
      ts: Date.now(),
    });

    const tx = new Transaction().add(
      createMemoInstruction(memo, [payer.publicKey])
    );

    tx.feePayer = payer.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const sig = await connection.sendTransaction(tx, [payer]);
    await connection.confirmTransaction(sig, 'confirmed');

    anchoredHashes.set(rootHash, sig);
    solanaAnchorSuccessCounter.inc();

    logger.info({
      event: 'solana_anchored',
      session_id: sessionId,
      tx_signature: sig,
      explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });

    return sig;
  },

  getExplorerUrl(txSignature: string): string {
    return `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
  },
};
