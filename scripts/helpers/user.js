module.exports = function generateRandomId() {
  let randomId = Math.random().toString(36).substring(5);
  return randomId;
}

module.exports = function createNewUser(username, email, password) {
  let userId = generateRandomId();
  let encryptedPassword = bcrypt.hashSync(password, 10);
  let user;

  user = {
    user_id: userId,
    username: username,
    email: email,
    password: encryptedPassword
  }

  return user;
}