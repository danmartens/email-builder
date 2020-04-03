import { Schema } from '../../types';

function fetchValues(
  templateName: string,
  schema: Schema
): { [key: string]: string | undefined } {
  const schemaKeys = schema.map(({ name }) => name);

  let dataKeys = [];
  let data = {};

  try {
    const serializedData = localStorage.getItem(templateName);

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
    if (!dataKeys.includes(key)) {
      data[key] = schema.find(({ name }) => name === key).defaultValue;
    }
  }

  return data;
}

export default fetchValues;
