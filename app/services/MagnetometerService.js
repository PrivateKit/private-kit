import {
  SensorTypes,
  magnetometer,
  setUpdateIntervalForType,
} from 'react-native-sensors';

import { MAGNETOMETER_DATA } from '../constants/storage';
import { MAGNETOMETER_TIMER } from '../constants/timer';
import { GetStoreData, SetStoreData } from '../helpers/General';

export class MagnetometerData {
  constructor() {
    this.locationInterval = MAGNETOMETER_TIMER; // Time (in milliseconds) between location information polls.  E.g. 5000 = 5 seconds
    // this.locationInterval = 60000 * 1; // Time (in milliseconds) between location information polls.  E.g. 60000 * 1 = 1 minutes
    setUpdateIntervalForType(SensorTypes.magnetometer, this.locationInterval);
    this.getMagnetometerData = this.getMagnetometerData.bind(this);
    this.setMagnetometerData = this.setMagnetometerData.bind(this);
    this.magnetometer = magnetometer;
  }

  getMagnetometerData() {
    return GetStoreData(MAGNETOMETER_DATA);
  }

  async getMagnetometerStats() {
    const magnetometerData = await this.getMagnetometerData();
    return magnetometerData;
  }

  setMagnetometerData(magnetometerData) {
    this.getMagnetometerData().then(magnetometerStoreString => {
      let magStoreArray = [];

      // console.log('-----------------------------');
      // console.log('[INFO] Initial magnetometer string : ', magnetometerStoreString);
      const magnetometerStoreArray = JSON.parse(magnetometerStoreString);
      const { x, y, z, timestamp } = magnetometerData;
      // console.log('[INFO] magnetometer data: ', { x, y, z, timestamp });

      if (
        magnetometerStoreArray !== undefined &&
        magnetometerStoreArray !== null &&
        Array.isArray(magnetometerStoreArray)
      ) {
        for (let i = 0; i < magnetometerStoreArray.length; i++) {
          magStoreArray.push(magnetometerStoreArray[i]);
        }
      }

      magStoreArray.push({ x, y, z, timestamp });

      // console.log(magStoreArray)
      // console.log(magStoreArray.length)

      // console.log('[INFO] magnetometer array: ', magStoreArray);
      console.log('[INFO] magnetometer array length: ', magStoreArray.length);
      SetStoreData(MAGNETOMETER_DATA, magStoreArray);
      // console.log('-----------------------------');
    });
  }

  start() {
    this.magnetometer.subscribe(this.setMagnetometerData);
  }

  stop() {
    this.magnetometer.unsubscribe();
  }
}

export default class MagnetometerServices {
  static start() {
    this.magnetometerData = new MagnetometerData();
    this.magnetometerData.start();
  }

  static stop() {
    this.magnetometerData.stop();
  }
}
