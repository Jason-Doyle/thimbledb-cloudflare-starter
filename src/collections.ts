import {
  collectionIndexConfiguration,
  defineCollection,
  defineIndex,
} from "thimbledb";

export type Note = {
  id: string;
  title: string;
  body: string;
  lastModified: number;
};

const noteSchema = {
  parse(value: unknown): Note {
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      typeof value.id !== "string" ||
      !("title" in value) ||
      typeof value.title !== "string" ||
      !("body" in value) ||
      typeof value.body !== "string" ||
      !("lastModified" in value) ||
      typeof value.lastModified !== "number"
    ) {
      throw new Error("Invalid note");
    }
    return value as Note;
  },
};

export const notesDefinition = defineCollection(
  "notes",
  noteSchema,
  {
    indexes: [
      defineIndex<Note>("by-title", ["title"]),
      defineIndex<Note>(
        "by-last-modified",
        ["lastModified"],
        "range",
      ),
    ],
  },
);

export const collectionIndexes =
  collectionIndexConfiguration([notesDefinition]);
