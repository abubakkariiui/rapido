import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC, useEffect, useRef, useState } from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
import { mapStyles } from "@/styles/mapStyles";
import {
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { useUserStore } from "@/store/userStore";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import { reverseGeocode } from "@/utils/mapUtils";
import haversine from "haversine-distance";

const DraggableMap: FC<{ height: number }> = ({ height }) => {
  const mapRef = useRef<MapView>(null);
  const isFocused = useIsFocused();
  const [markers, setMarkers] = useState<any>([]);

  const MAX_DISTANCE_THRESHOLD = 10000;

  const { setLocation, location, outOfRange, setOutOfRange } = useUserStore();

  const askLocationAccess = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      try {
        const location = await Location.getCurrentPositionAsync({});
        console.log("Location: ", location);
        const { latitude, longitude } = location.coords;
        mapRef.current?.fitToCoordinates([{ latitude, longitude }], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });

        const rewRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        handleRegionChangeComplete(rewRegion);
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("Location permission not granted");
    }
  };

  useEffect(() => {
    if (isFocused) {
      askLocationAccess();
    }
  }, [mapRef, isFocused]);

  const handleRegionChangeComplete = async (rewRegion: Region) => {
    const address = await reverseGeocode(
      rewRegion?.latitude,
      rewRegion?.longitude
    );

    setLocation({
      latitude: rewRegion?.latitude,
      longitude: rewRegion?.longitude,
      address,
    });

    const userLocation = {
      latitude: location?.latitude,
      longitude: location?.longitude,
    } as any;

    if (userLocation) {
      const newLocation = {
        latitude: rewRegion?.latitude,
        longitude: rewRegion?.longitude,
      };

      const distance = haversine(userLocation, newLocation);
      setOutOfRange(distance > MAX_DISTANCE_THRESHOLD);
    }
  };

  const handleGpsButton = () => {
    console.log("gps button pressed");
  };

  return (
    <View style={{ height: height, width: "100%" }}>
      <MapView
        ref={mapRef}
        maxZoomLevel={16}
        minZoomLevel={12}
        pitchEnabled={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        initialRegion={indiaIntialRegion}
        provider="google"
        customMapStyle={customMapStyle}
        showsMyLocationButton={false}
        showsCompass={false}
        showsIndoors={false}
        showsIndoorLevelPicker={false}
        showsTraffic={false}
        showsScale={false}
        showsBuildings={false}
        showsPointsOfInterest={false}
        showsUserLocation={true}
      ></MapView>

      <View style={mapStyles.centerMarkerContainer}>
        <Image
          source={require("@/assets/icons/marker.png")}
          style={mapStyles.marker}
        />
      </View>
      <TouchableOpacity style={mapStyles.gpsButton} onPress={handleGpsButton}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>

      {outOfRange && (
        <View style={mapStyles.outOfRange}>
          <FontAwesome6 name="road-circle-exclamation" size={24} color="red" />
        </View>
      )}
    </View>
  );
};

export default DraggableMap;
