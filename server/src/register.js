class RegisterSystem {
  
  constructor() {
    this.usersID = {};
    this.usersName = {};
  }
  
  registerUser(user) {
    this.usersID[user.id] = user;
    this.usersName[user.name] = user;
  }

  getUserByID(id) {
    return this.usersID[id];
  }

  getUserByName(name) {
    return this.usersName[name];
  }

}

module.exports = RegisterSystem;