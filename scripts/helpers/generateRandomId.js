module.exports = function generateRandomId() {
  let randomId = Math.random().toString(36).substring(5);
  return randomId;
}