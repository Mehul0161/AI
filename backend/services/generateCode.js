const { modelSwitch } = require('./modelSwitch');

async function generateCode({ prompt, technology, model }) {
  // modelSwitch will handle which AI model to use
  return await modelSwitch({ prompt, technology, model });
}

module.exports = { generateCode }; 