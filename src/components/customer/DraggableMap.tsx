import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
import { mapStyles } from "@/styles/mapStyles";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { useUserStore } from "@/store/userStore";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import { reverseGeocode } from "@/utils/mapUtils";
import haversine from "haversine-distance";
import { useWS } from "@/service/WSProvider";

const DraggableMap: FC<{ height: number }> = ({ height }) => {
  const mapRef = useRef<MapView>(null);
  const isFocused = useIsFocused();
  const [markers, setMarkers] = useState<any>([]);
  const { emit, on, off } = useWS();

  const MAX_DISTANCE_THRESHOLD = 10000;

  const { setLocation, location, outOfRange, setOutOfRange } = useUserStore();

  const askLocationAccess = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      try {
        const location = await Location.getCurrentPositionAsync({});
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
    console.log(rewRegion);
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

  const handleGpsButton = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const current_location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = current_location.coords;

      mapRef.current?.fitToCoordinates([{ latitude, longitude }], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });

      const address = await reverseGeocode(latitude, longitude);
      setLocation({
        latitude,
        longitude,
        address,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // real captain markers
  // useEffect(() => {
  //   if (location?.latitude && location?.longitude && isFocused) {
  //     emit("subscribeToZone", {
  //       latitude: location.latitude,
  //       longitude: location.longitude,
  //     });

  //     on("nearbyCaptains", (captains: any[]) => {
  //       const updatedMarkers = captains?.map((captain) => ({
  //         id: captain.id,
  //         latitude: captain?.coords?.latitude,
  //         longitude: captain?.coords?.longitude,
  //         type: "captain",
  //         rotation: captain?.coords?.heading,
  //         visible: true,
  //       }));

  //       setMarkers(updatedMarkers);
  //     });

  //     return () => {
  //       off("nearbyCaptains");
  //     };
  //   }
  // }, [location, emit, on, off, isFocused]);

  // simulation of captain markers
  useEffect(() => {
    generateRandomMarkers();
  }, [location, emit, on, off, isFocused]);

  const generateRandomMarkers = () => {
    if (!location?.latitude || !location?.longitude || outOfRange) return;
    const types = ["bike", "auto", "cab"];

    const newMarkers = Array.from({ length: 20 }, (_, index) => {
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomRotation = Math.floor(Math.random() * 360);

      return {
        id: index,
        latitude: location.latitude + (Math.random() - 0.5) * 0.01,
        longitude: location.longitude + (Math.random() - 0.5) * 0.01,
        type: randomType,
        rotation: randomRotation,
        visible: true,
      };
    });

    setMarkers(newMarkers);
  };

  const updateMarkers = () => {
    const updatedMarkers = markers.map((marker: any) => {
      return {
        ...marker,
        latitude: marker.latitude + Math.random() / 100,
        longitude: marker.longitude + Math.random() / 100,
      };
    });

    setMarkers(updatedMarkers);
  };

  return (
    <View style={{ height: height, width: "100%" }}>
      <MapView
        style={{ flex: 1 }}
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
      >
        {markers.map(
          (marker: any, index: number) =>
            marker.visible && (
              <Marker
                zIndex={index}
                key={index}
                flat
                anchor={{ x: 0.5, y: 0.5 }}
                coordinate={{
                  latitude: marker?.latitude,
                  longitude: marker?.longitude,
                }}
              >
                <View
                  style={{ transform: [{ rotate: `${marker?.rotation}deg` }] }}
                >
                  <Image
                    source={
                      marker?.type === "bike"
                        ? require("@/assets/icons/bike_marker.png")
                        : marker?.type === "auto"
                        ? require("@/assets/icons/auto_marker.png")
                        : require("@/assets/icons/cab_marker.png")
                    }
                    style={{ height: 40, width: 40, resizeMode: "contain" }}
                  />
                </View>
              </Marker>
            )
        )}
      </MapView>

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

export default memo(DraggableMap);
