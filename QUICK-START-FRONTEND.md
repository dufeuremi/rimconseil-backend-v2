# ⚡ Quick Start Frontend - Editable Content

## 🚀 En 5 minutes chrono

### 1. Copiez-collez cette classe (1 min)

```javascript
class EditableAPI {
  constructor() {
    this.baseUrl = ''; // Votre URL d'API
    this.token = localStorage.getItem('authToken');
  }
  
  async login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('authToken', data.token);
    return data;
  }
  
  async get(pageName) {
    const response = await fetch(`/api/editable-content/${pageName}`);
    return response.json();
  }
  
  async save(pageName, selector, html, type = 'paragraph') {
    const response = await fetch('/api/editable-content/element', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_name: pageName,
        element_selector: selector,
        content_html: html,
        element_type: type
      })
    });
    return response.json();
  }
}

const api = new EditableAPI();
```

### 2. Connectez-vous (30 sec)

```javascript
// Se connecter une fois
await api.login('admin@rimconseil.fr', 'admin123');
```

### 3. Rendez vos éléments éditables (2 min)

```javascript
// Fonction magique pour rendre un élément éditable
const makeEditable = (selector, type = 'paragraph') => {
  const el = document.querySelector(selector);
  if (!el) return;
  
  el.contentEditable = true;
  el.style.border = '2px dashed transparent';
  el.style.transition = 'border 0.3s';
  
  el.onmouseenter = () => el.style.border = '2px dashed #007bff';
  el.onmouseleave = () => el.style.border = '2px dashed transparent';
  
  el.onblur = async () => {
    await api.save('notre-equipe', selector, el.innerHTML, type);
    showSaved();
  };
};

const showSaved = () => {
  const notif = document.createElement('div');
  notif.textContent = '✅ Sauvegardé';
  notif.style.cssText = `
    position: fixed; top: 20px; right: 20px; 
    background: #4CAF50; color: white; padding: 10px; 
    border-radius: 5px; z-index: 9999;
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
};
```

### 4. Activez l'édition (30 sec)

```javascript
// Activez l'édition sur vos éléments
makeEditable('.team-member-1 .name', 'title');
makeEditable('.team-member-1 .bio', 'bio');
makeEditable('.hero-title', 'title');
makeEditable('.description', 'paragraph');
```

### 5. Chargez le contenu existant (1 min)

```javascript
// Charger et afficher le contenu au démarrage
const loadContent = async () => {
  const data = await api.get('notre-equipe');
  
  data.elements.forEach(item => {
    const el = document.querySelector(item.element_selector);
    if (el) el.innerHTML = item.content_html;
  });
};

// Lancez au chargement de la page
document.addEventListener('DOMContentLoaded', loadContent);
```

## 🎯 Version React Express (2 min)

```jsx
import React, { useState, useEffect } from 'react';

const EditableText = ({ pageName, selector, type = 'paragraph', children }) => {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    // Charger le contenu initial
    fetch(`/api/editable-content/${pageName}`)
      .then(r => r.json())
      .then(data => {
        const item = data.elements.find(el => el.element_selector === selector);
        if (item) setContent(item.content_html);
      });
  }, []);
  
  const save = async (newContent) => {
    setSaving(true);
    try {
      await fetch('/api/editable-content/element', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_name: pageName,
          element_selector: selector,
          content_html: newContent,
          element_type: type
        })
      });
      setContent(newContent);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: content || children }}
      onBlur={(e) => save(e.target.innerHTML)}
      style={{
        outline: 'none',
        border: '2px dashed transparent',
        padding: '5px',
        borderRadius: '3px',
        opacity: saving ? 0.5 : 1
      }}
      onMouseEnter={(e) => e.target.style.borderColor = '#007bff'}
      onMouseLeave={(e) => e.target.style.borderColor = 'transparent'}
    />
  );
};

// Utilisation
const MyPage = () => (
  <div>
    <EditableText pageName="notre-equipe" selector=".hero-title" type="title">
      Titre par défaut
    </EditableText>
    
    <EditableText pageName="notre-equipe" selector=".description" type="paragraph">
      Description par défaut
    </EditableText>
  </div>
);
```

## 📱 Version Vue Express (2 min)

```vue
<template>
  <div
    contenteditable
    @blur="save"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    v-html="content"
    :style="style"
  />
</template>

<script>
export default {
  props: ['pageName', 'selector', 'type'],
  data() {
    return {
      content: '',
      hover: false,
      saving: false
    }
  },
  computed: {
    style() {
      return {
        outline: 'none',
        border: `2px dashed ${this.hover ? '#007bff' : 'transparent'}`,
        padding: '5px',
        borderRadius: '3px',
        opacity: this.saving ? 0.5 : 1,
        transition: 'border 0.3s'
      }
    }
  },
  async mounted() {
    const response = await fetch(`/api/editable-content/${this.pageName}`);
    const data = await response.json();
    const item = data.elements.find(el => el.element_selector === this.selector);
    if (item) this.content = item.content_html;
  },
  methods: {
    async save(e) {
      this.saving = true;
      try {
        await fetch('/api/editable-content/element', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page_name: this.pageName,
            element_selector: this.selector,
            content_html: e.target.innerHTML,
            element_type: this.type || 'paragraph'
          })
        });
        this.content = e.target.innerHTML;
      } finally {
        this.saving = false;
      }
    }
  }
}
</script>
```

## 🎨 CSS Minimal

```css
.editable {
  transition: all 0.3s;
  cursor: pointer;
}

.editable:hover {
  background: rgba(0,123,255,0.1);
}

.editable:focus {
  background: rgba(0,123,255,0.2);
  outline: none;
}
```

## 🔧 Debug Rapide

```javascript
// Dans la console du navigateur
window.debug = {
  // Voir tous les éléments d'une page
  show: async (page) => {
    const data = await fetch(`/api/editable-content/${page}`).then(r => r.json());
    console.table(data.elements);
  },
  
  // Tester un sélecteur
  test: (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      el.style.background = 'yellow';
      setTimeout(() => el.style.background = '', 2000);
    }
    return !!el;
  }
};

// Utilisation : debug.show('notre-equipe')
```

## 🚨 Gestion d'erreurs simple

```javascript
const handleError = (error) => {
  if (error.message.includes('401')) {
    alert('Veuillez vous reconnecter');
    localStorage.removeItem('authToken');
  } else {
    alert('Erreur de sauvegarde');
  }
};

// Wrappez vos appels API
const safeSave = async (...args) => {
  try {
    return await api.save(...args);
  } catch (error) {
    handleError(error);
  }
};
```

---

## ✅ C'est tout !

En 5 minutes vous avez :
- ✅ Une API fonctionnelle
- ✅ Des éléments éditables
- ✅ Sauvegarde automatique
- ✅ Indicateurs visuels
- ✅ Gestion d'erreurs

**🚀 Maintenant vos contenus sont éditables en temps réel !** 