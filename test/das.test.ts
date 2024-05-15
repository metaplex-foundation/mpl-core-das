import test from 'ava';
import { publicKey } from '@metaplex-foundation/umi';
import { das } from '../src';
import {
  createUmiWithDas,
  DAS_API_ENDPOINT,
  prepareAssetForComparison,
} from './_setup';
import {
  dasTestAsset1Owner,
  dasTestAsset1,
  dasTestAsset2UpdateAuthority,
  dasTestAsset2,
  dasTestCollection1,
  dasTestCollection2UpdateAuthority,
  dasTestCollection2,
  dasTestAssetInCollection,
  dasTestCollection1PubKey,
  dasTestAsset1PubKey,
  dasTestAsset2PubKey,
  dasTestAssetInCollectionPubKey,
  dasTestCollection2PubKey,
} from './_expectedData';
import {
  AssetV1,
  CollectionV1,
  fetchAssetV1,
  fetchCollectionV1,
} from '@metaplex-foundation/mpl-core';

test('das: it can search assets', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.searchAssets(umi, {
    owner: dasTestAsset1Owner,
    interface: 'MplCoreAsset',
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset1PubKey);

  t.like(asset, dasTestAsset1);
});

test('das: it can fetch assets by owner', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.fetchAssetsByOwner(umi, {
    owner: dasTestAsset1Owner,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset1PubKey);
  t.like(asset, dasTestAsset1);
});

test('das: it can fetch assets by authority', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.fetchAssetsByAuthority(umi, {
    authority: dasTestAsset1Owner,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset1PubKey);
  t.like(asset, dasTestAsset1);
});

test('das: it can fetch assets by authority if authority is not owner', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.fetchAssetsByAuthority(umi, {
    authority: dasTestAsset2UpdateAuthority,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset2PubKey);
  t.like(asset, dasTestAsset2);
});

test('das: it can fetch assets by collection', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.fetchAssetsByCollection(umi, {
    collection: dasTestCollection1PubKey,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find(
    (a) => a.publicKey === dasTestAssetInCollectionPubKey
  );
  t.like(asset, dasTestAssetInCollection);
});

test('das: it can fetch collections by update authority', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then collections are fetched via the MPL Core DAS helper
  const collections = await das.fetchCollectionsByUpdateAuthority(umi, {
    updateAuthority: publicKey(dasTestAsset1Owner),
  });

  // One of the fetched collections structure is the same as with the MPL Core fetchCollectionV1
  const collection = collections.find(
    (a) => a.publicKey === dasTestCollection1PubKey
  );
  t.like(collection, dasTestCollection1);
});

test('das: it can fetch collections by update authority if update authority is not owner', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then collections are fetched via the MPL Core DAS helper
  const collections = await das.fetchCollectionsByUpdateAuthority(umi, {
    updateAuthority: publicKey(dasTestCollection2UpdateAuthority),
  });

  // One of the fetched collections structure is the same as with the MPL Core fetchCollectionV1
  const collection = collections.find(
    (a) => a.publicKey === dasTestCollection2PubKey
  );
  t.like(collection, dasTestCollection2);
});

test('das: it can convert a DAS asset with the edition plugin to the MPL Core asset structure', async (t) => {
  // Given an Umi instance with DAS API and an asset with the edition plugin
  const umi = createUmiWithDas(DAS_API_ENDPOINT);
  const assetPubKey = publicKey('94tbAopaajgjRndvvK31TBqNTkNbJdzifwW4ec7iqpYh');

  // Then the asset data parsed from DAS
  const assets = await das.fetchAssetsByOwner(umi, {
    owner: publicKey('EBgC18R6zKNic1CLYKYEy3SMSz4zweymeqrMHkXeqpag'),
  });
  const assetDas = assets.find((a) => a.publicKey === assetPubKey) ?? {};
  prepareAssetForComparison(assetDas as AssetV1, false);

  // Then the asset data fetched via fetchAssetV1
  const assetMplCore = await fetchAssetV1(umi, assetPubKey);
  prepareAssetForComparison(assetMplCore);

  // Assets data structure is the same from both sources
  t.like(assetDas, assetMplCore);
});

test('das: it can convert a DAS collection with the master edition plugin to the MPL Core collection structure', async (t) => {
  // Given an Umi instance with DAS API and a collection with the master edition plugin
  const umi = createUmiWithDas(DAS_API_ENDPOINT);
  const collectionPubKey = publicKey(
    'D6kHt7XgMLtqBWSSf7QNc6YijQn8vqBwHb2ZF3GHnv7P'
  );

  // Then the collection data parsed from DAS
  const collections = await das.fetchCollectionsByUpdateAuthority(umi, {
    updateAuthority: publicKey('EBgC18R6zKNic1CLYKYEy3SMSz4zweymeqrMHkXeqpag'),
  });
  const collectionDas =
    collections.find((a) => a.publicKey === collectionPubKey) ?? {};
  prepareAssetForComparison(collectionDas as CollectionV1, false);

  // Then the collection data fetched via fetchCollectionV1
  const collectionMplCore = await fetchCollectionV1(umi, collectionPubKey);
  prepareAssetForComparison(collectionMplCore);

  // Collections data structure is the same from both sources
  t.like(collectionDas, collectionMplCore);
});

// TODO
test.skip('das: oracle', async (t) => {});
test.skip('das: lifecycle hooks', async (t) => {});
test.skip('das: data store', async (t) => {});
