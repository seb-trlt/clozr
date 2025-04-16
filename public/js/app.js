// Variables globales
let leads = [];
let currentPage = 1;
const leadsPerPage = 10;
let currentFilter = 'all';
let currentAgentFilter = 'all';

// Fonction pour afficher les leads filtrés
function displayFilteredLeads() {
    let filteredLeads = leads;

    // Appliquer le filtre par statut
    if (currentFilter !== 'all') {
        filteredLeads = filteredLeads.filter(lead => {
            const leadStatus = lead.status?.toLowerCase() || 'new';
            return leadStatus === currentFilter;
        });
    }

    // Appliquer le filtre par agent
    if (currentAgentFilter !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.agent === currentAgentFilter);
    }

    // Appliquer la recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredLeads = filteredLeads.filter(lead => 
            lead.contact.toLowerCase().includes(searchTerm) ||
            lead.agent.toLowerCase().includes(searchTerm) ||
            lead.campaign.toLowerCase().includes(searchTerm)
        );
    }

    displayLeads(filteredLeads);
}

// Fonction pour afficher les leads dans le tableau
function displayLeads(leadsToShow) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    if (!leadsToShow || leadsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-gray-500">
                    No leads found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = leadsToShow.map(lead => `
        <tr>
            <td colspan="9" class="p-0">
                <div style="width: 100%; height: 100%; padding-left: 15px; padding-right: 15px; padding-top: 12px; padding-bottom: 12px; justify-content: flex-start; align-items: center; gap: 18px; display: inline-flex">
                    <div style="width: 10px; height: 10px; border-radius: 2px; outline: 1px var(--Border-+-Light-Field-Text, #D0D5DD) solid"></div>
                    <div data-property-1="no filter" style="width: 150px; justify-content: flex-start; align-items: center; gap: 8px; display: flex">
                        <div style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 500; word-wrap: break-word">${lead.contact}</div>
                    </div>
                    <div data-property-1="no filter" style="width: 150px; justify-content: flex-start; align-items: center; gap: 8px; display: flex">
                        <div><span style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 400; line-height: 14px; word-wrap: break-word">${new Date(lead.date || lead.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}<br/></span><span style="color: #248EF3; font-size: 11px; font-family: Roboto; font-weight: 400; line-height: 14px; word-wrap: break-word">${new Date(lead.date || lead.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (+04)</span></div>
                    </div>
                    <div style="width: 120px; padding-left: 10px; padding-right: 10px; padding-top: 8px; padding-bottom: 8px; background: white; border-radius: 5px; justify-content: space-between; align-items: center; display: flex">
                        <div style="justify-content: flex-start; align-items: center; gap: 5px; display: flex">
                            <img style="width: 16px; height: 16px; background: #D9D9D9; border-radius: 9999px" src="/profile.svg" />
                            <div style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 400; line-height: 15.40px; word-wrap: break-word">${lead.agent}</div>
                        </div>
                        <div style="width: 14px; height: 14px; position: relative; transform: rotate(180deg); transform-origin: top left; opacity: 0; overflow: hidden">
                            <div style="width: 9.33px; height: 4.67px; left: 2.33px; top: 5.25px; position: absolute; outline: 1.17px var(--Dark-Grey-text-&-icons, #4C5563) solid; outline-offset: -0.58px"></div>
                        </div>
                    </div>
                    <div data-property-1="no filter" style="width: 10px; justify-content: flex-start; align-items: center; gap: 8px; display: flex"></div>
                    <div style="width: 100px; padding-left: 10px; padding-right: 10px; padding-top: 8px; padding-bottom: 8px; background: #F2F4F7; border-radius: 34px; justify-content: flex-start; align-items: center; gap: 5px; display: flex">
                        <div style="width: 8px; height: 8px; background: ${lead.status?.toLowerCase() === 'contested' ? '#FF4D4D' : lead.status?.toLowerCase() === 'processed' ? '#55DD79' : '#FF9D00'}; border-radius: 9999px"></div>
                        <div style="justify-content: flex-start; align-items: center; gap: 5px; display: flex">
                            <div style="color: #4C5563; font-size: 13px; font-family: Roboto; font-weight: 600; line-height: 15.40px; word-wrap: break-word">${lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'New Lead'}</div>
                        </div>
                    </div>
                    <div data-property-1="no filter" style="width: 10px; justify-content: flex-start; align-items: center; gap: 8px; display: flex"></div>
                    <div data-property-1="no filter" style="width: 160px; justify-content: flex-start; align-items: center; gap: 8px; display: flex">
                        <div style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 400; word-wrap: break-word">${lead.campaign || '—'}</div>
                    </div>
                    <div data-property-1="no filter" style="width: 90px; justify-content: flex-start; align-items: center; gap: 8px; display: flex">
                        <div style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 400; word-wrap: break-word">${lead.budget === 'OK' ? '—' : lead.budget || '—'}</div>
                    </div>
                    <div data-property-1="no filter" style="width: 90px; justify-content: flex-start; align-items: center; gap: 8px; display: flex">
                        <div style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 400; word-wrap: break-word">${lead.timeline === 'OK' ? '—' : lead.timeline || '—'}</div>
                    </div>
                    <div data-property-1="no filter" style="width: 150px; justify-content: flex-start; align-items: center; gap: 8px; display: flex">
                        <div style="color: var(--Dark-Grey-text-&-icons, #4C5563); font-size: 13px; font-family: Roboto; font-weight: 400; word-wrap: break-word">${lead.type === 'OK' ? '—' : lead.type || '—'}</div>
                    </div>
                    <div style="flex: 1 1 0; justify-content: flex-end; align-items: center; gap: 8px; display: flex">
                        ${lead.status?.toLowerCase() !== 'contested' ? `
                            <div onclick="openClaimPopup(${JSON.stringify(lead).replace(/"/g, '&quot;')})" style="width: 24px; height: 24px; position: relative; background: #F2F4F7; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                                <div style="display: flex; gap: 2px;">
                                    <div style="width: 3px; height: 3px; background: #65757D; border-radius: 50%;"></div>
                                    <div style="width: 3px; height: 3px; background: #65757D; border-radius: 50%;"></div>
                                    <div style="width: 3px; height: 3px; background: #65757D; border-radius: 50%;"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Fonction pour mettre à jour la liste des agents
function updateAgentList() {
    const agentList = document.getElementById('agentList');
    if (!agentList) return;

    const uniqueAgents = [...new Set(leads.map(lead => lead.agent))];
    agentList.innerHTML = uniqueAgents.map(agent => `
        <button class="w-full px-4 py-2 text-left hover:bg-gray-50" data-agent="${agent}">
            ${agent}
        </button>
    `).join('');
}

// Fonction pour mettre à jour le compteur de leads total
function updateTotalLeadsCounter(count) {
    const totalLeadsCounter = document.getElementById('totalLeadsCounter');
    if (totalLeadsCounter) {
        totalLeadsCounter.textContent = count;
    }
}

// Fonction pour mettre à jour le compteur de leads restants
function updateRemainingLeadsCounter(receivedCount) {
    const remainingLeadsCounter = document.getElementById('remainingLeadsCounter');
    if (remainingLeadsCounter) {
        const monthlyOrder = 500; // Nombre de leads commandés par mois
        const remaining = monthlyOrder - receivedCount;
        remainingLeadsCounter.textContent = remaining > 0 ? remaining : 0;
    }
}

// Fonction pour mettre à jour le compteur de leads dans la pagination
function updateLeadsCount(count) {
    const leadsCount = document.getElementById('leadsCount');
    if (leadsCount) {
        leadsCount.textContent = count;
    }
}

// Fonction pour charger les leads
async function loadLeads() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const userEmail = urlParams.get('id');
        
        console.log('🔍 Chargement des leads...');
        console.log('- URL actuelle:', window.location.href);
        console.log('- Paramètres:', urlParams.toString());
        console.log('- Email:', userEmail);
        
        if (!userEmail) {
            console.log('❌ Pas d\'email fourni dans l\'URL');
            updateTotalLeadsCounter(0);
            updateRemainingLeadsCounter(0);
            updateLeadsCount(0);
            return;
        }
        
        const response = await fetch(`/api/leads?id=${encodeURIComponent(userEmail)}`);
        console.log('🔍 Statut de la réponse:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Erreur API:', error);
            updateTotalLeadsCounter(0);
            updateRemainingLeadsCounter(0);
            updateLeadsCount(0);
            throw new Error(error.error || 'Erreur lors du chargement des leads');
        }
        
        const data = await response.json();
        console.log('📊 Données reçues:', data);
        
        // Normaliser les statuts des leads
        leads = data.map(lead => ({
            ...lead,
            status: lead.status?.toLowerCase() || 'new'
        }));
        
        console.log('📊 Leads normalisés:', leads);
        console.log('📊 Nombre de leads chargés:', leads.length);
        
        // Mettre à jour les compteurs
        updateTotalLeadsCounter(leads.length || 0);
        updateRemainingLeadsCounter(leads.length || 0);
        updateLeadsCount(leads.length || 0);
        
        displayFilteredLeads();
        updateAgentList();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        updateTotalLeadsCounter(0);
        updateRemainingLeadsCounter(0);
        updateLeadsCount(0);
        const tbody = document.getElementById('leadsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-red-500">
                        ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Configuration des événements
function setupEventListeners() {
    // Filtres par statut
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-[#7F56D9]', 'text-white');
                btn.classList.add('bg-white', 'text-[#101828]');
            });
            button.classList.remove('bg-white', 'text-[#101828]');
            button.classList.add('bg-[#7F56D9]', 'text-white');
            currentFilter = button.dataset.status;
            displayFilteredLeads();
        });
    });

    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            displayFilteredLeads();
        });
    }

    // Filtrage par agent
    const agentList = document.getElementById('agentList');
    if (agentList) {
        agentList.addEventListener('click', (event) => {
            const agent = event.target.dataset.agent;
            if (agent) {
                currentAgentFilter = agent;
                displayFilteredLeads();
            }
        });
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Initialisation de l\'application...');
    setupEventListeners();
    loadLeads();
});

// Déclaration des types pour TypeScript
window.filterLeads = function(status) {
    currentFilter = status;
    
    // Mettre à jour les classes des boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-[#7F56D9]', 'text-white');
        btn.classList.add('bg-white', 'text-[#101828]');
        
        if (btn.dataset.status === status) {
            btn.classList.remove('bg-white', 'text-[#101828]');
            btn.classList.add('bg-[#7F56D9]', 'text-white');
        }
    });
    
    displayFilteredLeads();
};

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

// Fonction pour ouvrir le popup de réclamation
function openClaimPopup(lead) {
    window.currentLead = lead; // Stocker le lead actuel
    const popup = document.getElementById('claimPopup');
    if (popup) {
        popup.classList.remove('hidden');
        // Mettre à jour les informations du lead dans le popup
        const leadName = popup.querySelector('.lead-name');
        const leadDate = popup.querySelector('.lead-date');
        if (leadName) leadName.textContent = lead.contact;
        if (leadDate) leadDate.textContent = new Date(lead.date || lead.created_at).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) + ' (+04)';
    }
}

// Fonction pour fermer le popup de réclamation
function closeClaimPopup() {
    const popup = document.getElementById('claimPopup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

// Fonction pour soumettre une réclamation
async function updateLeadStatus(leadId, status, reason, comment) {
    try {
        const response = await fetch('/api/leads/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                leadId,
                status,
                reason,
                comment
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du statut');
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

function submitClaim() {
    const details = document.getElementById('claimDetails').value;
    const reason = document.querySelector('select').value;
    
    if (reason === 'Select a reason') {
        alert('Veuillez sélectionner une raison pour votre réclamation');
        return;
    }

    // Récupérer l'ID du lead actuel
    const currentLead = window.currentLead;
    if (!currentLead) {
        console.error('Aucun lead sélectionné');
        return;
    }

    // Mettre à jour le statut dans Airtable
    updateLeadStatus(currentLead.id, 'contested', reason, details || '')
        .then(() => {
            // Fermer le popup de réclamation
            closeClaimPopup();
            
            // Afficher le popup de succès
            const successPopup = document.getElementById('claimSuccessPopup');
            successPopup.classList.remove('hidden');

            // Recharger les leads pour mettre à jour l'affichage
            loadLeads();
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour du statut:', error);
            alert('Une erreur est survenue lors de la soumission du claim');
        });
}

function closeSuccessPopup() {
    const successPopup = document.getElementById('claimSuccessPopup');
    successPopup.classList.add('hidden');
}