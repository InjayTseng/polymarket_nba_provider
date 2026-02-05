import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique
} from "typeorm";
import { InjuryReport } from "./injury-report.entity";
import { Player } from "./player.entity";
import { Team } from "./team.entity";

@Entity({ name: "injury_report_entry" })
@Unique("uq_injury_report_entry", [
  "reportId",
  "teamAbbrev",
  "playerName",
  "matchup",
  "gameDate",
  "gameTime"
])
@Index("idx_injury_report_entry_report", ["reportId"])
@Index("idx_injury_report_entry_team", ["teamAbbrev"])
@Index("idx_injury_report_entry_player", ["playerName"])
export class InjuryReportEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "report_id", type: "uuid" })
  reportId!: string;

  @ManyToOne(() => InjuryReport, (report) => report.entries, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "report_id" })
  report!: InjuryReport;

  @Column({ name: "team_id", type: "uuid", nullable: true })
  teamId!: string | null;

  @ManyToOne(() => Team, { onDelete: "SET NULL" })
  @JoinColumn({ name: "team_id" })
  team?: Team | null;

  @Column({ name: "player_id", type: "uuid", nullable: true })
  playerId!: string | null;

  @ManyToOne(() => Player, { onDelete: "SET NULL" })
  @JoinColumn({ name: "player_id" })
  player?: Player | null;

  @Column({ name: "game_date", type: "date", nullable: true })
  gameDate!: string | null;

  @Column({ name: "game_time", type: "text", nullable: true })
  gameTime!: string | null;

  @Column({ name: "matchup", type: "text", nullable: true })
  matchup!: string | null;

  @Column({ name: "team_abbrev", type: "text", nullable: true })
  teamAbbrev!: string | null;

  @Column({ name: "player_name", type: "text", nullable: true })
  playerName!: string | null;

  @Column({ name: "status", type: "text", nullable: true })
  status!: string | null;

  @Column({ name: "injury", type: "text", nullable: true })
  injury!: string | null;

  @Column({ name: "reason", type: "text", nullable: true })
  reason!: string | null;

  @Column({ name: "notes", type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "raw_json", type: "jsonb", nullable: true })
  rawJson!: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
