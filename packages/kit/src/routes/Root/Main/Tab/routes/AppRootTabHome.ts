import { withTabLayout } from '@onekeyhq/components/src/Layout/withTabLayout';

import { toFocusedLazy } from '../../../../../components/LazyRenderWhenFocus';
import BulkSender from '../../../../../views/BulkSender';
import FullTokenList from '../../../../../views/FullTokenList/FullTokenList';
import NFTMarketCollectionScreen from '../../../../../views/NFTMarket/CollectionDetail';
import PNLDetailScreen from '../../../../../views/NFTMarket/PNL/PNLDetail';
import OverviewDefiListScreen from '../../../../../views/Overview';
import RevokePage from '../../../../../views/Revoke';
import RevokeRedirectPage from '../../../../../views/Revoke/Redirect';
import TokenDetail from '../../../../../views/TokenDetail';
import HomeScreen from '../../../../../views/Wallet';
import { HomeRoutes, TabRoutes } from '../../../../routesEnum';

import { tabRoutesConfigBaseMap } from './tabRoutes.base';

import type { TabRouteConfig } from '../../../../types';

const name = TabRoutes.Home;
const config: TabRouteConfig = {
  ...tabRoutesConfigBaseMap[name],
  component: withTabLayout(
    toFocusedLazy(HomeScreen, {
      rootTabName: name,
    }),
    name,
  ),
};
export default config;
