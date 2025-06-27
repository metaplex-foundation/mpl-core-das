import {
  DasApiAsset,
  DasApiAssetAuthority,
  DasApiAssetGrouping,
  DasApiAssetInterface,
} from '@metaplex-foundation/digital-asset-standard-api';
import {
  AddBlocker,
  Attributes,
  UpdateAuthority,
  BurnDelegate,
  Edition,
  FreezeDelegate,
  getPluginSerializer,
  ImmutableMetadata,
  Key,
  mapPlugin,
  MasterEdition,
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
  ExternalPluginAdaptersList,
  ExtraAccount,
  LifecycleChecks,
  CheckResult,
  Autograph,
  VerifiedCreators,
  ExternalPluginAdapterType,
  getExternalPluginAdapterSerializer,
  BaseExternalPluginAdapter,
  oracleFromBase,
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
import { AssetResult, CollectionResult } from './types';

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
      ? dasRuleSet[ruleSetKind].map((bytes: any) =>
          publicKey(typeof bytes === 'string' ? bytes : new Uint8Array(bytes))
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

function parseExtraAccount(data: any): ExtraAccount | undefined {
  let result: ExtraAccount | undefined;
  Object.keys(data).forEach((key) => {
    const acc = data[key];
    const type = convertSnakeCase(key, 'pascal');
    switch (type) {
      case 'PreconfiguredProgram':
      case 'PreconfiguredCollection':
      case 'PreconfiguredOwner':
      case 'PreconfiguredRecipient':
      case 'PreconfiguredAsset':
        result = {
          type,
          isSigner: acc.is_signer,
          isWritable: acc.is_writable,
        };
        break;
      case 'Address':
        result = {
          type,
          isSigner: acc.is_signer,
          isWritable: acc.is_writable,
          address: publicKey(acc.address),
        };
        break;
      case 'CustomPda':
        result = {
          type,
          isSigner: acc.is_signer,
          isWritable: acc.is_writable,
          seeds: acc.seeds?.map((seed: any) => {
            if (typeof seed === 'string') {
              return {
                type: seed,
              };
            }
            if (seed.address) {
              return {
                type: 'Address',
                pubkey: publicKey(seed.address),
              };
            }
            if (seed.bytes) {
              return {
                type: 'Bytes',
                bytes: new Uint8Array(seed.bytes),
              };
            }
            return null;
          }),
          customProgramId: acc.custom_program_id
            ? publicKey(acc.custom_program_id)
            : undefined,
        };
        break;
      default:
    }
  });

  return result;
}

function parseLifecycleChecks(data: any): LifecycleChecks {
  return Object.keys(data).reduce(
    (acc: LifecycleChecks, key) => ({
      ...acc,
      [key]: data[key].map((check: string) => {
        switch (check) {
          case 'CanListen':
            return CheckResult.CAN_LISTEN;
          case 'CanApprove':
            return CheckResult.CAN_APPROVE;
          case 'CanReject':
          default:
            return CheckResult.CAN_REJECT;
        }
      }),
    }),
    {}
  );
}

function dasExternalPluginsToCoreExternalPlugins(
  externalPlugins: Record<string, any>[]
) {
  return externalPlugins.reduce(
    (acc: ExternalPluginAdaptersList, externalPlugin) => {
      const {
        authority,
        offset,
        type,
        adapter_config: adapterConfig,
      } = externalPlugin;
      const authorityAddress = authority?.address;

      if (type === 'Oracle') {
        if (!acc.oracles) {
          acc.oracles = [];
        }

        acc.oracles.push({
          type: 'Oracle',
          authority: {
            type: authority.type,
            ...(authorityAddress
              ? { address: publicKey(authorityAddress) }
              : {}),
          },
          baseAddress: adapterConfig.base_address,
          resultsOffset:
            typeof adapterConfig.results_offset === 'string'
              ? {
                  type: convertSnakeCase(
                    adapterConfig.results_offset,
                    'pascal'
                  ) as any,
                }
              : {
                  type: 'Custom',
                  offset: BigInt(adapterConfig.results_offset.custom),
                },
          baseAddressConfig: adapterConfig.base_address_config
            ? parseExtraAccount(adapterConfig.base_address_config)
            : undefined,
          lifecycleChecks: externalPlugin.lifecycle_checks
            ? parseLifecycleChecks(externalPlugin.lifecycle_checks)
            : undefined,
          offset: BigInt(offset),
        });
      }

      if (type === 'AppData') {
        if (!acc.appDatas) {
          acc.appDatas = [];
        }

        acc.appDatas.push({
          type: 'AppData',
          authority: {
            type: authority.type,
            ...(authorityAddress
              ? { address: publicKey(authorityAddress) }
              : {}),
          },
          dataAuthority: adapterConfig.data_authority ? {
            type: 'Address',
            address: publicKey(adapterConfig.data_authority),
          } : {
            type: 'UpdateAuthority',
          },
          schema: adapterConfig.schema,
          data: externalPlugin.data ? base64ToUInt8Array(externalPlugin.data) : undefined,
          dataLen: externalPlugin.data_len != null ? BigInt(externalPlugin.data_len) : undefined,
          dataOffset: externalPlugin.data_offset ? BigInt(externalPlugin.data_offset) : undefined,
          lifecycleChecks: externalPlugin.lifecycle_checks
            ? parseLifecycleChecks(externalPlugin.lifecycle_checks)
            : undefined,
          offset: BigInt(offset),
        });
      }

      if (type === 'DataSection' && adapterConfig?.parent_key?.linked_app_data) {
        // Create DataSection plugin  
        if (!acc.dataSections) {
          acc.dataSections = [];
        }

        acc.dataSections.push({
          type: 'DataSection',
          authority: {
            type: authority.type,
            ...(authorityAddress
              ? { address: publicKey(authorityAddress) }
              : {}),
          },
          dataAuthority: adapterConfig.parent_key.linked_app_data.address 
            ? {
                type: 'Address',
                address: publicKey(adapterConfig.parent_key.linked_app_data.address),
              }
            : authority.type,
          parentKey: {
            type: 'LinkedAppData',
            dataAuthority: {
              type: 'Address',
              address: publicKey(adapterConfig.parent_key.linked_app_data.address),
            },
          },
          schema: adapterConfig.schema,
          data: externalPlugin.data ? base64ToUInt8Array(externalPlugin.data) : undefined,
          dataLen: externalPlugin.data_len != null ? BigInt(externalPlugin.data_len) : undefined,
          dataOffset: externalPlugin.data_offset ? BigInt(externalPlugin.data_offset) : undefined,
          lifecycleChecks: externalPlugin.lifecycle_checks
            ? parseLifecycleChecks(externalPlugin.lifecycle_checks)
            : undefined,
          offset: BigInt(offset),
        });

        // Create LinkedAppData plugin
        if (!acc.linkedAppDatas) {
          acc.linkedAppDatas = [];
        }

        acc.linkedAppDatas.push({
          type: 'LinkedAppData',
          authority: {
            type: 'UpdateAuthority',
            ...(authorityAddress
              ? { address: publicKey(authorityAddress) }
              : {}),
          },
          dataAuthority: {
            type: 'Address',
            address: publicKey(adapterConfig.parent_key.linked_app_data.address),
          },
          schema: adapterConfig.schema === 'Binary' ? 0 : adapterConfig.schema,
          data: externalPlugin.data ? base64ToUInt8Array(externalPlugin.data) : undefined,
          lifecycleChecks: externalPlugin.lifecycle_checks
            ? parseLifecycleChecks(externalPlugin.lifecycle_checks)
            : undefined,
          offset: externalPlugin.data_offset ? BigInt(externalPlugin.data_offset) : BigInt(offset),
        });
      }

      return acc;
    },
    {}
  );
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
  | MasterEdition
  | AddBlocker
  | ImmutableMetadata
  | Autograph
  | VerifiedCreators {
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
    signatures,
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
    ...(signatures !== undefined ? { signatures } : {}),
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

function handleUnknownExternalPlugins(
  unknownDasPlugins?: Record<string, any>[]
) {
  if (!unknownDasPlugins) return {};

  return unknownDasPlugins.reduce(
    (acc: ExternalPluginAdaptersList, unknownPlugin) => {
      if (!ExternalPluginAdapterType[unknownPlugin.type]) return acc;

      const deserializedPlugin =
        getExternalPluginAdapterSerializer().deserialize(
          base64ToUInt8Array(unknownPlugin.data)
        )[0];

      const {
        authority,
        offset,
        lifecycle_checks: lifecycleChecks,
      } = unknownPlugin;

      const mappedPlugin: BaseExternalPluginAdapter = {
        lifecycleChecks: lifecycleChecks
          ? parseLifecycleChecks(lifecycleChecks)
          : undefined,
        authority,
        offset: BigInt(offset),
      };

      if (deserializedPlugin.__kind === 'Oracle') {
        if (!acc.oracles) {
          acc.oracles = [];
        }

        acc.oracles.push({
          type: 'Oracle',
          ...mappedPlugin,
          // Oracle conversion does not use the record or account data so we pass in dummies
          ...oracleFromBase(
            deserializedPlugin.fields[0],
            {} as any,
            new Uint8Array(0)
          ),
        });
      }

      return acc;
    },
    {}
  );
}

export function dasAssetToCoreAssetOrCollection(
  dasAsset: DasApiAsset
): AssetResult | CollectionResult {
  const {
    interface: assetInterface,
    id,
    ownership: { owner },
    content,
    compression: { seq },
    grouping,
    authorities,
    plugins,
    unknown_plugins: unknownPlugins,
    executable,
    lamports: lamps,
    rent_epoch: rentEpoch,
    mpl_core_info: mplCoreInfo,
    external_plugins: externalPlugins,
    unknown_external_plugins: unknownExternalPlugins,
  } = dasAsset as DasApiAsset & {
    executable?: boolean;
    lamports?: number;
    rent_epoch?: number;
  };
  const { num_minted: numMinted = 0, current_size: currentSize = 0 } =
    mplCoreInfo ?? {};

  const commonFields = {
    publicKey: id,
    uri: content.json_uri,
    name: content.metadata.name,
    content,
    collection_metadata: grouping[0]?.collection_metadata,
    ...getAccountHeader(executable, lamps, rentEpoch),
    ...(plugins ? dasPluginsToCorePlugins(plugins) : {}),
    ...(externalPlugins !== undefined
      ? dasExternalPluginsToCoreExternalPlugins(externalPlugins)
      : {}),
    ...handleUnknownPlugins(unknownPlugins),
    ...handleUnknownExternalPlugins(unknownExternalPlugins),
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
