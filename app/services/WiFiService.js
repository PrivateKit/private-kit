import BackgroundTimer from 'react-native-background-timer';
import WifiManager from 'react-native-wifi-reborn';
import { WIFI_LOGGING_FREQUENCY, WIFI_DATA } from '../constants/storage';
import { GetStoreData, SetStoreData } from '../helpers/General';

export default class WiFiService {
  static start() {
    BackgroundTimer.runBackgroundTimer(() => {
      WiFiService.logWifiData();
    }, WIFI_LOGGING_FREQUENCY);
    WiFiService.logWifiData();
  }

  static logWifiData() {
    // capture data
    console.log('Wifi point logged');
    WifiManager.loadWifiList().then(result => {
      // filter data
      WiFiService.filterWiFiData(result).then(filteredResult => {
        // save it in the storage
        WiFiService.storeLocally(filteredResult);
      });
    });
  }

  static async filterWiFiData(scanResults) {
    // Remove the keys which are not required
    scanResults = JSON.parse(scanResults);
    return scanResults.map(wifiAP => {
      delete wifiAP['capabilities'];
      return wifiAP;
    });
  }

  static async storeLocally(scanResults) {
    GetStoreData(WIFI_DATA).then(wifiArrayString => {
      let wifiArray = [];
      if (wifiArrayString !== null) {
        wifiArray = JSON.parse(wifiArrayString);
      }
      wifiArray.push(scanResults);
      SetStoreData(WIFI_DATA, wifiArray);
    });
  }

  static stop() {
    BackgroundTimer.stopBackgroundTimer();
  }
}
