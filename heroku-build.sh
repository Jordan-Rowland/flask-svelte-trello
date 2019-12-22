
cd client/
npm run build
cd ..

rm -rvf ./static/*

# cp client/public/index.html ./templates/
cp -v client/public/global.css ./static/
cp -rv client/public/build/ ./static/
