
rm -rvf ./static/*

cp -v client/public/global.css ./static/
# cp client/public/index.html ./templates/
cp -rv client/public/build/ ./static/
