
const DID_PREFIX = process.env.NEXT_PUBLIC_IS_TESTNET === 'true' ? 'did:signum:testnet' : 'did:signum';

export const getAccountDid = (accountId: string) => `${DID_PREFIX}:acc:${accountId}`;
export const getTxDid = (txId: string) => `${DID_PREFIX}:tx:${txId}`;
