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
   import { createUmi } from '@metaplex-foundation/umi';
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
   const assetsByAuthority = await das.fetchAssetsByAuthority(umi, {
     authority: publicKey('<authorityPublicKey>'),
   });
   
   // Fetch assets by owner
   const assetsByOwner = await das.fetchAssetsByOwner(umi, {
     owner: publicKey('<ownerPublicKey>'),
   });
   
   // Fetch assets by collection
   const assetsByCollection = await das.fetchAssetsByCollection(umi, {
     collection: publicKey('<collectionPublicKey>'),
   });
   
   // Fetch collections by authority
   const collectionsByUpdateAuthority = await das.fetchCollectionsByUpdateAuthority(umi, {
     updateAuthority: publicKey('<updateAuthorityPublicKey>'),
   }); 
   ```

## Contributing

Check out the [Contributing Guide](./CONTRIBUTING.md) the learn more about how to contribute to this library.