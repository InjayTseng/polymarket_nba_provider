import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "tags" })
export class Tag {
  @PrimaryColumn({ type: "int" })
  id!: number;

  @Column({ type: "text", nullable: true })
  label!: string | null;

  @Column({ type: "text", nullable: true })
  slug!: string | null;

  @Column({ name: "force_show", type: "boolean", nullable: true })
  forceShow!: boolean | null;

  @Column({ name: "force_hide", type: "boolean", nullable: true })
  forceHide!: boolean | null;

  @Column({ name: "is_carousel", type: "boolean", nullable: true })
  isCarousel!: boolean | null;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
