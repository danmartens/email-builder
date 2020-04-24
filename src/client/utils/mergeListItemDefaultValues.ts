import { ListValueSchema } from '../../types';

const mergeListItemDefaultValues = (
  schema: ListValueSchema[],
  data: { [key: string]: any } = {}
) =>
  schema.reduce((value, item) => {
    return {
      ...value,
      [item.name]: data[item.name] ?? item.defaultValue ?? ''
    };
  }, {});

export default mergeListItemDefaultValues;
