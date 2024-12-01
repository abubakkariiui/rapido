import { useCaptainStore } from "@/store/captainStore";
import { tokenStorage } from "@/store/store";
import { useUserStore } from "@/store/userStore";
import { resetAndNavigate } from "@/utils/Helpers";
import axios from "axios";
import { Alert } from "react-native";
import { BASE_URL } from "./config";

export const signin = async (
  payload: {
    role: "customer" | "captain";
    phone: string;
  },
  updateAccessToken: () => void
) => {
  const { setUser } = useUserStore.getState();
  const { setUser: setCaptainUser } = useCaptainStore.getState();

  try {
    const res = await axios.post(`${BASE_URL}/auth/signin`, payload);

    if (res.data.user.role === "customer") {
      setUser(res.data.user);
    } else {
      setCaptainUser(res.data.user);
    }
    console.log("Sign-in response:", res.data);
    // Save tokens asynchronously
    await tokenStorage.setItem("access_token", res.data.access_token);
    await tokenStorage.setItem("refresh_token", res.data.refresh_token);

    // Navigate based on role
    if (res.data.user.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      resetAndNavigate("/captain/home");
    }

    updateAccessToken();
  } catch (error) {
    Alert.alert("Error", "Something went wrong during sign-in.");
    console.error("Sign-in error:", error);
  }
};

export const logout = async () => {
  const { clearData } = useUserStore.getState();
  const { clearCaptainData } = useCaptainStore.getState();

  try {
    // Clear tokens asynchronously
    await tokenStorage.removeItem("access_token");
    await tokenStorage.removeItem("refresh_token");

    clearCaptainData();
    clearData();

    // Navigate to role selection
    resetAndNavigate("/role");
  } catch (error) {
    Alert.alert("Error", "Something went wrong during logout.");
    console.error("Logout error:", error);
  }
};
