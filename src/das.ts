import { PublicKey, Umi } from '@metaplex-foundation/umi';
import {
  DasApiAssetInterface,
  SearchAssetsRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import { AssetV1, CollectionV1 } from '@metaplex-foundation/mpl-core';
import { MPL_CORE_ASSET, MPL_CORE_COLLECTION } from './constants';
import { Pagination } from './types';
import { dasAssetToCoreAssetOrCollection } from './helpers';

async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_ASSET;
  }
): Promise<AssetV1[]>;
async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_COLLECTION;
  }
): Promise<CollectionV1[]>;
async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_ASSET | typeof MPL_CORE_COLLECTION;
  }
) {
  const dasAssets = await context.rpc.searchAssets({
    ...input,
    interface: (input.interface ?? MPL_CORE_ASSET) as DasApiAssetInterface,
    burnt: false,
  });

  return dasAssets.items.map((dasAsset) =>
    dasAssetToCoreAssetOrCollection(dasAsset)
  );
}

function searchCollections(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'>
) {
  return searchAssets(context, { ...input, interface: MPL_CORE_COLLECTION });
}

function fetchAssetsByOwner(
  context: Umi,
  input: {
    owner: PublicKey;
  } & Pagination
) {
  return searchAssets(context, {
    owner: input.owner,
  });
}

function fetchAssetsByAuthority(
  context: Umi,
  input: {
    authority: PublicKey;
  } & Pagination
) {
  return searchAssets(context, {
    ...input,
    authority: input.authority,
  });
}

function fetchAssetsByCollection(
  context: Umi,
  input: {
    collection: PublicKey;
  } & Pagination
) {
  return searchAssets(context, {
    ...input,
    grouping: ['collection', input.collection],
  });
}

function fetchCollectionsByUpdateAuthority(
  context: Umi,
  input: {
    updateAuthority: PublicKey;
  } & Pagination
) {
  return searchCollections(context, {
    ...input,
    authority: input.updateAuthority,
  });
}

export const das = {
  searchAssets,
  searchCollections,
  fetchAssetsByOwner,
  fetchAssetsByAuthority,
  fetchAssetsByCollection,
  fetchCollectionsByUpdateAuthority,
} as const;
