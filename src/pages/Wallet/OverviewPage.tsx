/*
Copyright 2018 - 2022 The Alephium Authors
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

import { calAmountDelta } from '@alephium/sdk'
import { Transaction } from '@alephium/sdk/api/explorer'
import dayjs from 'dayjs'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'

import ActionLink from '../../components/ActionLink'
import AddressBadge from '../../components/AddressBadge'
import OverviewPageHeader from '../../components/OverviewPage/Header'
import { MainContent } from '../../components/PageComponents/PageContainers'
import { PageH2 } from '../../components/PageComponents/PageHeadings'
import Table, { TableCell, TableCellPlaceholder, TableProps, TableRow } from '../../components/Table'
import TransactionalInfo from '../../components/TransactionalInfo'
import { Address, useAddressesContext } from '../../contexts/addresses'
import TransactionDetailsModal from '../../modals/TransactionDetailsModal'

const transactionsTableHeaders: TableProps['headers'] = [
  { title: 'Direction', width: '100px' },
  { title: 'Timestamp', width: '100px' },
  { title: 'Address', width: '100px' },
  { title: 'Amount', align: 'end', width: '100px' }
]

const tableColumnWidths = transactionsTableHeaders.map(({ width }) => width)

type TransactionAndAddress = Transaction & { address: Address }

const OverviewPage = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionAndAddress>()
  const { addresses, fetchAddressTransactionsNextPage, isLoadingData } = useAddressesContext()
  const totalNumberOfTransactions = addresses.map((address) => address.details.txNumber).reduce((a, b) => a + b, 0)

  const allConfirmedTxs = addresses
    .map((address) => address.transactions.confirmed.map((tx) => ({ ...tx, address })))
    .flat()
    .sort((a, b) => b.timestamp - a.timestamp)

  const allPendingTxs = addresses
    .map((address) => address.transactions.pending.map((tx) => ({ ...tx, address })))
    .flat()
    .sort((a, b) => b.timestamp - a.timestamp)

  const onTransactionClick = (transaction: TransactionAndAddress) => {
    setSelectedTransaction(transaction)
  }

  const loadNextTransactionsPage = async () => {
    addresses.forEach((address) => fetchAddressTransactionsNextPage(address))
  }

  const showSkeletonLoading = isLoadingData && !allConfirmedTxs.length && !allPendingTxs.length

  return (
    <MainContent>
      <OverviewPageHeader />
      <PageH2>Transaction history</PageH2>
      <Table headers={transactionsTableHeaders} isLoading={showSkeletonLoading}>
        {allPendingTxs
          .slice(0)
          .reverse()
          .map(({ txId, timestamp, address, amount, type }) => (
            <TableRow key={txId} columnWidths={tableColumnWidths} blinking>
              <TableCell>
                <TransactionalInfo content="Pending" type="pending" />
              </TableCell>
              <TableCell>{dayjs(timestamp).fromNow()}</TableCell>
              <TableCell>
                <AddressBadge color={address.settings.color} addressName={address.getLabelName()} />
              </TableCell>
              <TableCell align="end">
                {type === 'transfer' && amount && <TransactionalInfo type="out" prefix="-" content={amount} amount />}
              </TableCell>
            </TableRow>
          ))}
        {allConfirmedTxs.map((transaction) => {
          const amount = calAmountDelta(transaction, transaction.address.hash)
          const amountIsBigInt = typeof amount === 'bigint'
          const isOut = amountIsBigInt && amount < 0

          return (
            <TableRow
              key={`${transaction.hash}-${transaction.address.hash}`}
              columnWidths={tableColumnWidths}
              onClick={() => onTransactionClick(transaction)}
            >
              <TableCell>
                <TransactionalInfo content={isOut ? '↑ Sent' : '↓ Received'} type={isOut ? 'out' : 'in'} />
              </TableCell>
              <TableCell>{dayjs(transaction.timestamp).fromNow()}</TableCell>
              <TableCell>
                <AddressBadge
                  color={transaction.address.settings.color}
                  truncate
                  addressName={transaction.address.getLabelName()}
                />
              </TableCell>
              <TableCell align="end">
                <TransactionalInfo
                  type={isOut ? 'out' : 'in'}
                  prefix={isOut ? '- ' : '+ '}
                  content={amountIsBigInt && amount < 0 ? (amount * -1n).toString() : amount.toString()}
                  amount
                />
              </TableCell>
            </TableRow>
          )
        })}
        {allConfirmedTxs.length !== totalNumberOfTransactions && (
          <TableRow>
            <TableCell align="center">
              <ActionLink onClick={loadNextTransactionsPage}>Show more</ActionLink>
            </TableCell>
          </TableRow>
        )}
        {!isLoadingData && !allPendingTxs.length && !allConfirmedTxs.length && (
          <TableRow>
            <TableCellPlaceholder align="center">No transactions to display</TableCellPlaceholder>
          </TableRow>
        )}
      </Table>
      <AnimatePresence>
        {selectedTransaction && (
          <TransactionDetailsModal
            address={selectedTransaction.address}
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(undefined)}
          />
        )}
      </AnimatePresence>
    </MainContent>
  )
}

export default OverviewPage
