const SUPABASE_URL = 'https://qszjfktfylsvnkbupmkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzempma3RmeWxzdm5rYnVwbWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDI3MDUsImV4cCI6MjA2OTM3ODcwNX0.pQS-v8GRQEzB8_nAZ5GunyiKs2Pr_JxRX547fvq_2i4';

// Supabase 초기화 (전역 객체 확인)
let supabaseClient;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        throw new Error('Supabase library not loaded');
    }
} catch (error) {
    console.error('Supabase 초기화 실패:', error);
    document.body.innerHTML = '<div style="text-align: center; padding: 50px; color: red;"><h2>초기화 오류</h2><p>Supabase를 초기화할 수 없습니다.</p></div>';
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const userInfoSection = document.getElementById('user-info-section');
const dataSection = document.getElementById('data-section');

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');

const userEmailSpan = document.getElementById('user-email');
const userIdSpan = document.getElementById('user-id');

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todosList = document.getElementById('todos-list');
const messageDiv = document.getElementById('message');

// Functions
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
        loadingText.style.display = 'inline';
        button.disabled = true;
    } else {
        btnText.style.display = 'inline';
        loadingText.style.display = 'none';
        button.disabled = false;
    }
}

async function handleAuthChange(event) {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // User is logged in
        authSection.style.display = 'none';
        userInfoSection.style.display = 'block';
        dataSection.style.display = 'block';
        signoutBtn.style.display = 'block';

        userEmailSpan.textContent = session.user.email;
        userIdSpan.textContent = session.user.id;

        console.log('🔑 사용자 로그인 상태, fetchTodos 호출');
        fetchTodos();
    } else {
        // User is logged out
        authSection.style.display = 'block';
        userInfoSection.style.display = 'none';
        dataSection.style.display = 'none';
        signoutBtn.style.display = 'none';

        userEmailSpan.textContent = '';
        userIdSpan.textContent = '';
        todosList.innerHTML = ''; // Clear todos
    }
}

async function signUp(email, password) {
    try {
        console.log('회원가입 시도 시작:', { email, url: SUPABASE_URL });
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });
        
        console.log('Supabase 응답:', { data, error });
        
        if (error) {
            console.error('회원가입 에러:', error);
            showMessage(`회원가입 실패: ${error.message}`, 'error');
        } else {
            console.log('회원가입 성공');
            showMessage('회원가입 성공! 로그인해 주세요.', 'success');
            emailInput.value = '';
            passwordInput.value = '';
        }
    } catch (err) {
        console.error('네트워크 에러 상세:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            showMessage('네트워크 연결 실패: Supabase 서버에 접근할 수 없습니다.', 'error');
        } else if (err.message.includes('CORS')) {
            showMessage('CORS 오류: 도메인 설정을 확인해 주세요.', 'error');
        } else {
            showMessage(`오류 발생: ${err.message}`, 'error');
        }
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            showMessage(`로그인 실패: ${error.message}`, 'error');
        } else {
            showMessage('로그인 성공!', 'success');
            emailInput.value = '';
            passwordInput.value = '';
        }
    } catch (err) {
        showMessage('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
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

async function fetchTodos() {
    console.log('🔍 fetchTodos 호출됨');
    todosList.innerHTML = ''; // Clear existing todos
    const { data: todos, error } = await supabaseClient
        .from('todos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching todos:', error.message);
        return;
    }

    console.log('📊 DB에서 가져온 todos 개수:', todos.length);
    console.log('📊 DB 데이터:', todos);

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.textContent = todo.task;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = async () => {
            const { error } = await supabaseClient
                .from('todos')
                .delete()
                .eq('id', todo.id);
            if (error) {
                console.error('Error deleting todo:', error.message);
            } else {
                fetchTodos(); // Re-fetch todos after deletion
            }
        };
        li.appendChild(deleteBtn);
        todosList.appendChild(li);
        console.log('➕ Todo 항목 추가됨:', todo.task);
    });
    console.log('✅ fetchTodos 완료, 화면에 표시된 항목 수:', todosList.children.length);
}

async function addTodo(task) {
    try {
        const { data, error } = await supabaseClient
            .from('todos')
            .insert([{ task: task }]);

        if (error) {
            console.error('Error adding todo:', error.message);
            showMessage(`할 일 추가 실패: ${error.message}`, 'error');
        } else {
            console.log('Todo 추가 성공');
            todoInput.value = ''; // Clear input
            fetchTodos(); // Re-fetch todos after adding
        }
    } catch (err) {
        console.error('Todo 추가 네트워크 에러:', err);
        showMessage('네트워크 오류로 할 일을 추가할 수 없습니다.', 'error');
    }
}

// Event Listeners
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
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

signoutBtn.addEventListener('click', signOut);

todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = todoInput.value.trim();
    const submitButton = todoForm.querySelector('button[type="submit"]');
    
    if (!task) {
        showMessage('할 일을 입력해 주세요.', 'error');
        return;
    }
    
    // 중복 제출 방지
    if (submitButton.disabled) {
        return;
    }
    
    // 버튼 비활성화
    submitButton.disabled = true;
    submitButton.textContent = '추가 중...';
    
    try {
        await addTodo(task);
    } finally {
        // 버튼 활성화
        submitButton.disabled = false;
        submitButton.textContent = 'Add Todo';
    }
});

// Initial check and listen for auth changes
supabaseClient.auth.onAuthStateChange((event, session) => {
    handleAuthChange(event);
});

handleAuthChange(); // Initial call to set UI state
