import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Market } from "./market.entity";

@Entity({ name: "market_snapshots" })
export class MarketSnapshot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "market_id", type: "uuid" })
  marketId!: string;

  @Column({ type: "timestamptz" })
  ts!: Date;

  @Column({ name: "price_yes", type: "numeric", nullable: true })
  priceYes!: number | null;

  @Column({ name: "price_no", type: "numeric", nullable: true })
  priceNo!: number | null;

  @Column({ type: "numeric", nullable: true })
  volume!: number | null;

  @Column({ type: "numeric", nullable: true })
  liquidity!: number | null;

  @ManyToOne(() => Market, { onDelete: "CASCADE" })
  @JoinColumn({ name: "market_id" })
  market!: Market;
}
