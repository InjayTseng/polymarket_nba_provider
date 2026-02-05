import { MigrationInterface, QueryRunner } from "typeorm";

export class InjuryReportLinks20260205025500 implements MigrationInterface {
  name = "InjuryReportLinks20260205025500";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" ADD COLUMN "team_id" uuid'
    );
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" ADD COLUMN "player_id" uuid'
    );

    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" ADD CONSTRAINT "fk_injury_report_entry_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL'
    );
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" ADD CONSTRAINT "fk_injury_report_entry_player" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE SET NULL'
    );

    await queryRunner.query(
      'CREATE INDEX "idx_injury_report_entry_team_id" ON "injury_report_entry" ("team_id")'
    );
    await queryRunner.query(
      'CREATE INDEX "idx_injury_report_entry_player_id" ON "injury_report_entry" ("player_id")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_injury_report_entry_player_id"'
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_injury_report_entry_team_id"'
    );
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" DROP CONSTRAINT IF EXISTS "fk_injury_report_entry_player"'
    );
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" DROP CONSTRAINT IF EXISTS "fk_injury_report_entry_team"'
    );
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" DROP COLUMN IF EXISTS "player_id"'
    );
    await queryRunner.query(
      'ALTER TABLE "injury_report_entry" DROP COLUMN IF EXISTS "team_id"'
    );
  }
}
