import { getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 현재 접속자 정보를 담을 변수
let currentUserInfo = null;

// [1] 로그인 한 사용자 정보 가져오기
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUserInfo = { uid: user.uid, ...userDoc.data() };
      }
    } catch (e) {
      console.error("유저 정보 확인 오류:", e);
    }
  }
  // 유저 정보 확인이 끝난 후 게시글 로딩을 시작합니다.
  loadPost();
});

// [2] 게시글 불러오기 및 렌더링
async function loadPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  const loadingDiv = document.getElementById("post-loading");
  const articleDiv = document.getElementById("single-post-article");

  if (!postId) {
    loadingDiv.textContent = "게시글 ID가 잘못되었거나 존재하지 않습니다.";
    return;
  }

  try {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const postData = docSnap.data();

      document.getElementById("post-title").textContent = postData.title;
      document.getElementById("post-author").textContent = `By ${postData.author || "익명"}`;

      if (postData.createdAt) {
        const date = new Date(postData.createdAt.seconds * 1000);
        document.getElementById("post-date").textContent = date.toLocaleDateString();
      }

      document.getElementById("post-content").textContent = postData.content;

      if (postData.imageUrl) {
        document.getElementById("post-image-container").innerHTML =
          `<img src="${postData.imageUrl}" style="max-width:100%; border-radius: 8px;">`;
      }

      document.title = `${postData.title} - Mir's Blog`;

      loadingDiv.style.display = "none";
      articleDiv.style.display = "block";

      // 렌더링 완료 후 삭제 버튼 권한 체크!
      setupDeleteButton(postId, postData);
    } else {
      loadingDiv.textContent = "찾으시는 게시글이 없습니다.";
    }
  } catch (error) {
    console.error("게시물 로드 에러:", error);
    loadingDiv.textContent = "게시글을 불러오는 도중 오류가 발생했습니다.";
  }
}

// [3] 삭제 버튼 기능 세팅 (작성자 또는 관리자 여부 판별)
function setupDeleteButton(postId, postData) {
  const deleteBtn = document.getElementById("delete-post-btn");
  if (!deleteBtn) return;

  // 로그인 되어 있고, 현재 유저가 어드민('admin')이거나 글 작성자일 때
  const isAuthorized =
    currentUserInfo && (currentUserInfo.role === "admin" || currentUserInfo.uid === postData.authorId);

  if (isAuthorized) {
    deleteBtn.style.display = "inline-block"; // 버튼 활성화

    deleteBtn.addEventListener("click", async () => {
      const confirmDelete = confirm("정말로 이 글을 삭제하시겠습니까? (첨부된 이미지도 삭제됩니다)");
      if (!confirmDelete) return;

      deleteBtn.disabled = true;
      deleteBtn.textContent = "삭제 중...";

      try {
        // (가변) blog-write.js에서 저장했던 imagePath가 있을 경우 스토리지 이미지 삭제
        if (postData.imagePath) {
          const imgRef = storageRef(storage, postData.imagePath);
          await deleteObject(imgRef).catch((err) => {
            console.warn("스토리지 이미지 삭제 실패(이미지가 없을지도):", err);
          });
        }

        // Firestore 해당 글 데이터 삭제
        await deleteDoc(doc(db, "posts", postId));

        alert("게시글이 삭제되었습니다.");
        window.location.href = "/blog"; // 블로그 목록으로 이동
      } catch (error) {
        console.error("삭제 중 오류 발생:", error);
        alert("글 삭제에 실패했습니다.");
        deleteBtn.disabled = false;
        deleteBtn.textContent = "🗑️ 이 글 삭제하기";
      }
    });
  } else {
    deleteBtn.style.display = "none"; // 권한이 없으면 숨김
  }
}
