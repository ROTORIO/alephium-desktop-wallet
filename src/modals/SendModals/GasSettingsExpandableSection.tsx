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

import { convertAlphToSet, formatAmountForDisplay } from '@alephium/sdk'
import { useTranslation } from 'react-i18next'
import styled, { useTheme } from 'styled-components'

import AlefSymbol from '../../components/AlefSymbol'
import InfoBox from '../../components/InfoBox'
import Input from '../../components/Inputs/Input'
import ToggleSection from '../../components/ToggleSection'
import { MINIMAL_GAS_AMOUNT, MINIMAL_GAS_PRICE } from '../../utils/constants'

export interface GasSettingsExpandableSectionProps {
  gasAmount?: string
  gasAmountError: string
  gasPrice?: string
  gasPriceError: string
  onGasAmountChange: (v: string) => void
  onGasPriceChange: (v: string) => void
  onClearGasSettings: () => void
  className?: string
}

const GasSettingsExpandableSection = ({
  gasAmount,
  gasAmountError,
  gasPrice,
  gasPriceError,
  onGasAmountChange,
  onGasPriceChange,
  onClearGasSettings,
  className
}: GasSettingsExpandableSectionProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  const expectedFeeInALPH =
    gasAmount && gasPrice && formatAmountForDisplay(BigInt(gasAmount) * convertAlphToSet(gasPrice), true)

  const minimalGasPriceInALPH = formatAmountForDisplay(MINIMAL_GAS_PRICE, true)

  return (
    <ToggleSection title={t`Gas`} onClick={onClearGasSettings} className={className}>
      <Input
        id="gas-amount"
        label={`${t('Gas amount')} (≥ ${MINIMAL_GAS_AMOUNT})`}
        value={gasAmount ?? ''}
        onChange={(e) => onGasAmountChange(e.target.value)}
        type="number"
        min={MINIMAL_GAS_AMOUNT}
        error={gasAmountError}
      />
      <Input
        id="gas-price"
        label={
          <>
            {t`Gas price`} (≥ {minimalGasPriceInALPH} <AlefSymbol color={theme.font.secondary} />)
          </>
        }
        value={gasPrice ?? ''}
        type="number"
        min={minimalGasPriceInALPH}
        onChange={(e) => onGasPriceChange(e.target.value)}
        step={minimalGasPriceInALPH}
        error={gasPriceError}
      />
      {expectedFeeInALPH && (
        <InfoBox short label={t`Expected fee`}>
          <Fee>
            {expectedFeeInALPH} <AlefSymbol />
          </Fee>
        </InfoBox>
      )}
    </ToggleSection>
  )
}

export default GasSettingsExpandableSection

const Fee = styled.div`
  display: flex;
`
