import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, saveBroker, getAllBrokers } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = "https://gateway.dubailand.gov.ae/brokers/?sortCriteria=2&pageIndex=0&pageSize=30000&consumer-id=gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F"; // URL de l'API

// Clé API Autom.dev
const apiKey = 'a531e5e9-33d4-4ac9-b7ca-4dffcdbaf2a7';

// Fonction pour récupérer le site web
async function fetchWebsite(officeName) {
    const url = 'https://autom.dev/api/v1/google/search';
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
    };

    const data = { 
        query: `${officeName} real estate agent dubai website`,
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
            website_url: firstResult.link,
            website_title: firstResult.title,
            website_snippet: firstResult.snippet
        };
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche du site web pour ${officeName}:`, error.message);
        return null;
    }
}

// Fonction pour récupérer le profil LinkedIn
async function fetchLinkedIn(agentName, officeName) {
    const url = 'https://autom.dev/api/v1/google/search';
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
    };

    const data = { 
        query: `${agentName} Dubai ${officeName} linkedin profile real estate`,
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
        // Vérifier si le résultat est bien un profil LinkedIn
        if (firstResult.link.includes('linkedin.com/in/')) {
            return {
                linkedin_url: firstResult.link,
                linkedin_title: firstResult.title,
                linkedin_snippet: firstResult.snippet
            };
        }
        return null;
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche LinkedIn pour ${agentName}:`, error.message);
        return null;
    }
}

// Fonction pour récupérer le compte Instagram
async function fetchInstagram(officeName) {
    const url = 'https://autom.dev/api/v1/google/search';
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
    };

    const data = { 
        query: `${officeName} Dubai real estate instagram account`,
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
        // Vérifier si le résultat est bien un profil Instagram
        if (firstResult.link.includes('instagram.com/')) {
            return {
                instagram_url: firstResult.link,
                instagram_title: firstResult.title,
                instagram_snippet: firstResult.snippet
            };
        }
        return null;
    } catch (error) {
        console.error(`❌ Erreur lors de la recherche Instagram pour ${officeName}:`, error.message);
        return null;
    }
}

// Fonction pour appliquer un trim avec regex
const cleanText = (text) => {
    return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
};

// Nouvelle fonction pour déterminer si un agent est CEO
const isCEO = (officeNameEn, cardNumber, allAgents) => {
    // Filtrer tous les agents avec le même OfficeNameEn
    const sameOfficeAgents = allAgents.filter(agent => agent.OfficeNameEn === officeNameEn);
    
    // Trouver le CardNumber le plus petit
    const minCardNumber = Math.min(...sameOfficeAgents.map(agent => parseInt(agent.CardNumber) || Infinity));
    
    // Comparer avec le CardNumber actuel
    return parseInt(cardNumber) === minCardNumber;
};

const webhookUrl = "https://script.google.com/macros/s/AKfycbxhsTkMpBvHUGVUu82ugkfO2CI8TOX8-kRgqYNFAg98O65AAh6S5e0O1lZ-nsySP9as/exec"; // Remplacez par l'URL du Webhook

// Fonction pour envoyer une seule donnée au webhook
const sendToWebhook = async (data) => {
    try {
        const response = await axios.post(webhookUrl, data);
        console.log('Élément envoyé avec succès.');
        console.log('Réponse du webhook:', response.data); // Afficher la réponse du webhook
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'élément:', error.message);
    }
};

// Fonction pour extraire les emails d'un site web
async function extractEmailsFromWebsite(websiteUrl) {
    if (!websiteUrl) return null;

    try {
        const response = await axios.get(websiteUrl, {
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Regex pour trouver les emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = response.data.match(emailRegex) || [];

        // Filtrer les emails uniques et les concaténer
        const uniqueEmails = [...new Set(emails)];
        return uniqueEmails.join(', ');
    } catch (error) {
        console.error(`❌ Erreur lors de l'extraction des emails de ${websiteUrl}:`, error.message);
        return null;
    }
}

export async function fetchAndConvert() {
    try {
        // Initialiser la base de données
        await initDB();

        // Récupérer les agents existants depuis la base de données
        const existingAgents = await getAllBrokers();
        const existingCardNumbers = new Set(existingAgents.map(agent => agent.CardNumber));

        console.log('\n📊 __ Je collecte les données de l\'API DubaiLand...');
        
        let retryCount = 0;
        const maxRetries = 3;
        let response;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`\n🔄 Tentative ${retryCount + 1}/${maxRetries} de connexion à l'API...`);
                response = await axios.get(url, { 
                    headers: { Accept: "application/json" },
                    timeout: 60000
                });
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    throw new Error(`Le serveur DubaiLand est temporairement indisponible (erreur ${error.response?.status || 'timeout'})`);
                }
                console.log(`❌ Tentative ${retryCount}/${maxRetries} échouée, nouvelle tentative dans 10 secondes...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        if (!response?.data?.Response || !Array.isArray(response.data.Response)) {
            throw new Error("Format de réponse API invalide");
        }

        const records = response.data.Response;
        console.log(`\n📈 __ Total des agents récupérés : ${records.length}`);
        
        // Compter les nouveaux agents
        let newAgentsCount = 0;
        
        for (const record of records) {
            const cardNumber = cleanText(record.CardNumber);
            if (!existingCardNumbers.has(cardNumber)) {
                newAgentsCount++;
                console.log(`\n✨ Traitement du nouvel agent (${newAgentsCount}/${records.length}) :`);
                console.log(`   - CardNumber : ${cardNumber}`);
                console.log(`   - Nom : ${cleanText(record.OfficeNameEn)}`);

                // Rechercher le site web
                console.log(`🔍 Recherche du site web pour : ${record.OfficeNameEn}`);
                const websiteData = await fetchWebsite(record.OfficeNameEn);
                
                // Extraire les emails du site web
                let websiteEmails = null;
                if (websiteData?.website_url) {
                    console.log(`📧 Extraction des emails de : ${websiteData.website_url}`);
                    websiteEmails = await extractEmailsFromWebsite(websiteData.website_url);
                }
                
                // Rechercher le compte Instagram
                console.log(`🔍 Recherche du compte Instagram pour : ${record.OfficeNameEn}`);
                const instagramData = await fetchInstagram(record.OfficeNameEn);
                
                // Rechercher le profil LinkedIn
                console.log(`🔍 Recherche du profil LinkedIn pour : ${record.CardHolderNameEn}`);
                const linkedinData = await fetchLinkedIn(record.CardHolderNameEn, record.OfficeNameEn);

                const agentData = {
                    AwardsCount: cleanText(record.AwardsCount) || "--",
                    CardExpiryDate: cleanText(record.CardExpiryDate) || "--",
                    CardHolderEmail: cleanText(record.CardHolderEmail) || "--",
                    CardHolderMobile: cleanText(record.CardHolderMobile) || "--",
                    CardHolderNameAr: cleanText(record.CardHolderNameAr) || "--",
                    CardHolderNameEn: cleanText(record.CardHolderNameEn) || "--",
                    CardHolderPhone: cleanText(record.CardHolderPhone) || "--",
                    CardHolderPhoto: cleanText(record.CardHolderPhoto) || "--",
                    CardIssueDate: cleanText(record.CardIssueDate) || "--",
                    CardNumber: cardNumber || "--",
                    CardRank: cleanText(record.CardRank) || "--",
                    CardRankId: cleanText(record.CardRankId) || "--",
                    LicenseNumber: cleanText(record.LicenseNumber) || "--",
                    OfficeExpiryDate: cleanText(record.OfficeExpiryDate) || "--",
                    OfficeIssueDate: cleanText(record.OfficeIssueDate) || "--",
                    OfficeLogo: cleanText(record.OfficeLogo) || "--",
                    OfficeNameAr: cleanText(record.OfficeNameAr) || "--",
                    OfficeNameEn: cleanText(record.OfficeNameEn) || "--",
                    OfficeRank: cleanText(record.OfficeRank) || "--",
                    OfficeRankId: cleanText(record.OfficeRankId) || "--",
                    RealEstateNumber: cleanText(record.RealEstateNumber) || "--",
                    dateAdded: new Date().toISOString().split('T')[0],
                    isCEO: isCEO(cleanText(record.OfficeNameEn), cardNumber, existingAgents) ? 'OUI' : 'NON',
                    website_url: websiteData?.website_url || "--",
                    website_title: websiteData?.website_title || "--",
                    website_snippet: websiteData?.website_snippet || "--",
                    website_emails: websiteEmails || "--",
                    instagram_url: instagramData?.instagram_url || "--",
                    instagram_title: instagramData?.instagram_title || "--",
                    instagram_snippet: instagramData?.instagram_snippet || "--",
                    linkedin_url: linkedinData?.linkedin_url || "--",
                    linkedin_title: linkedinData?.linkedin_title || "--",
                    linkedin_snippet: linkedinData?.linkedin_snippet || "--"
                };

                // Sauvegarder dans la base de données
                await saveBroker(cardNumber, agentData);
                console.log(`✅ Agent ${agentData.CardHolderNameEn} (${cardNumber}) sauvegardé dans la base de données`);

                // Envoyer au spreadsheet
                await sendToWebhook(agentData);
                console.log(`✅ Données envoyées au spreadsheet`);
            }
        }

        console.log(`\n✅ Traitement terminé : ${newAgentsCount} nouveaux agents ont été ajoutés`);
    } catch (error) {
        console.error('Erreur:', error.message);
        throw error;
    }
}

// Exécuter le script si lancé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    fetchAndConvert();
}

function doPost(e) {
  try {
    // Récupérer les données envoyées par le Webhook
    const data = JSON.parse(e.postData.contents);

    // Log pour vérifier les données reçues
    Logger.log('Données reçues: ' + JSON.stringify(data));

    // Récupérer la date actuelle
    const currentDate = new Date();

    // Ouvrir la feuille de calcul
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data');
    if (!sheet) {
      throw new Error("L'onglet 'data' n'existe pas.");
    }

    // Log pour vérifier si la feuille est bien trouvée
    Logger.log('Feuille trouvée: ' + sheet.getName());

    // Ajouter les données dans la première ligne vide
    sheet.appendRow([
      data.CardExpiryDate || '',
      data.CardHolderEmail || '',
      data.CardHolderMobile || '',
      data.CardHolderNameAr || '',
      data.CardHolderNameEn || '',
      data.CardHolderPhone || '',
      data.CardHolderPhoto || '',
      data.CardIssueDate || '',
      data.CardNumber || '',
      data.CardRank || '',
      data.LicenseNumber || '',
      data.OfficeExpiryDate || '',
      data.OfficeIssueDate || '',
      data.OfficeLogo || '',
      data.OfficeNameAr || '',
      data.OfficeNameEn || '',
      data.OfficeRank || '',
      data.RealEstateNumber || '',
      data.isCEO || '',
      data.website_url || '',
      data.website_title || '',
      data.website_snippet || '',
      data.website_emails || '',
      data.instagram_url || '',
      data.instagram_title || '',
      data.instagram_snippet || '',
      data.linkedin_url || '',
      data.linkedin_title || '',
      data.linkedin_snippet || '',
      currentDate
    ]);

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
