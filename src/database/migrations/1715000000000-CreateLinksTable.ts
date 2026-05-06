import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLinksTable1715000000000 implements MigrationInterface {
  name = 'CreateLinksTable1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE "links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(120) NOT NULL,
        "targetUrl" text NOT NULL,
        "clickCount" integer NOT NULL DEFAULT 0,
        "lastAccessedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_links_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_links_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_links_slug" ON "links" ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_links_slug"`);
    await queryRunner.query(`DROP TABLE "links"`);
  }
}
