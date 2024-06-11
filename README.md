# JavaScript client with DAS helpers for Mpl Core

A JavaScript library for getting assets and collections from DAS in the Mpl Core format.

## Getting started

1. First, if you're not already using Umi, [follow these instructions to install the Umi framework](https://github.com/metaplex-foundation/umi/blob/main/docs/installation.md).
2. Next, install [the DAS](https://github.com/metaplex-foundation/digital-asset-standard-api) client using the package manager of your choice.
    ```sh
   npm install @metaplex-foundation/digital-asset-standard-api
   ```
3. Install this library.
    ```sh
   npm install @metaplex-foundation/mpl-core-das
   ```
4. Finally, register the library with your Umi instance.
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
   
   // Fetch collections by authority
   const collectionsByUpdateAuthority = await das.getCollectionsByUpdateAuthority(umi, {
     updateAuthority: publicKey('<updateAuthorityPublicKey>'),
   }); 
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



## Contributing

Check out the [Contributing Guide](./CONTRIBUTING.md) to learn more about how to contribute to this library.