import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import axios from 'axios';
import { mnemonicToSeedSync } from 'bip39';

import type { ExportedSeedCredential } from '@onekeyhq/engine/src/dbs/base';
import simpleDb from '@onekeyhq/engine/src/dbs/simple/simpleDb';
import { OneKeyError } from '@onekeyhq/engine/src/errors';
import { mnemonicFromEntropy } from '@onekeyhq/engine/src/secret';
import {
  getLnurlDetails,
  getPathSuffix,
  verifyInvoice,
} from '@onekeyhq/engine/src/vaults/impl/lightning-network/helper/lnurl';
import HashKeySigner from '@onekeyhq/engine/src/vaults/impl/lightning-network/helper/signer';
import type { IEncodedTxLightning } from '@onekeyhq/engine/src/vaults/impl/lightning-network/types';
import type {
  LNURLDetails,
  LNURLError,
  LNURLPaymentInfo,
} from '@onekeyhq/engine/src/vaults/impl/lightning-network/types/lnurl';
import type VaultLightning from '@onekeyhq/engine/src/vaults/impl/lightning-network/Vault';
import type { IEncodedTx } from '@onekeyhq/engine/src/vaults/types';
import { getBitcoinBip32 } from '@onekeyhq/engine/src/vaults/utils/btcForkChain/utils';
import {
  backgroundClass,
  backgroundMethod,
} from '@onekeyhq/shared/src/background/backgroundDecorators';
import { isLightningNetworkByNetworkId } from '@onekeyhq/shared/src/engine/engineConsts';

import ServiceBase from './ServiceBase';

import type { AxiosError } from 'axios';

@backgroundClass()
export default class ServiceLightningNetwork extends ServiceBase {
  private previousRequestTokenAccountId = '';

  private previousRequestTokenTimestamp: number | null = null;

  private isFetchingToken = false;

  @backgroundMethod()
  async refreshToken({
    networkId,
    accountId,
    password,
  }: {
    networkId: string;
    accountId: string;
    password: string;
  }) {
    if (
      (this.previousRequestTokenAccountId === accountId &&
        this.previousRequestTokenTimestamp &&
        Date.now() - this.previousRequestTokenTimestamp < 10000) ||
      this.isFetchingToken
    ) {
      // Prevent frequent token fetching during  rerender
      return;
    }
    try {
      this.isFetchingToken = true;
      const vault = await this.backgroundApi.engine.getVault({
        networkId,
        accountId,
      });
      const res = await (vault as VaultLightning).exchangeToken(password);
      const address = await (
        vault as VaultLightning
      ).getCurrentBalanceAddress();
      await simpleDb.utxoAccounts.updateLndToken(
        address,
        res.access_token,
        res.refresh_token,
      );
      this.previousRequestTokenAccountId = accountId;
      this.previousRequestTokenTimestamp = Date.now();
    } finally {
      this.isFetchingToken = false;
    }
  }

  @backgroundMethod()
  async createInvoice({
    networkId,
    accountId,
    amount,
    description,
  }: {
    networkId: string;
    accountId: string;
    amount: string;
    description?: string;
  }) {
    const vault = await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    });
    const invoice = (vault as VaultLightning).createInvoice(
      amount,
      description,
    );
    return invoice;
  }

  @backgroundMethod()
  async fetchSpecialInvoice({
    paymentHash,
    networkId,
    accountId,
  }: {
    paymentHash: string;
    networkId: string;
    accountId: string;
  }) {
    const vault = await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    });
    return (vault as VaultLightning).fetchSpecialInvoice(paymentHash);
  }

  @backgroundMethod()
  async decodedInvoice({
    payReq,
    networkId,
    accountId,
  }: {
    payReq: string;
    networkId: string;
    accountId: string;
  }) {
    const vault = await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    });
    return (vault as VaultLightning)._decodedInvoceCache(payReq);
  }

  @backgroundMethod()
  async isZeroAmountInvoice({
    payReq,
    networkId,
    accountId,
  }: {
    payReq: string;
    networkId: string;
    accountId: string;
  }) {
    const vault = (await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    })) as VaultLightning;
    const invoice = await vault._decodedInvoceCache(payReq);
    return vault.isZeroAmountInvoice(invoice);
  }

  @backgroundMethod()
  async checkAuth({
    networkId,
    accountId,
  }: {
    networkId: string;
    accountId: string;
  }) {
    const vault = await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    });
    return (vault as VaultLightning)
      .checkAuth()
      .then(() => false)
      .catch((e) => {
        console.log('check auth error: ', e);
        return true;
      });
  }

  @backgroundMethod()
  async getInvoiceConfig({
    networkId,
    accountId,
  }: {
    networkId: string;
    accountId: string;
  }) {
    const vault = (await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    })) as VaultLightning;
    const client = await vault.getClient();
    const address = await vault.getCurrentBalanceAddress();
    return client.getConfig(address);
  }

  @backgroundMethod()
  async validateZeroInvoiceMaxSendAmount({
    accountId,
    networkId,
    amount,
  }: {
    networkId: string;
    accountId: string;
    amount: string;
  }) {
    const vault = await this.backgroundApi.engine.getVault({
      networkId,
      accountId,
    });
    // @ts-expect-error
    return vault.validateSendAmount(amount);
  }

  @backgroundMethod()
  async getLnurlDetails(lnurl: string) {
    return getLnurlDetails(lnurl);
  }

  @backgroundMethod()
  async fetchLnurlPayRequestResult({
    callback,
    params,
  }: {
    callback: string;
    params: {
      amount: number;
      comment?: string;
    };
  }) {
    try {
      const response = await axios.get<LNURLPaymentInfo | LNURLError>(
        callback,
        {
          params,
          validateStatus: () => true,
        },
      );
      if (response.status >= 500) {
        throw new OneKeyError('Recipient server error');
      }

      if (!Object.prototype.hasOwnProperty.call(response.data, 'pr')) {
        throw new OneKeyError((response.data as LNURLError).reason);
      }
      return response.data as LNURLPaymentInfo;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  @backgroundMethod()
  async verifyInvoice({
    paymentInfo,
    metadata,
    amount,
    networkId,
    accountId,
  }: {
    paymentInfo: LNURLPaymentInfo;
    metadata: string;
    amount: number;
    networkId: string;
    accountId: string;
  }) {
    const decodedInvoice = await this.decodedInvoice({
      payReq: paymentInfo.pr,
      networkId,
      accountId,
    });
    return verifyInvoice({
      decodedInvoice,
      paymentInfo,
      metadata,
      amount,
    });
  }

  @backgroundMethod()
  async getSuccessAction({
    networkId,
    encodedTx,
  }: {
    networkId: string;
    encodedTx: IEncodedTx;
  }) {
    if (!isLightningNetworkByNetworkId(networkId)) return null;
    return Promise.resolve((encodedTx as IEncodedTxLightning).successAction);
  }

  @backgroundMethod()
  async fetchLnurlWithdrawRequestResult({
    callback,
    pr,
    k1,
  }: {
    callback: string;
    pr: string;
    k1: string;
  }) {
    try {
      const response = await axios.get<{
        status: string;
        reason: string;
      }>(callback, {
        params: {
          k1,
          pr,
        },
      });
      if (response.status >= 500) {
        throw new Error('Recipient server error');
      }

      if (response.data.status.toUpperCase() === 'OK') {
        return response.data;
      }
      throw new OneKeyError(response.data.reason);
    } catch (e) {
      console.error(e);
      const error = e as AxiosError<LNURLError>;
      if (error.response?.data?.reason) {
        throw new Error(error.response?.data.reason);
      }
      throw e;
    }
  }

  @backgroundMethod()
  async lnurlAuth({
    password,
    walletId,
    lnurlDetail,
  }: {
    walletId: string;
    password: string;
    lnurlDetail: LNURLDetails;
  }) {
    if (lnurlDetail.tag !== 'login') {
      throw new Error('lnurl-auth: invalid tag');
    }
    const { entropy } = (await this.backgroundApi.engine.dbApi.getCredential(
      walletId,
      password,
    )) as ExportedSeedCredential;
    const mnemonic = mnemonicFromEntropy(entropy, password);
    const seed = mnemonicToSeedSync(mnemonic);
    const root = getBitcoinBip32().fromSeed(seed);
    // See https://github.com/lnurl/luds/blob/luds/05.md
    const hashingKey = root.derivePath(`m/138'/0`);
    const hashingPrivateKey = hashingKey.privateKey;

    if (!hashingPrivateKey) {
      throw new Error('lnurl-auth: invalid hashing key');
    }

    const url = new URL(lnurlDetail.url);

    const pathSuffix = getPathSuffix(url.host, bytesToHex(hashingPrivateKey));

    let linkingKey = root.derivePath(`m/138'`);
    for (const index of pathSuffix) {
      linkingKey = linkingKey.derive(index);
    }

    if (!linkingKey.privateKey) {
      throw new Error('lnurl-auth: invalid linking private key');
    }

    const linkingKeyPriv = bytesToHex(linkingKey.privateKey);

    if (!linkingKeyPriv) {
      throw new Error('Invalid linkingKey');
    }

    const signer = new HashKeySigner(linkingKeyPriv);

    const k1 = hexToBytes(lnurlDetail.k1);
    const signedMessage = signer.sign(k1);
    const signedMessageDERHex = signedMessage.toDER('hex');

    const loginURL = url;
    loginURL.searchParams.set('sig', signedMessageDERHex);
    loginURL.searchParams.set('key', signer.pkHex);
    loginURL.searchParams.set('t', Date.now().toString());

    try {
      const response = await axios.get<{
        reason?: string;
        status: string;
      }>(loginURL.toString());
      // if the service returned with a HTTP 200 we still check if the response data is OK
      if (response?.data.status?.toUpperCase() !== 'OK') {
        throw new Error(response?.data?.reason || 'Auth: Something went wrong');
      }

      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.error('LNURL-AUTH FAIL:', e);
        const error =
          (e.response?.data as { reason?: string })?.reason || e.message; // lnurl error or exception message
        throw new Error(error);
      }
      throw e;
    }
  }
}
