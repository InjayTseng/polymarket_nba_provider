import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Game } from "./game.entity";
import { Player } from "./player.entity";
import { Team } from "./team.entity";

@Entity({ name: "player_game_stat" })
@Index(["gameId", "playerId"], { unique: true })
@Index(["playerId", "gameId"])
@Index(["gameId", "teamId"])
@Index(["playerId"])
@Index(["teamId"])
@Index(["gameId"])
export class PlayerGameStats {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ name: "game_id", type: "uuid" })
  gameId!: string;

  @Column({ name: "player_id", type: "uuid" })
  playerId!: string;

  @Column({ name: "team_id", type: "uuid" })
  teamId!: string;

  @Column({ name: "is_starter", type: "bool", nullable: true })
  isStarter!: boolean | null;

  @Column({ type: "numeric", precision: 6, scale: 3, nullable: true })
  minutes!: number | null;

  @Column({ type: "int" })
  pts!: number;

  @Column({ type: "int" })
  reb!: number;

  @Column({ type: "int" })
  ast!: number;

  @Column({ type: "int" })
  tov!: number;

  @Column({ type: "int", nullable: true })
  stl!: number | null;

  @Column({ type: "int", nullable: true })
  blk!: number | null;

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

  @Column({ name: "plus_minus", type: "int", nullable: true })
  plusMinus!: number | null;

  @Column({ name: "did_not_play_reason", type: "text", nullable: true })
  didNotPlayReason!: string | null;

  @ManyToOne(() => Game, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: Game;

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
