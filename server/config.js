import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4173),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://lingoflow:lingoflow_dev@localhost:5432/lingoflow',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  demoUserId: process.env.DEMO_USER_ID || '11111111-1111-4111-8111-111111111111',
  nodeEnv: process.env.NODE_ENV || 'development'
};
