import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "team" })
@Index(["provider", "providerTeamId"], { unique: true })
export class Team {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ name: "provider_team_id", type: "text" })
  providerTeamId!: string;

  @Column({ type: "text" })
  abbrev!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
