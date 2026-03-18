/* === js/blog.js 맨 윗부분 교체 코드 === */
import { getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// auth.js에서 이미 초기화된 앱을 가져옵니다
const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// 로그인 상태 체크하여 글쓰기 버튼 표시 (이하 기존 코드 그대로 유지)
onAuthStateChanged(auth, async (user) => {
  const writeBtn = document.getElementById("write-btn");
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userInfo = userDoc.data();
        if (userInfo.role === "admin" || true) {
          // 원래는 userInfo.role === 'admin'
          writeBtn.style.display = "inline-block";
        }
      } else {
        writeBtn.style.display = "inline-block";
      }
    } catch (e) {
      console.log("Error checking user role:", e);
    }
  }
});

async function loadPosts() {
  const postContainer = document.getElementById("post-grid-container");

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    postContainer.innerHTML = ""; // 로딩 메시지 지우기

    if (querySnapshot.empty) {
      postContainer.innerHTML =
        '<p style="grid-column: 1 / -1; text-align: center; padding: 2rem;">아직 작성된 글이 없습니다.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const dateStr = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : "";
      const summary = post.content.length > 50 ? post.content.substring(0, 50) + "..." : post.content;

      const imgHtml = post.imageUrl
        ? `<div class="post-image" style="background-image: url('${post.imageUrl}'); background-size: cover; background-position: center;"></div>`
        : `<div class="post-image" style="background-color: #e0f2f1; color: darkblue;"><i class="fa-solid fa-file-alt"></i></div>`;

      const html = `
        <article class="post-card">
          ${imgHtml}
          <div class="post-content">
            <span class="post-date">${dateStr}</span>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-excerpt">${summary}</p>
            <a href="/blog-post?id=${doc.id}" class="read-more">더 읽기 →</a>
          </div>
        </article>
      `;
      postContainer.innerHTML += html;
    });
  } catch (error) {
    console.error("포스트를 불러오는 중 오류 발생:", error);
    postContainer.innerHTML = '<p style="color: red; padding: 2rem;">글을 불러오는데 실패했습니다.</p>';
  }
}

// 화면이 열리면 바로 로드 시작
loadPosts();
