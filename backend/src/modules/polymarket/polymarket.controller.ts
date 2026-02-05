import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PolymarketService } from "./polymarket.service";

@Controller("polymarket")
@ApiTags("Polymarket")
export class PolymarketController {
  constructor(private readonly polymarketService: PolymarketService) {}

  @Get("events")
  @ApiOperation({ summary: "List Polymarket events" })
  @ApiQuery({ name: "date", required: false, description: "YYYY-MM-DD" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async listEvents(
    @Query("date") date?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.polymarketService.listEvents({
      date,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  @Get("markets")
  @ApiOperation({ summary: "List Polymarket markets" })
  @ApiQuery({ name: "date", required: false, description: "YYYY-MM-DD" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "eventId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async listMarkets(
    @Query("date") date?: string,
    @Query("search") search?: string,
    @Query("eventId") eventId?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.polymarketService.listMarkets({
      date,
      search,
      eventId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  @Get("price")
  @ApiOperation({ summary: "Proxy live price from Polymarket CLOB" })
  @ApiQuery({ name: "tokenId", required: false })
  @ApiQuery({ name: "marketId", required: false })
  @ApiQuery({ name: "marketIds", required: false, description: "comma separated" })
  @ApiQuery({ name: "side", required: false, description: "buy|sell" })
  async getPrice(
    @Query("tokenId") tokenId?: string,
    @Query("marketId") marketId?: string,
    @Query("marketIds") marketIds?: string,
    @Query("side") side?: string
  ) {
    const ids = marketIds
      ? marketIds
          .split(",")
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : undefined;
    return this.polymarketService.getLivePrices({
      tokenId,
      marketId: marketId ? Number(marketId) : undefined,
      marketIds: ids,
      side
    });
  }

  @Get("orderbook")
  @ApiOperation({ summary: "Proxy live orderbook from Polymarket CLOB" })
  @ApiQuery({ name: "tokenId", required: false })
  @ApiQuery({ name: "marketId", required: false })
  @ApiQuery({ name: "marketIds", required: false, description: "comma separated" })
  async getOrderbook(
    @Query("tokenId") tokenId?: string,
    @Query("marketId") marketId?: string,
    @Query("marketIds") marketIds?: string
  ) {
    const ids = marketIds
      ? marketIds
          .split(",")
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : undefined;
    return this.polymarketService.getOrderbooks({
      tokenId,
      marketId: marketId ? Number(marketId) : undefined,
      marketIds: ids
    });
  }
}
