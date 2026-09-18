import {
  DasApiAssetContent,
  SearchAssetsRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import { AssetV1, CollectionV1, GroupV1 } from '@metaplex-foundation/mpl-core';
import { PublicKey } from '@metaplex-foundation/umi';
import {
  MPL_CORE_ASSET,
  MPL_CORE_COLLECTION,
  MPL_CORE_GROUP,
} from './constants';

export type Pagination = Pick<
  SearchAssetsRpcInput,
  'sortBy' | 'limit' | 'page' | 'before' | 'after' | 'cursor'
>;

export type AssetOptions = {
  skipDerivePlugins?: boolean;
};

export type CoreInterface =
  | typeof MPL_CORE_ASSET
  | typeof MPL_CORE_COLLECTION
  | typeof MPL_CORE_GROUP;

/**
 * Extra fields that are not on AssetV1 / CollectionV1 / GroupV1 but returned by DAS
 */
export type DasExtra = {
  content: DasApiAssetContent;
  collection_metadata?: {
    name: string;
    symbol: string;
    description: string;
    image: string;
  };
  /**
   * Whether the Core asset has an AgentIdentity external plugin.
   */
  is_agent?: boolean;
  /**
   * Canonical token mint from the AgentIdentityV2 PDA, when set.
   */
  agent_token?: PublicKey;
  /**
   * Core Asset Signer PDA — the agent's onchain wallet.
   */
  asset_signer?: PublicKey;
};

export type AssetResult = AssetV1 & DasExtra;
export type CollectionResult = CollectionV1 & DasExtra;
/**
 * Group membership vectors (`collections`, `groups`, `parentGroups`, `assets`)
 * are not always populated by DAS indexers. Prefer `fetchGroupV1` from
 * `@metaplex-foundation/mpl-core` when you need authoritative on-chain membership.
 */
export type GroupResult = GroupV1 & DasExtra;

export type CoreResult = AssetResult | CollectionResult | GroupResult;
