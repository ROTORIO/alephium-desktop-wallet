/*
Copyright 2018 - 2023 The Alephium Authors
This file is part of the alephium project.

The library is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with the library. If not, see <http://www.gnu.org/licenses/>.
*/

import { ALPH } from '@alephium/token-list'
import { createSelector } from '@reduxjs/toolkit'

import { addressesAdapter, contactsAdapter } from '@/storage/addresses/addressesAdapters'
import { selectAllAssetsInfo } from '@/storage/assets/assetsSelectors'
import { RootState } from '@/storage/store'
import { AddressHash } from '@/types/addresses'
import { Asset, TokenDisplayBalances } from '@/types/assets'
import { filterAddressesWithoutAssets } from '@/utils/addresses'

export const {
  selectById: selectAddressByHash,
  selectAll: selectAllAddresses,
  selectIds: selectAddressIds
} = addressesAdapter.getSelectors<RootState>((state) => state.addresses)

export const makeSelectAddresses = () =>
  createSelector(
    [selectAllAddresses, (_, addressHashes?: AddressHash[] | AddressHash) => addressHashes],
    (allAddresses, addressHashes) =>
      addressHashes
        ? allAddresses.filter((address) =>
            Array.isArray(addressHashes) ? addressHashes.includes(address.hash) : addressHashes === address.hash
          )
        : allAddresses
  )

export const selectDefaultAddress = createSelector(selectAllAddresses, (addresses) =>
  addresses.find((address) => address.isDefault)
)

export const selectTotalBalance = createSelector([selectAllAddresses], (addresses) =>
  addresses.reduce((acc, address) => acc + BigInt(address.balance), BigInt(0))
)

export const makeSelectAddressesAlphAsset = () =>
  createSelector(makeSelectAddresses(), (addresses): Asset => {
    const alphBalances = addresses.reduce(
      (acc, { balance, lockedBalance }) => ({
        balance: acc.balance + BigInt(balance),
        lockedBalance: acc.lockedBalance + BigInt(lockedBalance)
      }),
      { balance: BigInt(0), lockedBalance: BigInt(0) }
    )

    return {
      ...ALPH,
      ...alphBalances
    }
  })

export const makeSelectAddressesAssets = () =>
  createSelector(
    [selectAllAssetsInfo, makeSelectAddressesAlphAsset(), makeSelectAddresses()],
    (assetsInfo, alphAsset, addresses): Asset[] => {
      const tokenBalances = addresses.reduce((acc, { tokens }) => {
        tokens.forEach((token) => {
          const existingToken = acc.find((t) => t.id === token.id)

          if (!existingToken) {
            acc.push({
              id: token.id,
              balance: BigInt(token.balance),
              lockedBalance: BigInt(token.lockedBalance)
            })
          } else {
            existingToken.balance = existingToken.balance + BigInt(token.balance)
            existingToken.lockedBalance = existingToken.lockedBalance + BigInt(token.lockedBalance)
          }
        })

        return acc
      }, [] as TokenDisplayBalances[])

      const tokenAssets = tokenBalances.map((token) => {
        const assetInfo = assetsInfo.find((t) => t.id === token.id)

        return {
          id: token.id,
          balance: BigInt(token.balance.toString()),
          lockedBalance: BigInt(token.lockedBalance.toString()),
          name: assetInfo?.name,
          symbol: assetInfo?.symbol,
          description: assetInfo?.description,
          logoURI: assetInfo?.logoURI,
          decimals: assetInfo?.decimals ?? 0
        }
      })

      return [alphAsset, ...tokenAssets]
    }
  )

export const { selectAll: selectAllContacts } = contactsAdapter.getSelectors<RootState>((state) => state.contacts)

export const makeSelectContactByAddress = () =>
  createSelector([selectAllContacts, (_, addressHash) => addressHash], (contacts, addressHash) =>
    contacts.find((contact) => contact.address === addressHash)
  )

export const selectIsStateUninitialized = createSelector(
  (state: RootState) => state.addresses.status,
  (status) => status === 'uninitialized'
)

export const selectHaveAllPagesLoaded = createSelector(
  [selectAllAddresses, (state: RootState) => state.confirmedTransactions.allLoaded],
  (addresses, allTransactionsLoaded) =>
    addresses.every((address) => address.allTransactionPagesLoaded) || allTransactionsLoaded
)

export const selectHaveHistoricBalancesLoaded = createSelector(selectAllAddresses, (addresses) =>
  addresses.every((address) => address.balanceHistoryInitialized)
)

export const makeSelectAddressesHaveHistoricBalances = () =>
  createSelector(
    makeSelectAddresses(),
    (addresses) =>
      addresses.every((address) => address.balanceHistoryInitialized) &&
      addresses.some((address) => address.balanceHistory.ids.length > 0)
  )

export const selectAddressesWithSomeBalance = createSelector(selectAllAddresses, filterAddressesWithoutAssets)