import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAndConvert } from './1.js';
import { updateBrokersWithWebsites } from './agent_search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3002;

const server = http.createServer((req, res) => {
    // Gérer les routes
    if (req.url === '/') {
        // Servir index.html
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Erreur lors de la lecture du fichier');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/api/data') {
        // Route API pour les données
        const filePath = path.join(__dirname, 'brokers.json');
        let data = [];
        
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));

        // Mettre à jour les données en arrière-plan
        fetchAndConvert().catch(error => {
            console.error('Erreur lors de la mise à jour des données:', error);
        });
    } else if (req.url === '/api/search-websites') {
        // Route API pour la recherche de sites web
        updateBrokersWithWebsites()
            .then(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Recherche des sites web terminée' }));
            })
            .catch(error => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            });
    } else {
        // Servir les fichiers statiques
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Fichier non trouvé');
                return;
            }
            
            // Déterminer le type de contenu
            let contentType = 'text/plain';
            if (filePath.endsWith('.html')) contentType = 'text/html';
            else if (filePath.endsWith('.css')) contentType = 'text/css';
            else if (filePath.endsWith('.js')) contentType = 'text/javascript';
            else if (filePath.endsWith('.json')) contentType = 'application/json';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
});

server.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
}); 