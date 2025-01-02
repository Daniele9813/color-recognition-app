import express from 'express';
import sqlite3 from 'sqlite3'; // Corretto

const app = express();
const PORT = 3000;

// Configura il database SQLite
const initializeDatabase = async () => {
    const db = new sqlite3.Database('./color-database.db', (err) => {
        if (err) {
            console.error("Errore nel connettersi al database", err.message);
        } else {
            console.log("Connesso al database SQLite");
        }
    });

    // Crea una tabella per i colori, se non esiste
    db.run(`
        CREATE TABLE IF NOT EXISTS colors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            hex TEXT
        );
    `);

    return db;
};

// Endpoint di test
app.get('/', (req, res) => {
    res.send('Backend per Color Recognition App');
});

// Avvia il server
app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server avviato su http://localhost:${PORT}`);
});

// Funzione per determinare un colore complementare (semplice esempio)
const getComplementaryColor = (hex) => {
    // Rimuoviamo il "#" dal valore esadecimale
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Calcoliamo il colore complementare invertendo i valori RGB
    r = (255 - r).toString(16).padStart(2, '0');
    g = (255 - g).toString(16).padStart(2, '0');
    b = (255 - b).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`; // Restituisce il colore complementare come stringa esadecimale
};

// Aggiungi un endpoint per riconoscere il colore e restituire il complementare
app.post('/recognize-color', express.json(), (req, res) => {
    const { hexColor } = req.body; // L'utente invia il colore esadecimale

    if (!hexColor) {
        return res.status(400).json({ error: 'Devi fornire un colore in formato esadecimale' });
    }

    const complementaryColor = getComplementaryColor(hexColor);

    res.json({
        originalColor: hexColor,
        complementaryColor: complementaryColor
    });
});

// Aggiungi un endpoint per salvare un colore
app.post('/save-color', express.json(), async (req, res) => {
    const { name, hexColor } = req.body;

    if (!name || !hexColor) {
        return res.status(400).json({ error: 'Devi fornire sia il nome che il colore' });
    }

    const db = await initializeDatabase();

    // Aggiungi il colore al database
    const query = `INSERT INTO colors (name, hex) VALUES (?, ?)`;
    db.run(query, [name, hexColor], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Errore durante il salvataggio del colore' });
        }

        res.status(201).json({ message: 'Colore salvato con successo', id: this.lastID });
    });
});