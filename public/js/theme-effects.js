document.addEventListener('DOMContentLoaded', () => {
    // 테마 스위치 요소 찾기
    const toggles = {
        nori: document.getElementById('nori-theme-toggle'),
        ruon: document.getElementById('ruon-theme-toggle'),
        lai: document.getElementById('lai-theme-toggle')
    };

    let currentInterval = null;

    // 화면에 있는 모든 파티클 지우기 (테마 변경 시 청소)
    function clearParticles() {
        if (currentInterval) clearInterval(currentInterval);
        document.querySelectorAll('.lemon-particle, .bubble-particle, .petal-particle').forEach(el => el.remove());
    }

    // 🍋 레몬 생성 (Nori)
    function createLemon() {
        const el = document.createElement('div');
        el.classList.add('lemon-particle');
        el.innerText = '🍋';
        const size = Math.random() * 50 + 50; // 50~100px
        el.style.fontSize = size + 'px';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }

    // 🫧 비눗방울 생성 (Ruon)
    function createBubble() {
        const el = document.createElement('div');
        el.classList.add('bubble-particle');
        el.innerText = '🫧';
        const size = Math.random() * 50 + 40; // 40~90px
        el.style.fontSize = size + 'px';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (Math.random() * 3 + 4) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 8000);
    }

    // 🌸 꽃잎 생성 (Lai)
    function createPetal() {
        const el = document.createElement('div');
        el.classList.add('petal-particle');
        el.innerText = '🌸';
        const size = Math.random() * 40 + 30; // 30~70px
        el.style.fontSize = size + 'px';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (Math.random() * 3 + 4) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 7000);
    }

    // 현재 체크된 테마 확인 후 효과 실행
    function updateEffect() {
        clearParticles(); // 기존 효과 멈춤

        if (toggles.nori && toggles.nori.checked) {
            currentInterval = setInterval(createLemon, 300);
        } else if (toggles.ruon && toggles.ruon.checked) {
            currentInterval = setInterval(createBubble, 200);
        } else if (toggles.lai && toggles.lai.checked) {
            currentInterval = setInterval(createPetal, 150);
        }
    }

    // 스위치에 이벤트 리스너 연결
    if (toggles.nori) toggles.nori.addEventListener('change', updateEffect);
    if (toggles.ruon) toggles.ruon.addEventListener('change', updateEffect);
    if (toggles.lai) toggles.lai.addEventListener('change', updateEffect);

    // 페이지 로드 시 바로 실행
    updateEffect();
});
