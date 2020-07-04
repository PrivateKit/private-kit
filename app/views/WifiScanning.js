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
  const [distanceStr, setDistanceStr] = useState('');

  function saveScan() {
    const id = `Location ${scans.length}`;
    const distance = parseInt(distanceStr);

    const scanLocationInfo = { id, distance };

    WifiService.logWifiData(scanLocationInfo);

    setScans([...scans, scanLocationInfo]);
    setDistanceStr('');
  }

  return (
    <View style={{ paddingVertical: 25 }}>
      <View>
        <Text style={styles.header}>Data Entry</Text>
      </View>

      <View style={styles.row}>
        <TextInput
          placeholder='Distance (in feet) from WiFi access point'
          keyboardType={'number-pad'}
          onChangeText={text => setDistanceStr(text)}
          value={distanceStr}
          style={{ width: '75%' }}
        />
      </View>
      <Button title='Perform Scan' onPress={saveScan} disabled={!distanceStr} />
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

  return (
    <NavigationBarWrapper title='Wifi Scanning' onBackPress={backToMain}>
      <ScrollView style={{ paddingHorizontal: 25, flex: 1 }}>
        <ScanInstructions />
        <View style={styles.divider} />
        <DistanceDataEntry scans={scans} setScans={setScans} />
        <View style={styles.divider} />
        <ScanRecords scans={scans} />
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
