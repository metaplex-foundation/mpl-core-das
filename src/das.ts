import { PublicKey, Umi } from '@metaplex-foundation/umi';
import {
  DasApiAsset,
  DisplayOptions,
//    DisplayOptions,
  SearchAssetsRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import {
  AssetV1,
  deriveAssetPluginsWithFetch,
} from '@metaplex-foundation/mpl-core';
import { MPL_CORE_ASSET, MPL_CORE_COLLECTION } from './constants';
import {
  AssetOptions,
  AssetResult,
  CollectionResult,
  Pagination,
} from './types';
import { dasAssetToCoreAssetOrCollection } from './helpers';

function validateDisplayOptions(displayOptions?: DisplayOptions) {
  if (!displayOptions) return;
  
  const allowedOptions = ['showCollectionMetadata'];
  const providedOptions = Object.keys(displayOptions);
  
  const invalidOptions = providedOptions.filter(opt => !allowedOptions.includes(opt));
  if (invalidOptions.length > 0) {
    throw new Error(
      `The following display options are not supported with MPL Core: ${invalidOptions.join(', ')}. ` +
      'Only showCollectionMetadata is supported.'
    );
  }
}

async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_ASSET;
  } & AssetOptions
): Promise<AssetResult[]>;
async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_COLLECTION;
  } & AssetOptions
): Promise<CollectionResult[]>;
async function searchAssets(
  context: Umi,
  input: Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> & {
    interface?: typeof MPL_CORE_ASSET | typeof MPL_CORE_COLLECTION;
  } & AssetOptions
) {
  validateDisplayOptions(input.displayOptions);
  
  const dasAssets = await context.rpc.searchAssets({
    ...input,
    interface: input.interface ?? MPL_CORE_ASSET,
    burnt: false,
    displayOptions: input.displayOptions,
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
    displayOptions?: DisplayOptions
  } & Pagination &
    AssetOptions
) {
  validateDisplayOptions(input.displayOptions);
  return searchAssets(context, {
    ...input,
    owner: input.owner,
    displayOptions: input.displayOptions,
  });
}

function getAssetsByAuthority(
  context: Umi,
  input: {
    authority: PublicKey;
    displayOptions?: DisplayOptions
  } & Pagination &
    AssetOptions
) {
  validateDisplayOptions(input.displayOptions);
  return searchAssets(context, {
    ...input,
    authority: input.authority,
    displayOptions: input.displayOptions,
  });
}

function getAssetsByCollection(
  context: Umi,
  input: {
    collection: PublicKey;
    displayOptions?: DisplayOptions;
  } & Pagination &
    AssetOptions
) {
  validateDisplayOptions(input.displayOptions);
  return searchAssets(context, {
    ...input,
    grouping: ['collection', input.collection],
    displayOptions: input.displayOptions,
  });
}

/**
 * Convenience function to fetch a single asset by pubkey
 * @param context Umi
 * @param asset pubkey of the asset
 * @param options
 * @returns
 */
async function getAsset(
  context: Umi,
  asset: PublicKey,
  options: AssetOptions = {},
  displayOptions?: DisplayOptions
): Promise<AssetResult> {
  validateDisplayOptions(displayOptions);
  const dasAsset = await context.rpc.getAsset({assetId: asset, displayOptions: displayOptions});

  return (
    await dasAssetsToCoreAssets(context, [dasAsset], options)
  )[0] as AssetResult;
}

/**
 * Convenience function to fetch a single collection by pubkey
 * @param context
 * @param collection
 * @returns
 */
async function getCollection(
  context: Umi,
  collection: PublicKey,
  displayOptions?: DisplayOptions
): Promise<CollectionResult> {
  validateDisplayOptions(displayOptions);
  const dasCollection = await context.rpc.getAsset({assetId: collection, displayOptions: displayOptions});

  return dasAssetToCoreCollection(context, dasCollection);
}

function getCollectionsByUpdateAuthority(
  context: Umi,
  input: {
    updateAuthority: PublicKey;
    displayOptions?: DisplayOptions
  } & Pagination &
    AssetOptions
) {
  validateDisplayOptions(input.displayOptions);
  return searchCollections(context, {
    ...input,
    authority: input.updateAuthority,
    displayOptions: input.displayOptions,
  });
}

async function dasAssetsToCoreAssets(
  context: Umi,
  assets: DasApiAsset[],
  options: AssetOptions
): Promise<AssetResult[]> {
  const coreAssets = assets.map((asset) => {
    if (asset.interface !== MPL_CORE_ASSET) {
      throw new Error(
        `Invalid interface, expecting interface to be ${MPL_CORE_ASSET} but got ${asset.interface}`
      );
    }
    return dasAssetToCoreAssetOrCollection(asset);
  }) as AssetResult[];

  if (options.skipDerivePlugins) {
    return coreAssets;
  }

  return deriveAssetPluginsWithFetch(context, coreAssets) as Promise<
    AssetResult[]
  >;
}

async function dasAssetToCoreCollection(
  context: Umi,
  asset: DasApiAsset & AssetOptions
): Promise<CollectionResult> {
  if (asset.interface !== MPL_CORE_COLLECTION) {
    throw new Error(
      `Invalid interface, expecting interface to be ${MPL_CORE_COLLECTION} but got ${asset.interface}`
    );
  }
  return dasAssetToCoreAssetOrCollection(asset) as CollectionResult;
}

export const das = {
  searchAssets,
  searchCollections,
  getAssetsByOwner,
  getAssetsByAuthority,
  getAssetsByCollection,
  getCollectionsByUpdateAuthority,
  getAsset,
  getCollection,
  dasAssetsToCoreAssets,
  dasAssetToCoreCollection,
} as const;
