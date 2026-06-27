cd C:\Fady\svn\R_D\Projects\Vibe\Gemeni\20251224_PriceCalulator\Github\WebsiteCalculator_UserLogin\WebsiteCalculator_UseLogin



npm install
npm run build
------- pm2/IIS-----------
npm install -g pm2 pm2-windows-service
pm2 start dist/server.cjs --name "website-calculator"
pm2 save
pm2-service-install -y
----------------
nssm install website-calculator
# Set the following fields in the GUI:
# Path: C:\Program Files\nodejs\node.exe (or your Node.exe path).
# Startup directory: C:\inetpub\website-calculator
# Arguments: dist/server.cjs
# ------------------
npm run dev


cd C:\Fady\root\order.itspark-eg.com\website-calculator_users
yarn build
yarn dev --port 4000

pause
