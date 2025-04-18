import 'dotenv/config';
import { fetchAndConvert } from './1.js';
import { getAllBrokers } from './db.js';

async function updateData() {
    console.log('🔄 Démarrage de la mise à jour des données...');
    console.log('📊 Connexion à la base de données...');
    try {
        // Récupérer les données de DubaiLand
        await fetchAndConvert();
        
        // Vérifier le nombre d'agents mis à jour
        const brokers = await getAllBrokers();
        console.log(`✅ Mise à jour terminée : ${brokers.length} agents disponibles`);
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        return false;
    }
}

// Exécuter la mise à jour
updateData().then(success => {
    process.exit(success ? 0 : 1);
}); 