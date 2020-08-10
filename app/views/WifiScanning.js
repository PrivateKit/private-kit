import React, { useEffect, useState } from 'react';
import {
  Button,
  BackHandler,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import NavigationBarWrapper from '../components/NavigationBarWrapper';
import { TextInput } from 'react-native-gesture-handler';
import WifiService from '../services/WiFiService';
import Colors from '../constants/colors';

function ScanRecords({ scans }) {
  let scanList;

  const WifiScanRecord = ({ scan }) => {
    const { id, distance } = scan;
    const unit = distance === 1 ? 'foot' : 'feet';

    return (
      <View style={styles.dataRow}>
        <Text style={styles.mdFont}>{id}</Text>
        <Text style={styles.mdFont}>{`${distance} ${unit}`}</Text>
      </View>
    );
  };

  if (scans.length > 0) {
    scanList = scans.map(scan => <WifiScanRecord scan={scan} key={scan.id} />);
  } else {
    scanList = (
      <Text
        style={{ fontStyle: 'italic', textAlign: 'center', paddingTop: 15 }}>
        No recorded logs
      </Text>
    );
  }

  return (
    <View style={{ paddingVertical: 25 }}>
      <Text style={styles.header}>Recorded Scans</Text>
      {scanList}
    </View>
  );
}

function DistanceDataEntry({ scans, setScans }) {
  const [interval, setInterval] = useState('0');
  const [curDistance, setCurDistance] = useState('0');

  function saveScan() {
    const scanNum = scans.length + 1;
    const scanLocationInfo = {
      id: `Location ${scanNum}`,
      distance: parseInt(curDistance),
    };

    WifiService.logWifiData(scanLocationInfo);

    setScans(scans => [...scans, scanLocationInfo]);
    setCurDistance(curDistance => parseInt(curDistance) + parseInt(interval));
  }

  return (
    <View style={{ paddingVertical: 25 }}>
      <View>
        <Text style={styles.header}>Data Entry</Text>
      </View>

      {scans.length === 0 ? (
        <>
          <View style={{ paddingBottom: 10 }}>
            <Text>
              The first scan should be taken directly next to the access point .
            </Text>
          </View>
          <Button title='Perform Scan At Access Point' onPress={saveScan} />
        </>
      ) : (
        <>
          <View style={styles.row}>
            <Text>Distance interval (in feet):</Text>
            <TextInput
              placeholder='Enter distance'
              disabled={interval !== ''}
              keyboardType={'number-pad'}
              onChangeText={text => {
                setInterval(text);
                setCurDistance(text);
              }}
              value={interval}
              style={{ width: '75%' }}
            />
          </View>

          <View style={{ paddingVertical: 10 }}>
            <Text>Next scan distance:</Text>
            <Text style={{ paddingTop: 10 }}>{curDistance || '0'}ft</Text>
          </View>
          <Button
            title='Perform Scan'
            onPress={saveScan}
            disabled={interval === '0' || interval === ''}
          />
        </>
      )}
    </View>
  );
}

function ScanInstructions() {
  return (
    <View style={{ paddingVertical: 15 }}>
      <Text style={styles.header}>Instructions</Text>
      <View style={{ paddingVertical: 15 }}>
        <Text
          style={styles.link}
          onPress={() =>
            Linking.openURL(
              'https://docs.google.com/document/d/1BjMOvCn2jxNu7Q02augbWo3uIjE44m7rrUpbv1kx-Gw/edit?usp=sharing',
            )
          }>
          View instructions on Google Docs
        </Text>
      </View>
    </View>
  );
}

export default function WifiScanningScreen(props) {
  const [scans, setScans] = useState([]);

  function handleBackPress() {
    props.navigation.goBack();
    return true;
  }

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return function cleanup() {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  function backToMain() {
    props.navigation.goBack();
  }

  const clearScans = () => {
    WifiService.deleteLogs();
    setScans([]);
  };

  return (
    <NavigationBarWrapper title='Wifi Scanning' onBackPress={backToMain}>
      <ScrollView style={{ paddingHorizontal: 25, flex: 1 }}>
        <ScanInstructions />
        <View style={styles.divider} />
        <DistanceDataEntry scans={scans} setScans={setScans} />
        <View style={styles.divider} />
        <ScanRecords scans={scans} />
        <View style={{ paddingTop: 25 }}>
          <Button title='Delete Scan Logs' onPress={clearScans} />
        </View>
      </ScrollView>
    </NavigationBarWrapper>
  );
}

const styles = StyleSheet.create({
  dataRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: { textAlign: 'center', fontSize: 24, paddingBottom: 10 },
  divider: {
    backgroundColor: Colors.DIVIDER,
    height: 1.5,
  },
  mdFont: { fontSize: 16 },
  // eslint-disable-next-line react-native/no-color-literals
  link: { fontSize: 16, textAlign: 'center', color: '#0000EE' },
});
