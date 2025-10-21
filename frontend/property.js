document.addEventListener('DOMContentLoaded', () => {
    const propertyDetailContainer = document.getElementById('property-detail-container');
    const loadingMessage = document.getElementById('loading-message');

    /**
     * Fetches and displays the details for a single property based on the ID in the URL.
     */
    async function fetchAndDisplayPropertyDetails() {
        // Get the property ID from the URL query string (e.g., ?id=1)
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');

        if (!propertyId) {
            propertyDetailContainer.innerHTML = '<p class="text-center text-red-500">No property ID provided. Please go back to the homepage.</p>';
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/api/properties/${propertyId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch property details. Status: ${response.status}`);
            }
            const property = await response.json();

            // Hide the loading message
            loadingMessage.style.display = 'none';
            
            // Render the property details
            renderPropertyDetails(property);

        } catch (error) {
            console.error('Error fetching property details:', error);
            propertyDetailContainer.innerHTML = '<p class="text-center text-red-500">Could not load property details. The property may not exist or an error occurred.</p>';
        }
    }

    /**
     * Renders the fetched property data into the page.
     * @param {object} property - The property data object from the backend.
     */
    function renderPropertyDetails(property) {
        // --- Image Gallery ---
        let mainImage = 'https://placehold.co/1200x800/E2E8F0/4A5568?text=No+Image';
        let thumbnailImages = '';

        if (property.images && property.images.length > 0) {
            mainImage = `http://localhost:8081${property.images[0].imageUrl}`;
            property.images.forEach(img => {
                thumbnailImages += `<img src="http://localhost:8081${img.imageUrl}" alt="Property thumbnail" class="h-24 w-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity">`;
            });
        }

        // --- Owner Contact Info ---
        const ownerName = property.owner ? property.owner.fullName : 'N/A';
        const ownerPhone = property.owner ? property.owner.phoneNumber : 'N/A';

        // --- Full HTML Structure ---
        propertyDetailContainer.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Image Gallery -->
                    <div class="lg:col-span-2">
                        <img id="main-image" src="${mainImage}" alt="Main property image" class="w-full h-[500px] object-cover rounded-lg shadow-md mb-4">
                        <div id="thumbnail-container" class="grid grid-cols-4 gap-4">
                            ${thumbnailImages}
                        </div>
                    </div>

                    <!-- Property Info & Contact -->
                    <div>
                        <h1 class="text-4xl font-bold text-gray-800 mb-2">${property.address}</h1>
                        <p class="text-lg text-gray-600 mb-4">${property.city}, ${property.state} ${property.zipCode}</p>
                        
                        <div class="flex items-center text-2xl font-bold text-blue-600 mb-6">
                            $${property.rentPrice}/month
                        </div>

                        <div class="border-t pt-6">
                            <h2 class="text-xl font-semibold text-gray-700 mb-4">Property Details</h2>
                            <div class="flex justify-between text-md text-gray-800 mb-6">
                                <span><i class="fas fa-bed mr-2 text-gray-500"></i>${property.bedrooms} Bedrooms</span>
                                <span><i class="fas fa-bath mr-2 text-gray-500"></i>${property.bathrooms} Bathrooms</span>
                            </div>
                            <p class="text-gray-700 leading-relaxed">${property.description}</p>
                        </div>
                        
                        <div class="border-t mt-6 pt-6">
                             <h2 class="text-xl font-semibold text-gray-700 mb-4">Contact Owner</h2>
                             <div class="space-y-3">
                                <p class="text-gray-800"><i class="fas fa-user mr-2 text-gray-500"></i>${ownerName}</p>
                                <p class="text-gray-800"><i class="fas fa-phone mr-2 text-gray-500"></i>${ownerPhone}</p>
                                <button class="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 mt-4">Request a Tour</button>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners to thumbnails
        document.getElementById('thumbnail-container').addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG') {
                document.getElementById('main-image').src = event.target.src;
            }
        });
    }

    // Initial fetch of data when the page loads
    fetchAndDisplayPropertyDetails();
});