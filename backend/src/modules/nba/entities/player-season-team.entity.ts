import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Player } from "./player.entity";
import { Team } from "./team.entity";

@Entity({ name: "player_season_team" })
@Index(["playerId", "season", "teamId"], { unique: true })
@Index(["playerId", "season"])
@Index(["teamId", "season"])
export class PlayerSeasonTeam {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ name: "player_id", type: "uuid" })
  playerId!: string;

  @Column({ type: "int" })
  season!: number;

  @Column({ name: "team_id", type: "uuid" })
  teamId!: string;

  @Column({ name: "from_utc", type: "timestamptz" })
  fromUtc!: Date;

  @Column({ name: "to_utc", type: "timestamptz", nullable: true })
  toUtc!: Date | null;

  @Column({ type: "text", nullable: true })
  role!: string | null;

  @Column({ name: "contract_type", type: "text", nullable: true })
  contractType!: string | null;

  @ManyToOne(() => Player, { onDelete: "CASCADE" })
  @JoinColumn({ name: "player_id" })
  player!: Player;

  @ManyToOne(() => Team, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
