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

let leads = [];
let currentFilter = 'all';
let currentAgentFilter = 'all';

// Fonction pour charger les leads
async function loadLeads() {
    try {
        const userEmail = 'seb@clozr.com'; // Email de test
        const response = await fetch(`/api/leads?id=${userEmail}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des leads');
        }
        leads = await response.json();
        displayFilteredLeads();
        updateAgentList();
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour afficher les leads filtrés
function displayFilteredLeads() {
    console.log('📊 Affichage des leads');
    console.log('📊 Nombre total de leads:', leads.length);
    console.log('📊 Filtre actuel:', currentFilter);
    console.log('📊 Agent actuel:', currentAgentFilter);

    // Appliquer le filtre par agent
    let filteredByAgent = currentAgentFilter === 'all' 
        ? leads 
        : leads.filter(lead => lead.agent === currentAgentFilter);

    console.log('📊 Nombre de leads après filtre agent:', filteredByAgent.length);

    // Appliquer le filtre par statut
    if (currentFilter !== 'all') {
        filteredByAgent = filteredByAgent.filter(lead => 
            lead.status.toLowerCase() === currentFilter
        );
    }

    console.log('📊 Nombre de leads après filtre statut:', filteredByAgent.length);

    // Appliquer la recherche
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredByAgent = filteredByAgent.filter(lead => 
            lead.contact.toLowerCase().includes(searchTerm) ||
            lead.agent.toLowerCase().includes(searchTerm) ||
            lead.campaign.toLowerCase().includes(searchTerm)
        );
    }

    console.log('📊 Nombre de leads après recherche:', filteredByAgent.length);
    
    // Mettre à jour le compteur de leads
    const leadsCountElement = document.getElementById('leadsCount');
    if (leadsCountElement) {
        leadsCountElement.textContent = filteredByAgent.length;
    }

    // Mettre à jour le compteur total de leads
    const totalLeadsCounter = document.querySelector('.total-leads-counter');
    if (totalLeadsCounter) {
        totalLeadsCounter.textContent = filteredByAgent.length;
    }

    // Mettre à jour le titre de la box
    const boxTitle = document.querySelector('.box-title');
    if (boxTitle) {
        boxTitle.textContent = 'Total Leads Received';
    }

    displayLeads(filteredByAgent);
}

// Fonction pour afficher les leads dans le tableau
function displayLeads(leadsToShow) {
    const tbody = document.getElementById('leadsTableBody');
    if (!leadsToShow || leadsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-gray-500">
                    No leads found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = leadsToShow.map(lead => `
        <tr class="table-row">
            <td class="px-6 py-4">${lead.contact}</td>
            <td class="px-6 py-4">${new Date(lead.date).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <img src="/profile.svg" alt="${lead.agent}" class="agent-image">
                    <span>${lead.agent}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="status-badge status-${lead.status.toLowerCase()}">${lead.status}</span>
            </td>
            <td class="px-6 py-4">${lead.campaign}</td>
            <td class="px-6 py-4">${lead.budget}</td>
            <td class="px-6 py-4">${lead.timeline}</td>
            <td class="px-6 py-4">${lead.type}</td>
        </tr>
    `).join('');
}

// Fonction pour mettre à jour la liste des agents
function updateAgentList() {
    const agentList = document.getElementById('agentList');
    if (!agentList) return;

    const uniqueAgents = [...new Set(leads.map(lead => lead.agent))];
    agentList.innerHTML = uniqueAgents.map(agent => `
        <button class="w-full px-4 py-2 text-left hover:bg-[#F9FAFB]" data-agent="${agent}">
            ${agent}
        </button>
    `).join('');
}

// Fonction pour basculer le dropdown Assign to
function toggleAssignToDropdown() {
    const dropdown = document.getElementById('assignToDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Fonction pour filtrer par agent
function filterByAgent(agent) {
    currentAgentFilter = agent;
    const dropdown = document.getElementById('assignToDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    displayFilteredLeads();
}

// Événements
document.addEventListener('DOMContentLoaded', () => {
    loadLeads();

    // Filtres par statut
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-[#7F56D9]', 'text-white');
                btn.classList.add('bg-white', 'text-[#101828]');
            });
            button.classList.remove('bg-white', 'text-[#101828]');
            button.classList.add('bg-[#7F56D9]', 'text-white');
            currentFilter = button.dataset.filter;
            displayFilteredLeads();
        });
    });

    // Dropdown Assign to
    const assignToBtn = document.getElementById('assignToBtn');
    if (assignToBtn) {
        assignToBtn.addEventListener('click', toggleAssignToDropdown);
    }

    // Clic en dehors du dropdown pour le fermer
    document.addEventListener('click', (event) => {
        const dropdown = document.getElementById('assignToDropdown');
        const button = document.getElementById('assignToBtn');
        if (dropdown && !dropdown.contains(event.target) && !button.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Filtrage par agent
    document.getElementById('agentList')?.addEventListener('click', (event) => {
        if (event.target.dataset.agent) {
            filterByAgent(event.target.dataset.agent);
        }
    });

    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', displayFilteredLeads);
    }
}); 