import { SearchAssetsRpcInput } from '@metaplex-foundation/digital-asset-standard-api';

export type Pagination = Pick<
  SearchAssetsRpcInput,
  'sortBy' | 'limit' | 'page' | 'before' | 'after'
>;

export type AssetOptions = {
  skipDerivePlugins?: boolean;
};
