import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAndConvert } from './1.js';
import { updateBrokersWithWebsites } from './agent_search.js';
import { getAllBrokers } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stockage des logs
const logs = [];

// Ajouter un cache pour les données
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fonction pour ajouter un log
function addLog(message, type = 'info') {
    const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
    };
    logs.push(logEntry);
    
    // Garder seulement les 50 derniers logs
    if (logs.length > 50) {
        logs.shift();
    }

    // Afficher dans la console du serveur
    console.log(`${logEntry.timestamp} - ${message}`);
}

const server = http.createServer(async (req, res) => {
    // Gérer les requêtes OPTIONS pour CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    try {
        if (req.url === '/') {
            // Servir le fichier index.html
            const filePath = path.join(__dirname, 'index.html');
            const content = fs.readFileSync(filePath, 'utf8');
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } else if (req.url === '/api/status') {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                isReady: true,
                totalAgents: 26726
            }));
        } else if (req.url === '/api/data') {
            try {
                // Vérifier la base de données une seule fois
                const brokers = await getAllBrokers();
                
                if (brokers.length === 0) {
                    addLog('📥 Aucune donnée trouvée, chargement depuis DubaiLand...');
                    await fetchAndConvert();
                    addLog('✅ Données de DubaiLand chargées avec succès');
                    const newBrokers = await getAllBrokers();
                    addLog(`📊 ${newBrokers.length} agents disponibles`);
                    
                    res.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify(newBrokers));
                } else {
                    addLog(`📊 ${brokers.length} agents disponibles`);
                    res.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify(brokers));
                }
            } catch (error) {
                addLog(`❌ Erreur lors du chargement des données: ${error.message}`, 'error');
                res.writeHead(500, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: 'Erreur lors de la récupération des données' }));
            }
        } else if (req.url === '/api/logs') {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(logs));
        } else if (req.url === '/api/search-websites') {
            await updateBrokersWithWebsites();
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ message: 'Recherche des sites web terminée' }));
        } else if (req.url === '/api/total') {
            const result = await getAllBrokers();
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ total: result.length }));
        } else if (req.url === '/api/dubailand-total') {
            const response = await fetch('https://dubailand.gov.ae/en/eservices/licensed-real-estate-brokers/licensed-real-estate-brokers-list/');
            const html = await response.text();
            const totalMatch = html.match(/Total Records: (\d+)/);
            const total = totalMatch ? parseInt(totalMatch[1]) : 0;
            
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ total }));
        } else {
            res.writeHead(404, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Route non trouvée' }));
        }
    } catch (error) {
        addLog(`Erreur: ${error.message}`, 'error');
        res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Erreur serveur' }));
    }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, async () => {
    addLog(`Serveur démarré sur le port ${PORT}`);
    try {
        const brokers = await getAllBrokers();
        addLog(`📊 ${brokers.length} agents disponibles`);
    } catch (error) {
        addLog(`❌ Erreur lors de la lecture des données: ${error.message}`, 'error');
    }
    addLog('📊 API prête à recevoir des requêtes');
}); 