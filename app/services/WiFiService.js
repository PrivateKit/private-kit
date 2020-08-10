import WifiManager from 'react-native-wifi-reborn';
import { WIFI_DATA } from '../constants/storage';
import { GetStoreData, SetStoreData } from '../helpers/General';

export default class WiFiService {
  static async logWifiData(scanLocationInfo) {
    const wifiList = JSON.parse(await WifiManager.loadWifiList());
    const cleanedWifiList = wifiList.map(wifiAP => {
      delete wifiAP['capabilities'];
      return wifiAP;
    });

    const scanWithLocation = { ...scanLocationInfo, scanInfo: cleanedWifiList };
    WiFiService.storeLocally(scanWithLocation);
  }

  static async storeLocally(scanResults) {
    const storedArray = await WiFiService.getParsedDataFromStore();
    const wifiArray = storedArray || [];
    console.log(wifiArray);
    wifiArray.push(scanResults);
    SetStoreData(WIFI_DATA, wifiArray);
  }

  static async getParsedDataFromStore() {
    return await GetStoreData(WIFI_DATA, false);
  }

  static async deleteLogs() {
    await SetStoreData(WIFI_DATA, []);
  }
}
