import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Link } from '../links/entities/link.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'link_tracker',
  entities: [Link],
  migrations: ['src/database/migrations/*.ts'],
});
