@echo off
set NODE_ENV=development
set DATABASE_URL=postgresql://postgres:28e03dbc9239d902ad90918598db3f8f@localhost:5432/weddingdaypro
set PORT=3000
set HOST=localhost
tsx server/index.ts 