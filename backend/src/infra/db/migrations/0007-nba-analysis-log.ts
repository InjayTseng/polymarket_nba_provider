import { MigrationInterface, QueryRunner } from "typeorm";

export class NbaAnalysisLog20260209120000 implements MigrationInterface {
  name = "NbaAnalysisLog20260209120000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "nba_analysis_log" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "payer_address" text,
        "session_id" text,
        "request_params" jsonb NOT NULL,
        "response" jsonb,
        "error" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_nba_analysis_log_payer_address" ON "nba_analysis_log" ("payer_address")'
    );
    await queryRunner.query(
      'CREATE INDEX "idx_nba_analysis_log_session_id" ON "nba_analysis_log" ("session_id")'
    );
    await queryRunner.query(
      'CREATE INDEX "idx_nba_analysis_log_created_at" ON "nba_analysis_log" ("created_at")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_nba_analysis_log_created_at"'
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_nba_analysis_log_session_id"'
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_nba_analysis_log_payer_address"'
    );
    await queryRunner.query('DROP TABLE IF EXISTS "nba_analysis_log"');
  }
}

