import { Injectable } from "@nestjs/common";

@Injectable()
export class GammaClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl =
      process.env.POLYMARKET_BASE || "https://gamma-api.polymarket.com";
    this.headers = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; PolymarketIngestion/1.0)"
    };
  }

  async listSports(): Promise<any[]> {
    return this.getJson("/sports");
  }

  async listEvents(params: Record<string, string | number | boolean | undefined>) {
    const query = this.buildQuery(params);
    return this.getJson(`/events${query}`);
  }

  async getMarket(id: string | number): Promise<any> {
    return this.getJson(`/markets/${id}`);
  }

  private buildQuery(
    params: Record<string, string | number | boolean | undefined>
  ) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
  }

  private async getJson(path: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gamma API ${response.status}: ${text.slice(0, 200)}`);
    }
    return response.json();
  }
}
