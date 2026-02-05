import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from "typeorm";
import { Event } from "./event.entity";
import { Tag } from "./tag.entity";

@Entity({ name: "event_tags" })
export class EventTag {
  @PrimaryColumn({ name: "event_id", type: "uuid" })
  eventId!: string;

  @PrimaryColumn({ name: "tag_id", type: "int" })
  tagId!: number;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @ManyToOne(() => Tag, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tag_id" })
  tag!: Tag;

}
