import { AssetV1, CollectionV1, Key } from '@metaplex-foundation/mpl-core';
import {
  AccountHeader,
  Option,
  publicKey,
  SolAmount,
} from '@metaplex-foundation/umi';
import { ASSET_COMMON_DATA } from './_setup';

type AssetV1WithNoBasisPoints = Omit<AssetV1, 'header'> & {
  header: Omit<AccountHeader, 'lamports'> & {
    lamports: Omit<SolAmount, 'basisPoints'>;
  };
};

type CollectionV1WithNoBasisPoints = Omit<CollectionV1, 'header'> & {
  header: Omit<AccountHeader, 'lamports'> & {
    lamports: Omit<SolAmount, 'basisPoints'>;
  };
};

const MPL_CORE_PROGRAM_ID = publicKey(
  'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
);

const TEST_ASSET_COMMON_DATA = {
  key: Key.AssetV1,
  seq: { __option: 'None' } as Option<bigint>,
};

const TEST_COLLECTION_COMMON_DATA = {
  key: Key.CollectionV1,
  numMinted: 0,
  currentSize: 0,
};

export const dasTestAsset1Owner = publicKey(
  'EBgC18R6zKNic1CLYKYEy3SMSz4zweymeqrMHkXeqpag'
);
export const dasTestAsset1PubKey = publicKey(
  '8gw7zp8cgo2wwp7wvykXaYvGUS6sHqYZ1PnzyQFW2ANG'
);
export const dasTestAsset1: AssetV1WithNoBasisPoints = {
  ...ASSET_COMMON_DATA,
  ...TEST_ASSET_COMMON_DATA,
  owner: dasTestAsset1Owner,
  publicKey: dasTestAsset1PubKey,
  updateAuthority: {
    type: 'Address',
    address: dasTestAsset1Owner,
  },
  header: {
    executable: false,
    owner: MPL_CORE_PROGRAM_ID,
    lamports: {
      // basisPoints: 4541520n, // Some RPC providers can return this
      identifier: 'SOL',
      decimals: 9,
    },
    // rentEpoch: 18446744073709552000, // Some RPC providers can return this
    // exists: true,
  },
  // pluginHeader: { key: 3, pluginRegistryOffset: 208n },
  transferDelegate: {
    authority: {
      type: 'Address',
      address: publicKey('3XSp2DSVM99ETD8YrxrytkGVAAu4rE47TJLoD7m3Ww1J'),
    },
    offset: 127n,
  },
  burnDelegate: {
    authority: { type: 'Owner', address: undefined },
    offset: 128n,
  },
  updateDelegate: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 129n,
    additionalDelegates: [],
  },
  freezeDelegate: {
    authority: { type: 'Owner', address: undefined },
    offset: 134n,
    frozen: false,
  },
  attributes: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 136n,
    attributeList: [{ key: 'some key', value: 'some value' }],
  },
  royalties: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 167n,
    basisPoints: 5,
    creators: [
      {
        address: dasTestAsset1Owner,
        percentage: 100,
      },
    ],
    ruleSet: { __kind: 'None' },
  },
};

export const dasTestAsset2PubKey = publicKey(
  '6wTjNnv5a4QFZDSyVMYaVPSGyAgk9Tppr8Cb3yBjd5th'
);
export const dasTestAsset2Owner = dasTestAsset1Owner;
export const dasTestAsset2UpdateAuthority = publicKey(
  '7Vrco3r1u1wiBwTm7GZtBmFfVKqVR1tyLn8adUuorQ63'
);
export const dasTestAsset2: AssetV1WithNoBasisPoints = {
  ...ASSET_COMMON_DATA,
  ...TEST_ASSET_COMMON_DATA,
  owner: dasTestAsset2Owner,
  publicKey: dasTestAsset2PubKey,
  updateAuthority: {
    type: 'Address',
    address: dasTestAsset2UpdateAuthority,
  },
  header: {
    executable: false,
    owner: MPL_CORE_PROGRAM_ID,
    lamports: {
      // basisPoints: 4541520n, // Some RPC providers can return this
      identifier: 'SOL',
      decimals: 9,
    },
    // rentEpoch: 18446744073709552000, // Some RPC providers can return this
    // exists: true,
  },
  // pluginHeader: { key: 3, pluginRegistryOffset: 208n },
  transferDelegate: {
    authority: {
      type: 'Address',
      address: publicKey('7f7w6BVuqHPb1hQgGUfxQP13NjZzF45YUHioUZkdP4Vd'),
    },
    offset: 127n,
  },
  burnDelegate: {
    authority: { type: 'Owner', address: undefined },
    offset: 128n,
  },
  updateDelegate: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 129n,
    additionalDelegates: [],
  },
  freezeDelegate: {
    authority: { type: 'Owner', address: undefined },
    offset: 134n,
    frozen: false,
  },
  attributes: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 136n,
    attributeList: [{ key: 'some key', value: 'some value' }],
  },
  royalties: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 167n,
    basisPoints: 5,
    creators: [
      {
        address: dasTestAsset2Owner,
        percentage: 100,
      },
    ],
    ruleSet: { __kind: 'None' },
  },
};

export const dasTestCollection1PubKey = publicKey(
  '6yNsdZyWiVYzFd56jZe7SjqBwf8UCbv1gbZb3eqyfVSL'
);
export const dasTestCollection1: CollectionV1WithNoBasisPoints = {
  ...ASSET_COMMON_DATA,
  ...TEST_COLLECTION_COMMON_DATA,
  numMinted: 1,
  currentSize: 1,
  publicKey: dasTestCollection1PubKey,
  header: {
    executable: false,
    owner: MPL_CORE_PROGRAM_ID,
    lamports: {
      // basisPoints: 2860560n, // Some RPC providers can return this
      identifier: 'SOL',
      decimals: 9,
    },
    // rentEpoch: 18446744073709552000, // Some RPC providers can return this
    // exists: true,
  },
  // pluginHeader: { key: 3, pluginRegistryOffset: 182n },

  // This collection was created before owner managed plugins were forbidden to use with collections.
  // But these plugins are actually present in the collection data

  // transferDelegate: {
  //   authority: {
  //     type: 'Address',
  //     address: publicKey('A8SQ9q2aRg2SAxJtBQxj8XwWMU74H1R7DYVCyNeYnQFx'),
  //   },
  //   offset: 101n,
  // },
  // burnDelegate: {
  //   authority: { type: 'Owner', address: undefined },
  //   offset: 102n,
  // },
  // freezeDelegate: {
  //   authority: { type: 'Owner', address: undefined },
  //   offset: 108n,
  //   frozen: false,
  // },

  updateDelegate: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 103n,
    additionalDelegates: [],
  },
  attributes: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 110n,
    attributeList: [{ key: 'some key', value: 'some value' }],
  },
  royalties: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 141n,
    basisPoints: 5,
    creators: [
      {
        address: dasTestAsset1Owner,
        percentage: 100,
      },
    ],
    ruleSet: { __kind: 'None' },
  },
  updateAuthority: dasTestAsset1Owner,
};

export const dasTestCollection2PubKey = publicKey(
  '9g6VQeAn2XUTPyuGXgqZc3YnGJjMxXonhACUy8pCZXLS'
);
export const dasTestCollection2UpdateAuthority = publicKey(
  'UbmPXW4h1P1oNHegWY81a1Q9p7o2Jj5TC4LsUHSUGfm'
);
export const dasTestCollection2: CollectionV1WithNoBasisPoints = {
  ...ASSET_COMMON_DATA,
  ...TEST_COLLECTION_COMMON_DATA,
  publicKey: dasTestCollection2PubKey,
  header: {
    executable: false,
    owner: MPL_CORE_PROGRAM_ID,
    lamports: {
      // basisPoints: 2860560n, // Some RPC providers can return this
      identifier: 'SOL',
      decimals: 9,
    },
    // rentEpoch: 18446744073709552000, // Some RPC providers can return this
    // exists: true,
  },
  // pluginHeader: { key: 3, pluginRegistryOffset: 182n },

  // This collection was created before owner managed plugins were forbidden to use with collections.
  // But these plugins are actually present in the collection data

  // transferDelegate: {
  //   authority: {
  //     type: 'Address',
  //     address: publicKey('G8xVUAnuYbMFq8pxtWFhUvHC8TVoAkqpWgahizugWFfF'),
  //   },
  //   offset: 101n,
  // },
  // burnDelegate: {
  //   authority: { type: 'Owner', address: undefined },
  //   offset: 102n,
  // },
  // freezeDelegate: {
  //   authority: { type: 'Owner', address: undefined },
  //   offset: 108n,
  //   frozen: false,
  // },

  updateDelegate: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 103n,
    additionalDelegates: [],
  },
  attributes: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 110n,
    attributeList: [{ key: 'some key', value: 'some value' }],
  },
  royalties: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 141n,
    basisPoints: 5,
    creators: [
      {
        address: dasTestAsset1Owner,
        percentage: 100,
      },
    ],
    ruleSet: { __kind: 'None' },
  },
  updateAuthority: dasTestCollection2UpdateAuthority,
};

export const dasTestAssetInCollectionPubKey = publicKey(
  'CLvNjH92gVevfwBwdabV2WeiqvkWnNBvgy1of64Xvnr3'
);
export const dasTestAssetInCollection: AssetV1WithNoBasisPoints = {
  ...ASSET_COMMON_DATA,
  ...TEST_ASSET_COMMON_DATA,
  publicKey: dasTestAssetInCollectionPubKey,
  header: {
    executable: false,
    owner: MPL_CORE_PROGRAM_ID,
    lamports: {
      // basisPoints: 4541520n, // Some RPC providers can return this
      identifier: 'SOL',
      decimals: 9,
    },
    // rentEpoch: 18446744073709552000, // Some RPC providers can return this
    // exists: true,
  },
  // pluginHeader: { key: 3, pluginRegistryOffset: 208n },
  transferDelegate: {
    authority: {
      type: 'Address',
      address: publicKey('GWxshtvVv5UP3KrRKLVEmfh393gpobKiS3qJHoEt8qf4'),
    },
    offset: 127n,
  },
  burnDelegate: {
    authority: { type: 'Owner', address: undefined },
    offset: 128n,
  },
  updateDelegate: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 129n,
    additionalDelegates: [],
  },
  freezeDelegate: {
    authority: { type: 'Owner', address: undefined },
    offset: 134n,
    frozen: false,
  },
  attributes: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 136n,
    attributeList: [{ key: 'some key', value: 'some value' }],
  },
  royalties: {
    authority: { type: 'UpdateAuthority', address: undefined },
    offset: 167n,
    basisPoints: 5,
    creators: [
      {
        address: dasTestAsset1Owner,
        percentage: 100,
      },
    ],
    ruleSet: { __kind: 'None' },
  },
  owner: dasTestAsset1Owner,
  updateAuthority: {
    type: 'Collection',
    address: dasTestCollection1PubKey,
  },
};
