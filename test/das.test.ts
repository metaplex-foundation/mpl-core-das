import test from 'ava';
import { publicKey } from '@metaplex-foundation/umi';
import {
  AssetV1,
  CollectionV1,
  fetchAsset,
  fetchAssetV1,
  fetchCollectionV1,
} from '@metaplex-foundation/mpl-core';
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

test.serial('das: it can search assets', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.searchAssets(umi, {
    owner: dasTestAsset1Owner,
    interface: 'MplCoreAsset',
    skipDerivePlugins: true,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset1PubKey);

  t.like(asset, dasTestAsset1);
});

test.serial('das: it can fetch assets by owner', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.getAssetsByOwner(umi, {
    owner: dasTestAsset1Owner,
    skipDerivePlugins: true,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset1PubKey);
  t.like(asset, dasTestAsset1);
});

test.serial(
  'das: it can fetch assets by owner with showCollectionMetadata',
  async (t) => {
    // Given an Umi instance with DAS API
    const umi = createUmiWithDas(DAS_API_ENDPOINT);

    // Then assets are fetched via the MPL Core DAS helper
    const assets = await das.getAssetsByOwner(umi, {
      owner: publicKey('3AajDgUy6p8cYNr7FUGjN1tsph1PdNdqcp7bHmHVdqsB'),
      displayOptions: {
        showCollectionMetadata: true,
      },
      skipDerivePlugins: true,
    });

    // Verify at least one asset has collection_metadata
    const assetWithCollectionMetadata = assets.find(
      (asset) => asset.collection_metadata
    );
    t.truthy(
      assetWithCollectionMetadata,
      'At least one asset should have collection_metadata'
    );

    // Verify the structure of collection_metadata
    if (assetWithCollectionMetadata?.collection_metadata) {
      t.truthy(
        assetWithCollectionMetadata.collection_metadata.name,
        'collection_metadata should have name'
      );
      t.truthy(
        assetWithCollectionMetadata.collection_metadata.description,
        'collection_metadata should have description'
      );
      t.truthy(
        assetWithCollectionMetadata.collection_metadata.image,
        'collection_metadata should have image'
      );
    }
  }
);

test.serial('das: it can fetch assets by authority', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.getAssetsByAuthority(umi, {
    authority: dasTestAsset1Owner,
    skipDerivePlugins: true,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find((a) => a.publicKey === dasTestAsset1PubKey);
  t.like(asset, dasTestAsset1);
});

test.serial(
  'das: it can fetch assets by authority if authority is not owner',
  async (t) => {
    // Given an Umi instance with DAS API
    const umi = createUmiWithDas(DAS_API_ENDPOINT);

    // Then assets are fetched via the MPL Core DAS helper
    const assets = await das.getAssetsByAuthority(umi, {
      authority: dasTestAsset2UpdateAuthority,
      skipDerivePlugins: true,
    });

    // The fetched assets structure is the same as with the MPL Core fetchAssetV1
    const asset = assets.find((a) => a.publicKey === dasTestAsset2PubKey);
    t.like(asset, dasTestAsset2);
  }
);

test.serial('das: it can fetch assets by collection', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then assets are fetched via the MPL Core DAS helper
  const assets = await das.getAssetsByCollection(umi, {
    collection: dasTestCollection1PubKey,
    skipDerivePlugins: true,
  });

  // The fetched assets structure is the same as with the MPL Core fetchAssetV1
  const asset = assets.find(
    (a) => a.publicKey === dasTestAssetInCollectionPubKey
  );
  t.like(asset, dasTestAssetInCollection);
});

test.serial('das: it can fetch collections by update authority', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // Then collections are fetched via the MPL Core DAS helper
  const collections = await das.getCollectionsByUpdateAuthority(umi, {
    updateAuthority: publicKey(dasTestAsset1Owner),
    skipDerivePlugins: true,
  });

  // One of the fetched collections structure is the same as with the MPL Core fetchCollectionV1
  const collection = collections.find(
    (a) => a.publicKey === dasTestCollection1PubKey
  );
  t.like(collection, dasTestCollection1);
});

test.serial(
  'das: it can fetch collections by update authority if update authority is not owner',
  async (t) => {
    // Given an Umi instance with DAS API
    const umi = createUmiWithDas(DAS_API_ENDPOINT);

    // Then collections are fetched via the MPL Core DAS helper
    const collections = await das.getCollectionsByUpdateAuthority(umi, {
      updateAuthority: publicKey(dasTestCollection2UpdateAuthority),
      skipDerivePlugins: true,
    });

    // One of the fetched collections structure is the same as with the MPL Core fetchCollectionV1
    const collection = collections.find(
      (a) => a.publicKey === dasTestCollection2PubKey
    );
    t.like(collection, dasTestCollection2);
  }
);

test.serial(
  'das: it can convert a DAS asset with the edition plugin to the MPL Core asset structure',
  async (t) => {
    // Given an Umi instance with DAS API and an asset with the edition plugin
    const umi = createUmiWithDas(DAS_API_ENDPOINT);
    const assetPubKey = publicKey(
      '94tbAopaajgjRndvvK31TBqNTkNbJdzifwW4ec7iqpYh'
    );

    // Then the asset data parsed from DAS
    const assets = await das.getAssetsByOwner(umi, {
      owner: publicKey('EBgC18R6zKNic1CLYKYEy3SMSz4zweymeqrMHkXeqpag'),
      skipDerivePlugins: true,
    });
    const assetDas = assets.find((a) => a.publicKey === assetPubKey) ?? {};
    prepareAssetForComparison(assetDas as AssetV1, false);

    // Then the asset data fetched via fetchAssetV1
    const assetMplCore = await fetchAssetV1(umi, assetPubKey);
    prepareAssetForComparison(assetMplCore);

    // Assets data structure is the same from both sources
    t.like(assetDas, assetMplCore);
  }
);

test.serial(
  'das: it can convert a DAS collection with the master edition plugin to the MPL Core collection structure',
  async (t) => {
    // Given an Umi instance with DAS API and a collection with the master edition plugin
    const umi = createUmiWithDas(DAS_API_ENDPOINT);
    const collectionPubKey = publicKey(
      'D6kHt7XgMLtqBWSSf7QNc6YijQn8vqBwHb2ZF3GHnv7P'
    );

    // Then the collection data parsed from DAS
    const collections = await das.getCollectionsByUpdateAuthority(umi, {
      updateAuthority: publicKey(
        'EBgC18R6zKNic1CLYKYEy3SMSz4zweymeqrMHkXeqpag'
      ),
      skipDerivePlugins: true,
    });
    const collectionDas =
      collections.find((a) => a.publicKey === collectionPubKey) ?? {};
    prepareAssetForComparison(collectionDas as CollectionV1, false);

    // Then the collection data fetched via fetchCollectionV1
    const collectionMplCore = await fetchCollectionV1(umi, collectionPubKey);
    prepareAssetForComparison(collectionMplCore);

    // Collections data structure is the same from both sources
    t.like(collectionDas, collectionMplCore);
  }
);

test.serial('das: it can fetch asset with oracle', async (t) => {
  const umi = createUmiWithDas(DAS_API_ENDPOINT);
  const assets = await das.searchAssets(umi, {
    owner: publicKey('APrZTeVysBJqAznfLXS71NAzjr2fCVTSF1A66MeErzM7'),
    skipDerivePlugins: true,
  });

  const asset = assets.find(
    (a) => a.publicKey === 'AFENffFzHQaT1c9GzLfJjUZPY4ZYbHBj7NKA9UgMv6RT'
  )!;
  prepareAssetForComparison(asset, false);

  const mplCoreAsset = await fetchAssetV1(umi, asset.publicKey);
  prepareAssetForComparison(mplCoreAsset);

  t.like(asset, mplCoreAsset);
});

test.serial('das: it can fetch derived asset', async (t) => {
  const umi = createUmiWithDas(DAS_API_ENDPOINT);
  const assets = await das.getAssetsByCollection(umi, {
    collection: publicKey('4waGHv3uwEvvZ35VNh8xZrVAkuDr6tEx8YnCvxYN4A7A'),
  });

  const asset = assets.find(
    (a) => a.publicKey === '9KvAqZVYJbXZzNvaV1HhxvybD6xfguztQwnqhkmzxWV3'
  )!;
  prepareAssetForComparison(asset, false);

  const mplCoreAsset = await fetchAsset(umi, asset.publicKey);
  prepareAssetForComparison(mplCoreAsset);

  t.like(asset, mplCoreAsset);
});

test.serial('das: it can getAsset', async (t) => {
  const umi = createUmiWithDas(DAS_API_ENDPOINT);
  const asset = await das.getAsset(
    umi,
    publicKey('9KvAqZVYJbXZzNvaV1HhxvybD6xfguztQwnqhkmzxWV3')
  );
  prepareAssetForComparison(asset, false);

  const mplCoreAsset = await fetchAsset(umi, asset.publicKey);
  prepareAssetForComparison(mplCoreAsset);

  t.like(asset, mplCoreAsset);
  t.like(asset.content, {
    $schema: 'https://schema.metaplex.com/nft1.0.json',
    json_uri: 'https://example.com/asset',
    files: [],
    metadata: { name: 'new name 2', symbol: '' },
    links: {},
  });
});

test.serial(
  'das: it can getAsset with appData and linkedAppData',
  async (t) => {
    const umi = createUmiWithDas(DAS_API_ENDPOINT);
    const asset = await das.getAsset(
      umi,
      publicKey('9zevazbKHth3X2AxB1H31L8v7L1GDig8wx2AjWkogFS5')
    );
    prepareAssetForComparison(asset, false);

    const mplCoreAsset = await fetchAsset(umi, asset.publicKey);
    prepareAssetForComparison(mplCoreAsset);

    t.like(asset, mplCoreAsset);
    t.like(asset.content, {
      $schema: 'https://schema.metaplex.com/nft1.0.json',
      json_uri:
        'https://raw.githubusercontent.com/Bread-Heads-NFT/arcade-landing/refs/heads/main/public/asset.json',
      files: [
        {
          mime: 'image/png',
          uri: 'https://raw.githubusercontent.com/Bread-Heads-NFT/arcade-landing/refs/heads/main/public/asset.png',
        },
      ],
      metadata: { name: 'Blockiosaurus', symbol: '' },
      links: {
        external_url: 'https://arcade.breadheads.io/',
        image:
          'https://raw.githubusercontent.com/Bread-Heads-NFT/arcade-landing/refs/heads/main/public/asset.png',
      },
    });

    t.true(asset.appDatas!.length > 0, 'appDatas should not be empty');
    t.true(
      asset.linkedAppDatas!.length > 0,
      'linkedAppDatas should not be empty'
    );
  }
);

// TODO
test.skip('das: lifecycle hooks', async (t) => {});

test.serial(
  'das: it throws error for unsupported display options',
  async (t) => {
    // Given an Umi instance with DAS API
    const umi = createUmiWithDas(DAS_API_ENDPOINT);

    // Then using unsupported display options should throw an error
    const error = await t.throwsAsync(async () => {
      await das.getAssetsByOwner(umi, {
        owner: publicKey('3AajDgUy6p8cYNr7FUGjN1tsph1PdNdqcp7bHmHVdqsB'),
        displayOptions: {
          showUnverifiedCollections: true,
        },
        skipDerivePlugins: true,
      });
    });

    t.is(
      error.message,
      'The following display options are not supported with MPL Core: showUnverifiedCollections. Only showCollectionMetadata is supported.'
    );
  }
);

test.serial(
  'das: it throws error for multiple unsupported display options',
  async (t) => {
    // Given an Umi instance with DAS API
    const umi = createUmiWithDas(DAS_API_ENDPOINT);

    // Then using multiple unsupported display options should throw an error
    const error = await t.throwsAsync(async () => {
      await das.getAssetsByOwner(umi, {
        owner: publicKey('3AajDgUy6p8cYNr7FUGjN1tsph1PdNdqcp7bHmHVdqsB'),
        displayOptions: {
          showUnverifiedCollections: true,
          showFungible: true,
        },
        skipDerivePlugins: true,
      });
    });

    t.is(
      error.message,
      'The following display options are not supported with MPL Core: showUnverifiedCollections, showFungible. Only showCollectionMetadata is supported.'
    );
  }
);

test.serial(
  'das: it accepts showCollectionMetadata display option',
  async (t) => {
    // Given an Umi instance with DAS API
    const umi = createUmiWithDas(DAS_API_ENDPOINT);

    // Then using showCollectionMetadata should not throw an error
    await t.notThrowsAsync(async () => {
      await das.getAssetsByOwner(umi, {
        owner: publicKey('3AajDgUy6p8cYNr7FUGjN1tsph1PdNdqcp7bHmHVdqsB'),
        displayOptions: {
          showCollectionMetadata: true,
        },
        skipDerivePlugins: true,
      });
    });
  }
);

test.serial(
  'das: it can convert DAS asset with MsgPack schema to MPL Core asset structure',
  async (t) => {
    // Given an Umi instance with DAS API and an asset with MsgPack schema
    const umi = createUmiWithDas(DAS_API_ENDPOINT);
    const assetPubKey = publicKey(
      'EuXEcqHhF9jPxV9CKB5hjHC2TRo3xprdgk5vJTc9qRaY'
    );

    // Then the asset data parsed from DAS
    const assetDas = await das.getAsset(umi, assetPubKey);
    prepareAssetForComparison(assetDas, false);

    // Then the asset data fetched via fetchAsset
    const assetMplCore = await fetchAsset(umi, assetPubKey);
    prepareAssetForComparison(assetMplCore);

    // Verify that linkedAppDatas and dataSections have correct schema values
    if (assetDas.linkedAppDatas && assetDas.linkedAppDatas.length > 0) {
      const linkedAppData = assetDas.linkedAppDatas[0];
      t.is(linkedAppData?.schema, 2, 'MsgPack schema should be 2');
    }
    if (assetDas.dataSections && assetDas.dataSections.length > 0) {
      const dataSection = assetDas.dataSections[0];
      t.is(dataSection?.schema, 2, 'MsgPack schema should be 2');
    }

    // Verify basic asset structure matches
    t.is(assetDas.publicKey, assetMplCore.publicKey);
    t.is(assetDas.name, assetMplCore.name);
    t.is(assetDas.uri, assetMplCore.uri);
  }
);

test.serial(
  'das: it can convert DAS asset with Json schema to MPL Core asset structure',
  async (t) => {
    // Given an Umi instance with DAS API and an asset with Json schema
    const umi = createUmiWithDas(DAS_API_ENDPOINT);
    const assetPubKey = publicKey(
      '9vqNxe6M6t7PYo1gXrY18hVgDvCpouHSZ6vdDEFbybeA'
    );

    // Then the asset data parsed from DAS
    const assetDas = await das.getAsset(umi, assetPubKey);
    prepareAssetForComparison(assetDas, false);

    // Then the asset data fetched via fetchAsset
    const assetMplCore = await fetchAsset(umi, assetPubKey);
    prepareAssetForComparison(assetMplCore);

    // Verify that linkedAppDatas has correct schema values
    if (assetDas.linkedAppDatas && assetDas.linkedAppDatas.length > 0) {
      const linkedAppData = assetDas.linkedAppDatas[0];
      t.is(linkedAppData?.schema, 1, 'Json schema should be 1');
      // Verify the data matches expected JSON format
      t.deepEqual(
        linkedAppData?.data,
        { message: 'Hello', target: 'world' },
        'LinkedAppData should have correct JSON data'
      );
    }
    if (assetDas.dataSections && assetDas.dataSections.length > 0) {
      const dataSection = assetDas.dataSections[0];
      t.is(dataSection?.schema, 1, 'Json schema should be 1');
      // Verify the data matches expected JSON format
      t.deepEqual(
        dataSection?.data,
        { message: 'Hello', target: 'world' },
        'DataSection should have correct JSON data'
      );
    }

    // Verify basic asset structure matches
    t.is(assetDas.publicKey, assetMplCore.publicKey);
    t.is(assetDas.name, assetMplCore.name);
    t.is(assetDas.uri, assetMplCore.uri);
  }
);

test.serial(
  'das: it can convert DAS asset with Binary schema to MPL Core asset structure',
  async (t) => {
    // Given an Umi instance with DAS API and an asset with Binary schema
    const umi = createUmiWithDas(DAS_API_ENDPOINT);
    const assetPubKey = publicKey(
      'BVjK8uvqUuH5YU6ThX6A7gznx2xi8BxshawbuFe1Y5Vr'
    );

    // Then the asset data parsed from DAS
    const assetDas = await das.getAsset(umi, assetPubKey);
    prepareAssetForComparison(assetDas, false);

    // Then the asset data fetched via fetchAsset
    const assetMplCore = await fetchAsset(umi, assetPubKey);
    prepareAssetForComparison(assetMplCore);

    // Verify that linkedAppDatas and dataSections have correct schema values
    if (assetDas.linkedAppDatas && assetDas.linkedAppDatas.length > 0) {
      const linkedAppData = assetDas.linkedAppDatas[0];
      t.is(linkedAppData?.schema, 0, 'Binary schema should be 0');
      // Verify the data matches expected Binary format (Hello, world! as string)
      t.deepEqual(
        linkedAppData?.data,
        assetMplCore.linkedAppDatas?.[0]?.data,
        'LinkedAppData should have correct Binary data as string'
      );
    }
    if (assetDas.dataSections && assetDas.dataSections.length > 0) {
      const dataSection = assetDas.dataSections[0];
      t.is(dataSection?.schema, 0, 'Binary schema should be 0');
      // Verify the data matches expected Binary format (Hello, world! as string)
      t.deepEqual(
        dataSection?.data,
        assetMplCore.dataSections?.[0]?.data,
        'DataSection should have correct Binary data as string'
      );
    }

    // Verify basic asset structure matches
    t.is(assetDas.publicKey, assetMplCore.publicKey);
    t.is(assetDas.name, assetMplCore.name);
    t.is(assetDas.uri, assetMplCore.uri);
  }
);
