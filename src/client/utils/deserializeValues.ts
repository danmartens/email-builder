import { Schema } from '../../types';
import mergeListItemDefaultValues from './mergeListItemDefaultValues';

const deserializeValues = (
  schema: Schema,
  serializedData: string
): { [key: string]: string | undefined } => {
  const schemaKeys = schema.map(({ name }) => name);

  let dataKeys = [];
  let data = {};

  try {
    if (serializedData != null) {
      data = JSON.parse(serializedData);
      dataKeys = Object.keys(data);

      // Remove keys from data which are no longer present in the current
      // schema.
      for (const key of dataKeys) {
        if (!schemaKeys.includes(key)) {
          delete data[key];
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  // Add keys and default values to the data which are now present in the
  // current schema.
  for (const key of schemaKeys) {
    const value = schema.find(({ name }) => name === key);

    if (value?.type === 'list') {
      data[key] = (data[key] || []).map((itemData) =>
        mergeListItemDefaultValues(value.schema, itemData)
      );
    } else if (!dataKeys.includes(key)) {
      data[key] = value.defaultValue;
    }
  }

  return data;
};

export default deserializeValues;
