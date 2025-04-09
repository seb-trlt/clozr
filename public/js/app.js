// Déclaration des types pour TypeScript
window.filterLeads = function(status) {
    // Implémentation à venir
};

// Données de test
const leads = [
    {
        contact: "John Smith",
        date: "2024-03-15",
        assignedTo: "Alice Johnson",
        status: "new",
        campaign: "Spring 2024",
        budget: "$5,000",
        timeline: "3 months",
        purchaseType: "Service"
    },
    // ... autres leads ...
];

let currentPage = 1;
const leadsPerPage = 10;

// Fonction pour afficher les leads
function displayLeads(leadsToShow) {
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const start = (currentPage - 1) * leadsPerPage;
    const end = start + leadsPerPage;
    const paginatedLeads = leadsToShow.slice(start, end);

    paginatedLeads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4">${lead.contact}</td>
            <td class="px-6 py-4">${lead.date}</td>
            <td class="px-6 py-4">${lead.assignedTo}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${
                    lead.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }">${lead.status}</span>
            </td>
            <td class="px-6 py-4">${lead.campaign}</td>
            <td class="px-6 py-4">${lead.budget}</td>
            <td class="px-6 py-4">${lead.timeline}</td>
            <td class="px-6 py-4">${lead.purchaseType}</td>
            <td class="px-6 py-4">
                <button class="text-blue-600 hover:text-blue-800">View</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updatePagination(leadsToShow.length);
}

// Fonction pour mettre à jour la pagination
function updatePagination(totalLeads) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    const totalPages = Math.ceil(totalLeads / leadsPerPage);
    
    paginationDiv.innerHTML = `
        <button 
            class="px-4 py-2 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}"
            ${currentPage === 1 ? 'disabled' : ''}
            onclick="changePage(${currentPage - 1})"
        >
            Previous
        </button>
        <span class="px-4 py-2">Page ${currentPage} of ${totalPages}</span>
        <button 
            class="px-4 py-2 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}"
            ${currentPage === totalPages ? 'disabled' : ''}
            onclick="changePage(${currentPage + 1})"
        >
            Next
        </button>
    `;
}

// Fonction pour changer de page
window.changePage = function(newPage) {
    if (newPage >= 1 && newPage <= Math.ceil(leads.length / leadsPerPage)) {
        currentPage = newPage;
        displayLeads(leads);
    }
};

// Fonction de filtrage
window.filterLeads = function(status) {
    const buttons = document.querySelectorAll('.filter-button');
    buttons.forEach(button => button.classList.remove('active'));
    event.target.classList.add('active');

    const filteredLeads = status === 'all' 
        ? leads 
        : leads.filter(lead => lead.status === status);
    
    currentPage = 1;
    displayLeads(filteredLeads);
};

// Fonction de recherche
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredLeads = leads.filter(lead => 
        lead.contact.toLowerCase().includes(searchTerm) ||
        lead.campaign.toLowerCase().includes(searchTerm) ||
        lead.assignedTo.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayLeads(filteredLeads);
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayLeads(leads);
}); 