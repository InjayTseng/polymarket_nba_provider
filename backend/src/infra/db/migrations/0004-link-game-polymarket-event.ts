import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkGamePolymarketEvent20260205020000
  implements MigrationInterface
{
  name = "LinkGamePolymarketEvent20260205020000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "game" ADD COLUMN IF NOT EXISTS "polymarket_event_id" uuid'
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_game_polymarket_event_id" ON "game" ("polymarket_event_id")'
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_game_polymarket_event'
        ) THEN
          ALTER TABLE "game"
          ADD CONSTRAINT "fk_game_polymarket_event"
          FOREIGN KEY ("polymarket_event_id")
          REFERENCES "events"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "game" DROP CONSTRAINT IF EXISTS "fk_game_polymarket_event"'
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_game_polymarket_event_id"'
    );
    await queryRunner.query(
      'ALTER TABLE "game" DROP COLUMN IF EXISTS "polymarket_event_id"'
    );
  }
}
