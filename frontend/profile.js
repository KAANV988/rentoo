document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const userActionsHeader = document.getElementById('userActionsHeader');
    const viewProfileSection = document.getElementById('viewProfileSection');
    const editProfileSection = document.getElementById('editProfileSection');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    // View elements
    const viewFullName = document.getElementById('viewFullName');
    const viewEmail = document.getElementById('viewEmail');
    const viewPhoneNumber = document.getElementById('viewPhoneNumber');

    // Form elements
    const updateProfileForm = document.getElementById('updateProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const fullNameInput = document.getElementById('fullName');
    const phoneNumberInput = document.getElementById('phoneNumber');

    // --- SESSION MANAGEMENT ---
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'index.html'; // Redirect if not logged in
        return;
    }
    
    // --- DATA FETCHING & RENDERING ---
    async function fetchAndPopulateUserData() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch user data.');
            const user = await response.json();

            // Populate the view section
            viewFullName.textContent = user.fullName;
            viewEmail.textContent = user.email;
            viewPhoneNumber.textContent = user.phoneNumber;
            
            // Populate the edit form fields
            fullNameInput.value = user.fullName;
            phoneNumberInput.value = user.phoneNumber;

            // Populate header
            let headerLinks = `
                <a href="profile.html" class="text-blue-600 font-bold">My Profile</a>
                <span class="text-gray-700 font-medium">Welcome, ${user.fullName}</span>
                <button id="logOutButton" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Log Out</button>
            `;
            if (user.role === 'OWNER') {
                headerLinks = `<a href="dashboard.html" class="text-gray-600 hover:text-blue-600 font-medium">My Dashboard</a>` + headerLinks;
            }
            userActionsHeader.innerHTML = headerLinks;

            document.getElementById('logOutButton').addEventListener('click', () => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Handle error, maybe show a message
        }
    }

    // --- UI TOGGLE LOGIC ---
    function showEditView() {
        viewProfileSection.classList.add('hidden');
        editProfileSection.classList.remove('hidden');
    }

    function showProfileView() {
        viewProfileSection.classList.remove('hidden');
        editProfileSection.classList.add('hidden');
    }

    editProfileBtn.addEventListener('click', showEditView);
    cancelEditBtn.addEventListener('click', showProfileView);

    // --- FORM SUBMISSION LOGIC ---
    updateProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const messageElement = document.getElementById('updateProfileMessage');
        const data = {
            fullName: fullNameInput.value,
            phoneNumber: phoneNumberInput.value
        };
        
        messageElement.textContent = 'Saving...';
        messageElement.className = 'text-center text-sm mt-4 text-gray-600';

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update profile.');
            }
            const updatedUser = await response.json();

            // Update user in local storage
            localStorage.setItem('user', JSON.stringify(updatedUser));

            messageElement.textContent = 'Profile updated successfully!';
            messageElement.className = 'text-center text-sm mt-4 text-green-600';
            
            setTimeout(() => {
                fetchAndPopulateUserData(); // Re-fetch and display new data
                showProfileView();
                messageElement.textContent = '';
            }, 1500);

        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'text-center text-sm mt-4 text-red-600';
            console.error('Update profile error:', error);
        }
    });

    changePasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const messageElement = document.getElementById('changePasswordMessage');
        const formData = new FormData(changePasswordForm);
        const data = Object.fromEntries(formData.entries());

        messageElement.textContent = 'Updating password...';
        messageElement.className = 'text-center text-sm mt-4 text-gray-600';

        try {
            const response = await fetch('/api/users/profile/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update password.');
            }
            
            messageElement.textContent = 'Password updated successfully!';
            messageElement.className = 'text-center text-sm mt-4 text-green-600';
            changePasswordForm.reset();
            setTimeout(() => { messageElement.textContent = ''; }, 2000);

        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.className = 'text-center text-sm mt-4 text-red-600';
            console.error('Change password error:', error);
        }
    });

    // --- INITIALIZE PAGE ---
    fetchAndPopulateUserData();
});
