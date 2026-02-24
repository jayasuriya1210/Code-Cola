const db = require("../config/db");

const User = {
  create: (name, email, password) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        }
      );
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT id, name, email FROM users WHERE id = ?", [id], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
  },
};

module.exports = User;
