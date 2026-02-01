// Firebase SDK 라이브러리 가져오기 (CDN 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// TODO: Firebase 콘솔에서 발급받은 설정값으로 교체해야 합니다.
const firebaseConfig = {
  apiKey: "AIzaSyBwPmTcn27A7KAkU7Cwe0xqIrJHZKPbLWU",
  authDomain: "mirdraco-dev.firebaseapp.com",
  projectId: "mirdraco-dev",
  storageBucket: "mirdraco-dev.firebasestorage.app",
  messagingSenderId: "748307894543",
  appId: "1:748307894543:web:4d03c279d8ef484e50ae7a",
  measurementId: "G-92V7TNQWRJ"
};


// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // 데이터베이스 초기화
const storage = getStorage(app); // 스토리지 초기화

// 로그인 폼 이벤트 리스너
const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMessage');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // 로그인 성공
                const user = userCredential.user;
                alert(user.email + '님 환영합니다!');
                window.location.href = '../index.html'; // 메인 페이지로 이동
            })
            .catch((error) => {
                // 로그인 실패
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Login Error:", errorCode, errorMessage);
                
                if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                    errorMsg.textContent = "비밀번호가 틀렸거나 존재하지 않는 사용자입니다.";
                } else if (errorCode === 'auth/too-many-requests') {
                    errorMsg.textContent = "접속 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
                } else {
                    errorMsg.textContent = "로그인 실패: " + errorMessage;
                }
            });
    });
}

// 회원가입 폼 이벤트 리스너
const signupForm = document.getElementById('signupForm');
const signupErrorMsg = document.getElementById('signupErrorMessage');

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const nickname = document.getElementById('signup-nickname').value;
        const password = document.getElementById('signup-password').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // 가입 성공
                const user = userCredential.user;
                
                // Firestore에 유저 정보 저장
                try {
                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        nickname: nickname,
                        role: 'user', // 기본 권한은 user, 관리자는 나중에 DB에서 직접 admin으로 변경
                        createdAt: new Date()
                    });
                    alert('회원가입이 완료되었습니다!\n' + nickname + '님 환영합니다.\n[확인]을 누르면 메인 페이지로 이동합니다.');
                } catch (error) {
                    console.error("유저 정보 저장 실패:", error);
                    alert("가입은 되었으나 프로필 저장에 실패했습니다.");
                }
                
                window.location.href = '../index.html'; // 메인 페이지로 이동
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Signup Error:", errorCode, errorMessage);
                
                if (errorCode === 'auth/email-already-in-use') {
                    signupErrorMsg.textContent = "이미 사용 중인 이메일입니다.";
                } else if (errorCode === 'auth/weak-password') {
                    signupErrorMsg.textContent = "비밀번호는 6자리 이상이어야 합니다.";
                } else {
                    signupErrorMsg.textContent = "회원가입 실패: " + errorMessage;
                }
            });
    });
}

// 현재 로그인 상태 확인 (필요 시 다른 페이지에서도 사용 가능)
onAuthStateChanged(auth, (user) => {
  const authBtn = document.getElementById('auth-btn');
  if (user) {
    console.log("현재 로그인된 유저:", user.email);
    if (authBtn) {
      authBtn.textContent = '로그아웃';
      authBtn.href = '#'; // 로그아웃 시에는 페이지 이동 방지
    }
  } else {
    console.log("로그아웃 상태입니다.");
    if (authBtn) {
      authBtn.textContent = '로그인';
      // 로그아웃 상태일 때는 HTML에 적힌 href(로그인 페이지 이동)가 작동합니다.
    }
  }
});

// 로그아웃 버튼 클릭 이벤트 처리
const authBtn = document.getElementById('auth-btn');
if (authBtn) {
    authBtn.addEventListener('click', (e) => {
        // 로그인 상태일 때만 로그아웃 동작 수행
        if (auth.currentUser) {
            e.preventDefault(); // 기본 링크 이동 막기
            signOut(auth).then(() => {
                alert('로그아웃 되었습니다.');
                window.location.reload(); // 페이지 새로고침하여 상태 반영
            }).catch((error) => {
                console.error("로그아웃 실패:", error);
            });
        }
    });
}