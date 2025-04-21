const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, './database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connecté à la base de données SQLite');

  // --- ARTICLES ---
  db.run(`DROP TABLE IF EXISTS articles`, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression de la table articles:', err.message);
      process.exit(1);
    }
    db.run(`
      CREATE TABLE articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        titre TEXT NOT NULL,
        text_preview TEXT NOT NULL,
        content_json TEXT NOT NULL,
        path TEXT,
        category TEXT DEFAULT '[]'
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table articles:', err.message);
        process.exit(1);
      }
      const articles = [
        {
          date: '2024-01-01',
          titre: 'Test Article 1',
          text_preview: 'Preview 1',
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Content 1' }] }),
          path: '/test-article-1',
          category: JSON.stringify(['Test'])
        },
        {
          date: '2024-01-02',
          titre: 'Test Article 2',
          text_preview: 'Preview 2',
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Content 2' }] }),
          path: '/test-article-2',
          category: JSON.stringify(['Test'])
        },
        {
          date: '2024-01-03',
          titre: 'Test Article 3',
          text_preview: 'Preview 3',
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Content 3' }] }),
          path: '/test-article-3',
          category: JSON.stringify(['Test'])
        }
      ];
      const stmt = db.prepare('INSERT INTO articles (date, titre, text_preview, content_json, path, category) VALUES (?, ?, ?, ?, ?, ?)');
      articles.forEach(a => stmt.run(a.date, a.titre, a.text_preview, a.content_json, a.path, a.category));
      stmt.finalize(() => console.log('3 articles de test insérés.'));
    });
  });

  // --- ACTUS ---
  db.run(`DROP TABLE IF EXISTS actus`, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression de la table actus:', err.message);
      process.exit(1);
    }
    db.run(`
      CREATE TABLE actus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        titre TEXT NOT NULL,
        text_preview TEXT NOT NULL,
        img_path TEXT,
        content_json TEXT NOT NULL,
        category TEXT DEFAULT '[]'
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table actus:', err.message);
        process.exit(1);
      }
      const actus = [
        {
          date: '2024-02-01',
          titre: 'Test Actu 1',
          text_preview: 'Actu Preview 1',
          img_path: null,
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Actu Content 1' }] }),
          category: JSON.stringify(['Test'])
        },
        {
          date: '2024-02-02',
          titre: 'Test Actu 2',
          text_preview: 'Actu Preview 2',
          img_path: null,
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Actu Content 2' }] }),
          category: JSON.stringify(['Test'])
        },
        {
          date: '2024-02-03',
          titre: 'Test Actu 3',
          text_preview: 'Actu Preview 3',
          img_path: null,
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Actu Content 3' }] }),
          category: JSON.stringify(['Test'])
        }
      ];
      const stmt = db.prepare('INSERT INTO actus (date, titre, text_preview, img_path, content_json, category) VALUES (?, ?, ?, ?, ?, ?)');
      actus.forEach(a => stmt.run(a.date, a.titre, a.text_preview, a.img_path, a.content_json, a.category));
      stmt.finalize(() => console.log('3 actus de test insérées.'));
    });
  });

  // --- PAGES ---
  db.run(`DROP TABLE IF EXISTS pages`, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression de la table pages:', err.message);
      process.exit(1);
    }
    db.run(`
      CREATE TABLE pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        content_json TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table pages:', err.message);
        process.exit(1);
      }
      const pages = [
        {
          path: '/test-page-1',
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Page Content 1' }] })
        },
        {
          path: '/test-page-2',
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Page Content 2' }] })
        },
        {
          path: '/test-page-3',
          content_json: JSON.stringify({ blocks: [{ type: 'paragraph', text: 'Page Content 3' }] })
        }
      ];
      const stmt = db.prepare('INSERT INTO pages (path, content_json) VALUES (?, ?)');
      pages.forEach(p => stmt.run(p.path, p.content_json));
      stmt.finalize(() => console.log('3 pages de test insérées.'));
    });
  });

  // --- MESSAGES ---
  db.run(`DROP TABLE IF EXISTS messages`, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression de la table messages:', err.message);
      process.exit(1);
    }
    db.run(`
      CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT NOT NULL,
        telephone TEXT,
        sujet TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        status BOOLEAN DEFAULT 0
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table messages:', err.message);
        process.exit(1);
      }
      const now = new Date().toISOString();
      const messages = [
        {
          nom: 'Test', prenom: 'User1', email: 'user1@test.com', telephone: '0600000001', sujet: 'Sujet 1', message: 'Message test 1', date: now, status: 0
        },
        {
          nom: 'Test', prenom: 'User2', email: 'user2@test.com', telephone: '0600000002', sujet: 'Sujet 2', message: 'Message test 2', date: now, status: 0
        },
        {
          nom: 'Test', prenom: 'User3', email: 'user3@test.com', telephone: '0600000003', sujet: 'Sujet 3', message: 'Message test 3', date: now, status: 0
        }
      ];
      const stmt = db.prepare('INSERT INTO messages (nom, prenom, email, telephone, sujet, message, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      messages.forEach(m => stmt.run(m.nom, m.prenom, m.email, m.telephone, m.sujet, m.message, m.date, m.status));
      stmt.finalize(() => {
        console.log('3 messages de test insérés.');
        db.close(() => console.log('Réinitialisation terminée. Connexion fermée.'));
      });
    });
  });
}); 