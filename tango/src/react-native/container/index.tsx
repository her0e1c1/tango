import { createNavi } from 'src/react-native/component';
import { ConfigPage } from './Config';
import { HomePage } from './Home';
import { DownloadPage } from './Download';

export const Navi = createNavi({
  Home: HomePage,
  Config: ConfigPage,
  Download: DownloadPage,
});
