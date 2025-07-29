const SUPABASE_URL = 'https://qszjfktfylsvnkbupmkr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzempma3RmeWxzdm5rYnVwbWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDI3MDUsImV4cCI6MjA2OTM3ODcwNX0.pQS-v8GRQEzB8_nAZ5GunyiKs2Pr_JxRX547fvq_2i4';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Functions
async function handleAuthChange(event) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // User is logged in
        authSection.style.display = 'none';
        userInfoSection.style.display = 'block';
        dataSection.style.display = 'block';
        signoutBtn.style.display = 'block';

        userEmailSpan.textContent = session.user.email;
        userIdSpan.textContent = session.user.id;

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
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (error) {
        alert(error.message);
    } else {
        alert('Sign up successful! Please check your email for verification.');
    }
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) {
        alert(error.message);
    } else {
        alert('Signed in successfully!');
    }
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert(error.message);
    } else {
        alert('Signed out successfully!');
    }
}

async function fetchTodos() {
    todosList.innerHTML = ''; // Clear existing todos
    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching todos:', error.message);
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.textContent = todo.task;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = async () => {
            const { error } = await supabase
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
    });
}

async function addTodo(task) {
    const { data, error } = await supabase
        .from('todos')
        .insert([{ task: task }]);

    if (error) {
        console.error('Error adding todo:', error.message);
    } else {
        todoInput.value = ''; // Clear input
        fetchTodos(); // Re-fetch todos after adding
    }
}

// Event Listeners
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    if (e.submitter.id === 'signup-btn') {
        await signUp(email, password);
    } else if (e.submitter.id === 'signin-btn') {
        await signIn(email, password);
    }
});

signoutBtn.addEventListener('click', signOut);

todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = todoInput.value;
    if (task) {
        await addTodo(task);
    }
});

// Initial check and listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
    handleAuthChange(event);
});

handleAuthChange(); // Initial call to set UI state
