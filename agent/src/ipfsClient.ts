// IPFS Client usando Pinata

import fetch from "node-fetch";

export async function uploadToIPFS(content: string, filename: string = "delivery.txt"): Promise<string> {
  try {
    // Opción 1: Si tienes Pinata API key
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      return await uploadToPinata(content, filename);
    }

    // Opción 2: Usar web3.storage (gratis, requiere API token)
    if (process.env.WEB3_STORAGE_TOKEN) {
      return await uploadToWeb3Storage(content, filename);
    }

    // Opción 3: Fallback - usar hash del contenido como "fake IPFS"
    // Esto permite que el agente funcione sin IPFS real
    console.warn("⚠️  No IPFS service configured. Using content hash as fallback.");
    const hash = await hashContent(content);
    return `QmFAKE${hash.slice(0, 42)}`; // Simula un hash IPFS
  } catch (error) {
    console.error("Error subiendo a IPFS:", error);
    // Fallback: usar hash del contenido
    const hash = await hashContent(content);
    return `QmFAKE${hash.slice(0, 42)}`;
  }
}

async function uploadToPinata(content: string, filename: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([content], { type: "text/plain" });

  formData.append("file", blob, filename);

  const pinataMetadata = JSON.stringify({
    name: filename,
    keyvalues: {
      source: "FlowWork Agent",
      timestamp: Date.now().toString(),
    },
  });
  formData.append("pinataMetadata", pinataMetadata);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_API_KEY}`,
    },
    body: formData as any,
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

async function uploadToWeb3Storage(content: string, filename: string): Promise<string> {
  // Web3.Storage implementation
  const response = await fetch("https://api.web3.storage/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WEB3_STORAGE_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: content,
  });

  if (!response.ok) {
    throw new Error(`Web3.Storage upload failed: ${response.statusText}`);
  }

  const result: any = await response.json();
  return result.cid;
}

async function hashContent(content: string): Promise<string> {
  // Simple hash para fallback
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  // Usar crypto.subtle si está disponible
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback simple
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(46, "0");
}

export async function getFromIPFS(hash: string): Promise<string> {
  try {
    // Intentar desde varios gateways
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, { timeout: 5000 } as any);
        if (response.ok) {
          return await response.text();
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error("No se pudo recuperar de ningún gateway IPFS");
  } catch (error) {
    console.error("Error recuperando de IPFS:", error);
    throw error;
  }
}
