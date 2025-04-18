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