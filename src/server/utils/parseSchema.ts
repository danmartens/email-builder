import { z } from 'zod/v4';

const StringFieldSchema = z.object({
  type: z.literal('string'),
  name: z.string(),
  label: z.string(),
  defaultValue: z.string().optional()
});

const TextFieldSchema = z.object({
  type: z.literal('text'),
  name: z.string(),
  label: z.string(),
  defaultValue: z.string().optional()
});

const ImageFieldSchema = z.object({
  type: z.literal('image'),
  name: z.string(),
  label: z.string(),
  defaultValue: z
    .object({
      src: z.string(),
      srcset: z.string().optional()
    })
    .optional(),
  dimensions: z
    .object({
      maxWidth: z.number().optional(),
      maxHeight: z.number().optional()
    })
    .optional()
});

const ListFieldSchemaCodec = z.union([
  StringFieldSchema,
  TextFieldSchema,
  ImageFieldSchema
]);

const ListFieldSchema = z.object({
  type: z.literal('list'),
  name: z.string(),
  label: z.string(),
  schema: z.array(ListFieldSchemaCodec)
});

const SchemaCodec = z.array(
  z.union([
    StringFieldSchema,
    TextFieldSchema,
    ImageFieldSchema,
    ListFieldSchema
  ])
);

export type Schema = z.infer<typeof SchemaCodec>;
export type ListValueSchema = z.infer<typeof ListFieldSchemaCodec>;

export function parseSchema(schema: string): Schema {
  const result = SchemaCodec.safeParse(JSON.parse(schema));

  if (!result.success) {
    throw new Error('Invalid schema');
  }

  return result.data;
}
