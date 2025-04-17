require('dotenv').config();
const express = require('express');
const path = require('path');
const Airtable = require('airtable');
const fs = require('fs');
const app = express();
const port = 3000;

// Configuration Airtable
console.log('🔑 Variables d\'environnement:');
console.log('AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY ? '✅ Présent' : '❌ Manquant');
console.log('AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? '✅ Présent' : '❌ Manquant');

const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

const tableName = process.env.AIRTABLE_TABLE_NAME || 'tblcKOiISqb8Ic0c1';

// Middleware pour parser le JSON
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Fonction pour analyser la structure des champs
async function analyzeAirtableStructure() {
    try {
        console.log('🔍 Analyse de la structure Airtable...');
        const records = await base(tableName).select({
            view: 'viwOVH7kYzXCfegT7',
            maxRecords: 1
        }).firstPage();

        if (records.length > 0) {
            const fields = records[0].fields;
            console.log('📊 Structure des champs trouvés:');
            Object.keys(fields).forEach(fieldName => {
                console.log(`   - ${fieldName}:`, {
                    type: typeof fields[fieldName],
                    value: fields[fieldName],
                    isArray: Array.isArray(fields[fieldName])
                });
            });
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse de la structure:', error);
    }
}

// Appel de l'analyse au démarrage du serveur
analyzeAirtableStructure();

// Route pour la page d'accueil
app.get('/', (req, res) => {
    console.log('📍 Requête reçue sur /');
    console.log('📍 URL complète:', req.url);
    console.log('📍 Query string:', req.query);
    
    // Servir directement la page sans redirection
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour récupérer les leads depuis Airtable
app.get('/api/leads', async (req, res) => {
    try {
        const userEmail = req.query.id.toLowerCase();
        console.log('\n🔍 Nouvelle requête sur /api/leads');
        console.log('🔍 URL complète:', req.protocol + '://' + req.get('host') + req.originalUrl);
        console.log('🔍 Email reçu:', userEmail);
        
        if (!userEmail) {
            console.log('❌ Pas d\'email fourni');
            return res.status(400).json({ error: 'Email requis' });
        }

        console.log('🔍 Configuration Airtable:');
        console.log('- Base ID:', process.env.AIRTABLE_BASE_ID);
        console.log('- Table:', tableName);
        console.log('- View:', 'viwOVH7kYzXCfegT7');

        const records = await base(tableName).select({
            view: 'viwOVH7kYzXCfegT7'
        }).all();
        
        console.log('📊 Total records trouvés:', records.length);
        
        // Vérifier l'accès de l'utilisateur
        const accessibleRecords = records.filter(record => {
            const usersAdmin = record.fields['Users Admin'] || '';
            const emails = usersAdmin.split(',').map(email => email.trim().toLowerCase());
            console.log('📧 Emails extraits:', emails);
            return emails.includes(userEmail);
        });
        
        console.log('📊 Nombre d\'enregistrements accessibles:', accessibleRecords.length);
        
        const leads = accessibleRecords.map(record => {
            const lead = {
                id: record.id,
                contact: `${record.fields['First name'] || ''} ${record.fields['Last name'] || ''}`.trim(),
                date: record.fields['Created'],
                created_at: record.fields['created_at'],
                agent: record.fields['agent'],
                status: record.fields['status'] || 'New',
                campaign: record.fields['State'],
                budget: record.fields['Question 1'],
                timeline: record.fields['Question 2'],
                type: record.fields['Question 3']
            };
            console.log('📄 Lead transformé:', lead);
            return lead;
        });
        
        console.log('\n📊 Leads à envoyer:', leads.length);
        res.json(leads);
        
    } catch (error) {
        console.error('\n❌ Erreur détaillée:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.post('/api/leads/status', async (req, res) => {
    try {
        const { leadId, status, reason, comment } = req.body;
        
        if (!leadId || !status) {
            return res.status(400).json({ error: 'ID du lead et statut requis' });
        }

        // Utiliser 'Contested' comme valeur de statut
        const statusValue = 'Contested';

        // Mettre à jour le statut dans Airtable
        const record = await base('Leads').update(leadId, {
            'status': statusValue,
            'Claim Reason': reason,
            'Claim Comment': comment
        });

        res.json({ success: true, record });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
});

// Endpoint pour récupérer les prix des campagnes
app.get('/api/campaign-prices', async (req, res) => {
    try {
        console.log('🔍 Début de la récupération des prix des campagnes...');
        const records = await base('Campaigns').select({
            view: 'viw641o48FQXz2L93'
        }).all();

        console.log('📊 Nombre d\'enregistrements trouvés:', records.length);
        
        const prices = {};
        records.forEach(record => {
            const campaignName = record.get('Campaign Name');
            const price = record.get('Default price per lead');
            console.log(`📝 Campagne: ${campaignName}, Prix: ${price}`);
            
            if (campaignName && price) {
                const key = campaignName.toLowerCase().replace(' campaign', '');
                prices[key] = price;
                console.log(`✅ Prix ajouté pour ${key}: ${price}`);
            }
        });

        console.log('💰 Prix finaux:', prices);
        res.json(prices);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des prix:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des prix' });
    }
});

// Endpoint pour récupérer les statuts des campagnes
app.get('/api/campaign-status', async (req, res) => {
    try {
        console.log('🔍 Début de la récupération des statuts des campagnes...');
        const records = await base('Campaigns').select({
            view: 'viw641o48FQXz2L93'
        }).all();

        console.log('📊 Nombre d\'enregistrements trouvés:', records.length);
        
        const campaigns = records.map(record => {
            const campaignName = record.get('Campaign Name');
            const status = record.get('Status');
            const price = record.get('Default price per lead');
            
            console.log(`📝 Campagne: ${campaignName}, Statut: ${status}, Prix: ${price}`);
            
            return {
                'Campaign Name': campaignName,
                'Status': status,
                'Default price per lead': price
            };
        });

        console.log('📊 Campagnes récupérées:', JSON.stringify(campaigns, null, 2));
        res.json(campaigns);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statuts:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statuts' });
    }
});

// Endpoint pour récupérer les informations de l'utilisateur
app.get('/api/user-info', async (req, res) => {
    try {
        const { email } = req.query;
        console.log('🔍 Recherche des informations pour l\'utilisateur:', email);

        // Récupérer d'abord les campagnes pour avoir la correspondance ID -> Nom
        const campaignRecords = await base('Campaigns').select({
            view: 'viw641o48FQXz2L93'
        }).all();
        
        const campaignMap = {};
        campaignRecords.forEach(record => {
            campaignMap[record.id] = record.get('Campaign Name');
        });

        const records = await base('tblXkF8FJy5tKFFxC').select({
            view: 'viwUHUxKFjqekH91n'
        }).all();

        // Créer un objet pour stocker les informations des utilisateurs
        const usersInfo = {};

        records.forEach(record => {
            const usersAdmin = record.fields['Users Admin'] || '';
            const emails = usersAdmin.split(',').map(e => e.trim().toLowerCase());
            
            if (emails.includes(email.toLowerCase())) {
                const userName = record.fields['User Name'];
                const leadRepartition = parseFloat(record.fields['Lead repartition']) || 0;
                const campaignId = record.fields['Campaign'];
                const campaignName = campaignMap[campaignId];
                
                // Convertir le pourcentage en valeur entière (multiplier par 100)
                const percentage = Math.round(leadRepartition * 100);
                
                console.log(`📊 Utilisateur: ${userName}, Répartition: ${percentage}%, Campagne: ${campaignName} (ID: ${campaignId})`);
                
                if (userName && campaignName) {
                    if (!usersInfo[campaignName]) {
                        usersInfo[campaignName] = [];
                    }
                    usersInfo[campaignName].push({
                        name: userName,
                        percentage: percentage
                    });
                }
            }
        });

        console.log('✅ Informations utilisateurs trouvées:', JSON.stringify(usersInfo, null, 2));
        res.json(usersInfo);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des informations utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Endpoint pour mettre à jour les pourcentages de répartition
app.post('/api/update-percentage', async (req, res) => {
    try {
        const { email, campaignName, userName, percentage } = req.body;
        
        // Normaliser le nom de la campagne
        const normalizedCampaignName = campaignName
            .replace('Uk', 'UK')
            .replace('Uae', 'UAE')
            .replace('uk', 'UK')
            .replace('uae', 'UAE');

        console.log('🔄 Mise à jour du pourcentage:', { 
            email, 
            campaignName: normalizedCampaignName, 
            userName, 
            percentage
        });

        // Rechercher l'enregistrement à mettre à jour directement avec le nom de la campagne
        const records = await base('tblXkF8FJy5tKFFxC').select({
            view: 'viwUHUxKFjqekH91n',
            filterByFormula: `AND(
                FIND('${email}', {Users Admin}) > 0,
                FIND('${normalizedCampaignName}', {Campaign}) > 0,
                FIND('${userName}', {User Name}) > 0
            )`
        }).all();

        // Afficher tous les enregistrements trouvés pour debug
        console.log('🔍 Tous les enregistrements trouvés:');
        records.forEach(record => {
            console.log({
                id: record.id,
                campaign: record.get('Campaign'),
                campaignExact: `"${record.get('Campaign')}"`,
                campaignLength: record.get('Campaign')?.length,
                userName: record.get('User Name'),
                usersAdmin: record.get('Users Admin')
            });
        });

        console.log('🔍 Recherche de l\'enregistrement avec les critères:', {
            email,
            campaignName: normalizedCampaignName,
            userName,
            nombreEnregistrements: records.length
        });

        if (records.length === 0) {
            console.error('❌ Aucun enregistrement trouvé pour la mise à jour');
            return res.status(404).json({ error: 'Enregistrement non trouvé' });
        }

        // Mettre à jour l'enregistrement
        const record = records[0];
        console.log('📝 Enregistrement trouvé:', record.id);
        
        const updatedRecord = await base('tblXkF8FJy5tKFFxC').update(record.id, {
            'Lead repartition': percentage / 100 // Convertir en décimal
        });

        console.log('✅ Enregistrement mis à jour:', updatedRecord);
        res.json({ success: true, record: updatedRecord });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
}); 