import {
  DasApiAsset,
  DasApiAssetAuthority,
  DasApiAssetGrouping,
  DasApiAssetInterface,
} from '@metaplex-foundation/digital-asset-standard-api';
import {
  AddBlocker,
  AssetV1,
  Attributes,
  UpdateAuthority,
  BurnDelegate,
  CollectionV1,
  Edition,
  FreezeDelegate,
  getPluginSerializer,
  ImmutableMetadata,
  Key,
  mapPlugin,
  BaseMasterEdition,
  MPL_CORE_PROGRAM_ID,
  PermanentBurnDelegate,
  PermanentFreezeDelegate,
  PermanentTransferDelegate,
  PluginsList,
  PluginType,
  Royalties,
  ruleSet,
  RuleSet,
  TransferDelegate,
  UpdateDelegate,
} from '@metaplex-foundation/mpl-core';
import {
  AccountHeader,
  BigIntInput,
  lamports,
  none,
  PublicKey,
  publicKey,
  some,
} from '@metaplex-foundation/umi';
import { MPL_CORE_COLLECTION } from './constants';

function convertSnakeCase(str: string, toCase: 'pascal' | 'camel' = 'camel') {
  return str
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      toCase === 'camel' && index === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

function base64ToUInt8Array(base64: string) {
  return Uint8Array.from(atob(base64), (m) => m.charCodeAt(0));
}

function getUpdateAuthority(
  groupingItem: DasApiAssetGrouping | undefined,
  authority: DasApiAssetAuthority
): Record<'updateAuthority', UpdateAuthority> {
  const result: { updateAuthority: UpdateAuthority } = {
    updateAuthority: { type: 'None' },
  };

  if (groupingItem && groupingItem.group_key === 'collection') {
    result.updateAuthority = {
      type: 'Collection',
      address: publicKey(groupingItem.group_value),
    };
  } else {
    result.updateAuthority = {
      type: 'Address',
      address: authority.address,
    };
  }

  return result;
}

function getAccountHeader(
  executable?: boolean,
  lamps?: BigIntInput,
  rentEpoch?: number
): Record<'header', AccountHeader & { exists: boolean }> {
  return {
    header: {
      executable: executable ?? false,
      owner: MPL_CORE_PROGRAM_ID,
      lamports: lamports(lamps ?? -1),
      ...(rentEpoch !== undefined ? { rentEpoch: BigInt(rentEpoch) } : {}),
      exists: true,
    },
  };
}

function getRuleSet(dasRuleSet: string | Record<string, any>): RuleSet {
  const isRuleSetString = typeof dasRuleSet === 'string';
  const ruleSetKind = isRuleSetString ? dasRuleSet : Object.keys(dasRuleSet)[0];
  const ruleSetData: PublicKey[] =
    !isRuleSetString && ruleSetKind
      ? dasRuleSet[ruleSetKind].map((bytes: Uint8Array) =>
          publicKey(new Uint8Array(bytes))
        )
      : [];

  // RuleSet has both __kind and type for backwards compatibility
  if (ruleSetKind === 'program_allow_list') {
    return {
      ...ruleSet('ProgramAllowList', [ruleSetData]),
      type: 'ProgramAllowList',
      addresses: ruleSetData,
    };
  }

  if (ruleSetKind === 'program_deny_list') {
    return {
      ...ruleSet('ProgramDenyList', [ruleSetData]),
      type: 'ProgramDenyList',
      addresses: ruleSetData,
    };
  }

  return {
    ...ruleSet('None'),
    type: 'None',
  };
}

function dasPluginDataToCorePluginData(
  dasPluginData: Record<string, any>
):
  | Royalties
  | FreezeDelegate
  | BurnDelegate
  | TransferDelegate
  | UpdateDelegate
  | PermanentFreezeDelegate
  | Attributes
  | PermanentTransferDelegate
  | PermanentBurnDelegate
  | Edition
  | BaseMasterEdition
  | AddBlocker
  | ImmutableMetadata {
  // TODO: Refactor when DAS types are defined
  return (({
    basis_points,
    creators,
    rule_set,
    attribute_list,
    frozen,
    additional_delegates,
    number,
    max_supply,
    name,
    uri,
  }) => ({
    ...(basis_points !== undefined ? { basisPoints: basis_points } : {}),
    ...(creators !== undefined
      ? {
          creators: creators.map((creator: any) => ({
            ...creator,
            address: publicKey(creator.address),
          })),
        }
      : {}),
    ...(rule_set !== undefined ? { ruleSet: getRuleSet(rule_set) } : {}),
    ...(attribute_list !== undefined ? { attributeList: attribute_list } : {}),
    ...(frozen !== undefined ? { frozen } : {}),
    ...(additional_delegates !== undefined
      ? { additionalDelegates: additional_delegates }
      : {}),
    ...(number !== undefined ? { number } : {}),
    ...(max_supply !== undefined ? { maxSupply: max_supply } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(uri !== undefined ? { uri } : {}),
  }))(dasPluginData);
}

function dasPluginsToCorePlugins(dasPlugins: Record<string, any>) {
  return Object.keys(dasPlugins).reduce((acc: PluginsList, dasPluginKey) => {
    const dasPlugin = dasPlugins[dasPluginKey];
    const { authority, data, offset } = dasPlugin;
    const authorityAddress = authority?.address;

    acc = {
      ...acc,
      [convertSnakeCase(dasPluginKey)]: {
        authority: {
          type: authority.type,
          ...(authorityAddress ? { address: publicKey(authorityAddress) } : {}),
        },
        ...dasPluginDataToCorePluginData(data),
        offset: BigInt(offset),
      },
    };

    return acc;
  }, {});
}

function handleUnknownPlugins(unknownDasPlugins?: Record<string, any>[]) {
  if (!unknownDasPlugins) return {};

  return unknownDasPlugins.reduce((acc: PluginsList, unknownPlugin) => {
    if (!PluginType[unknownPlugin.type]) return acc;

    const deserializedPlugin = getPluginSerializer().deserialize(
      base64ToUInt8Array(unknownPlugin.data)
    )[0];

    const { authority } = unknownPlugin;
    const { address } = authority;
    const mappedPlugin = mapPlugin({
      plugin: deserializedPlugin,
      authority: {
        type: authority.type,
        ...(address ? { address } : {}),
      },
      offset: BigInt(unknownPlugin.offset),
    });

    acc = {
      ...acc,
      ...mappedPlugin,
    };

    return acc;
  }, {});
}

export function dasAssetToCoreAssetOrCollection(
  dasAsset: DasApiAsset
): AssetV1 | CollectionV1 {
  // TODO: Define types in Umi DAS client.
  const {
    interface: assetInterface,
    id,
    ownership: { owner },
    content: {
      metadata: { name },
      json_uri: uri,
    },
    compression: { seq },
    grouping,
    authorities,
    plugins,
    unknown_plugins: unknownPlugins,
    executable,
    lamports: lamps,
    rent_epoch: rentEpoch,
    mpl_core_info: mplCoreInfo,
  } = dasAsset as DasApiAsset & {
    plugins: Record<string, any>;
    unknown_plugins?: Array<Record<string, any>>;
    executable?: boolean;
    lamports?: number;
    rent_epoch?: number;
    mpl_core_info?: {
      num_minted?: number;
      current_size?: number;
      plugins_json_version: number;
    };
  };
  const { num_minted: numMinted = 0, current_size: currentSize = 0 } =
    mplCoreInfo ?? {};

  const commonFields = {
    publicKey: id,
    uri,
    name,
    ...getAccountHeader(executable, lamps, rentEpoch),
    ...dasPluginsToCorePlugins(plugins),
    ...handleUnknownPlugins(unknownPlugins),
    // pluginHeader: // TODO: Reconstruct
  };

  const isCollection =
    assetInterface === (MPL_CORE_COLLECTION as DasApiAssetInterface);
  if (isCollection) {
    return {
      ...commonFields,
      key: Key.CollectionV1,
      // Authority should be always present!
      updateAuthority: authorities[0]!.address,
      numMinted,
      currentSize,
    };
  }

  return {
    ...commonFields,
    key: Key.AssetV1,
    owner,
    seq: seq ? some(BigInt(seq)) : none(),
    // Authority should be always present!
    ...getUpdateAuthority(grouping[0], authorities[0]!),
  };
}
