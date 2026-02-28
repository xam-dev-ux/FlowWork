import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, FLOWWORK_ABI, BASE_RPC, USDC_ADDRESS, USDC_ABI } from "@/lib/contract";

export function useContract() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    const readProvider = new ethers.JsonRpcProvider(BASE_RPC);
    setProvider(readProvider);
    setContract(new ethers.Contract(CONTRACT_ADDRESS, FLOWWORK_ABI, readProvider));

    async function setupSigner() {
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
          const ethSigner = await ethersProvider.getSigner();
          setSigner(ethSigner);
          setUserAddress(await ethSigner.getAddress());
        }
      } catch (error) {
        console.error("Failed to setup signer:", error);
      }
    }

    setupSigner();
  }, []);

  const getWriteContract = () => {
    if (!signer) throw new Error("No signer available");
    return new ethers.Contract(CONTRACT_ADDRESS, FLOWWORK_ABI, signer);
  };

  const getUSDCContract = () => {
    if (!signer) throw new Error("No signer available");
    return new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
  };

  const approveUSDC = async (amount: bigint) => {
    const usdcContract = getUSDCContract();
    const tx = await usdcContract.approve(CONTRACT_ADDRESS, amount);
    await tx.wait();
  };

  return {
    provider,
    contract,
    signer,
    userAddress,
    getWriteContract,
    approveUSDC,
  };
}
