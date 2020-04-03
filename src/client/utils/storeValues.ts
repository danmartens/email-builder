import Values from '../Values';

function storeValues(templateName: string, values: Values) {
  try {
    localStorage.setItem(templateName, JSON.stringify(values.valueOf()));
  } catch (error) {
    console.error(error);
  }
}

export default storeValues;
