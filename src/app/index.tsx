import { View, Image, Alert } from "react-native";
import React, { useEffect } from "react";
import { commonStyles } from "@/styles/commonStyles";
import { splashStyles } from "@/styles/splashStyles";
import CustomText from "@/components/shared/CustomText";
import { useFonts } from "expo-font";
import { resetAndNavigate } from "@/utils/Helpers";
import { jwtDecode } from "jwt-decode";
import { asyncStorage } from "@/store/store";
import { refresh_tokens } from "@/service/apiInterceptors";
import { useUserStore } from "@/store/userStore";

interface DecodeToken {
  exp: number;
}

const Main = () => {
  const [loaded] = useFonts({
    Bold: require("../assets/fonts/NotoSans-Bold.ttf"),
    Regular: require("../assets/fonts/NotoSans-Regular.ttf"),
    Medium: require("../assets/fonts/NotoSans-Medium.ttf"),
    Light: require("../assets/fonts/NotoSans-Light.ttf"),
    SemiBold: require("../assets/fonts/NotoSans-SemiBold.ttf"),
  });

  const { user } = useUserStore();

  const [hasNavigated, setHasNavigated] = React.useState(false);

  const tokenCheck = async () => {
    const access_token = (await asyncStorage.getItem("access_token")) as string;
    const refresh_token = (await asyncStorage.getItem(
      "refresh_token"
    )) as string;

    if (access_token) {
      const decodedAccessToken = jwtDecode<DecodeToken>(access_token);
      const decodedRefreshToken = jwtDecode<DecodeToken>(refresh_token);

      const currentTime = Date.now() / 1000;

      if (decodedAccessToken?.exp < currentTime) {
        resetAndNavigate("/role");
        Alert.alert("Session Expired", "Please login again");
      }

      if (decodedRefreshToken?.exp < currentTime) {
        try {
          refresh_tokens();
        } catch (error) {
          console.log(error);
          Alert.alert("Refresh token error");
        }
      }

      if (user) {
        resetAndNavigate("/customer/home");
      } else {
        resetAndNavigate("/captain/home");
      }

      return;
    }

    resetAndNavigate("/role");
  };

  useEffect(() => {
    if (loaded && !hasNavigated) {
      const timeoutId = setTimeout(() => {
        tokenCheck();
        setHasNavigated(true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [loaded, hasNavigated]);

  return (
    <View style={commonStyles.container}>
      <Image
        source={require("@/assets/images/logo_t.png")}
        style={splashStyles.img}
      />
      <CustomText variant="h5" fontFamily="Medium" style={splashStyles.text}>
        Made in love with React Native
      </CustomText>
    </View>
  );
};

export default Main;
