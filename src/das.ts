import { PublicKey, RpcInterface, Umi } from '@metaplex-foundation/umi';
import {
  DasApiAsset,
  DasApiInterface,
  DisplayOptions,
  GetGroupingRpcResponse,
  SearchAssetsRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import {
  AssetV1,
  Key,
  deriveAssetPluginsWithFetch,
} from '@metaplex-foundation/mpl-core';
import {
  MPL_CORE_ASSET,
  MPL_CORE_COLLECTION,
  MPL_CORE_GROUP,
} from './constants';
import {
  AssetOptions,
  AssetResult,
  CollectionResult,
  CoreInterface,
  CoreResult,
  GroupResult,
  Pagination,
} from './types';
import { dasAssetToCoreAssetOrCollection } from './helpers';

/** Avoid relying on DAS module augmentation across duplicate umi installs. */
function dasRpc(context: Umi): RpcInterface & DasApiInterface {
  return context.rpc as RpcInterface & DasApiInterface;
}

function validateDisplayOptions(displayOptions?: DisplayOptions) {
  if (!displayOptions) return;

  const providedOptions = Object.keys(displayOptions);

  // Since only 'showCollectionMetadata' is allowed, any other option is invalid
  const invalidOptions = providedOptions.filter(
    (opt) => opt !== 'showCollectionMetadata'
  );

  if (invalidOptions.length > 0) {
    throw new Error(
      `The following display options are not supported with MPL Core: ${invalidOptions.join(', ')}. ` +
        'Only showCollectionMetadata is supported.'
    );
  }
}

type SearchAssetsBaseInput = Omit<SearchAssetsRpcInput, 'interface' | 'burnt'> &
  AssetOptions;

async function searchAssets(
  context: Umi,
  input: SearchAssetsBaseInput & {
    interface?: typeof MPL_CORE_ASSET;
  }
): Promise<AssetResult[]>;
async function searchAssets(
  context: Umi,
  input: SearchAssetsBaseInput & {
    interface?: typeof MPL_CORE_COLLECTION;
  }
): Promise<CollectionResult[]>;
async function searchAssets(
  context: Umi,
  input: SearchAssetsBaseInput & {
    interface?: typeof MPL_CORE_GROUP;
  }
): Promise<GroupResult[]>;
async function searchAssets(
  context: Umi,
  input: SearchAssetsBaseInput & {
    interface?: CoreInterface;
  }
): Promise<CoreResult[]>;
async function searchAssets(
  context: Umi,
  input: SearchAssetsBaseInput & {
    interface?: CoreInterface;
  }
) {
  validateDisplayOptions(input.displayOptions);

  const dasAssets = await dasRpc(context).searchAssets({
    ...input,
    interface: input.interface ?? MPL_CORE_ASSET,
    burnt: false,
    displayOptions: input.displayOptions,
  });

  const mappedAssets = dasAssets.items.map((dasAsset) =>
    dasAssetToCoreAssetOrCollection(dasAsset)
  );

  if (
    input.interface === MPL_CORE_COLLECTION ||
    input.interface === MPL_CORE_GROUP ||
    input.skipDerivePlugins
  ) {
    return mappedAssets;
  }

  return deriveAssetPluginsWithFetch(context, mappedAssets as AssetV1[]);
}

function searchCollections(context: Umi, input: SearchAssetsBaseInput) {
  return searchAssets(context, { ...input, interface: MPL_CORE_COLLECTION });
}

function searchGroups(context: Umi, input: SearchAssetsBaseInput) {
  return searchAssets(context, { ...input, interface: MPL_CORE_GROUP });
}

function getAssetsByOwner(
  context: Umi,
  input: {
    owner: PublicKey;
    displayOptions?: DisplayOptions;
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
    displayOptions?: DisplayOptions;
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
 * List Core assets / collections / nested groups that belong to an mpl-core GroupV1.
 * Uses the base DAS `getAssetsByGroup` method with `groupKey: 'group'`.
 */
async function getAssetsByGroup(
  context: Umi,
  input: {
    group: PublicKey;
    displayOptions?: DisplayOptions;
  } & Pagination &
    AssetOptions
): Promise<CoreResult[]> {
  validateDisplayOptions(input.displayOptions);

  const dasAssets = await dasRpc(context).getAssetsByGroup({
    groupKey: 'group',
    groupValue: input.group,
    sortBy: input.sortBy,
    limit: input.limit,
    page: input.page,
    before: input.before,
    after: input.after,
    cursor: input.cursor,
    displayOptions: input.displayOptions,
  });

  const mapped = dasAssets.items.map((dasAsset) =>
    dasAssetToCoreAssetOrCollection(dasAsset)
  );

  if (input.skipDerivePlugins) {
    return mapped;
  }

  const assets = mapped.filter(
    (item): item is AssetResult => item.key === Key.AssetV1
  );
  if (assets.length === 0) {
    return mapped;
  }

  const derivedAssets = (await deriveAssetPluginsWithFetch(
    context,
    assets
  )) as AssetResult[];
  const derivedByKey = new Map(
    derivedAssets.map((asset) => [asset.publicKey.toString(), asset])
  );

  return mapped.map((item) => {
    if (item.key !== Key.AssetV1) return item;
    return derivedByKey.get(item.publicKey.toString()) ?? item;
  });
}

/**
 * Return DAS grouping metadata (name + size) for a collection or mpl-core group.
 */
function getGrouping(
  context: Umi,
  input: {
    groupKey: 'collection' | 'group';
    groupValue: PublicKey | string;
  }
): Promise<GetGroupingRpcResponse> {
  return dasRpc(context).getGrouping({
    groupKey: input.groupKey,
    groupValue: input.groupValue.toString(),
  });
}

/**
 * Convenience function to fetch a single asset by pubkey
 */
async function getAsset(
  context: Umi,
  asset: PublicKey,
  options: AssetOptions = {},
  displayOptions?: DisplayOptions
): Promise<AssetResult> {
  validateDisplayOptions(displayOptions);

  const dasAsset = await dasRpc(context).getAsset({
    assetId: asset,
    ...(displayOptions ? { displayOptions } : {}),
  });

  return (
    await dasAssetsToCoreAssets(context, [dasAsset], options)
  )[0] as AssetResult;
}

/**
 * Convenience function to fetch a single collection by pubkey
 */
async function getCollection(
  context: Umi,
  collection: PublicKey,
  displayOptions?: DisplayOptions
): Promise<CollectionResult> {
  validateDisplayOptions(displayOptions);

  const dasCollection = await dasRpc(context).getAsset({
    assetId: collection,
    ...(displayOptions ? { displayOptions } : {}),
  });

  return dasAssetToCoreCollection(dasCollection);
}

/**
 * Convenience function to fetch a single mpl-core GroupV1 by pubkey via DAS.
 * Membership vectors may be empty depending on the indexer — use `fetchGroupV1`
 * from `@metaplex-foundation/mpl-core` for authoritative on-chain membership.
 */
async function getGroup(
  context: Umi,
  group: PublicKey,
  displayOptions?: DisplayOptions
): Promise<GroupResult> {
  validateDisplayOptions(displayOptions);

  const dasGroup = await dasRpc(context).getAsset({
    assetId: group,
    ...(displayOptions ? { displayOptions } : {}),
  });

  return dasAssetToCoreGroup(dasGroup);
}

function getCollectionsByUpdateAuthority(
  context: Umi,
  input: {
    updateAuthority: PublicKey;
    displayOptions?: DisplayOptions;
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

function getGroupsByUpdateAuthority(
  context: Umi,
  input: {
    updateAuthority: PublicKey;
    displayOptions?: DisplayOptions;
  } & Pagination &
    AssetOptions
) {
  validateDisplayOptions(input.displayOptions);
  return searchGroups(context, {
    ...input,
    authority: input.updateAuthority,
    displayOptions: input.displayOptions,
  });
}

async function dasAssetsToCoreAssets(
  context: Umi,
  assets: DasApiAsset[],
  options: AssetOptions = {}
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

function dasAssetToCoreCollection(asset: DasApiAsset): CollectionResult {
  if (asset.interface !== MPL_CORE_COLLECTION) {
    throw new Error(
      `Invalid interface, expecting interface to be ${MPL_CORE_COLLECTION} but got ${asset.interface}`
    );
  }
  return dasAssetToCoreAssetOrCollection(asset) as CollectionResult;
}

function dasAssetToCoreGroup(asset: DasApiAsset): GroupResult {
  if (asset.interface !== MPL_CORE_GROUP) {
    throw new Error(
      `Invalid interface, expecting interface to be ${MPL_CORE_GROUP} but got ${asset.interface}`
    );
  }
  return dasAssetToCoreAssetOrCollection(asset) as GroupResult;
}

export const das = {
  searchAssets,
  searchCollections,
  searchGroups,
  getAssetsByOwner,
  getAssetsByAuthority,
  getAssetsByCollection,
  getAssetsByGroup,
  getCollectionsByUpdateAuthority,
  getGroupsByUpdateAuthority,
  getGrouping,
  getAsset,
  getCollection,
  getGroup,
  dasAssetsToCoreAssets,
  dasAssetToCoreCollection,
  dasAssetToCoreGroup,
} as const;
