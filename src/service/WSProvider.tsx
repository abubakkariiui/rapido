import { tokenStorage } from "@/store/store";
import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { refresh_tokens } from "./apiInterceptors";

interface WSService {
  initializeSocket: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  removeListener: (listenerName: string) => void;
  updateAccessToken: () => void;
  disconnect: () => void;
}

const WSContext = createContext<WSService | undefined>(undefined);

export const WSProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [socketAccessToken, setSocketAccessToken] = useState<string | null>(
    null
  );
  const socket = useRef<Socket>();

  useEffect(() => {
    const token = tokenStorage.getItem("access_token") as any;
    setSocketAccessToken(token);
  }, []);

  useEffect(() => {
    if (socketAccessToken) {
      if (socket.current) {
        socket.current.disconnect();
      }

      socket.current = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
        extraHeaders: {
          access_token: socketAccessToken || "",
        },
      });

      socket.current.on("connect_error", (error) => {
        if (error.message === "Authentication error") {
          console.log("Authentication error");
          refresh_tokens();
        }
      });
    }

    return () => {
      socket.current?.disconnect();
    };
  }, [socketAccessToken]);

  const emit = (event: string, data: any = {}) => {
    socket.current?.emit(event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    socket.current?.on(event, callback);
  };

  const off = (event: string) => {
    socket.current?.off(event);
  };

  const removeListener = (listenerName: string) => {
    socket.current?.removeListener(listenerName);
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = undefined;
    }
  };

  const updateAccessToken = () => {
    const token = tokenStorage.getItem("access_token") as any;
    setSocketAccessToken(token);
  };

  const socketService: WSService = {
    initializeSocket: () => {},
    emit,
    on,
    off,
    removeListener,
    updateAccessToken,
    disconnect,
  };

  return (
    <WSContext.Provider value={socketService}>{children}</WSContext.Provider>
  );
};

export const useWS = (): WSService => {
  const socketService = useContext(WSContext);
  if (!socketService) {
    throw new Error("useWS must be used within a WSProvider");
  }
  return socketService;
};
