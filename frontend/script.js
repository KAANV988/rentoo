document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const signUpModal = document.getElementById('signUpModal');
    const logInModal = document.getElementById('logInModal');
    const signUpButton = document.getElementById('signUpButton');
    const logInButton = document.getElementById('logInButton');
    const closeSignUpModal = document.getElementById('closeSignUpModal');
    const closeLogInModal = document.getElementById('closeLogInModal');
    const signUpForm = document.getElementById('signUpForm');
    const logInForm = document.getElementById('logInForm');
    const searchForm = document.getElementById('searchForm');
    const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
    const advancedFilters = document.getElementById('advancedFilters');

    // --- MODAL CONTROLS ---
    function openModal(modalId) { document.getElementById(modalId).classList.remove('hidden'); }
    function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

    if (signUpButton) signUpButton.addEventListener('click', () => openModal('signUpModal'));
    if (logInButton) logInButton.addEventListener('click', () => openModal('logInModal'));
    if (closeSignUpModal) closeSignUpModal.addEventListener('click', () => closeModal('signUpModal'));
    if (closeLogInModal) closeLogInModal.addEventListener('click', () => closeModal('logInModal'));

    // --- FORM & UI EVENT LISTENERS ---
    if (signUpForm) signUpForm.addEventListener('submit', handleSignUpFormSubmit);
    if (logInForm) logInForm.addEventListener('submit', handleLoginFormSubmit);
    if (searchForm) searchForm.addEventListener('submit', handleSearchFormSubmit);
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', () => {
            advancedFilters.classList.toggle('hidden');
            toggleFiltersBtn.querySelector('i').classList.toggle('rotate-180');
        });
    }

    // --- UI UPDATE & ANIMATIONS ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => observer.observe(el));
    
    // --- INITIAL PAGE LOAD LOGIC ---
    checkLoginStatus();
    if (document.getElementById('property-listings')) {
        fetchAndDisplayProperties();
    }
});

// --- AUTHENTICATION & UI FUNCTIONS ---

function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (user && token) {
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('userActions').classList.remove('hidden');
    document.getElementById('welcomeMessage').textContent = `Welcome, ${user.fullName}`;
    
    const dashboardLink = document.getElementById('dashboardLink');
    if (user.role === 'OWNER') {
        dashboardLink.classList.remove('hidden');
    } else {
        dashboardLink.classList.add('hidden');
    }

    document.getElementById('logOutButton').addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

function updateUIForLoggedOutUser() {
    document.getElementById('authActions').classList.remove('hidden');
    document.getElementById('userActions').classList.add('hidden');
}

async function handleSignUpFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const messageElement = document.getElementById('signUpMessage');

    messageElement.textContent = 'Creating account...';
    messageElement.className = 'text-center text-sm mt-4 text-gray-600';

    try {
        const response = await fetch('http://localhost:8081/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Registration failed!');
        }

        const newUser = await response.json();
        messageElement.textContent = `Welcome, ${newUser.fullName}! Your account is ready.`;
        messageElement.className = 'text-center text-sm mt-4 text-green-600';

        setTimeout(() => {
            closeModal('signUpModal');
            form.reset();
            messageElement.textContent = '';
        }, 2000);

    } catch (error) {
        messageElement.textContent = 'Email already exists. Please use a different email.';
        messageElement.className = 'text-center text-sm mt-4 text-red-600';
        console.error('Sign up error:', error);
    }
}

async function handleLoginFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const messageElement = document.getElementById('logInMessage');

    messageElement.textContent = 'Logging in...';
    messageElement.className = 'text-center text-sm mt-4 text-gray-600';

    try {
        const response = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Login failed! Status: ${response.status}`);
        }

        const result = await response.json();
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        if (result.user.role === 'OWNER') {
            messageElement.textContent = `Welcome back, ${result.user.fullName}! Redirecting...`;
        } else {
            messageElement.textContent = `Welcome back, ${result.user.fullName}!`;
        }
        messageElement.className = 'text-center text-sm mt-4 text-green-600';
        
        setTimeout(() => {
            if (result.user.role === 'OWNER') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.reload();
            }
        }, 1500);

    } catch (error) {
        messageElement.textContent = 'Invalid email or password. Please try again.';
        messageElement.className = 'text-center text-sm mt-4 text-red-600';
        console.error('Login error:', error);
    }
}

// --- PROPERTY SEARCH & DISPLAY FUNCTIONS ---

async function handleSearchFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const listingsContainer = document.getElementById('property-listings');
    const listingsTitle = document.getElementById('listings-title');

    const params = new URLSearchParams();
    const query = formData.get('searchInput');
    const minPrice = formData.get('minPrice');
    const maxPrice = formData.get('maxPrice');
    const minBeds = formData.get('minBeds');
    const minBaths = formData.get('minBaths');

    if (query) params.append('query', query);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (minBeds) params.append('minBeds', minBeds);
    if (minBaths) params.append('minBaths', minBaths);

    listingsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">Searching...</p>';
    listingsTitle.textContent = 'Search Results';

    try {
        const response = await fetch(`http://localhost:8081/api/properties/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const properties = await response.json();
        displayProperties(properties);

    } catch (error) {
        console.error("Failed to fetch search results:", error);
        listingsContainer.innerHTML = '<p class="col-span-full text-center text-red-500">Could not perform search.</p>';
    }
}

async function fetchAndDisplayProperties() {
    try {
        const response = await fetch('http://localhost:8081/api/properties');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const properties = await response.json();
        displayProperties(properties);
    } catch (error) {
        console.error("Failed to fetch properties:", error);
        document.getElementById('property-listings').innerHTML = '<p class="col-span-full text-center text-red-500">Could not load properties.</p>';
    }
}

function displayProperties(properties) {
    const listingsContainer = document.getElementById('property-listings');
    if (!properties || properties.length === 0) {
        listingsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No properties found.</p>';
        return;
    }

    listingsContainer.innerHTML = '';
    properties.forEach(property => {
        const imageUrl = property.images && property.images.length > 0 
            ? `http://localhost:8081${property.images[0].imageUrl}` 
            : 'https://placehold.co/600x400/E2E8F0/4A5568?text=No+Image';
        
        const mapQuery = encodeURIComponent(`${property.address}, ${property.city}, ${property.state}`);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

        const propertyLink = document.createElement('a');
        propertyLink.href = `property.html?id=${property.id}`;
        propertyLink.className = 'block bg-white rounded-lg shadow-md overflow-hidden animate-on-scroll hover:shadow-xl transition-shadow';
        
        propertyLink.innerHTML = `
            <div class="relative">
                <img src="${imageUrl}" alt="Property Image" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-blue-600 font-bold text-lg px-3 py-1 rounded-full">$${property.rentPrice}/mo</div>
            </div>
            <div class="p-6">
                <a href="${mapUrl}" target="_blank" class="hover:text-blue-600 inline-block">
                    <h3 class="font-bold text-xl mb-2 text-gray-800 truncate">${property.address}</h3>
                    <p class="text-gray-600 text-sm flex items-center"><i class="fas fa-map-marker-alt mr-2"></i>${property.city}, ${property.state}</p>
                </a>
                <div class="border-t my-4"></div>
                <div class="flex justify-between text-sm text-gray-700">
                    <span><i class="fas fa-bed mr-2"></i>${property.bedrooms} Beds</span>
                    <span><i class="fas fa-bath mr-2"></i>${property.bathrooms} Baths</span>
                </div>
            </div>
        `;
        listingsContainer.appendChild(propertyLink);
    });
    
    // Re-initialize animations for newly added elements
    const newAnimatedElements = listingsContainer.querySelectorAll('.animate-on-scroll');
    const newObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    newAnimatedElements.forEach(el => newObserver.observe(el));
}
