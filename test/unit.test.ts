import test from 'ava';
import { publicKey, RpcInterface, Umi } from '@metaplex-foundation/umi';
import { Key } from '@metaplex-foundation/mpl-core';
import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';
import { das } from '../src';
import { dasAssetToCoreAssetOrCollection } from '../src/helpers';

function createMockUmi(rpcOverrides: Partial<RpcInterface> = {}): Umi {
  const rpc = {
    call: async () => {
      throw new Error('unexpected rpc.call');
    },
    getAsset: async () => {
      throw new Error('unexpected getAsset');
    },
    searchAssets: async () => ({ total: 0, limit: 1, items: [] }),
    getAssetsByGroup: async () => ({ total: 0, limit: 1, items: [] }),
    getGrouping: async () => ({
      group_key: 'group',
      group_name: 'Test',
      group_size: 0,
    }),
    ...rpcOverrides,
  } as unknown as RpcInterface;

  return { rpc } as Umi;
}

const baseDasAsset = (
  overrides: Partial<DasApiAsset> & { interface: DasApiAsset['interface'] }
): DasApiAsset =>
  ({
    id: publicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    content: {
      json_uri: 'https://example.com/meta.json',
      metadata: { name: 'Test', symbol: '' },
    },
    authorities: [
      {
        address: publicKey('11111111111111111111111111111111'),
        scopes: ['full'],
      },
    ],
    compression: {
      eligible: false,
      compressed: false,
      data_hash: publicKey('11111111111111111111111111111111'),
      creator_hash: publicKey('11111111111111111111111111111111'),
      asset_hash: publicKey('11111111111111111111111111111111'),
      tree: publicKey('11111111111111111111111111111111'),
      seq: 0,
      leaf_id: 0,
    },
    grouping: [],
    royalty: {
      royalty_model: 'creators',
      target: null,
      percent: 0,
      basis_points: 0,
      primary_sale_happened: false,
      locked: false,
    },
    creators: [],
    ownership: {
      frozen: false,
      delegated: false,
      delegate: null,
      ownership_model: 'single',
      owner: publicKey('11111111111111111111111111111111'),
    },
    supply: {
      print_max_supply: 0,
      print_current_supply: 0,
      edition_nonce: null,
    },
    mutable: true,
    burnt: false,
    ...overrides,
  }) as DasApiAsset;

test('searchAssets passes agent filters to the DAS RPC call', async (t) => {
  const agentToken = publicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const assetSigner = publicKey('6ttUwc5VVmHeVKTddB6XM5vQgBMfw62DThuoiVEufVZq');

  let captured: Record<string, unknown> | undefined;
  const umi = createMockUmi({
    searchAssets: async (params: Record<string, unknown>) => {
      captured = params;
      return { total: 0, limit: 1, items: [] };
    },
  } as Partial<RpcInterface>);

  await das.searchAssets(umi, {
    isAgent: true,
    agentToken,
    assetSigner,
    skipDerivePlugins: true,
  });

  t.is(captured?.isAgent, true);
  t.is(captured?.agentToken, agentToken);
  t.is(captured?.assetSigner, assetSigner);
  t.is(captured?.interface, 'MplCoreAsset');
  t.is(captured?.burnt, false);
});

test('getAssetsByGroup queries DAS with groupKey group', async (t) => {
  const group = publicKey('1CTME6duRH3SaBd5bmSikw1nhxpENe1xS2nHkwUGhgQ');
  let captured: Record<string, unknown> | undefined;

  const umi = createMockUmi({
    getAssetsByGroup: async (params: Record<string, unknown>) => {
      captured = params;
      return {
        total: 1,
        limit: 1,
        items: [
          baseDasAsset({
            interface: 'MplCoreAsset',
            grouping: [
              {
                group_key: 'group',
                group_value: group.toString(),
              },
            ],
          }),
        ],
      };
    },
  } as Partial<RpcInterface>);

  const results = await das.getAssetsByGroup(umi, {
    group,
    skipDerivePlugins: true,
  });

  t.is(captured?.groupKey, 'group');
  t.is(captured?.groupValue, group);
  t.is(results.length, 1);
  t.is(results[0]!.key, Key.AssetV1);
});

test('getGrouping forwards collection and group keys', async (t) => {
  let captured: Record<string, unknown> | undefined;
  const umi = createMockUmi({
    getGrouping: async (params: Record<string, unknown>) => {
      captured = params;
      return {
        group_key: 'collection',
        group_name: 'Demo',
        group_size: 12,
      };
    },
  } as Partial<RpcInterface>);

  const grouping = await das.getGrouping(umi, {
    groupKey: 'collection',
    groupValue: publicKey('5PA96eCFHJSFPY9SWFeRJUHrpoNF5XZL6RrE1JADXhxf'),
  });

  t.is(captured?.groupKey, 'collection');
  t.is(grouping.group_size, 12);
});

test('dasAssetToCoreAssetOrCollection maps MplCoreGroup and agent fields', (t) => {
  const agentToken = publicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const assetSigner = publicKey('6ttUwc5VVmHeVKTddB6XM5vQgBMfw62DThuoiVEufVZq');

  const group = dasAssetToCoreAssetOrCollection(
    baseDasAsset({
      interface: 'MplCoreGroup',
      is_agent: false,
    })
  );

  t.is(group.key, Key.GroupV1);
  t.deepEqual((group as { collections: unknown[] }).collections, []);

  const asset = dasAssetToCoreAssetOrCollection(
    baseDasAsset({
      interface: 'MplCoreAsset',
      is_agent: true,
      agent_token: agentToken,
      asset_signer: assetSigner,
    })
  );

  t.is(asset.key, Key.AssetV1);
  t.is(asset.is_agent, true);
  t.is(asset.agent_token, agentToken);
  t.is(asset.asset_signer, assetSigner);
});

test('nullable collection group_value does not throw', (t) => {
  const asset = dasAssetToCoreAssetOrCollection(
    baseDasAsset({
      interface: 'MplCoreAsset',
      grouping: [{ group_key: 'collection', group_value: null }],
    })
  );

  t.is(asset.key, Key.AssetV1);
  t.like((asset as { updateAuthority: { type: string } }).updateAuthority, {
    type: 'Address',
  });
});
