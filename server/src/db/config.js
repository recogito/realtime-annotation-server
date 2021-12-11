import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  db: process.env.DB_NAME
}

export default CONFIG;