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

const form = document.getElementById("blog-write-form");
const submitBtn = document.getElementById("submit-btn");
const fileInput = document.getElementById("post-image");
const fileNameDisplay = document.getElementById("file-name-display");
const authStatus = document.getElementById("auth-status");

let currentUser = null;
let currentUserInfo = null;
let authReady = false;

function setWriteAccess(enabled) {
  const controls = form.querySelectorAll("input, textarea, button");
  controls.forEach((control) => {
    control.disabled = !enabled;
  });
}

function setAuthStatus(message, state = "checking") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.dataset.state = state;
}

setWriteAccess(false);
setAuthStatus("로그인 상태 확인 중...");

// 인증 콜백이 오지 않는 경우에도 무한 대기처럼 보이지 않도록 상태를 갱신
window.setTimeout(() => {
  if (!authReady) {
    setAuthStatus("로그인 상태 확인이 지연되고 있습니다. 새로고침 후 다시 시도해 주세요.", "required");
  }
}, 5000);

onAuthStateChanged(auth, async (user) => {
  authReady = true;

  if (!user) {
    currentUser = null;
    currentUserInfo = null;
    setWriteAccess(false);
    setAuthStatus("로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다.", "required");

    window.setTimeout(() => {
      window.location.replace("/login");
    }, 1200);
    return;
  }

  currentUser = user;
  currentUserInfo = { email: user.email || "" };

  // 로그인 확인 즉시 글쓰기 기능을 열고, 상세 프로필은 뒤에서 보강
  const initialDisplayName = user.email || "사용자";
  setAuthStatus(`${initialDisplayName} 계정으로 로그인되어 있습니다. 글 작성이 가능합니다.`, "ok");
  setWriteAccess(true);

  try {
    const userDoc = await Promise.race([
      getDoc(doc(db, "users", user.uid)),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("profile-timeout")), 2500)),
    ]);

    if (userDoc.exists()) {
      currentUserInfo = userDoc.data();
      const displayName = currentUserInfo.nickname || user.email || "사용자";
      setAuthStatus(`${displayName}님 로그인됨. 글 작성이 가능합니다.`, "ok");
    }
  } catch (e) {
    console.log("Error fetching user data", e);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!authReady || !currentUser) {
    alert("로그인한 사용자만 글을 등록할 수 있습니다.");
    return;
  }

  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  const file = fileInput.files[0];

  submitBtn.disabled = true;
  submitBtn.textContent = "작업 진행 중...";

  try {
    let imageUrl = null;
    let imagePath = null;

    // 이미지가 첨부된 경우
    if (file) {
      submitBtn.textContent = "이미지 압축 중...";

      // 이미지 압축 옵션 설정
      const options = {
        maxSizeMB: 1, // 최대 허용 메가바이트 크기 (예: 1MB)
        maxWidthOrHeight: 1280, // 최대 해상도 넓이나 높이
        useWebWorker: true,
      };

      let uploadFile = file;

      try {
        // UMD 전역 함수가 있으면 압축하고, 없으면 원본 파일을 그대로 사용
        if (window.imageCompression) {
          uploadFile = await window.imageCompression(file, options);
        }
      } catch (error) {
        console.warn("이미지 압축 실패, 원본 이미지로 진행합니다.", error);
      }

      submitBtn.textContent = "업로드 중...";

      // 압축된 파일(또는 원본 파일)을 Firebase Storage에 업로드
      imagePath = `blog_images/${Date.now()}_${uploadFile.name}`;
      const fileRef = ref(storage, imagePath);
      const uploadTask = await uploadBytesResumable(fileRef, uploadFile);
      imageUrl = await getDownloadURL(uploadTask.ref);
    }

    // Firestore에 게시물 데이터 저장 (기존과 동일)
    const postData = {
      title: title,
      content: content,
      imageUrl: imageUrl, // 이미지가 없으면 null
      imagePath: imagePath, // Storage 파일 경로 저장
      author: currentUserInfo.nickname || currentUser.email,
      authorId: currentUser.uid,
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
