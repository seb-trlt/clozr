import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clé API Autom.dev
const apiKey = 'f9282fe0-7e68-47fc-9014-6403b347a569';

// Fonction pour récupérer le résultat de recherche
async function fetchSearchResult(query) {
    const url = 'https://autom.dev/api/v1/google/search';
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
    };

    const data = { 
        query: `${query} real estate agent dubai website`,
        num: 1 
    };

    try {
        const response = await axios.post(url, data, { 
            headers, 
            timeout: 20000
        });

        if (!response.data.organic_results || response.data.organic_results.length === 0) {
            return null;
        }

        const firstResult = response.data.organic_results[0];
        return {
            query,
            website_url: firstResult.link,
            title: firstResult.title,
            snippet: firstResult.snippet
        };
    } catch (error) {
        console.error(`❌ Erreur pour : ${query}`, error.message);
        return null;
    }
}

// Fonction pour mettre à jour le fichier brokers.json avec les sites web
export async function updateBrokersWithWebsites() {
    try {
        // Lire le fichier brokers.json
        const filePath = path.join(__dirname, 'brokers.json');
        let brokers = [];
        
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            brokers = JSON.parse(data);
        }

        console.log(`📄 ${brokers.length} agents trouvés dans brokers.json`);

        // Filtrer les agents qui n'ont pas encore de site web
        const agentsToProcess = brokers.filter(broker => !broker.website_url);
        console.log(`🔍 ${agentsToProcess.length} agents à traiter`);

        // Traiter chaque agent
        for (let i = 0; i < agentsToProcess.length; i++) {
            const broker = agentsToProcess[i];
            console.log(`\n🔍 Traitement de l'agent ${i + 1}/${agentsToProcess.length} : ${broker.OfficeNameEn}`);

            const result = await fetchSearchResult(broker.OfficeNameEn);
            
            if (result) {
                // Mettre à jour l'agent dans le tableau
                const brokerIndex = brokers.findIndex(b => b.CardNumber === broker.CardNumber);
                if (brokerIndex !== -1) {
                    brokers[brokerIndex] = {
                        ...brokers[brokerIndex],
                        website_url: result.website_url,
                        website_title: result.title,
                        website_snippet: result.snippet
                    };
                }
                console.log('✅ Site web trouvé :', result.website_url);
            } else {
                console.log('❌ Pas de site web trouvé');
            }

            // Sauvegarder les modifications toutes les 10 agents
            if ((i + 1) % 10 === 0 || i === agentsToProcess.length - 1) {
                fs.writeFileSync(filePath, JSON.stringify(brokers, null, 2));
                console.log('💾 Fichier brokers.json mis à jour');
            }

            // Petit délai avant la prochaine requête
            if (i + 1 < agentsToProcess.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('\n✅ Traitement terminé !');
    } catch (error) {
        console.error('❌ Erreur lors du traitement:', error);
    }
}

// Exécuter le script si lancé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updateBrokersWithWebsites();
} 