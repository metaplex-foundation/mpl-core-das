# JavaScript client with DAS helpers for Mpl Core

A JavaScript library for getting assets, collections, and groups from DAS in the Mpl Core format.

Requires `@metaplex-foundation/digital-asset-standard-api` `>=2.1.0` (core groups, `getGrouping`, agent filters).

## Getting started

1. First, if you're not already using Umi, [follow these instructions to install the Umi framework](https://github.com/metaplex-foundation/umi/blob/main/docs/installation.md).
2. Next, install [the DAS](https://github.com/metaplex-foundation/digital-asset-standard-api) client using the package manager of your choice.
    ```sh
   npm install @metaplex-foundation/digital-asset-standard-api
   ```
3. Install this library (requires `@metaplex-foundation/mpl-core` `>=1.9.0`).
    ```sh
   npm install @metaplex-foundation/mpl-core-das @metaplex-foundation/mpl-core
   ```
4. Finally, register the DAS plugin with your Umi instance.
   ```ts
   import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
   import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
   
   const umi = createUmi('<your rpc endpoint>');
   umi.use(dasApi());
   ```
5. Examples
   ```ts
   import { publicKey } from '@metaplex-foundation/umi';
   import { das } from '@metaplex-foundation/mpl-core-das';
   
   // Search assets
   const foundAssets = await das.searchAssets(umi, {
     owner: publicKey('<ownerPublicKey>'),
     interface: 'MplCoreAsset',
   });
   
   // Search collections
   const foundCollections = await das.searchCollections(umi, {
     authority: publicKey('<authorityPublicKey>'),
   });

   // Search groups
   const foundGroups = await das.searchGroups(umi, {
     authority: publicKey('<authorityPublicKey>'),
   });
   
   // Fetch assets by authority
   const assetsByAuthority = await das.getAssetsByAuthority(umi, {
     authority: publicKey('<authorityPublicKey>'),
   });
   
   // Fetch assets by owner
   const assetsByOwner = await das.getAssetsByOwner(umi, {
     owner: publicKey('<ownerPublicKey>'),
   });
   
   // Fetch assets by collection
   const assetsByCollection = await das.getAssetsByCollection(umi, {
     collection: publicKey('<collectionPublicKey>'),
   });

   // Fetch members of an mpl-core GroupV1
   const assetsByGroup = await das.getAssetsByGroup(umi, {
     group: publicKey('<groupPublicKey>'),
   });

   // Grouping metadata (name + size) without listing members
   const grouping = await das.getGrouping(umi, {
     groupKey: 'group',
     groupValue: publicKey('<groupPublicKey>'),
   });
   
   // Fetch collections by authority
   const collectionsByUpdateAuthority = await das.getCollectionsByUpdateAuthority(umi, {
     updateAuthority: publicKey('<updateAuthorityPublicKey>'),
   });

   // Fetch groups by authority
   const groupsByUpdateAuthority = await das.getGroupsByUpdateAuthority(umi, {
     updateAuthority: publicKey('<updateAuthorityPublicKey>'),
   });

   // Discover registered agents via DAS agent filters
   const agents = await das.searchAssets(umi, {
     isAgent: true,
     skipDerivePlugins: true,
   });
   ```

## Core groups

mpl-core `GroupV1` accounts are indexed by DAS with `groupKey: 'group'` (collections use `groupKey: 'collection'`).

| Helper | What it does |
|--------|----------------|
| `das.getAssetsByGroup` | List members (assets, collections, nested groups) |
| `das.getGrouping` | Summary metadata (`group_name`, `group_size`) |
| `das.getGroup` / `das.searchGroups` | Fetch group account(s) as `GroupResult` |

> Membership vectors on `GroupResult` (`collections`, `groups`, `parentGroups`, `assets`) may be empty depending on the indexer. Use `fetchGroupV1` from `@metaplex-foundation/mpl-core` for authoritative on-chain membership.

## Agent filters

`das.searchAssets` forwards DAS agent filters from `@metaplex-foundation/digital-asset-standard-api`:

```ts
const agents = await das.searchAssets(umi, {
  isAgent: true,
  agentToken: publicKey('<genesisMint>'),
  assetSigner: publicKey('<assetSignerPda>'),
  skipDerivePlugins: true,
});

// Mapped onto each AssetResult when present:
// asset.is_agent, asset.agent_token, asset.asset_signer
```

## Plugin Derivations

This library will automatically derive the plugins in assets inherited from the collection. 

Read more about plugin inheritance and precedence [here.](https://developers.metaplex.com/core/plugins)

To disable automatic derivation:

```ts
const assetsByOwner = await das.getAssetsByOwner(umi, {
  owner: publicKey('<ownerPublicKey>'),
  skipDerivePlugins: true,
});

```

You can also manually derive the plugins for the asset if you have already fetched the collection at a prior time
using the `mpl-core` JavaScript SDK like:


```js
import { deriveAssetPlugins, fetchCollection } from '@metaplex-foundation/mpl-core'

//...

const collection = await fetchCollection(umi, publicKey('<collectionPublicKey>'))

const assetsByCollection = await das.getAssetsByCollection(umi, {
  collection: collection.publicKey,
  skipDerivePlugins: true,
});

const derivedAssets = assetsByCollection.map((asset) => deriveAssetPlugins(asset, collection))
```

## Using DAS-to-Core type conversions
If you are working with not only Core assets, it might be useful to directly access the conversion helpers along side the other DAS asset types when fetching using [@metaplex-foundation/digital-asset-standard-api](https://github.com/metaplex-foundation/digital-asset-standard-api).


```js
// ... standard setup for @metaplex-foundation/digital-asset-standard-api

const dasAssets = await umi.rpc.getAssetsByOwner({ owner: publicKey('<pubkey>') });

// filter out only core assets
const dasCoreAssets = assets.items.filter((a) => a.interface === 'MplCoreAsset')

// convert them to AssetV1 type (actually AssetResult type which will also have the content field populated from DAS)
const coreAssets = await das.dasAssetsToCoreAssets(umi, dasCoreAssets)

```


## Contributing

Check out the [Contributing Guide](./CONTRIBUTING.md) to learn more about how to contribute to this library.
