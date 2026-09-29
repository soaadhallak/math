nvm use 22
cd deploy 
docker compose up -d
cd ..
npm install
cd website
npm install
npm run prisma:reset
npm run prisma:generate
npm run prisma:seed

npm run dev