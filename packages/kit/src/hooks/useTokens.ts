import { useEffect, useMemo, useState } from 'react';

import { pick } from 'lodash';
import { useAsync } from 'react-async-hook';

import type { Token } from '@onekeyhq/engine/src/types/token';
import { useActiveWalletAccount } from '@onekeyhq/kit/src/hooks/redux';
import debugLogger from '@onekeyhq/shared/src/logger/debugLogger';

import backgroundApiProxy from '../background/instance/backgroundApiProxy';
import { appSelector } from '../store';
import { createDeepEqualSelector } from '../utils/reselectUtils';

import { useAppSelector } from './useAppSelector';

import type { IAppState } from '../store';

export const useSingleToken = (networkId: string, address: string) => {
  const [state, setState] = useState<{
    loading: boolean;
    token?: Token;
  }>({
    loading: true,
  });

  useEffect(() => {
    backgroundApiProxy.engine
      .findToken({
        networkId,
        tokenIdOnNetwork: address,
      })
      .then((t) => {
        setState({
          loading: false,
          token: t,
        });
      })
      .catch(() => {
        setState({
          loading: false,
          token: undefined,
        });
      });
  }, [address, networkId]);

  return {
    ...state,
  };
};

export function useNativeToken(networkId?: string): Token | undefined {
  const { token } = useSingleToken(networkId ?? '', '');
  return token;
}

export function useCurrentNetworkTokenInfoByCoingeckoId(
  coingeckoId: string,
): null | Pick<Token, 'coingeckoId' | 'name' | 'symbol' | 'logoURI'> {
  const { networkId, accountId } = useActiveWalletAccount();
  const accountTokens = appSelector(
    (s) => s.tokens.accountTokens?.[networkId]?.[accountId] || [],
  );
  return useMemo(() => {
    const token = accountTokens.find((t) => t.coingeckoId === coingeckoId);
    if (!token) {
      return null;
    }
    return pick(token, 'coingeckoId', 'name', 'symbol', 'logoURI');
  }, [coingeckoId, accountTokens]);
}

const accountTokensBalanceSelector = (networkId?: string, accountId?: string) =>
  createDeepEqualSelector(
    (s: IAppState) => {
      if (!networkId || !accountId) {
        return {};
      }

      const accountTokensBalance = s.tokens.accountTokensBalance || {};
      const accountBalance = accountTokensBalance?.[networkId]?.[accountId];
      if (accountBalance) {
        return Object.fromEntries(
          Object.entries(accountBalance).map(([tokenId, data]) => [
            tokenId,
            { balance: data?.balance ?? '0' },
          ]),
        );
      }
      return {};
    },
    (tokenBalances) => tokenBalances,
  );

export function useAccountTokensBalance(
  networkId?: string,
  accountId?: string,
) {
  return useAppSelector(
    useMemo(
      () => accountTokensBalanceSelector(networkId, accountId),
      [accountId, networkId],
    ),
  );
}

export const useNativeTokenBalance = (
  networkId?: string,
  accountId?: string,
) => {
  const balances = useAccountTokensBalance(networkId, accountId);
  return useMemo(() => balances?.main?.balance || '0', [balances]);
};

export function useNetworkTokens(networkId?: string) {
  const { result: tokens } = useAsync(
    async () =>
      backgroundApiProxy.engine.getTopTokensOnNetwork(networkId ?? ''),
    [networkId],
  );

  return tokens ?? [];
}

export const useFrozenBalance = ({
  networkId,
  accountId,
  tokenId,
}: {
  networkId: string;
  accountId: string;
  tokenId: string;
}) => {
  const [frozenBalance, setFrozenBalance] = useState<
    number | Record<string, number>
  >(0);

  useEffect(() => {
    (async () => {
      let password;

      const vaultSettings = await backgroundApiProxy.engine.getVaultSettings(
        networkId,
      );
      if (vaultSettings.validationRequired) {
        password = await backgroundApiProxy.servicePassword.getPassword();
      }

      backgroundApiProxy.engine
        .getFrozenBalance({
          accountId,
          networkId,
          password,
        })
        .then(setFrozenBalance)
        .catch((e) => {
          debugLogger.common.error('getFrozenBalance error', e);
        });
    })();
  }, [networkId, accountId]);

  return useMemo(
    () =>
      typeof frozenBalance === 'number'
        ? frozenBalance
        : frozenBalance?.[tokenId] ?? 0,
    [tokenId, frozenBalance],
  );
};

export const useTokenPrice = ({
  networkId,
  tokenIdOnNetwork,
  fallback = 0,
  vsCurrency,
}: {
  networkId: string;
  vsCurrency: string;
  tokenIdOnNetwork: string;
  fallback?: number;
}) => {
  const key = tokenIdOnNetwork
    ? `${networkId}-${tokenIdOnNetwork ?? ''}`
    : networkId;
  const prices = useAppSelector((s) => s.tokens.tokenPriceMap);
  const price = prices?.[key]?.[vsCurrency];
  return price ?? fallback;
};

export const useCurrentFiatValue = () => {
  const selectedFiatMoneySymbol = useAppSelector(
    (s) => s.settings.selectedFiatMoneySymbol,
  );
  const fiatMap = useAppSelector((s) => s.fiatMoney.map);
  return fiatMap?.[selectedFiatMoneySymbol]?.value || 0;
};

export const useSimpleTokenPriceValue = ({
  networkId,
  contractAdress,
}: {
  networkId?: string;
  contractAdress?: string;
}) => {
  const vsCurrency = useAppSelector((s) => s.settings.selectedFiatMoneySymbol);
  const price = useTokenPrice({
    networkId: networkId ?? '',
    tokenIdOnNetwork: contractAdress ?? '',
    vsCurrency,
  });

  return price;
};
