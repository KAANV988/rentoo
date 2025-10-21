document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logOutButton = document.getElementById('logOutButton');
    const myPropertiesList = document.getElementById('my-properties-list');
    const addPropertyForm = document.getElementById('addPropertyForm');
    
    // Modal Selectors
    const editPropertyModal = document.getElementById('editPropertyModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editPropertyForm = document.getElementById('editPropertyForm');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');

    // Add Property Form Specific Selectors
    const imageUploadInput = document.getElementById('file-upload');
    const imagePreviewContainer = document.getElementById('image-preview');

    // --- Session Management ---
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token || user.role !== 'OWNER') {
        window.location.href = 'index.html';
        return;
    }

    welcomeMessage.textContent = `Welcome, ${user.fullName}`;
    logOutButton.addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // --- Modal Controls ---
    function openModal(modal) { modal.classList.remove('hidden'); }
    function closeModal(modal) { modal.classList.add('hidden'); }

    closeEditModal.addEventListener('click', () => closeModal(editPropertyModal));
    cancelDeleteButton.addEventListener('click', () => closeModal(deleteConfirmModal));

    // --- State Management ---
    let propertiesCache = [];
    let propertyIdToDelete = null;
    let selectedFiles = [];

    // --- Image Preview Logic for Add Form ---
    imageUploadInput.addEventListener('change', (event) => {
        selectedFiles.push(...event.target.files);
        renderImagePreviews();
    });

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'relative group';
                    imgWrapper.innerHTML = `
                        <img src="${e.target.result}" class="w-full h-24 object-cover rounded-md">
                        <button type="button" data-index="${index}" class="remove-btn absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    `;
                    imagePreviewContainer.appendChild(imgWrapper);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    imagePreviewContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-btn')) {
            const indexToRemove = parseInt(event.target.getAttribute('data-index'), 10);
            selectedFiles.splice(indexToRemove, 1);
            renderImagePreviews();
        }
    });

    // --- API & Rendering Logic ---
    async function fetchAndDisplayMyProperties() {
        try {
            const response = await fetch('http://localhost:8081/api/properties/my-listings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            propertiesCache = await response.json();
            renderProperties();
        } catch (error) {
            myPropertiesList.innerHTML = '<p class="text-center text-red-500">Could not load your properties.</p>';
            console.error('Fetch properties error:', error);
        }
    }
    
    function renderProperties() {
        if (propertiesCache.length === 0) {
            myPropertiesList.innerHTML = '<p class="text-center text-gray-500">You have not listed any properties yet.</p>';
            return;
        }
        myPropertiesList.innerHTML = '';
        propertiesCache.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.className = 'bg-white p-4 rounded-lg shadow-md flex justify-between items-center';
            propertyCard.innerHTML = `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${property.address}, ${property.city}</h3>
                    <p class="text-gray-600">$${property.rentPrice}/month - ${property.bedrooms} Bed, ${property.bathrooms} Bath</p>
                </div>
                <div>
                    <button data-property-id="${property.id}" class="edit-btn text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                    <button data-property-id="${property.id}" class="delete-btn text-red-500 hover:text-red-700">Delete</button>
                </div>
            `;
            myPropertiesList.appendChild(propertyCard);
        });
    }

    // --- Event Delegation for Edit and Delete buttons ---
    myPropertiesList.addEventListener('click', (event) => {
        const propertyId = event.target.dataset.propertyId;
        if (!propertyId) return;

        if (event.target.classList.contains('edit-btn')) {
            handleEditClick(propertyId);
        }
        if (event.target.classList.contains('delete-btn')) {
            handleDeleteClick(propertyId);
        }
    });

    function handleEditClick(propertyId) {
        const property = propertiesCache.find(p => p.id == propertyId);
        if (!property) return;

        editPropertyForm.querySelector('[name="id"]').value = property.id;
        editPropertyForm.querySelector('[name="address"]').value = property.address;
        editPropertyForm.querySelector('[name="city"]').value = property.city;
        editPropertyForm.querySelector('[name="state"]').value = property.state;
        editPropertyForm.querySelector('[name="zipCode"]').value = property.zipCode;
        editPropertyForm.querySelector('[name="rentPrice"]').value = property.rentPrice;
        editPropertyForm.querySelector('[name="bedrooms"]').value = property.bedrooms;
        editPropertyForm.querySelector('[name="bathrooms"]').value = property.bathrooms;
        editPropertyForm.querySelector('[name="description"]').value = property.description;
        editPropertyForm.querySelector('[name="videoUrl"]').value = property.videoUrl || '';
        
        openModal(editPropertyModal);
    }
    
    function handleDeleteClick(propertyId) {
        propertyIdToDelete = propertyId;
        openModal(deleteConfirmModal);
    }

    // --- Form Submission Handlers ---
    addPropertyForm.addEventListener('submit', handleAddPropertyFormSubmit);
    editPropertyForm.addEventListener('submit', handleEditFormSubmit);
    confirmDeleteButton.addEventListener('click', handleConfirmDelete);

    async function handleAddPropertyFormSubmit(event) {
        event.preventDefault();
        const messageElement = document.getElementById('addPropertyMessage');
        const propertyData = Object.fromEntries(new FormData(addPropertyForm).entries());
        delete propertyData.files;

        const multipartFormData = new FormData();
        multipartFormData.append('property', new Blob([JSON.stringify(propertyData)], { type: "application/json" }));
        selectedFiles.forEach(file => multipartFormData.append('files', file));
        
        messageElement.textContent = 'Adding property...';
        try {
            const response = await fetch('http://localhost:8081/api/properties', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: multipartFormData
            });
            if (!response.ok) throw new Error('Failed to add property.');

            messageElement.textContent = 'Property added successfully!';
            addPropertyForm.reset();
            selectedFiles = [];
            imagePreviewContainer.innerHTML = '';
            fetchAndDisplayMyProperties();
        } catch (error) {
            messageElement.textContent = 'Error adding property. Please try again.';
            console.error('Add property error:', error);
        }
    }

    async function handleEditFormSubmit(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(editPropertyForm).entries());
        const propertyId = data.id;
        const messageElement = document.getElementById('editPropertyMessage');
        messageElement.textContent = 'Saving changes...';

        try {
            const response = await fetch(`http://localhost:8081/api/properties/${propertyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to save changes.');
            
            messageElement.textContent = 'Changes saved successfully!';
            setTimeout(() => {
                closeModal(editPropertyModal);
                messageElement.textContent = '';
                fetchAndDisplayMyProperties();
            }, 1500);
        } catch (error) {
            messageElement.textContent = 'Error saving changes. Please try again.';
            console.error('Edit property error:', error);
        }
    }
    
    async function handleConfirmDelete() {
        if (!propertyIdToDelete) return;
        try {
            const response = await fetch(`http://localhost:8081/api/properties/${propertyIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete property.');

            closeModal(deleteConfirmModal);
            fetchAndDisplayMyProperties();
            propertyIdToDelete = null;
        } catch (error) {
            alert('Error deleting property. Please try again.');
            console.error('Delete property error:', error);
        }
    }

    // --- Initial Load ---
    fetchAndDisplayMyProperties();
});