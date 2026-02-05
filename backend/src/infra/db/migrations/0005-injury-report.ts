import { MigrationInterface, QueryRunner } from "typeorm";

export class InjuryReport20260204193000 implements MigrationInterface {
  name = "InjuryReport20260204193000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "injury_report" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "report_date" date,
        "report_time" text,
        "source_url" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_injury_report_source_url" UNIQUE ("source_url")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_injury_report_date" ON "injury_report" ("report_date")'
    );

    await queryRunner.query(`
      CREATE TABLE "injury_report_entry" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "report_id" uuid NOT NULL,
        "game_date" date,
        "game_time" text,
        "matchup" text,
        "team_abbrev" text,
        "player_name" text,
        "status" text,
        "injury" text,
        "reason" text,
        "notes" text,
        "raw_json" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_injury_report_entry_report" FOREIGN KEY ("report_id") REFERENCES "injury_report"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_injury_report_entry" UNIQUE ("report_id", "team_abbrev", "player_name", "matchup", "game_date", "game_time")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_injury_report_entry_report" ON "injury_report_entry" ("report_id")'
    );

    await queryRunner.query(
      'CREATE INDEX "idx_injury_report_entry_team" ON "injury_report_entry" ("team_abbrev")'
    );

    await queryRunner.query(
      'CREATE INDEX "idx_injury_report_entry_player" ON "injury_report_entry" ("player_name")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "injury_report_entry"');
    await queryRunner.query('DROP TABLE IF EXISTS "injury_report"');
  }
}
