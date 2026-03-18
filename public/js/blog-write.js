import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { imageCompression } from "https://www.npmjs.com/package/image-compression";

const firebaseConfig = {
  apiKey: "AIzaSyBwPmTcn27A7KAkU7Cwe0xqIrJHZKPbLWU",
  authDomain: "mirdraco-dev.firebaseapp.com",
  projectId: "mirdraco-dev",
  storageBucket: "mirdraco-dev.firebasestorage.app",
  messagingSenderId: "748307894543",
  appId: "1:748307894543:web:4d03c279d8ef484e50ae7a",
  measurementId: "G-92V7TNQWRJ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 권한 체크 (여기서는 임시로 로그인되어 있고 권한이 있는지 확인 구조만 잡습니다)
let currentUserInfo = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUserInfo = userDoc.data();
        // admin 권한이 아니라면 막을 수 있음
        // if(currentUserInfo.role !== 'admin') { ... }
      }
    } catch (e) {
      console.log("Error fetching user data", e);
    }
  } else {
    alert("로그인이 필요합니다.");
    window.location.href = "/login";
  }
});

const form = document.getElementById("blog-write-form");
const submitBtn = document.getElementById("submit-btn");
const fileInput = document.getElementById("post-image");
const fileNameDisplay = document.getElementById("file-name-display");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  const file = fileInput.files[0];

  if (!currentUserInfo) {
    alert("사용자 정보를 불러오는 중이거나 권한이 없습니다.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "작업 진행 중...";

  try {
    let imageUrl = null;

    // 이미지가 첨부된 경우
    if (file) {
      submitBtn.textContent = "이미지 압축 중...";

      // 이미지 압축 옵션 설정
      const options = {
        maxSizeMB: 1, // 최대 허용 메가바이트 크기 (예: 1MB)
        maxWidthOrHeight: 1280, // 최대 해상도 넓이나 높이
        useWebWorker: true,
      };

      try {
        // 이미지를 압축된 파일로 변환 (압축 라이브러리 사용)
        file = await imageCompression(file, options);
      } catch (error) {
        console.warn("이미지 압축 실패, 원본 이미지로 진행합니다.", error);
      }

      submitBtn.textContent = "업로드 중...";

      // 압축된 'file'을 Firebase Storage에 업로드
      const pathString = `blog_images/${Date.now()}_${file.name}`;
      const FileRef = ref(storage, pathString);
      const uploadTask = await uploadBytesResumable(FileRef, file);
      imageUrl = await getDownloadURL(uploadTask.ref);
    }

    // Firestore에 게시물 데이터 저장 (기존과 동일)
    const postData = {
      title: title,
      content: content,
      imageUrl: imageUrl, // 이미지가 없으면 null
      imagePath: pathString, // <--- 이 부분을 추가하여 Storage 파일 경로 저장
      author: currentUserInfo.nickname || currentUserInfo.email,
      authorId: auth.currentUser.uid,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "posts"), postData);

    alert("글이 성공적으로 등록되었습니다!");
    window.location.href = "/blog"; // 등록 후 블로그 목록 페이지로 이동
  } catch (error) {
    console.error("Error adding post: ", error);
    alert("글 둥록 중 오류가 발생했습니다: " + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "글 등록하기";
  }
});

// 파일이 선택될 때마다 파일 이름을 text에 표시합니다.
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameDisplay.textContent = file.name;
  } else {
    fileNameDisplay.textContent = "선택된 파일 없음";
  }
});
