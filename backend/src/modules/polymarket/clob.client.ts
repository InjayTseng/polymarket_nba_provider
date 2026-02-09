import { Injectable } from "@nestjs/common";

@Injectable()
export class ClobClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl =
      process.env.POLYMARKET_CLOB_BASE || "https://clob.polymarket.com";
    this.headers = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; PolymarketIngestion/1.0)"
    };
  }

  async getPrice(tokenId: string, side: string) {
    const params = new URLSearchParams({
      token_id: tokenId,
      side: side.toUpperCase()
    });
    return this.getJson(`/price?${params.toString()}`);
  }

  async getOrderbook(tokenId: string) {
    const params = new URLSearchParams({ token_id: tokenId });
    return this.getJson(`/book?${params.toString()}`);
  }

  // Best-effort; endpoint availability can vary. Caller should handle errors.
  async getRecentTrades(tokenId: string, limit = 50) {
    const capped = Math.max(1, Math.min(200, Math.floor(limit)));
    const params = new URLSearchParams({
      token_id: tokenId,
      limit: String(capped)
    });
    return this.getJson(`/trades?${params.toString()}`);
  }

  private async getJson(path: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`CLOB API ${response.status}: ${text.slice(0, 200)}`);
    }
    return response.json();
  }
}
