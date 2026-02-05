import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "ingestion_state" })
export class IngestionState {
  @PrimaryColumn({ type: "text" })
  key!: string;

  @Column({ type: "jsonb", nullable: true })
  value!: Record<string, any> | null;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
