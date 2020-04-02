export interface BoxValues {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const parseBoxValues = (values: string): BoxValues => {
  if (typeof values === 'string') {
    const parsedValues = values.split(/\s+/).map((value) => parseInt(value));

    switch (parsedValues.length) {
      case 4:
        return {
          top: parsedValues[0],
          left: parsedValues[1],
          bottom: parsedValues[2],
          right: parsedValues[3]
        };

      case 2:
        return {
          top: parsedValues[0],
          left: parsedValues[1],
          bottom: parsedValues[0],
          right: parsedValues[1]
        };

      case 1:
        return {
          top: parsedValues[0],
          left: parsedValues[0],
          bottom: parsedValues[0],
          right: parsedValues[0]
        };

      default:
        throw new Error(`Invalid padding value: "${values}"`);
    }
  }

  return { top: 0, left: 0, bottom: 0, right: 0 };
};

export default parseBoxValues;
