#!/bin/bash

# 프로젝트 루트 디렉토리
ROOT_DIR=$(pwd)

# MongoDB Atlas 설정
echo "MongoDB Atlas 계정이 필요합니다. 없다면 https://www.mongodb.com/cloud/atlas에서 무료로 만드세요."
echo "MongoDB Atlas 연결 URL을 입력하세요 (mongodb+srv://...): "
read MONGODB_URI

# 클라우드타입 설정 파일 업데이트
sed -i "s|mongodb+srv://iverson7454:y7QPA7yCFJOPvOlf@jong9.h96iyai.mongodb.net/?retryWrites=true&w=majority&appName=jong9|$MONGODB_URI|g" cloudtype.json

# 백엔드 디렉토리 설정
echo "백엔드 설정..."
cd $ROOT_DIR/backend
npm install

# 프론트엔드 디렉토리 설정
echo "프론트엔드 설정..."
cd $ROOT_DIR/frontend
npm install
npm run build

# Git 설정
cd $ROOT_DIR
git init
git add .
git commit -m "Initial commit for CloudType deployment"

echo "===================================="
echo "프로젝트 설정이 완료되었습니다!"
echo "이제 다음 단계에 따라 클라우드타입에 배포하세요:"
echo "1. 클라우드타입(https://cloudtype.io/)에 로그인"
echo "2. '새 프로젝트 생성' 클릭"
echo "3. GitHub 연동 및 리포지토리 선택"
echo "4. cloudtype.json 파일이 자동으로 인식되어 서비스 설정"
echo "5. '배포하기' 버튼 클릭"
echo "===================================="