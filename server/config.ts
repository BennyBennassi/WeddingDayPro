export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  database: {
    url: process.env.DATABASE_URL
  },
  email: {
    sendgridKey: process.env.SENDGRID_API_KEY || ''
  }
}; 