const SUPABASE_URL = 'https://qszjfktfylsvnkbupmkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzempma3RmeWxzdm5rYnVwbWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDI3MDUsImV4cCI6MjA2OTM3ODcwNX0.pQS-v8GRQEzB8_nAZ5GunyiKs2Pr_JxRX547fvq_2i4';

// Supabase 초기화
let supabaseClient;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase 초기화 성공');
    } else {
        throw new Error('Supabase library not loaded');
    }
} catch (error) {
    console.error('❌ Supabase 초기화 실패:', error);
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userMenu = document.getElementById('user-menu');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const messageDiv = document.getElementById('message');

// Dashboard elements
const userNameSpan = document.getElementById('user-name');
const userEmailHeader = document.getElementById('user-email-header');
const currentDateSpan = document.getElementById('current-date');
const completedCountSpan = document.getElementById('completed-count');
const pendingCountSpan = document.getElementById('pending-count');

// Todo elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const prioritySelect = document.getElementById('priority');
const todosList = document.getElementById('todos-list');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');

// Global state
let currentUser = null;
let todos = [];
let currentFilter = 'all';

// Utility Functions
function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const loadingText = button.querySelector('.loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        loadingText.style.display = 'flex';
        button.disabled = true;
    } else {
        btnText.style.display = 'flex';
        loadingText.style.display = 'none';
        button.disabled = false;
    }
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour % 12 || 12;
    return `${ampm} ${displayHour}:${minutes}`;
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    };
    currentDateSpan.textContent = now.toLocaleDateString('ko-KR', options);
}

function updateStats() {
    const completed = todos.filter(todo => todo.completed).length;
    const pending = todos.filter(todo => !todo.completed).length;
    
    completedCountSpan.textContent = completed;
    pendingCountSpan.textContent = pending;
}

// Auth Functions
async function handleAuthChange(event, session) {
    console.log('🔄 Auth state changed:', event, session);
    
    if (session && session.user) {
        currentUser = session.user;
        
        // UI 전환
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        userMenu.style.display = 'flex';
        
        // 사용자 정보 표시
        const userName = session.user.email.split('@')[0];
        userNameSpan.textContent = userName;
        userEmailHeader.textContent = session.user.email;
        
        // 날짜 업데이트
        updateCurrentDate();
        
        // Todo 데이터 로드
        await fetchTodos();
        
        console.log('✅ 로그인 완료');
    } else {
        currentUser = null;
        
        // UI 전환
        authSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        userMenu.style.display = 'none';
        
        // 데이터 초기화
        todos = [];
        todosList.innerHTML = '';
        
        console.log('ℹ️ 로그아웃 상태');
    }
}

async function signUp(email, password) {
    try {
        console.log('📝 회원가입 시도:', email);
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) {
            console.error('❌ 회원가입 에러:', error);
            showMessage(`회원가입 실패: ${error.message}`, 'error');
        } else {
            console.log('✅ 회원가입 성공');
            showMessage('회원가입 성공! 로그인해 주세요.', 'success');
            emailInput.value = '';
            passwordInput.value = '';
        }
    } catch (err) {
        console.error('❌ 네트워크 에러:', err);
        showMessage(`오류 발생: ${err.message}`, 'error');
    }
}

async function signIn(email, password) {
    try {
        console.log('🔐 로그인 시도:', email);
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            console.error('❌ 로그인 에러:', error);
            showMessage(`로그인 실패: ${error.message}`, 'error');
        } else {
            console.log('✅ 로그인 성공');
            showMessage('로그인 성공!', 'success');
            emailInput.value = '';
            passwordInput.value = '';
        }
    } catch (err) {
        console.error('❌ 네트워크 에러:', err);
        showMessage(`오류 발생: ${err.message}`, 'error');
    }
}

async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            showMessage(`로그아웃 실패: ${error.message}`, 'error');
        } else {
            showMessage('로그아웃되었습니다.', 'success');
        }
    } catch (err) {
        showMessage('네트워크 오류가 발생했습니다.', 'error');
    }
}

// Todo Functions
async function fetchTodos() {
    try {
        console.log('📊 Todo 데이터 로드 중...');
        
        const { data, error } = await supabaseClient
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Todo 로드 에러:', error);
            showMessage(`데이터 로드 실패: ${error.message}`, 'error');
            return;
        }

        todos = data || [];
        console.log('✅ Todo 데이터 로드 완료:', todos.length + '개');
        
        renderTodos();
        updateStats();
        
    } catch (err) {
        console.error('❌ 네트워크 에러:', err);
        showMessage('네트워크 오류로 데이터를 불러올 수 없습니다.', 'error');
    }
}

async function addTodo(task, startTime, endTime, priority) {
    try {
        console.log('➕ Todo 추가 중:', { task, startTime, endTime, priority });
        
        const { data, error } = await supabaseClient
            .from('todos')
            .insert([{
                task: task,
                start_time: startTime || null,
                end_time: endTime || null,
                priority: priority,
                completed: false
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Todo 추가 에러:', error);
            if (error.code === '23505') {
                showMessage('이미 같은 할 일이 존재합니다.', 'error');
            } else {
                showMessage(`할 일 추가 실패: ${error.message}`, 'error');
            }
            return false;
        }

        console.log('✅ Todo 추가 성공');
        todos.unshift(data);
        renderTodos();
        updateStats();
        
        // 폼 초기화
        todoInput.value = '';
        startTimeInput.value = '';
        endTimeInput.value = '';
        prioritySelect.value = 'medium';
        
        return true;
        
    } catch (err) {
        console.error('❌ 네트워크 에러:', err);
        showMessage('네트워크 오류로 할 일을 추가할 수 없습니다.', 'error');
        return false;
    }
}

async function toggleTodo(id, completed) {
    try {
        console.log('🔄 Todo 상태 변경:', id, completed);
        
        const { data, error } = await supabaseClient
            .from('todos')
            .update({ completed: completed })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Todo 상태 변경 에러:', error);
            showMessage(`상태 변경 실패: ${error.message}`, 'error');
            return;
        }

        // 로컬 상태 업데이트
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            todos[todoIndex] = data;
        }
        
        renderTodos();
        updateStats();
        
        console.log('✅ Todo 상태 변경 완료');
        
    } catch (err) {
        console.error('❌ 네트워크 에러:', err);
        showMessage('네트워크 오류가 발생했습니다.', 'error');
    }
}

async function deleteTodo(id) {
    try {
        console.log('🗑️ Todo 삭제:', id);
        
        const { error } = await supabaseClient
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Todo 삭제 에러:', error);
            showMessage(`삭제 실패: ${error.message}`, 'error');
            return;
        }

        // 로컬 상태 업데이트
        todos = todos.filter(todo => todo.id !== id);
        renderTodos();
        updateStats();
        
        console.log('✅ Todo 삭제 완료');
        
    } catch (err) {
        console.error('❌ 네트워크 에러:', err);
        showMessage('네트워크 오류가 발생했습니다.', 'error');
    }
}

function renderTodos() {
    // 필터링
    let filteredTodos = todos;
    if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    } else if (currentFilter === 'pending') {
        filteredTodos = todos.filter(todo => !todo.completed);
    }
    
    // 빈 상태 처리
    if (filteredTodos.length === 0) {
        todosList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    todosList.style.display = 'flex';
    emptyState.style.display = 'none';
    
    // Todo 항목 렌더링
    todosList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodoStatus(${todo.id}, ${!todo.completed})"></div>
            
            <div class="todo-content">
                <div class="todo-task">${todo.task}</div>
                <div class="todo-meta">
                    ${todo.start_time || todo.end_time ? `
                        <div class="todo-time">
                            <i class="fas fa-clock"></i>
                            ${todo.start_time ? formatTime(todo.start_time) : ''} 
                            ${todo.start_time && todo.end_time ? ' - ' : ''}
                            ${todo.end_time ? formatTime(todo.end_time) : ''}
                        </div>
                    ` : ''}
                    <div class="priority-badge priority-${todo.priority}">
                        ${todo.priority === 'high' ? '높음' : todo.priority === 'medium' ? '보통' : '낮음'}
                    </div>
                </div>
            </div>
            
            <div class="todo-actions">
                <button class="action-btn delete-btn" onclick="deleteTodoItem(${todo.id})" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('🎨 Todo 렌더링 완료:', filteredTodos.length + '개');
}

// Global functions for onclick handlers
window.toggleTodoStatus = function(id, completed) {
    toggleTodo(id, completed);
};

window.deleteTodoItem = function(id) {
    if (confirm('이 할 일을 삭제하시겠습니까?')) {
        deleteTodo(id);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 앱 초기화 중...');
    
    // Auth form handler
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const button = e.submitter;

        if (!email || !password) {
            showMessage('이메일과 비밀번호를 모두 입력해 주세요.', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
            return;
        }

        setButtonLoading(button, true);
        
        try {
            if (button.id === 'signup-btn') {
                await signUp(email, password);
            } else if (button.id === 'signin-btn') {
                await signIn(email, password);
            }
        } finally {
            setButtonLoading(button, false);
        }
    });
    
    // Signout handler
    signoutBtn.addEventListener('click', signOut);
    
    // Todo form handler
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const task = todoInput.value.trim();
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const priority = prioritySelect.value;
        const submitButton = todoForm.querySelector('button[type="submit"]');
        
        if (!task) {
            showMessage('할 일을 입력해 주세요.', 'error');
            return;
        }
        
        // 시간 검증
        if (startTime && endTime && startTime >= endTime) {
            showMessage('종료 시간은 시작 시간보다 늦어야 합니다.', 'error');
            return;
        }
        
        setButtonLoading(submitButton, true);
        
        try {
            await addTodo(task, startTime, endTime, priority);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 활성 버튼 변경
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 필터 변경
            currentFilter = button.dataset.filter;
            renderTodos();
            
            console.log('🔧 필터 변경:', currentFilter);
        });
    });
    
    // Auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleAuthChange(event, session);
    });
    
    // 초기 auth 상태 확인
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange('INITIAL_SESSION', session);
    });
    
    console.log('✅ 앱 초기화 완료');
});