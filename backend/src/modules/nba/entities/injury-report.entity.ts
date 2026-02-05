import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { InjuryReportEntry } from "./injury-report-entry.entity";

@Entity({ name: "injury_report" })
export class InjuryReport {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "report_date", type: "date", nullable: true })
  reportDate!: string | null;

  @Column({ name: "report_time", type: "text", nullable: true })
  reportTime!: string | null;

  @Column({ name: "source_url", type: "text" })
  sourceUrl!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => InjuryReportEntry, (entry) => entry.report)
  entries!: InjuryReportEntry[];
}
