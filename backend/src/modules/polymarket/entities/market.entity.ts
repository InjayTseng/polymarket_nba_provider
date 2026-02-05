import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Event } from "./event.entity";

@Entity({ name: "markets" })
@Index(["polymarketMarketId"], { unique: true })
@Index(["eventId"])
export class Market {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "polymarket_market_id", type: "int" })
  polymarketMarketId!: number;

  @Column({ type: "text", nullable: true })
  slug!: string | null;

  @Column({ type: "text", nullable: true })
  question!: string | null;

  @Column({ type: "text", nullable: true })
  title!: string | null;

  @Column({ type: "text", nullable: true })
  category!: string | null;

  @Column({ name: "condition_id", type: "text", nullable: true })
  conditionId!: string | null;

  @Column({ name: "market_type", type: "text", nullable: true })
  marketType!: string | null;

  @Column({ name: "format_type", type: "text", nullable: true })
  formatType!: string | null;

  @Column({ type: "boolean", nullable: true })
  active!: boolean | null;

  @Column({ type: "boolean", nullable: true })
  closed!: boolean | null;

  @Column({ type: "text", nullable: true })
  status!: string | null;

  @Column({ name: "end_date", type: "timestamptz", nullable: true })
  endDate!: Date | null;

  @Column({ name: "resolve_time", type: "timestamptz", nullable: true })
  resolveTime!: Date | null;

  @Column({ type: "numeric", nullable: true })
  liquidity!: number | null;

  @Column({ type: "numeric", nullable: true })
  volume!: number | null;

  @Column({ name: "volume_24hr", type: "numeric", nullable: true })
  volume24hr!: number | null;

  @Column({ name: "outcome_prices", type: "jsonb", nullable: true })
  outcomePrices!: any[] | null;

  @Column({ type: "jsonb", nullable: true })
  outcomes!: any[] | null;

  @Column({ name: "clob_token_ids", type: "text", array: true, nullable: true })
  clobTokenIds!: string[] | null;

  @Column({ name: "last_detail_synced_at", type: "timestamptz", nullable: true })
  lastDetailSyncedAt!: Date | null;

  @Column({ name: "event_id", type: "uuid", nullable: true })
  eventId!: string | null;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @Column({ type: "jsonb", nullable: true })
  raw!: Record<string, any> | null;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
