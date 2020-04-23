import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Linking,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  BackHandler,
  Modal,
  TouchableHighlight,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import RNFetchBlob from 'rn-fetch-blob';
import NavigationInfoBarWrapper from '../components/NavigationInfoBarWrapper';
import { GetStoreData } from '../helpers/General';
import greenMarker from '../assets/images/user-green.png';
import languages from '../locales/languages';
import CustomCircle from '../helpers/customCircle';
import fontFamily from '../constants/fonts';
import { PUBLIC_DATA_URL } from '../constants/authorities';
import { LOCATION_DATA } from '../constants/storage';

const width = Dimensions.get('window').width;

// This data source was published in the Lancet, originally mentioned in
// this article:
//    https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(20)30119-5/fulltext
// The dataset is now hosted on Github due to the high demand for it.  The
// first Google Doc holding data (https://docs.google.com/spreadsheets/d/1itaohdPiAeniCXNlntNztZ_oRvjh0HsGuJXUJWET008/edit#gid=0)
// points to this souce but no longer holds the actual data.
const show_button_text = languages.t('label.show_overlap');
const overlap_true_button_text = languages.t(
  'label.overlap_found_button_label',
);
const no_overlap_button_text = languages.t(
  'label.overlap_no_results_button_label',
);
const INITIAL_REGION = {
  latitude: 36.56,
  longitude: 20.39,
  latitudeDelta: 50,
  longitudeDelta: 50,
};

// TODO: This code is functionally duplicated by logic in the areLocationsNearby() function
//  in Intersect.js.  Not cleaning up right now since for v1.0 this is unused code, but
//  should clean this up in the future.
function distance(lat1, lon1, lat2, lon2) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist * 1.609344;
  }
}

function OverlapScreen(props) {
  //const [region, setRegion] = useState({});
  const [markers, setMarkers] = useState([]);
  const [circles, setCircles] = useState([]);
  const [showButton, setShowButton] = useState({
    disabled: false,
    text: show_button_text,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [initialRegion, setInitialRegion] = useState(INITIAL_REGION);
  //const { navigate } = useNavigation();
  const mapView = useRef();

  try {
    props.navigation.setOptions({
      headerShown: false,
      title: 'Map',
      headerBackTitle: '',
    });
  } catch (error) {
    console.log(error);
  }

  async function getOverlap() {
    try {
    } catch (error) {
      console.log(error.message);
    }
  }

  async function populateMarkers() {
    GetStoreData(LOCATION_DATA).then(locationArrayString => {
      var locationArray = JSON.parse(locationArrayString);
      if (locationArray !== null) {
        var markers = [];
        var previousMarkers = {};
        for (var i = 0; i < locationArray.length - 1; i += 1) {
          const coord = locationArray[i];
          const lat = coord['latitude'];
          const long = coord['longitude'];
          const key = String(lat) + '|' + String(long);
          if (key in previousMarkers) {
            previousMarkers[key] += 1;
          } else {
            previousMarkers[key] = 0;
            const marker = {
              coordinate: {
                latitude: lat,
                longitude: long,
              },
              key: i + 1,
            };
            markers.push(marker);
          }
        }

        setMarkers(markers);
      }
    });
  }

  async function getInitialState() {
    try {
      GetStoreData(LOCATION_DATA).then(locationArrayString => {
        const locationArray = JSON.parse(locationArrayString);
        if (locationArray !== null) {
          const { latitude, longitude } = locationArray.slice(-1)[0];

          mapView.current &&
            mapView.current.animateCamera({ center: { latitude, longitude } });
          setInitialRegion({
            latitude,
            longitude,
            latitudeDelta: 0.10922,
            longitudeDelta: 0.20421,
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function downloadAndPlot() {
    // Downloads the file on the disk and loads it into memory
    try {
      setShowButton({
        disabled: true,
        text: languages.t('label.loading_public_data'),
      });

      RNFetchBlob.config({
        // add this option that makes response data to be stored as a file,
        // this is much more performant.
        fileCache: true,
      })
        .fetch('GET', PUBLIC_DATA_URL, {})
        .then(res => {
          // the temp file path
          console.log('The file saved to ', res.path());
          try {
            RNFetchBlob.fs
              .readFile(res.path(), 'utf8')
              .then(records => {
                // delete the file first using flush
                res.flush();
                parseCSV(records).then(parsedRecords => {
                  console.log(parsedRecords);
                  console.log(Object.keys(parsedRecords).length);
                  plotCircles(parsedRecords).then(() => {
                    // if no overlap, alert user via button text
                    // this is a temporary fix, make it more robust later
                    if (Object.keys(parsedRecords).length !== 0) {
                      setShowButton({
                        disabled: false,
                        text: overlap_true_button_text,
                      });
                    } else {
                      setShowButton({
                        disabled: false,
                        text: no_overlap_button_text,
                      });
                    }
                  });
                });
              })
              .catch(e => {
                console.error('got error: ', e);
              });
          } catch (err) {
            console.log('ERROR:', err);
          }
        });
    } catch (e) {
      console.log(e);
    }
  }

  async function parseCSV(records) {
    try {
      /* const latestLat = initialRegion.latitude;
      const latestLong = initialRegion.longitude; */
      const rows = records.split('\n');
      const parsedRows = {};

      for (var i = rows.length - 1; i >= 0; i--) {
        var row = rows[i].split(',');
        const lat = parseFloat(row[1]);
        const long = parseFloat(row[2]);
        if (!isNaN(lat) && !isNaN(long)) {
          if (true) {
            var key = String(lat) + '|' + String(long);
            if (!(key in parsedRows)) {
              parsedRows[key] = 0;
            }
            parsedRows[key] += 1;
          }
        }
      }
      return parsedRows;
    } catch (e) {
      console.log(e);
    }
  }

  plotCircles = async records => {
    try {
      const circles = [];
      const distThreshold = 100; //In KMs
      const latestLat = initialRegion.latitude;
      const latestLong = initialRegion.longitude;
      let index = 0;

      for (const key in records) {
        const latitude = parseFloat(key.split('|')[0]);
        const longitude = parseFloat(key.split('|')[1]);
        const count = records[key];
        if (
          !isNaN(latitude) &&
          !isNaN(longitude) &&
          distance(latestLat, latestLong, latitude, longitude) < distThreshold
        ) {
          const circle = {
            key: `${index}-${latitude}-${longitude}-${count}`,
            center: {
              latitude: latitude,
              longitude: longitude,
            },
            radius: 5 * count,
          };
          circles.push(circle);
        }
        index += 1;
      }
      console.log(circles.length, 'points found');
      setCircles(circles);
    } catch (e) {
      console.log(e);
    }
  };

  function backToMain() {
    props.navigation.goBack();
  }
  function setVisible() {
    setModalVisible(true);
  }

  function handleBackPress() {
    props.navigation.goBack();
    return true;
  }

  useFocusEffect(
    React.useCallback(() => {
      getInitialState();
      populateMarkers();
      return () => {};
    }, []),
  );

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return function cleanup() {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  });

  // This map shows where your private location trail overlaps with public data from a variety of sources,
  // including official reports from WHO, Ministries of Health, and Chinese local, provincial, and national
  // health authorities. If additional data are available from reliable online reports, they are included.
  return (
    <>
      <NavigationInfoBarWrapper
        title={languages.t('label.overlap_title')}
        onBackPress={backToMain.bind()}
        onInfoTapped={setVisible.bind()}>
        <View style={styles.main}>
          {modalVisible && (
            <View style={styles.centeredView}>
              <Modal
                animationType='slide'
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                  Alert.alert('Modal has been closed.');
                }}>
                <View
                  style={[
                    styles.overlay,
                    { flex: 1, alignItems: 'center', justifyContent: 'center' },
                  ]}>
                  <View style={styles.modalView}>
                    <TouchableHighlight
                      style={{ ...styles.openButton }}
                      onPress={() => {
                        setModalVisible(!modalVisible);
                      }}>
                      <View style={styles.footer}>
                        <Text
                          style={
                            (styles.sectionDescription,
                            {
                              textAlign: 'left',
                              paddingTop: 15,
                              color: '#fff',
                            })
                          }>
                          {languages.t('label.overlap_para_1')}
                        </Text>

                        <Text
                          style={[
                            styles.sectionFooter,
                            {
                              textAlign: 'center',
                              paddingTop: 15,
                              color: '#63beff',
                            },
                          ]}
                          onPress={() =>
                            Linking.openURL(
                              'https://github.com/beoutbreakprepared/nCoV2019',
                            )
                          }>
                          {languages.t('label.nCoV2019_url_info')}{' '}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <Text style={[styles.okButton]}>{'OK'}</Text>
                        </View>
                      </View>
                    </TouchableHighlight>
                  </View>
                </View>
              </Modal>
            </View>
          )}

          <MapView
            ref={mapView}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            customMapStyle={customMapStyles}>
            {markers.map(marker => (
              <Marker
                key={marker.key}
                coordinate={marker.coordinate}
                title={marker.title}
                description={marker.description}
                image={greenMarker}
              />
            ))}
            {circles.map(circle => (
              <CustomCircle
                key={circle.key}
                center={circle.center}
                radius={circle.radius}
                fillColor='rgba(245, 19, 19, 0.4)'
                zIndex={2}
                strokeWidth={0}
              />
            ))}
          </MapView>
          {
            <View style={styles.mapFooter}>
              <TouchableOpacity
                style={styles.buttonTouchable}
                onPress={downloadAndPlot}
                disabled={showButton.disabled}>
                <Text style={styles.buttonText}>
                  {languages.t(showButton.text)}
                </Text>
              </TouchableOpacity>
            </View>
          }
        </View>
      </NavigationInfoBarWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  map: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
  },
  description: {
    flex: 0.5,
  },
  buttonTouchable: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    height: 52,
    alignSelf: 'center',
    width: width * 0.7866,
    marginTop: 15,
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fontFamily.primaryRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    fontFamily: fontFamily.primaryRegular,
  },
  sectionFooter: {
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
    fontFamily: fontFamily.primaryRegular,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingBottom: 5,
  },
  mapFooter: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    alignSelf: 'center',
    marginBottom: 35,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  openButton: {
    backgroundColor: '#333333',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#06273F80',
  },
  okButton: {
    paddingTop: 5,
    color: 'white',
  },
});

const customMapStyles = [
  {
    featureType: 'all',
    elementType: 'all',
    stylers: [
      {
        saturation: '32',
      },
      {
        lightness: '-3',
      },
      {
        visibility: 'on',
      },
      {
        weight: '1.18',
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'landscape',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'all',
    stylers: [
      {
        saturation: '-70',
      },
      {
        lightness: '14',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [
      {
        saturation: '100',
      },
      {
        lightness: '-14',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
      {
        lightness: '12',
      },
    ],
  },
];

export default OverlapScreen;
