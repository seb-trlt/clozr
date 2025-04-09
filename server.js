const express = require('express');
const path = require('path');
const Airtable = require('airtable');
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
app.use(express.static(path.join(__dirname)));

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

// Route pour récupérer les leads depuis Airtable
app.get('/api/leads', async (req, res) => {
    try {
        console.log('🔍 URL complète:', req.protocol + '://' + req.get('host') + req.originalUrl);
        console.log('🔍 Paramètres de requête:', req.query);
        console.log('🔍 Headers:', req.headers);
        
        const userEmail = req.query.id;
        console.log('🔍 Email utilisateur reçu:', userEmail);
        
        if (!userEmail) {
            console.log('❌ Aucun email utilisateur fourni');
            return res.status(400).json({ error: 'Email utilisateur requis' });
        }
        
        // Récupérer tous les leads
        const records = await base(tableName).select({
            view: 'viwOVH7kYzXCfegT7'
        }).all();
        
        console.log('📊 Nombre total de leads trouvés:', records.length);
        
        // Fonction pour vérifier si l'utilisateur a accès au lead
        const hasAccess = (record) => {
            const usersAdmin = record.get('Users Admin');
            console.log('🔍 Users Admin:', usersAdmin);
            console.log('🔍 Email recherché:', userEmail);
            
            if (!usersAdmin) return false;
            
            // Convertir en tableau si ce n'est pas déjà le cas
            const emails = Array.isArray(usersAdmin) ? usersAdmin : usersAdmin.split(',');
            console.log('🔍 Emails trouvés:', emails);
            
            // Vérifier si l'email est dans la liste
            const hasAccess = emails.includes(userEmail);
            console.log('🔍 Accès trouvé:', hasAccess);
            
            return hasAccess;
        };
        
        // Filtrer les leads selon l'accès de l'utilisateur
        const filteredRecords = records.filter(hasAccess);
        console.log('📊 Nombre de leads après filtrage:', filteredRecords.length);
        
        // Transformer les records en format plus simple
        const leads = filteredRecords.map(record => ({
            id: record.id,
            contact: `${record.get('First name') || ''} ${record.get('Last name') || ''}`.trim() || '—',
            date: record.get('Created') || new Date().toISOString(),
            agent: record.get('agent') || '—',
            status: record.get('Status') || 'New',
            campaign: record.get('State') || '—',
            budget: record.get('Question 1') || '—',
            timeline: record.get('Question 2') || '—',
            type: record.get('Question 3') || '—'
        }));
        
        res.json(leads);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des leads:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
}); 