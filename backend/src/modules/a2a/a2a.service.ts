import { Injectable } from "@nestjs/common";
import { NbaService } from "../nba/nba.service";
import { PolymarketService } from "../polymarket/polymarket.service";

@Injectable()
export class A2AService {
  constructor(
    private readonly nbaService: NbaService,
    private readonly polymarketService: PolymarketService
  ) {}

  async runMatchupBrief(input: {
    date: string;
    home: string;
    away: string;
    matchupLimit?: number;
    recentLimit?: number;
    marketId?: number;
    side?: "buy" | "sell";
  }) {
    const context = await this.nbaService.getGameContextByMatchup({
      date: input.date,
      home: input.home,
      away: input.away,
      matchupLimit: input.matchupLimit,
      recentLimit: input.recentLimit
    });
    if (!context) {
      return { ok: false, error: "game_not_found" };
    }

    let prices: any = null;
    if (input.marketId) {
      prices = await this.polymarketService.getLivePrices({
        marketId: input.marketId,
        side: input.side ?? "buy"
      });
    }

    const game = context.game;
    const homeName = context.homeTeam?.name ?? input.home;
    const awayName = context.awayTeam?.name ?? input.away;

    const injuries = Array.isArray(context.injuries?.entries?.data)
      ? context.injuries.entries.data.slice(0, 20).map((row: any) => ({
          player: row.playerName ?? null,
          team: row.teamAbbrev ?? null,
          status: row.status ?? null,
          description: row.description ?? null
        }))
      : [];

    const recentForm = (team: "home" | "away") => {
      const games = Array.isArray(context.recentForm?.[team])
        ? context.recentForm[team]
        : [];
      return games.slice(0, 5).map((g: any) => ({
        date: g.dateTimeUtc ? new Date(g.dateTimeUtc).toISOString() : null,
        status: g.status ?? null,
        homeScore: g.homeScore ?? null,
        awayScore: g.awayScore ?? null,
        homeTeam: g.homeTeam?.abbrev ?? g.homeTeamId ?? null,
        awayTeam: g.awayTeam?.abbrev ?? g.awayTeamId ?? null
      }));
    };

    return {
      ok: true,
      matchup: {
        date: input.date,
        home: homeName,
        away: awayName
      },
      game: {
        status: game?.status ?? null,
        dateTimeUtc: game?.dateTimeUtc
          ? new Date(game.dateTimeUtc).toISOString()
          : null,
        score:
          game?.homeScore !== null && game?.awayScore !== null
            ? { home: game.homeScore, away: game.awayScore }
            : null
      },
      recent: {
        home: recentForm("home"),
        away: recentForm("away"),
        headToHead: Array.isArray(context.recentMatchups)
          ? context.recentMatchups.slice(0, 5).map((g: any) => ({
              date: g.dateTimeUtc
                ? new Date(g.dateTimeUtc).toISOString()
                : null,
              status: g.status ?? null,
              homeScore: g.homeScore ?? null,
              awayScore: g.awayScore ?? null,
              homeTeam: g.homeTeam?.abbrev ?? g.homeTeamId ?? null,
              awayTeam: g.awayTeam?.abbrev ?? g.awayTeamId ?? null
            }))
          : []
      },
      injuries,
      polymarket: {
        linkedEvent: context.polymarket?.event ?? null,
        linkedMarkets: context.polymarket?.markets?.data ?? [],
        livePrices: prices
      }
    };
  }

  async runMatchupFull(input: {
    date: string;
    home: string;
    away: string;
    matchupLimit?: number;
    recentLimit?: number;
  }) {
    const result = await this.nbaService.analyzeGameByMatchup(
      { date: input.date, home: input.home, away: input.away },
      { matchupLimit: input.matchupLimit, recentLimit: input.recentLimit }
    );
    if (!result) {
      return { ok: false, error: "game_not_found" };
    }
    return { ok: true, ...result };
  }
}
