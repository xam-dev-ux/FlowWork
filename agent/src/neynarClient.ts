import fetch from "node-fetch";

export class NeynarClient {
  private apiKey: string;
  private baseUrl = "https://api.neynar.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getUserByAddress(address: string): Promise<{
    username: string;
    displayName: string;
    pfpUrl: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/farcaster/user/by-verification?address=${address}`,
        {
          headers: {
            api_key: this.apiKey,
          },
        }
      );

      if (!response.ok) {
        console.error("Neynar API error:", response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.user) {
        return {
          username: data.user.username,
          displayName: data.user.display_name,
          pfpUrl: data.user.pfp_url,
        };
      }

      return null;
    } catch (error) {
      console.error("Neynar fetch error:", error);
      return null;
    }
  }

  async resolveAddressToName(address: string): Promise<string> {
    const user = await this.getUserByAddress(address);

    if (user) {
      return `@${user.username}`;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
