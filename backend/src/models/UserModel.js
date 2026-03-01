import db from '../config/database.js';

export class UserModel {
  static async create({ name, email, password, role = 'tenant', phone = null }) {
    return db.one(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, password, role, phone]
    );
  }

  static async findByEmail(email) {
    return db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  }

  static async findById(id) {
    return db.oneOrNone(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [id]
    );
  }
}
