#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 打包
npm run build

git add .
git commit -m 'release'
git push
git checkout master
git merge dev
git push

npm publish -access public

cd -