import { PublicKey, Umi } from '@metaplex-foundation/umi';
import {
  DasApiAssetInterface,
  SearchAssetsRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import { AssetV1, CollectionV1, deriveAssetPluginsWithFetch } from '@metaplex-foundation/mpl-core';
import { MPL_CORE_ASSET, MPL_CORE_COLLECTION } from './constants';
import { AssetOptions, Pagination } from './types';
import { dasAssetToCoreAssetOrCollection } from './helpers';

async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_ASSET;
  } & AssetOptions
): Promise<AssetV1[]>;
async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_COLLECTION;
  } & AssetOptions
): Promise<CollectionV1[]>;
async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_ASSET | typeof MPL_CORE_COLLECTION;
  } & AssetOptions
) {
  const dasAssets = await context.rpc.searchAssets({
    ...input,
    interface: (input.interface ?? MPL_CORE_ASSET) as DasApiAssetInterface,
    burnt: false,
  });

  const mappedAssets = dasAssets.items.map((dasAsset) =>
    dasAssetToCoreAssetOrCollection(dasAsset)
  );

  if (input.interface === MPL_CORE_COLLECTION || input.skipDerivePlugins) {
    return mappedAssets;
  }

  return deriveAssetPluginsWithFetch(context, mappedAssets as AssetV1[]);
}

function searchCollections(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & AssetOptions
) {
  return searchAssets(context, { ...input, interface: MPL_CORE_COLLECTION });
}

function getAssetsByOwner(
  context: Umi,
  input: {
    owner: PublicKey;
  } & Pagination & AssetOptions
) {
  return searchAssets(context, {
    ...input,
    owner: input.owner,
  });
}

function getAssetsByAuthority(
  context: Umi,
  input: {
    authority: PublicKey;
  } & Pagination & AssetOptions
) {
  return searchAssets(context, {
    ...input,
    authority: input.authority,
  });
}

function getAssetsByCollection(
  context: Umi,
  input: {
    collection: PublicKey;
  } & Pagination & AssetOptions
) {
  return searchAssets(context, {
    ...input,
    grouping: ['collection', input.collection],
  });
}

function getCollectionsByUpdateAuthority(
  context: Umi,
  input: {
    updateAuthority: PublicKey;
  } & Pagination & AssetOptions
) {
  return searchCollections(context, {
    ...input,
    authority: input.updateAuthority,
  });
}

export const das = {
  searchAssets,
  searchCollections,
  getAssetsByOwner,
  getAssetsByAuthority,
  getAssetsByCollection,
  getCollectionsByUpdateAuthority,
} as const;
