import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Team } from "./team.entity";
import { Event } from "../../polymarket/entities/event.entity";

@Entity({ name: "game" })
@Index(["provider", "providerGameId"], { unique: true })
@Index(["dateTimeUtc"])
export class Game {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ name: "provider_game_id", type: "text" })
  providerGameId!: string;

  @Column({ type: "int" })
  season!: number;

  @Column({ name: "date_time_utc", type: "timestamptz" })
  dateTimeUtc!: Date;

  @Column({ type: "text" })
  status!: string;

  @Column({ name: "home_score", type: "int", nullable: true })
  homeScore!: number | null;

  @Column({ name: "away_score", type: "int", nullable: true })
  awayScore!: number | null;

  @Column({ name: "home_team_id", type: "uuid" })
  homeTeamId!: string;

  @Column({ name: "away_team_id", type: "uuid" })
  awayTeamId!: string;

  @Column({ name: "polymarket_event_id", type: "uuid", nullable: true })
  polymarketEventId!: string | null;

  @ManyToOne(() => Event, { onDelete: "SET NULL" })
  @JoinColumn({ name: "polymarket_event_id" })
  polymarketEvent!: Event | null;

  @ManyToOne(() => Team, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "home_team_id" })
  homeTeam!: Team;

  @ManyToOne(() => Team, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "away_team_id" })
  awayTeam!: Team;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
