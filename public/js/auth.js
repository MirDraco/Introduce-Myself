// Firebase SDK 라이브러리 가져오기 (CDN 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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
                window.location.href = "/"; // 메인 페이지로 이동
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
                    alert("가입은 되었으나 프로필 저장에 실패했습니다.\n원인: " + error.message);
                }
                
                window.location.href = "/"; // 메인 페이지로 이동
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
onAuthStateChanged(auth, async (user) => {
  const authBtn = document.getElementById('auth-btn');
  if (user) {
    console.log("현재 로그인된 유저:", user.email);
    
    // [보안 개선] 소스코드에 이메일을 노출하지 않고, DB의 권한 정보(role)를 확인
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            console.log("관리자 권한이 확인되었습니다. (DB 검증)");
            showAdminButton(); // 관리자 버튼 표시
            enableDeleteButtons(); // 갤러리 삭제 버튼 활성화
        }
    } catch (e) {
        console.error("권한 확인 중 오류:", e);
    }

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

// [UI] 관리자 전용 업로드 버튼 생성 함수
function showAdminButton() {
    // 현재 페이지가 캐릭터 페이지(nori, lai, ruon)가 아니면 버튼을 표시하지 않음
    const path = window.location.pathname;
    if (!path.includes('nori') && !path.includes('lai') && !path.includes('ruon')) {
        return;
    }

    const nav = document.querySelector('.header-nav');
    // 이미 버튼이 있으면 중복 생성 방지
    if (nav && !document.getElementById('admin-upload-btn')) {
        const uploadBtn = document.createElement('a');
        uploadBtn.id = 'admin-upload-btn';
        uploadBtn.textContent = '📷 사진 업로드'; // 카메라 아이콘과 텍스트
        uploadBtn.className = 'nav-button';
        uploadBtn.href = '#'; 
        uploadBtn.style.cursor = 'pointer';
        uploadBtn.style.color = '#ffeb3b'; // 눈에 띄는 노란색
        
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            createUploadModal(); // 모달 생성 (없으면 만듦)
            document.getElementById('upload-modal').style.display = 'flex'; // 모달 열기
        });

        // '로그인' 버튼 앞에 추가 (순서 배치)
        const loginBtn = document.getElementById('auth-btn');
        if (loginBtn) nav.insertBefore(uploadBtn, loginBtn);
        else nav.appendChild(uploadBtn);
        
        // 이미 갤러리가 로드되어 있다면 삭제 버튼 추가
        enableDeleteButtons();
    }
}

// [UI] 업로드 모달창 생성 및 이벤트 처리 함수
function createUploadModal() {
    // 이미 모달이 만들어져 있다면 생성하지 않음
    if (document.getElementById('upload-modal')) return;

    // 모달 HTML 구조 생성 (JS로 동적 삽입)
    const modalHtml = `
        <div id="upload-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; justify-content:center; align-items:center;">
            <div style="background:white; padding:2rem; border-radius:15px; width:90%; max-width:400px; position:relative; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <span id="close-modal" style="position:absolute; top:15px; right:20px; cursor:pointer; font-size:1.5rem; color:#666;">&times;</span>
                <h3 style="margin-top:0; color:#333; text-align:center; margin-bottom:20px;">📷 사진 업로드</h3>
                <form id="upload-form">
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; color:#555; font-size:0.9rem;">이미지 선택</label>
                        <input type="file" id="upload-file" accept="image/*" multiple required style="width:100%; padding:5px; border:1px solid #ddd; border-radius:5px;">
                        <div id="file-name-display" style="margin-top:5px; font-size:0.9rem; color:#4CAF50; font-weight:500;"></div>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; color:#555; font-size:0.9rem;">제목</label>
                        <input type="text" id="upload-title" placeholder="사진 제목을 입력하세요" required style="width:100%; padding:10px; box-sizing:border-box; border:1px solid #ddd; border-radius:5px;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:5px; color:#555; font-size:0.9rem;">설명</label>
                        <textarea id="upload-desc" placeholder="사진에 대한 설명을 입력하세요" rows="3" style="width:100%; padding:10px; box-sizing:border-box; border:1px solid #ddd; border-radius:5px; resize:none;"></textarea>
                    </div>
                    <button type="submit" style="width:100%; padding:12px; background:#333; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.3s;">업로드 하기</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 닫기 버튼 이벤트
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('upload-modal').style.display = 'none';
    });
    
    // 폼 제출(업로드) 이벤트
    document.getElementById('upload-form').addEventListener('submit', handleUpload);

    // 파일 선택 시 파일명 표시 이벤트
    document.getElementById('upload-file').addEventListener('change', (e) => {
        const files = e.target.files;
        const display = document.getElementById('file-name-display');
        if (files.length > 0) {
            display.textContent = `✅ ${files.length}개의 파일이 선택되었습니다.`;
        } else {
            display.textContent = '';
        }
    });
}

// [Logic] 실제 업로드 처리 함수
async function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('upload-file');
    const titleInput = document.getElementById('upload-title');
    const descInput = document.getElementById('upload-desc');
    const files = fileInput.files;
    
    if (files.length === 0) return;

    // 현재 페이지 URL을 보고 어떤 캐릭터인지 판단
    const path = window.location.pathname;
    let character = 'etc';
    if (path.includes('nori')) character = 'nori';
    else if (path.includes('lai')) character = 'lai';
    else if (path.includes('ruon')) character = 'ruon';

    const submitBtn = e.target.querySelector('button');
    
    try {
        // 버튼 비활성화 (중복 클릭 방지)
        submitBtn.disabled = true;

        let successCount = 0;

        // 선택된 모든 파일을 순회하며 업로드
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            submitBtn.textContent = `업로드 중... (${i + 1}/${files.length}) ⏳`;

            // 1. Firebase Storage에 이미지 파일 업로드
            // 경로: images/캐릭터이름/시간_파일명
            const storageRef = ref(storage, `images/${character}/${Date.now()}_${file.name}`);
            
            // uploadBytesResumable을 사용하지만, 여러 개일 때는 개별 진행률보다 전체 진행 상황(몇 번째 파일인지)을 보여주는 게 더 직관적임
            // 여기서는 await로 순차 처리하여 안정성을 높임
            const uploadTask = uploadBytesResumable(storageRef, file);

            // 업로드 완료 대기 (Promise 래핑)
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed', 
                    null, // 진행률 콜백 생략 (버튼 텍스트로 전체 진행상황 표시 중)
                    (error) => reject(error),
                    () => resolve()
                );
            });
            
            // 다운로드 URL 가져오기
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // 2. Firestore Database에 정보 저장
            // 컬렉션: gallery
            await addDoc(collection(db, "gallery"), {
                character: character,     // 어느 캐릭터 갤러리인지 구분
                title: titleInput.value,  // 제목 (모든 파일 공통)
                description: descInput.value, // 설명 (모든 파일 공통)
                imageUrl: downloadURL,    // 이미지 주소
                createdAt: new Date()     // 올린 시간
            });
            
            successCount++;
        }

        alert(`총 ${successCount}장의 사진 업로드 성공! 🎉`);
        document.getElementById('upload-modal').style.display = 'none';
        e.target.reset(); // 입력창 초기화
        document.getElementById('file-name-display').textContent = ''; // 파일명 표시 초기화
        loadGalleryImages(); // 갤러리 새로고침 (새 사진 바로 표시)

    } catch (error) {
        console.error("Upload failed:", error);
        alert('업로드 실패 😭: ' + error.message);
    } finally {
        // 버튼 상태 복구
        submitBtn.disabled = false;
        submitBtn.textContent = '업로드 하기';
    }
}

// [UI] 갤러리 이미지 불러오기 함수
async function loadGalleryImages() {
    const path = window.location.pathname;
    let character = '';
    if (path.includes('nori')) character = 'nori';
    else if (path.includes('lai')) character = 'lai';
    else if (path.includes('ruon')) character = 'ruon';

    // 캐릭터 페이지가 아니면 실행하지 않음
    if (!character) return;

    const container = document.querySelector('.picture-container');
    if (!container) return;

    try {
        // Firestore에서 해당 캐릭터의 이미지 데이터를 최신순으로 가져오기
        // 주의: 콘솔에 'index creation' 에러가 뜨면 링크를 클릭해서 인덱스를 만들어야 합니다.
        const q = query(
            collection(db, "gallery"),
            where("character", "==", character),
            orderBy("createdAt", "asc")
        );

        const querySnapshot = await getDocs(q);

        // 기존 갤러리 초기화 (중복 방지 및 최신화)
        container.innerHTML = '';

        if (querySnapshot.empty) {
            console.log("데이터베이스에 저장된 사진이 없습니다.");
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // HTML 요소 생성
            const div = document.createElement('div');
            div.className = 'picture-item';
            div.style.position = 'relative'; // 삭제 버튼 위치 잡기 위해 추가
            div.dataset.id = doc.id; // 문서 ID 저장 (삭제 시 필요)
            div.dataset.imageUrl = data.imageUrl; // 이미지 URL 저장
            
            // Lightbox 속성 적용
            const link = document.createElement('a');
            link.href = data.imageUrl;
            link.setAttribute('data-lightbox', `${character}-gallery`);
            link.setAttribute('data-title', data.title || ''); // 제목이 있으면 표시
            
            const img = document.createElement('img');
            img.src = data.imageUrl;
            img.loading = 'lazy';
            img.alt = data.description || `${character} illustration`;

            link.appendChild(img);
            div.appendChild(link);
            
            // 갤러리 끝에 추가 (쿼리 순서 유지: 최신순)
            container.appendChild(div);
        });
        
        // 관리자라면 삭제 버튼 추가
        if (document.getElementById('admin-upload-btn')) {
            enableDeleteButtons();
        }

    } catch (error) {
        console.error("갤러리 불러오기 실패:", error);
        // 인덱스 에러가 발생하면 사용자에게 알림
        if (error.message.includes("index")) {
            alert("⚠️ 사진을 불러오려면 '인덱스' 설정이 필요합니다!\n\n1. 키보드의 F12 키를 눌러 개발자 도구를 엽니다.\n2. 'Console' 탭을 클릭합니다.\n3. 빨간색 에러 메시지에 있는 긴 링크를 클릭하세요.\n4. Firebase 콘솔이 열리면 '인덱스 만들기' 버튼을 누르세요.");
        }
    }
}

// [UI] 삭제 버튼 활성화 함수
function enableDeleteButtons() {
    const items = document.querySelectorAll('.picture-item');
    items.forEach(item => {
        // [안전장치] DB ID가 없는(하드코딩된) 이미지는 삭제 버튼을 달지 않음
        if (!item.dataset.id) return;

        // 이미 삭제 버튼이 있으면 패스
        if (item.querySelector('.delete-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.innerHTML = '&times;'; // X 표시
        btn.title = '사진 삭제';
        
        // 스타일 설정 (CSS 파일에 넣어도 됨)
        Object.assign(btn.style, {
            position: 'absolute', top: '5px', right: '5px',
            background: 'red', color: 'white', border: 'none',
            borderRadius: '50%', width: '25px', height: '25px',
            cursor: 'pointer', fontSize: '16px', lineHeight: '25px',
            zIndex: '10', display: 'flex', justifyContent: 'center', alignItems: 'center'
        });

        btn.addEventListener('click', async (e) => {
            e.preventDefault(); // 링크 이동 방지
            if (!confirm('정말 이 사진을 삭제하시겠습니까?')) return;

            // [강력 삭제 모드]
            // 1. 일단 화면에서 먼저 지워버립니다. (사용자 눈에 안 보이게)
            item.remove();

            const docId = item.dataset.id;
            const imageUrl = item.dataset.imageUrl;

            // 2. 데이터베이스(Firestore) 삭제 시도
            try {
                await deleteDoc(doc(db, "gallery", docId));
                console.log("데이터베이스 삭제 성공");
            } catch (dbError) {
                console.error("데이터베이스 삭제 실패:", dbError);
                alert("화면에서는 지웠지만, 데이터베이스 삭제에 실패했습니다. (새로고침 시 다시 나타날 수 있음)\n원인: " + dbError.message);
            }

            // 3. 스토리지(Storage) 파일 삭제 시도 (실패해도 무시)
            try {
                if (imageUrl) {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                    console.log("이미지 파일 삭제 성공");
                }
            } catch (storageError) {
                console.log("이미지 파일이 없거나 삭제 실패 (무시함):", storageError);
            }
        });

        item.appendChild(btn);
    });
}

// 페이지 로드 시 갤러리 불러오기 실행
loadGalleryImages();