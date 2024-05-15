import {
  generateSigner,
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
  PublicKey,
  createUmi,
  Umi,
  Signer,
} from '@metaplex-foundation/umi';
import {
  AssetV1,
  CollectionV1,
  fetchAssetV1,
  DataState,
  fetchCollectionV1,
  create,
  createCollection as baseCreateCollection,
  ExternalPluginAdapterInitInfoArgs,
  AssetPluginAuthorityPairArgsV2,
  CollectionPluginAuthorityPairArgsV2,
  AuthorityManagedPluginArgsV2,
} from '@metaplex-foundation/mpl-core';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { testPlugins } from '@metaplex-foundation/umi-bundle-tests';

export const DAS_API_ENDPOINT = process.env.DAS_API_ENDPOINT!;

export const createUmiWithDas = (endpoint: string) =>
  createUmi().use(testPlugins(endpoint)).use(dasApi());

export const prepareAssetForComparison = (
  asset: AssetV1 | CollectionV1,
  removePluginHeader = true
) => {
  // Needed for passing tests with different RPC providers.
  // Most providers do not return rentEpoch and set lamports basis points to -1n
  asset.header.lamports.basisPoints = -1n;
  delete asset.header.rentEpoch;

  if (removePluginHeader) {
    // Remove plugin header for tests
    // TODO: Reconstruct plugin header when converting data from DAS
    delete asset.pluginHeader;
  }
};

export const ASSET_COMMON_DATA = {
  name: 'DAS Test Asset',
  uri: 'https://example.com/das-asset',
};

export const COLLECTION_COMMON_DATA = {
  name: 'DAS Test Collection',
  uri: 'https://example.com/das-collection',
};

type CreateAssetHelperArgs = {
  owner?: PublicKey | Signer;
  payer?: Signer;
  asset?: Signer;
  dataState?: DataState;
  name?: string;
  uri?: string;
  authority?: Signer;
  updateAuthority?: PublicKey | Signer;
  collection?: PublicKey | CollectionV1;
  plugins?: (
    | ExternalPluginAdapterInitInfoArgs
    | AssetPluginAuthorityPairArgsV2
  )[];
};

const createAsset = async (umi: Umi, input: CreateAssetHelperArgs = {}) => {
  const payer = input.payer || umi.identity;
  const owner = publicKey(input.owner || input.payer || umi.identity);
  const asset = input.asset || generateSigner(umi);
  const updateAuthority = publicKey(input.updateAuthority || payer);

  const collection =
    typeof input.collection === 'string'
      ? await fetchCollectionV1(umi, input.collection as PublicKey)
      : (input.collection as CollectionV1 | undefined);

  await create(umi, {
    owner,
    payer,
    dataState: input.dataState,
    asset,
    updateAuthority,
    name: input.name || ASSET_COMMON_DATA.name,
    uri: input.uri || ASSET_COMMON_DATA.uri,
    plugins: input.plugins,
    collection,
    authority: input.authority,
  }).sendAndConfirm(umi);

  return fetchAssetV1(umi, publicKey(asset));
};

type CreateCollectionHelperArgs = {
  payer?: Signer;
  collection?: Signer;
  name?: string;
  uri?: string;
  updateAuthority?: PublicKey | Signer;
  plugins?: (
    | ExternalPluginAdapterInitInfoArgs
    | CollectionPluginAuthorityPairArgsV2
  )[];
};

const createCollection = async (
  umi: Umi,
  input: CreateCollectionHelperArgs = {}
) => {
  const payer = input.payer || umi.identity;
  const collection = input.collection || generateSigner(umi);
  const updateAuthority = publicKey(input.updateAuthority || payer);

  await baseCreateCollection(umi, {
    name: input.name || COLLECTION_COMMON_DATA.name,
    uri: input.uri || COLLECTION_COMMON_DATA.uri,
    collection,
    payer,
    updateAuthority,
    plugins: input.plugins,
  }).sendAndConfirm(umi);

  return fetchCollectionV1(umi, publicKey(collection));
};

function getPluginsForCreation(
  payer: PublicKey
): AuthorityManagedPluginArgsV2[] {
  return [
    {
      type: 'UpdateDelegate',
      additionalDelegates: [],
    },
    {
      type: 'Attributes',
      attributeList: [{ key: 'some key', value: 'some value' }],
    },
    {
      type: 'Royalties',
      basisPoints: 500,
      creators: [{ address: payer, percentage: 100 }],
      ruleSet: {
        type: 'None',
      },
    },
  ];
}

// Run this function if assets for DAS tests need to be changed for some reason
// @ts-ignore
export async function createDasTestAssetOrCollection({
  payerSecretKey,
  rpcEndpoint,
  isUpdateAuthorityOwner = true,
  isCollection = false,
  collection,
}: {
  payerSecretKey: Uint8Array;
  rpcEndpoint: string;
  isUpdateAuthorityOwner?: boolean;
  isCollection?: boolean;
  collection?: PublicKey;
}) {
  const umi = createUmiWithDas(rpcEndpoint);
  const payerKeypair = umi.eddsa.createKeypairFromSecretKey(payerSecretKey);
  const payer = createSignerFromKeypair(umi, payerKeypair);
  const assetAddress = generateSigner(umi);
  const transferDelegateAuthority = generateSigner(umi);
  const updateAuthority = !isUpdateAuthorityOwner
    ? generateSigner(umi)
    : undefined;

  umi.use(keypairIdentity(payerKeypair));

  let asset: AssetV1 | CollectionV1;
  if (isCollection) {
    asset = await createCollection(umi, {
      ...ASSET_COMMON_DATA,
      updateAuthority,
      collection: assetAddress,
      payer,
      plugins: [
        ...getPluginsForCreation(payer.publicKey),
        {
          type: 'MasterEdition',
          maxSupply: 100,
          name: 'Test Master Edition Name',
          uri: 'https://example.com/das-collection-master-edition',
          authority: {
            type: 'UpdateAuthority',
          },
        },
      ],
    });
  } else {
    asset = await createAsset(umi, {
      ...ASSET_COMMON_DATA,
      updateAuthority,
      asset: assetAddress,
      payer,
      collection,
      plugins: [
        ...getPluginsForCreation(payer.publicKey),
        {
          type: 'TransferDelegate',
          authority: {
            type: 'Address',
            address: transferDelegateAuthority.publicKey,
          },
        },
        {
          type: 'BurnDelegate',
          authority: {
            type: 'UpdateAuthority',
          },
        },
        {
          type: 'FreezeDelegate',
          frozen: false,
        },
        {
          type: 'Edition',
          number: 2,
        },
      ],
    });
  }

  const entity = isCollection ? 'collection' : 'asset';
  console.log(
    `A new ${entity} is created. Save the info below somewhere for further use in tests!`
  );
  console.log(`Created ${entity}:`, asset);
}
