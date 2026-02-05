import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "events" })
@Index(["polymarketEventId"], { unique: true })
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "polymarket_event_id", type: "int" })
  polymarketEventId!: number;

  @Column({ type: "text", nullable: true })
  slug!: string | null;

  @Column({ type: "text", nullable: true })
  title!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "start_date", type: "timestamptz", nullable: true })
  startDate!: Date | null;

  @Column({ name: "end_date", type: "timestamptz", nullable: true })
  endDate!: Date | null;

  @Column({ type: "boolean", nullable: true })
  active!: boolean | null;

  @Column({ type: "boolean", nullable: true })
  closed!: boolean | null;

  @Column({ type: "boolean", nullable: true })
  archived!: boolean | null;

  @Column({ type: "boolean", nullable: true })
  featured!: boolean | null;

  @Column({ type: "boolean", nullable: true })
  restricted!: boolean | null;

  @Column({ type: "numeric", nullable: true })
  liquidity!: number | null;

  @Column({ type: "numeric", nullable: true })
  volume!: number | null;

  @Column({ type: "jsonb", nullable: true })
  raw!: Record<string, any> | null;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
