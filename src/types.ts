import {
  DasApiAssetContent,
  SearchAssetsRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import { AssetV1, CollectionV1 } from '@metaplex-foundation/mpl-core';

export type Pagination = Pick<
  SearchAssetsRpcInput,
  'sortBy' | 'limit' | 'page' | 'before' | 'after'
>;

export type AssetOptions = {
  skipDerivePlugins?: boolean;
};

/**
 * Extra fields that are not on AssetV1 or CollectionV1 but returned by DAS
 */
export type DasExtra = {
  content: DasApiAssetContent;
  collection_metadata?: {
    name: string;
    symbol: string;
    description: string;
    image: string;
};
};

export type AssetResult = AssetV1 & DasExtra;
export type CollectionResult = CollectionV1 & DasExtra;
