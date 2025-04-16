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

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
}); 