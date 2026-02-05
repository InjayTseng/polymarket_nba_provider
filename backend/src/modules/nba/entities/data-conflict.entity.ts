import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "data_conflict" })
@Index(["conflictType"])
export class DataConflict {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "conflict_type", type: "text" })
  conflictType!: string;

  @Column({ name: "player_id", type: "uuid", nullable: true })
  playerId!: string | null;

  @Column({ type: "int", nullable: true })
  season!: number | null;

  @Column({ name: "job_id", type: "text", nullable: true })
  jobId!: string | null;

  @Column({ name: "details_json", type: "jsonb", nullable: true })
  detailsJson!: Record<string, any> | null;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;
}
