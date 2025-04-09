// Variables globales
let currentPage = 1;
const leadsPerPage = 10;
let totalPages = 1;
let currentFilter = 'all';
let currentAgentFilter = 'all';
let filteredLeads = [];
let leads = [];

// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// Fonction pour formater l'heure
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + '+02';
}

// Fonction pour formater le montant en USD
function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Function to load leads
function loadLeads() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    if (!userId) {
        console.error('❌ Aucun ID utilisateur trouvé dans l\'URL');
        return;
    }

    console.log('🔍 Chargement des leads pour l\'utilisateur:', userId);
    
    fetch(`/api/leads?id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            return response.json();
        })
        .then(data => {
            console.log('📊 Données reçues:', data);
            leads = data;
            filteredLeads = [...leads];
            displayFilteredLeads();
        })
        .catch(error => {
            console.error('❌ Erreur lors du chargement des leads:', error);
        });
}

// Function to toggle all checkboxes
function toggleAllCheckboxes() {
    const mainCheckbox = document.querySelector('thead input[type="checkbox"]');
    const allCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = mainCheckbox.checked;
    });
}

// Function to display leads
function displayLeads(leadsToShow) {
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) {
        console.error('❌ Table body not found');
        return;
    }

    tableBody.innerHTML = '';

    if (!leadsToShow || leadsToShow.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" class="px-6 py-4 text-center text-gray-500">
                No leads found
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }

    console.log('📊 Affichage de', leadsToShow.length, 'leads');

    leadsToShow.forEach(lead => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Déterminer la couleur du point en fonction du statut
        let statusColor = '#FF9D00'; // Couleur par défaut pour New
        if (lead.status === 'Processed') {
            statusColor = '#00BFA5'; // Vert pour Processed
        } else if (lead.status === 'Contested') {
            statusColor = '#FF0000'; // Rouge pour Contested
        }
        
        // Fonction pour gérer l'affichage des questions
        const formatQuestion = (value) => {
            return value === 'OK' ? '—' : (value || '—');
        };
        
        row.innerHTML = `
            <td class="px-6 py-3 text-left">
                <input type="checkbox" class="h-4 w-4 text-blue-600 rounded border-gray-300">
            </td>
            <td class="px-6 py-3 text-left">
                <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[14px]">${lead.contact}</span>
            </td>
            <td class="px-6 py-3 text-left">
                <div class="w-full h-full inline-flex justify-start items-center gap-2">
                    <div>
                        <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[14px] block">${formatDate(lead.date)}</span>
                        <span class="text-[#248EF3] text-[11px] font-normal font-['Roboto'] leading-[14px] block">${formatTime(lead.date)}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3 text-left">
                <div class="inline-flex px-[10px] py-[8px] bg-white rounded-[5px] justify-between items-center">
                    <div class="flex items-center gap-[5px]">
                        <img class="w-4 h-4 rounded-full object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&auto=format" alt="${lead.agent}" />
                        <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[15.4px]">${lead.agent}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3 text-left">
                <div class="inline-flex px-[10px] py-[8px] bg-[#F2F4F7] rounded-[34px] justify-start items-center gap-[5px]">
                    <div class="w-[8px] h-[8px] rounded-full" style="background-color: ${statusColor}"></div>
                    <div class="text-[#4C5563] text-[13px] font-semibold font-['Roboto'] leading-[15.4px]">${lead.status}</div>
                </div>
            </td>
            <td class="px-6 py-3 text-left">
                <div class="inline-flex px-[10px] py-[8px] bg-white rounded-[5px] justify-between items-center">
                    <div class="flex items-center gap-[5px]">
                        <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[15.4px]">${lead.campaign || '—'}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3 text-left">
                <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[14px]">${formatQuestion(lead.budget)}</span>
            </td>
            <td class="px-6 py-3 text-left">
                <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[14px]">${formatQuestion(lead.timeline)}</span>
            </td>
            <td class="px-6 py-3 text-left">
                <span class="text-[#4C5563] text-[13px] font-normal font-['Roboto'] leading-[14px]">${formatQuestion(lead.type)}</span>
            </td>
            <td class="px-6 py-3 text-center">
                <button class="action-button w-6 h-6 bg-[#F2F4F7] rounded-full inline-flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="3" cy="6" r="1" fill="#65757D"></circle>
                        <circle cx="6" cy="6" r="1" fill="#65757D"></circle>
                        <circle cx="9" cy="6" r="1" fill="#65757D"></circle>
                    </svg>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to display paginated leads (renamed to displayFilteredLeads)
function displayFilteredLeads() {
    console.log('📊 Affichage des leads');
    console.log('📊 Nombre total de leads:', filteredLeads.length);
    console.log('📊 Filtre actuel:', currentFilter);
    console.log('📊 Agent actuel:', currentAgentFilter);

    // Appliquer le filtre par agent
    let filteredByAgent = currentAgentFilter === 'all' 
        ? filteredLeads 
        : filteredLeads.filter(lead => lead.agent === currentAgentFilter);

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

// Function to filter leads
function filterLeads(status) {
    currentFilter = status;
    
    // Mettre à jour l'état actif des boutons
    document.querySelectorAll('.filter-btn').forEach(button => {
        if (button.getAttribute('data-status') === status) {
            button.classList.add('bg-blue-50', 'text-blue-600', 'hover:bg-blue-50', 'hover:text-blue-600');
            button.classList.remove('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-600');
        } else {
            button.classList.remove('bg-blue-50', 'text-blue-600', 'hover:bg-blue-50', 'hover:text-blue-600');
            button.classList.add('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-600');
        }
    });
    
    displayFilteredLeads();
}

// Fonction pour basculer l'affichage du menu déroulant
function toggleAssignToDropdown() {
    const dropdown = document.getElementById('assignToDropdown');
    dropdown.classList.toggle('hidden');
}

// Fermer le menu déroulant quand on clique ailleurs
document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('assignToDropdown');
    const assignToBtn = document.querySelector('.assign-to-btn');
    
    if (!dropdown.contains(event.target) && !assignToBtn.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// Fonction pour mettre à jour la liste des agents
function updateAgentList(leads) {
    const agentList = document.getElementById('agentList');
    const uniqueAgents = [...new Set(leads.map(lead => lead.agent))].filter(agent => agent && agent !== 'Non assigné');
    
    agentList.innerHTML = uniqueAgents.map(agent => `
        <button onclick="filterByAgent('${agent}')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
            ${agent}
        </button>
    `).join('');
}

// Function to filter by agent
function filterByAgent(agent) {
    currentAgentFilter = agent;
    const assignToBtn = document.querySelector('.assign-to-btn');
    assignToBtn.textContent = agent === 'all' ? 'Assign to' : `Assign to: ${agent}`;
    
    document.getElementById('assignToDropdown').classList.add('hidden');
    displayFilteredLeads();
}

// Charger les leads au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadLeads();
    
    // Initialiser le filtre "Assign to"
    const assignToBtn = document.querySelector('.assign-to-btn');
    if (assignToBtn) {
        assignToBtn.textContent = 'Assign to';
    }

    // Ajouter l'événement pour la case à cocher principale
    const mainCheckbox = document.querySelector('thead input[type="checkbox"]');
    if (mainCheckbox) {
        mainCheckbox.addEventListener('change', toggleAllCheckboxes);
    }

    // Ajouter l'événement pour la recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            displayFilteredLeads();
        });
    }
});

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
} 