require("dotenv").config();

const knex = require('knex')({
    client: 'pg',
    version: '14.2',
    connection: {
      host : `${process.env.DATABASE_HOST}`,
      port : process.env.DATABASE_PORT,
      user :  `${process.env.DATABASE_USER}`,
      password :  `${process.env.DATABASE_PASS}`,
      database :  `${process.env.DATABASE_NAME}`,
    }
  });
  module.exports = knex;