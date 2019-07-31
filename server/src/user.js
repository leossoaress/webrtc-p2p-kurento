class User{

  constructor(id_, name_, ws_) {
    this.id = id_;
    this.name = name_;
    this.ws = ws_;
  }

  sendMessage(msg) {
    this.ws.send(JSON.stringify(msg));
  }

}

module.exports = User;