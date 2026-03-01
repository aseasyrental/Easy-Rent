// Example model definition
// This is a template for defining database models

export class User {
  constructor(id, name, email, password, createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.createdAt = createdAt;
  }

  static tableName = 'users';

  static schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export class Property {
  constructor(id, title, description, price, owner_id, createdAt) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.price = price;
    this.owner_id = owner_id;
    this.createdAt = createdAt;
  }

  static tableName = 'properties';

  static schema = `
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export class Booking {
  constructor(id, property_id, user_id, check_in, check_out, status) {
    this.id = id;
    this.property_id = property_id;
    this.user_id = user_id;
    this.check_in = check_in;
    this.check_out = check_out;
    this.status = status;
  }

  static tableName = 'bookings';

  static schema = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}
