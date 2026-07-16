const {Sequelize} = require('sequelize');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = sequelize;
