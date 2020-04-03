import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';

const StringValueCodec = t.type({
  type: t.literal('string'),
  name: t.string,
  label: t.string,
  defaultValue: t.union([t.string, t.void])
});

const TextValueCodec = t.type({
  type: t.literal('text'),
  name: t.string,
  label: t.string,
  defaultValue: t.union([t.string, t.void])
});

const ImageValueCodec = t.type({
  type: t.literal('image'),
  name: t.string,
  label: t.string,
  defaultValue: t.union([t.string, t.void]),
  dimensions: t.union([
    t.type({
      maxWidth: t.union([t.number, t.undefined]),
      maxHeight: t.union([t.number, t.undefined])
    }),
    t.undefined
  ])
});

const SchemaCodec = t.array(
  t.union([StringValueCodec, TextValueCodec, ImageValueCodec])
);

export type Schema = t.TypeOf<typeof SchemaCodec>;

const parseSchema = (schema: string): Schema => {
  const result = SchemaCodec.decode(JSON.parse(schema));

  return pipe(
    result,
    fold(
      () => {
        throw new Error(`Invalid schema`);
      },
      (decodedSchema) => decodedSchema
    )
  );
};

export default parseSchema;
