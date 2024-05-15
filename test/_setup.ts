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
  pluginAuthorityPair,
  AssetV1,
  ruleSet,
  addressPluginAuthority,
  CollectionV1,
  createV1,
  fetchAssetV1,
  DataState,
  PluginAuthorityPairArgs,
  fetchCollectionV1,
  createCollectionV1,
  updatePluginAuthority,
} from '@metaplex-foundation/mpl-core';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { testPlugins } from '@metaplex-foundation/umi-bundle-tests';

export const DAS_API_ENDPOINT = process.env.DAS_API_ENDPOINT!;

export const createUmiWithDas = (endpoint: string) =>
  createUmi().use(testPlugins(endpoint)).use(dasApi());

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
  collection?: PublicKey;
  // TODO use PluginList type here
  plugins?: PluginAuthorityPairArgs[];
};

const createAsset = async (umi: Umi, input: CreateAssetHelperArgs = {}) => {
  const payer = input.payer || umi.identity;
  const owner = publicKey(input.owner || input.payer || umi.identity);
  const asset = input.asset || generateSigner(umi);
  const updateAuthority = publicKey(input.updateAuthority || payer);
  // const tx =
  await createV1(umi, {
    owner,
    payer,
    dataState: input.dataState,
    asset,
    updateAuthority,
    name: input.name || ASSET_COMMON_DATA.name,
    uri: input.uri || ASSET_COMMON_DATA.uri,
    plugins: input.plugins,
    collection: input.collection,
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
  // TODO use CollectionPluginList type here
  plugins?: PluginAuthorityPairArgs[];
};

const createCollection = async (
  umi: Umi,
  input: CreateCollectionHelperArgs = {}
) => {
  const payer = input.payer || umi.identity;
  const collection = input.collection || generateSigner(umi);
  const updateAuthority = publicKey(input.updateAuthority || payer);
  await createCollectionV1(umi, {
    name: input.name || COLLECTION_COMMON_DATA.name,
    uri: input.uri || COLLECTION_COMMON_DATA.uri,
    collection,
    payer,
    updateAuthority,
    plugins: input.plugins,
  }).sendAndConfirm(umi);

  return fetchCollectionV1(umi, publicKey(collection));
};

function getPluginsForCreation(payer: PublicKey) {
  return [
    pluginAuthorityPair({
      type: 'UpdateDelegate',
    }),
    pluginAuthorityPair({
      type: 'Attributes',
      data: { attributeList: [{ key: 'some key', value: 'some value' }] },
    }),
    pluginAuthorityPair({
      type: 'Royalties',
      data: {
        basisPoints: 5,
        creators: [
          {
            address: payer,
            percentage: 100,
          },
        ],
        ruleSet: ruleSet('None'),
      },
    }),
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
        pluginAuthorityPair({
          type: 'MasterEdition',
          data: {
            maxSupply: 100,
            name: 'Test Master Edition Name',
            uri: 'https://example.com/das-collection-master-edition',
          },
          authority: updatePluginAuthority(),
        }),
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
        pluginAuthorityPair({
          authority: addressPluginAuthority(
            transferDelegateAuthority.publicKey
          ),
          type: 'TransferDelegate',
        }),
        pluginAuthorityPair({
          type: 'BurnDelegate',
          authority: updatePluginAuthority(),
        }),
        pluginAuthorityPair({
          type: 'FreezeDelegate',
          data: { frozen: false },
        }),
        pluginAuthorityPair({
          type: 'Edition',
          data: { number: 2 },
        }),
      ],
    });
  }

  const entity = isCollection ? 'collection' : 'asset';
  console.log(
    `A new ${entity} is created. Save the info below somewhere for further use in tests!`
  );
  console.log(`Created ${entity}:`, asset);
}
