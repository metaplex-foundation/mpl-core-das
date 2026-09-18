import test from 'ava';
import { publicKey } from '@metaplex-foundation/umi';
import { Key } from '@metaplex-foundation/mpl-core';
import { das } from '../src';
import { createUmiWithDas, DAS_API_ENDPOINT } from './_setup';

// Devnet fixtures created 2026-09-18 (see scenario: create two assets and a
// collection, create a group, add all three as members, plus a standalone
// group with no members). Devnet DAS indexers do not backfill, so these were
// minted after both major providers deployed Core group indexing.
const dasTestGroupPubKey = publicKey(
  '2bYTvEcbjjaGVhcRBn1Pdj2Zo9vBpxY6sbDMtHYwqHw5'
);
const dasTestStandaloneGroupPubKey = publicKey(
  'EyhUM9fn1kh6oi6AZqc6BkbGXDFPuxpZbUdek4Cym7tJ'
);
const dasTestGroupOwner = publicKey(
  '5Da3oXxkpCcbvGfL6WY4JEr2AyXXXFfJyYiLuZ4KJXME'
);
const dasTestGroupMemberAssets = [
  publicKey('By5YfKScDwNX8MHLB7CphUrvozG1kMExMF5FidTZZ1CT'),
  publicKey('GtHxKewijMpcwbVpyYSWYFEQDdD2s9DmfbHonH1dLzQA'),
];
const dasTestGroupMemberCollection = publicKey(
  '3da2Z6mx8YRTyFebbetg2RU6wEoV2CansAHMf5ST3CKr'
);

test('das: it can fetch a group by pubkey', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // When we fetch a GroupV1 via DAS.
  const group = await das.getGroup(umi, dasTestGroupPubKey);

  // Then it is mapped onto the GroupV1 shape.
  t.is(group.key, Key.GroupV1);
  t.is(group.name, 'PR14 DAS Test Group');
  t.is(group.updateAuthority, dasTestGroupOwner);
});

test('das: it can fetch group members with getAssetsByGroup', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // When we list the members of a group containing two assets and a
  // collection.
  const members = await das.getAssetsByGroup(umi, {
    group: dasTestGroupPubKey,
    limit: 10,
  });

  // Then all members come back with their proper Core kinds.
  t.is(members.length, 3);
  const assets = members.filter((m) => m.key === Key.AssetV1);
  const collections = members.filter((m) => m.key === Key.CollectionV1);
  t.is(assets.length, 2);
  t.is(collections.length, 1);
  t.deepEqual(
    assets.map((a) => a.publicKey).sort(),
    [...dasTestGroupMemberAssets].sort()
  );
  t.is(collections[0]!.publicKey, dasTestGroupMemberCollection);
});

test('das: it can search groups', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // When we search groups by owner (some providers require an owner or
  // authority filter for interface-scoped searches).
  const groups = await das.searchGroups(umi, {
    owner: dasTestGroupOwner,
    limit: 10,
  });

  // Then both fixture groups are found and typed as groups.
  t.is(groups.length, 2);
  groups.forEach((group) => t.is(group.key, Key.GroupV1));
  t.deepEqual(
    groups.map((group) => group.publicKey).sort(),
    [dasTestGroupPubKey, dasTestStandaloneGroupPubKey].sort()
  );
});

test('das: it can fetch groups by update authority', async (t) => {
  // Given an Umi instance with DAS API
  const umi = createUmiWithDas(DAS_API_ENDPOINT);

  // When we fetch groups by their update authority.
  const groups = await das.getGroupsByUpdateAuthority(umi, {
    updateAuthority: dasTestGroupOwner,
    limit: 10,
  });

  // Then both fixture groups are found.
  t.is(groups.length, 2);
  groups.forEach((group) => t.is(group.key, Key.GroupV1));
});
