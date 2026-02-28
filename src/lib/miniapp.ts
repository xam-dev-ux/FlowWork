import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface MiniAppContextType {
  isReady: boolean;
  userAddress: string | null;
  openUrl: (url: string) => void;
}

const MiniAppContext = createContext<MiniAppContextType>({
  isReady: false,
  userAddress: null,
  openUrl: () => {},
});

interface MiniAppProviderProps {
  children: ReactNode;
}

export function MiniAppProvider(props: MiniAppProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        if (typeof window !== "undefined") {
          const ethereum = (window as any).ethereum;
          if (ethereum) {
            try {
              const accounts = await ethereum.request({
                method: "eth_accounts",
              });
              if (accounts && accounts[0]) {
                setUserAddress(accounts[0]);
              }
            } catch (error) {
              console.log("No wallet connected yet");
            }
          }
        }
        setIsReady(true);
      } catch (error) {
        console.error("Init failed:", error);
        setIsReady(true);
      }
    }

    init();
  }, []);

  const openUrl = (url: string) => {
    window.open(url, "_blank");
  };

  const value = { isReady, userAddress, openUrl };

  return <MiniAppContext.Provider value={value}>{props.children}</MiniAppContext.Provider>;
}

export function useMiniApp() {
  return useContext(MiniAppContext);
}
