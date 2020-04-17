import { ListValueSchema } from '../../types';

const mergeListItemDefaultValues = (
  schema: ListValueSchema[],
  data: object = {}
) =>
  schema.reduce((value, item) => {
    return {
      ...value,
      [item.name]: data[item.name] ?? item.defaultValue
    };
  }, {});

export default mergeListItemDefaultValues;
