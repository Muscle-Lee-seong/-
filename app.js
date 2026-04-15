// 1. PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// 2. 탭(네비게이션) 전환 로직
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    function switchTab(targetId) {
        // 모든 뷰 숨기기
        viewSections.forEach(section => {
            section.classList.remove('active');
        });
        // 모든 네비게이션 활성화 해제
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // 타겟 뷰 보이기
        const targetView = document.getElementById(targetId);
        if(targetView) targetView.classList.add('active');

        // 타겟 네비게이션 활성화
        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if(targetNav) targetNav.classList.add('active');
    }

    // 네비게이션 클릭 이벤트 바인딩
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            switchTab(target);
        });
    });

    // 전역에서 호출 가능하게 노출
    window.switchTab = switchTab;

    // Admin Toggle Logic
    let isAdmin = false;
    window.toggleAdmin = () => {
        if (!isAdmin) {
            const pwd = prompt("교역자 비밀번호를 입력해주세요 (예: 1234)");
            if (pwd === "1234") {
                isAdmin = true;
                document.body.classList.add('admin-mode');
                document.getElementById('admin-login-btn').setAttribute('name', 'lock-open-outline');
                document.getElementById('admin-login-btn').style.color = 'var(--primary-color)';
                alert("교역자 모드가 활성화되었습니다. 숨겨진 메뉴가 표시됩니다.");
            } else if (pwd !== null) {
                alert("비밀번호가 일치하지 않습니다.");
            }
        } else {
            isAdmin = false;
            document.body.classList.remove('admin-mode');
            document.getElementById('admin-login-btn').setAttribute('name', 'lock-closed-outline');
            document.getElementById('admin-login-btn').style.color = 'var(--text-muted)';
            
            // 만약 현재 교역자 메뉴라면 홈으로 이동
            const navMembers = document.getElementById('nav-members');
            if (navMembers && navMembers.classList.contains('active')) {
                switchTab('view-home');
            }
            alert("교역자 모드가 해제되었습니다.");
        }
    };

    // 3. 인원 관리 가짜 데이터(Mock Data) 로드 및 렌더링
    const mockMembers = [
        { id: 1, name: '김이음', grade: '1', present: false },
        { id: 2, name: '박가야', grade: '1', present: false },
        { id: 3, name: '이지수', grade: '2', present: false },
        { id: 4, name: '최현우', grade: '2', present: false },
        { id: 5, name: '정하늘', grade: '3', present: false },
    ];

    const memberListEl = document.getElementById('member-list');
    const attCountEl = document.getElementById('att-count');
    const classFilter = document.getElementById('class-filter');

    function renderMembers() {
        memberListEl.innerHTML = '';
        let presentCount = 0;
        const filterVal = classFilter.value;

        mockMembers.forEach(member => {
            if (filterVal !== 'all' && member.grade !== filterVal) return;

            if(member.present) presentCount++;

            const li = document.createElement('li');
            li.className = 'member-item';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'member-info';
            infoDiv.innerHTML = `<h4>${member.name}</h4><p>중학교 ${member.grade}학년</p>`;

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '6px';
            actionsDiv.style.width = '100%';
            actionsDiv.style.justifyContent = 'center';

            const delBtn = document.createElement('button');
            delBtn.className = 'btn outline admin-only';
            delBtn.style.padding = '6px';
            delBtn.style.margin = '0';
            delBtn.style.flex = '0 0 auto';
            delBtn.style.border = '1px solid #ff4d4d';
            delBtn.style.borderRadius = '8px';
            delBtn.style.color = '#ff4d4d';
            delBtn.style.minWidth = '38px';
            delBtn.innerHTML = '<ion-icon name="trash"></ion-icon>';
            delBtn.onclick = () => {
                if(confirm(`${member.name} 학생을 삭제하시겠습니까?`)) {
                    const idx = mockMembers.findIndex(m => m.id === member.id);
                    if(idx > -1) mockMembers.splice(idx, 1);
                    renderMembers();
                }
            };

            const btn = document.createElement('button');
            btn.className = `att-btn ${member.present ? 'present' : 'absent'} admin-only`;
            btn.innerText = member.present ? '출석' : '결석';
            btn.style.flex = '1';
            btn.onclick = () => {
                if(!isAdmin) return;
                member.present = !member.present;
                renderMembers(); // 상태 변경 후 다시 렌더링
            };
            
            actionsDiv.appendChild(delBtn);
            actionsDiv.appendChild(btn);

            li.appendChild(infoDiv);
            li.appendChild(actionsDiv);
            memberListEl.appendChild(li);
        });

        // 카운트 업데이트
        attCountEl.innerText = mockMembers.filter(m => m.present).length;
    }

    // 초기 렌더링
    renderMembers();

    // 필터 변경 시 재렌더링
    classFilter.addEventListener('change', renderMembers);

    // 4. 모달 및 추가 기능
    const modal = document.getElementById('add-student-modal');
    const nameInput = document.getElementById('new-student-name');
    const gradeInput = document.getElementById('new-student-grade');

    window.openAddStudentModal = () => {
        nameInput.value = '';
        gradeInput.value = '1';
        modal.classList.add('active');
    };

    window.closeAddStudentModal = () => {
        modal.classList.remove('active');
    };

    window.submitAddStudent = () => {
        const name = nameInput.value.trim();
        const grade = gradeInput.value;
        if (!name) {
            alert('이름을 입력해주세요.');
            return;
        }

        const newId = mockMembers.length > 0 ? Math.max(...mockMembers.map(m => m.id)) + 1 : 1;
        mockMembers.push({
            id: newId,
            name: name,
            grade: grade,
            present: false
        });

        alert(`${name} 학생이 추가되었습니다.`);
        closeAddStudentModal();
        renderMembers(); // 목록 새로고침
    };

    // 5. 찬양 로직 및 모달
    const mockPraises = [
        { id: 1, title: '제이어스(J-US) - Love Never Fails', videoId: 'B_wH-e8E6m0' }
    ];
    const praiseListEl = document.getElementById('praise-list');
    
    function extractVideoId(url) {
        let videoId = null;
        try {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(new URL(url).search);
                videoId = urlParams.get('v');
            } else if (url.includes('youtube.com/shorts/')) {
                videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
            }
        } catch(e) {}
        return videoId;
    }

    function renderPraises() {
        praiseListEl.innerHTML = '';
        if (mockPraises.length === 0) {
            praiseListEl.innerHTML = '<p style="color:#777; font-size:0.85rem;">등록된 찬양이 없습니다.</p>';
            return;
        }

        mockPraises.forEach(praise => {
            const div = document.createElement('div');
            div.className = 'praise-item';
            div.style.marginBottom = '20px';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <p style="margin: 0; font-weight: 600;">▶ ${praise.title}</p>
                    <ion-icon name="trash-outline" class="admin-only" style="color: #ff4d4d; cursor: pointer; font-size: 1.2rem;" onclick="deletePraise(${praise.id})"></ion-icon>
                </div>
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${praise.videoId}" allowfullscreen></iframe>
                </div>
            `;
            praiseListEl.appendChild(div);
        });
    }
    renderPraises();

    window.deletePraise = (id) => {
        if (confirm('이 찬양 영상을 삭제하시겠습니까?')) {
            const idx = mockPraises.findIndex(p => p.id === id);
            if (idx > -1) {
                mockPraises.splice(idx, 1);
                renderPraises();
            }
        }
    };

    const praiseModal = document.getElementById('add-praise-modal');
    const praiseTitleInput = document.getElementById('new-praise-title');
    const praiseUrlInput = document.getElementById('new-praise-url');

    window.openAddPraiseModal = () => {
        praiseTitleInput.value = '';
        praiseUrlInput.value = '';
        praiseModal.classList.add('active');
    };

    window.closeAddPraiseModal = () => {
        praiseModal.classList.remove('active');
    };

    window.submitAddPraise = () => {
        const title = praiseTitleInput.value.trim();
        const url = praiseUrlInput.value.trim();
        
        if (!title || !url) {
            alert('제목과 유튜브 링크를 모두 입력해주세요.');
            return;
        }

        const videoId = extractVideoId(url);
        if(!videoId) {
            alert('올바른 유튜브 링크를 입력해주세요. (예: https://youtu.be/...)');
            return;
        }

        const newId = mockPraises.length > 0 ? Math.max(...mockPraises.map(p => p.id)) + 1 : 1;
        mockPraises.unshift({ id: newId, title, videoId }); // 최신 찬양을 위로

        alert('새로운 찬양이 추가되었습니다!');
        closeAddPraiseModal();
        renderPraises();
    };

    // 6. 주보 및 공과 데이터 연동 & 수정 로직
    let mockBulletin = {
        date: '2026. 04. 19 주일',
        sermonTitle: '"사랑과 이음"',
        verse: '요한복음 3장 16절',
        preacher: '이목사님'
    };

    let mockStudy = {
        title: '14과: 하나님이 세상을 이처럼 사랑하사',
        verse: '"하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니..." (요 3:16)'
    };

    function renderBulletin() {
        document.getElementById('bulletin-date').innerText = mockBulletin.date;
        document.getElementById('bulletin-container').innerHTML = `
            <p><strong>예배 전 찬양:</strong> 찬양팀</p>
            <p><strong>사도신경:</strong> 다같이</p>
            <p><strong>대표기도:</strong> 선생님</p>
            <p><strong>성경봉독:</strong> ${mockBulletin.verse}</p>
            <hr>
            <h4 class="sermon-title">말씀: ${mockBulletin.sermonTitle}</h4>
            <p><strong>설교:</strong> ${mockBulletin.preacher}</p>
            <hr>
            <p><strong>봉헌 및 기도:</strong> 다같이</p>
            <p><strong>주기도문:</strong> 다같이</p>
        `;
    }

    function renderStudy() {
        document.getElementById('study-container').innerHTML = `
            <div class="card study-card">
                <div class="badge">이번 주 학습</div>
                <h3>${mockStudy.title}</h3>
                <p class="verse">${mockStudy.verse}</p>
                <div class="study-actions">
                    <button class="btn outline">학생용 교재 보기</button>
                    <button class="btn outline">교사용 가이드 보기</button>
                </div>
            </div>
            <div class="card study-card">
                <div class="badge gray">지난 주 학습</div>
                <h3>13과: 믿음으로 나아가는 길</h3>
            </div>
        `;
    }

    renderBulletin();
    renderStudy();

    const bulletinModal = document.getElementById('edit-bulletin-modal');
    window.openEditBulletinModal = () => {
        document.getElementById('edit-bulletin-date').value = mockBulletin.date;
        document.getElementById('edit-bulletin-sermon').value = mockBulletin.sermonTitle;
        document.getElementById('edit-bulletin-verse').value = mockBulletin.verse;
        document.getElementById('edit-bulletin-preacher').value = mockBulletin.preacher;
        bulletinModal.classList.add('active');
    };
    window.closeEditBulletinModal = () => bulletinModal.classList.remove('active');
    window.submitEditBulletin = () => {
        mockBulletin.date = document.getElementById('edit-bulletin-date').value;
        mockBulletin.sermonTitle = document.getElementById('edit-bulletin-sermon').value;
        mockBulletin.verse = document.getElementById('edit-bulletin-verse').value;
        mockBulletin.preacher = document.getElementById('edit-bulletin-preacher').value;
        renderBulletin();
        closeEditBulletinModal();
        alert('주보가 수정되었습니다.');
    };

    const studyModal = document.getElementById('edit-study-modal');
    window.openEditStudyModal = () => {
        document.getElementById('edit-study-title').value = mockStudy.title;
        document.getElementById('edit-study-verse').value = mockStudy.verse;
        studyModal.classList.add('active');
    };
    window.closeEditStudyModal = () => studyModal.classList.remove('active');
    window.submitEditStudy = () => {
        mockStudy.title = document.getElementById('edit-study-title').value;
        mockStudy.verse = document.getElementById('edit-study-verse').value;
        renderStudy();
        closeEditStudyModal();
        alert('공과 내용이 수정되었습니다.');
    };

    // 7. 공지사항 로직 및 모달
    const mockNotices = [
        { id: 1, text: '중등부 여름 수련회 사전 등록 안내', detail: '올해 중등부 수련회는 가평에서 진행됩니다. 자세한 일정과 참가비는 추후 안내될 예정이오니 기도를 부탁드립니다.' },
        { id: 2, text: '이번 주 성경 퀴즈 대회! (상품 있음)', detail: '요한복음 1-5장 범위를 바탕으로 반별 퀴즈 대회를 진행합니다! 푸짐한 간식비가 상품으로 준비되어 있습니다.' },
        { id: 3, text: '새친구 환영의 시간 안내', detail: '예배 후 2부 순서로 반별 새친구 환영의 시간이 준비되어 있습니다. 다과와 함께 즐겁게 교제해요.' }
    ];

    const noticeListEl = document.getElementById('notice-list');
    let currentNoticeId = null;
    
    window.renderNotices = () => {
        noticeListEl.innerHTML = '';
        if (mockNotices.length === 0) {
            noticeListEl.innerHTML = '<li style="color:#777; font-size:0.85rem; border:none; padding:10px 0;">등록된 공지사항이 없습니다.</li>';
            return;
        }

        mockNotices.forEach(notice => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '8px 0';
            li.style.cursor = 'pointer';
            
            li.innerHTML = `<span style="flex:1;" onclick="openNoticeDetail(${notice.id})">• ${notice.text}</span>
            <ion-icon name="trash" class="admin-only" style="color: #ff4d4d; cursor: pointer; padding: 4px; font-size: 1.1rem; flex: 0 0 auto;" onclick="deleteNotice(event, ${notice.id})"></ion-icon>`;
            noticeListEl.appendChild(li);
        });
    }
    renderNotices();

    const noticeModal = document.getElementById('notice-modal');
    const noticeTitleInput = document.getElementById('notice-detail-title');
    const noticeBodyInput = document.getElementById('notice-detail-body');
    const noticeHeader = document.getElementById('notice-modal-header');

    window.openAddNoticeModal = () => {
        currentNoticeId = null;
        noticeHeader.innerText = '새 공지사항 추가';
        noticeTitleInput.value = '';
        noticeBodyInput.value = '';
        noticeTitleInput.readOnly = false;
        noticeBodyInput.readOnly = false;
        
        document.getElementById('notice-action-edit').style.display = 'flex';
        document.getElementById('notice-action-view').style.display = 'none';
        
        noticeModal.classList.add('active');
    };

    window.openNoticeDetail = (id) => {
        const notice = mockNotices.find(n => n.id === id);
        if(!notice) return;
        currentNoticeId = notice.id;
        
        noticeHeader.innerText = '공지사항 상세';
        noticeTitleInput.value = notice.text;
        noticeBodyInput.value = notice.detail || '';
        
        if (isAdmin) {
            noticeTitleInput.readOnly = false;
            noticeBodyInput.readOnly = false;
            noticeTitleInput.style.border = '1px solid var(--border-color)';
            noticeBodyInput.style.border = '1px solid var(--border-color)';
            document.getElementById('notice-action-edit').style.display = 'flex';
            document.getElementById('notice-action-view').style.display = 'none';
        } else {
            noticeTitleInput.readOnly = true;
            noticeBodyInput.readOnly = true;
            // 일반 사용자 모드일 때 입력창 테두리 숨기기
            noticeTitleInput.style.border = 'none';
            noticeBodyInput.style.border = 'none';
            document.getElementById('notice-action-edit').style.display = 'none';
            document.getElementById('notice-action-view').style.display = 'flex';
        }

        noticeModal.classList.add('active');
    };

    window.closeNoticeModal = () => {
        noticeModal.classList.remove('active');
        // 테두리 복구
        noticeTitleInput.style.border = '1px solid rgba(255, 255, 255, 0.4)';
        noticeBodyInput.style.border = '1px solid rgba(255, 255, 255, 0.4)';
    };

    window.saveNotice = () => {
        const text = noticeTitleInput.value.trim();
        const detail = noticeBodyInput.value.trim();
        if (!text) {
            alert('공지 제목을 입력해주세요.');
            return;
        }
        
        if (currentNoticeId) {
            const notice = mockNotices.find(n => n.id === currentNoticeId);
            notice.text = text;
            notice.detail = detail;
            alert('공지가 성공적으로 수정되었습니다.');
        } else {
            const newId = mockNotices.length > 0 ? Math.max(...mockNotices.map(n => n.id)) + 1 : 1;
            mockNotices.unshift({ id: newId, text, detail });
            alert('새로운 공지가 추가되었습니다.');
        }

        closeNoticeModal();
        renderNotices();
    };

    window.deleteNotice = (e, id) => {
        e.stopPropagation(); // 상세보기 모달이 뜨는 것을 방지
        if(confirm('이 공지를 삭제하시겠습니까?')) {
            const idx = mockNotices.findIndex(n => n.id === id);
            if(idx > -1) mockNotices.splice(idx, 1);
            renderNotices();
        }
    };

    // 8. 환영인사 (Welcome Card) 수정 로직
    let mockWelcome = {
        title: '환영합니다! ✨',
        text: '이번 주도 은혜로운 시간 되세요.'
    };

    function renderWelcome() {
        document.getElementById('welcome-title').innerText = mockWelcome.title;
        document.getElementById('welcome-text').innerText = mockWelcome.text;
    }
    renderWelcome();

    const welcomeModal = document.getElementById('edit-welcome-modal');
    window.openEditWelcomeModal = () => {
        document.getElementById('edit-welcome-title').value = mockWelcome.title;
        document.getElementById('edit-welcome-text').value = mockWelcome.text;
        welcomeModal.classList.add('active');
    };
    window.closeEditWelcomeModal = () => welcomeModal.classList.remove('active');
    window.submitEditWelcome = () => {
        mockWelcome.title = document.getElementById('edit-welcome-title').value;
        mockWelcome.text = document.getElementById('edit-welcome-text').value;
        renderWelcome();
        closeEditWelcomeModal();
        alert('환영인사가 수정되었습니다.');
    };
});
