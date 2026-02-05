import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Game } from "./game.entity";
import { Team } from "./team.entity";

@Entity({ name: "team_game_stat" })
@Index(["gameId", "teamId"], { unique: true })
@Index(["teamId", "gameId"])
export class TeamGameStat {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "game_id", type: "uuid" })
  gameId!: string;

  @Column({ name: "team_id", type: "uuid" })
  teamId!: string;

  @Column({ name: "is_home", type: "bool" })
  isHome!: boolean;

  @Column({ type: "int" })
  pts!: number;

  @Column({ type: "int", nullable: true })
  reb!: number | null;

  @Column({ type: "int", nullable: true })
  ast!: number | null;

  @Column({ type: "int", nullable: true })
  tov!: number | null;

  @Column({ type: "int", nullable: true })
  fgm!: number | null;

  @Column({ type: "int", nullable: true })
  fga!: number | null;

  @Column({ type: "int", nullable: true })
  fg3m!: number | null;

  @Column({ type: "int", nullable: true })
  fg3a!: number | null;

  @Column({ type: "int", nullable: true })
  ftm!: number | null;

  @Column({ type: "int", nullable: true })
  fta!: number | null;

  @Column({ name: "off_rtg", type: "numeric", nullable: true })
  offRtg!: number | null;

  @Column({ name: "def_rtg", type: "numeric", nullable: true })
  defRtg!: number | null;

  @Column({ type: "numeric", nullable: true })
  pace!: number | null;

  @Column({ name: "ts_pct", type: "numeric", nullable: true })
  tsPct!: number | null;

  @ManyToOne(() => Game, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @ManyToOne(() => Team, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
