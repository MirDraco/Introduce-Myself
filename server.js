const express = require('express');
const compression = require('compression');
const app = express();
const port = 3000;

app.use(compression()); // 데이터 압축 미들웨어 적용
app.use(express.static('public'));
app.use(express.static('public/html', { extensions: ['html'] })); // .html 확장자 생략 가능하게 설정

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

// 404 에러 처리 (맨 마지막에 위치해야 함)
app.use((req, res, next) => {
  res.status(404).send('<h1>404 Not Found</h1><p>페이지를 찾을 수 없습니다.</p>');
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});