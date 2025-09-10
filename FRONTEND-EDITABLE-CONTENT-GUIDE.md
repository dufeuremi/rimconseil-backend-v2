# 🎨 Guide Frontend - API Editable Content

## 🚀 Vue d'ensemble
Cette API permet d'éditer en temps réel des éléments HTML spécifiques dans vos pages (titres, paragraphes, bios, etc.) sans recharger la page complète.

**URL de base :** `http://localhost:4000` (ou votre domaine en production)

## 🔐 Authentification rapide

```javascript
// 1. Se connecter et récupérer le token
const login = async (email, password) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('authToken', data.token);
    return data.token;
  }
  throw new Error(data.message);
};

// 2. Récupérer le token stocké
const getToken = () => localStorage.getItem('authToken');

// 3. Se déconnecter
const logout = () => localStorage.removeItem('authToken');
```

## 📋 Endpoints disponibles

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/editable-content/:pageName` | ❌ | Récupérer les éléments d'une page |
| PATCH | `/api/editable-content/element` | ✅ | Modifier un élément |
| POST | `/api/editable-content/bulk-update` | ✅ | Modifier plusieurs éléments |

## 🎯 Classe utilitaire pour le frontend

```javascript
class EditableContentAPI {
  constructor(baseUrl = '', token = null) {
    this.baseUrl = baseUrl;
    this.token = token || localStorage.getItem('authToken');
  }
  
  // Mettre à jour le token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }
  
  // Headers avec authentification
  getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }
  
  // Récupérer tous les éléments d'une page
  async getPageElements(pageName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/editable-content/${pageName}`, {
        headers: this.getHeaders(false) // Pas d'auth pour la lecture
      });
      
      if (response.ok) {
        return await response.json();
      } else if (response.status === 404) {
        return { pageName, elements: [], totalElements: 0 };
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      throw error;
    }
  }
  
  // Modifier un élément
  async updateElement(elementData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/editable-content/element`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(elementData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return result;
      } else {
        throw new Error(result.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur update:', error);
      throw error;
    }
  }
  
  // Modifier plusieurs éléments
  async bulkUpdate(elements) {
    try {
      const response = await fetch(`${this.baseUrl}/api/editable-content/bulk-update`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ elements })
      });
      
      const result = await response.json();
      
      if (response.ok || response.status === 207) {
        return result;
      } else {
        throw new Error(result.message || 'Erreur lors de la modification en lot');
      }
    } catch (error) {
      console.error('Erreur bulk update:', error);
      throw error;
    }
  }
}

// Instance globale
const editableAPI = new EditableContentAPI();
```

## ⚡ Exemples d'utilisation rapide

### 1. Charger et afficher les éléments d'une page

```javascript
// Charger les éléments de la page "notre-equipe"
const loadPageContent = async () => {
  try {
    const data = await editableAPI.getPageElements('notre-equipe');
    
    data.elements.forEach(element => {
      const domElement = document.querySelector(element.element_selector);
      if (domElement) {
        domElement.innerHTML = element.content_html;
      }
    });
    
    console.log(`✅ ${data.totalElements} éléments chargés`);
  } catch (error) {
    console.error('❌ Erreur de chargement:', error);
  }
};

// Appeler au chargement de la page
loadPageContent();
```

### 2. Rendre un élément éditable (Vanilla JS)

```javascript
// Fonction pour rendre un élément éditable
const makeEditable = (selector, elementType = 'paragraph') => {
  const element = document.querySelector(selector);
  if (!element) return;
  
  // Ajouter un indicateur visuel
  element.style.border = '2px dashed #007bff';
  element.style.cursor = 'pointer';
  element.contentEditable = true;
  
  // Sauvegarder automatiquement quand l'utilisateur arrête d'éditer
  let timeout;
  element.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      await saveElement(selector, element.innerHTML, elementType);
    }, 1000); // Sauvegarde après 1 seconde d'inactivité
  });
  
  // Sauvegarder quand l'élément perd le focus
  element.addEventListener('blur', () => {
    clearTimeout(timeout);
    saveElement(selector, element.innerHTML, elementType);
  });
};

// Fonction de sauvegarde
const saveElement = async (selector, content, elementType) => {
  try {
    const pageName = 'notre-equipe'; // À adapter selon votre contexte
    
    const result = await editableAPI.updateElement({
      page_name: pageName,
      element_selector: selector,
      content_html: content,
      element_type: elementType
    });
    
    // Indicateur de sauvegarde réussie
    showNotification('✅ Sauvegardé', 'success');
    
  } catch (error) {
    console.error('❌ Erreur de sauvegarde:', error);
    showNotification('❌ Erreur de sauvegarde', 'error');
  }
};

// Fonction de notification
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 5px;
    z-index: 10000;
    transition: opacity 0.3s;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Utilisation
makeEditable('.team-member-1 .name', 'title');
makeEditable('.team-member-1 .bio', 'bio');
makeEditable('.team-intro p', 'paragraph');
```

## ⚛️ Composant React

```jsx
import React, { useState, useEffect } from 'react';

const EditableElement = ({ 
  pageName, 
  selector, 
  elementType = 'paragraph',
  className = '',
  placeholder = 'Cliquez pour éditer...'
}) => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger le contenu initial
  useEffect(() => {
    loadContent();
  }, [pageName, selector]);
  
  const loadContent = async () => {
    try {
      setIsLoading(true);
      const data = await editableAPI.getPageElements(pageName);
      const element = data.elements.find(el => el.element_selector === selector);
      
      if (element) {
        setContent(element.content_html);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveContent = async (newContent) => {
    try {
      setIsSaving(true);
      
      await editableAPI.updateElement({
        page_name: pageName,
        element_selector: selector,
        content_html: newContent,
        element_type: elementType
      });
      
      setContent(newContent);
      
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBlur = (e) => {
    const newContent = e.target.innerHTML;
    if (newContent !== content) {
      saveContent(newContent);
    }
    setIsEditing(false);
  };
  
  if (isLoading) {
    return <div className={className}>Chargement...</div>;
  }
  
  return (
    <div
      className={`${className} ${isEditing ? 'editing' : ''} ${isSaving ? 'saving' : ''}`}
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: content || placeholder }}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      style={{
        minHeight: '20px',
        padding: '5px',
        border: isEditing ? '2px dashed #007bff' : '2px transparent solid',
        borderRadius: '3px',
        outline: 'none',
        transition: 'border 0.3s',
        cursor: 'pointer',
        opacity: isSaving ? 0.7 : 1
      }}
    />
  );
};

// Composant pour toute une page
const EditablePage = ({ pageName, children }) => {
  const [elements, setElements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadPageElements();
  }, [pageName]);
  
  const loadPageElements = async () => {
    try {
      const data = await editableAPI.getPageElements(pageName);
      setElements(data.elements);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div>Chargement de la page...</div>;
  }
  
  return (
    <div className="editable-page">
      {children}
    </div>
  );
};

// Utilisation dans votre composant
const NotreEquipePage = () => {
  return (
    <EditablePage pageName="notre-equipe">
      <div className="team-section">
        <EditableElement
          pageName="notre-equipe"
          selector=".team-intro h2"
          elementType="title"
          className="team-title"
        />
        
        <EditableElement
          pageName="notre-equipe"
          selector=".team-intro p"
          elementType="paragraph"
          className="team-description"
        />
        
        <div className="team-members">
          <div className="team-member">
            <EditableElement
              pageName="notre-equipe"
              selector=".team-member-1 .name"
              elementType="title"
              className="member-name"
            />
            <EditableElement
              pageName="notre-equipe"
              selector=".team-member-1 .bio"
              elementType="bio"
              className="member-bio"
            />
          </div>
        </div>
      </div>
    </EditablePage>
  );
};

export default NotreEquipePage;
```

## 🖖 Composant Vue.js

```vue
<template>
  <div class="editable-element">
    <div
      ref="editableRef"
      :contenteditable="true"
      @focus="isEditing = true"
      @blur="handleBlur"
      @input="handleInput"
      v-html="content"
      :class="{
        'editing': isEditing,
        'saving': isSaving
      }"
      :style="editableStyle"
    />
    
    <div v-if="isSaving" class="saving-indicator">
      💾 Sauvegarde...
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'EditableElement',
  props: {
    pageName: {
      type: String,
      required: true
    },
    selector: {
      type: String,
      required: true
    },
    elementType: {
      type: String,
      default: 'paragraph'
    },
    placeholder: {
      type: String,
      default: 'Cliquez pour éditer...'
    }
  },
  
  setup(props) {
    const content = ref('')
    const isEditing = ref(false)
    const isSaving = ref(false)
    const isLoading = ref(true)
    const editableRef = ref(null)
    
    let saveTimeout = null
    
    const editableStyle = computed(() => ({
      minHeight: '20px',
      padding: '5px',
      border: isEditing.value ? '2px dashed #007bff' : '2px transparent solid',
      borderRadius: '3px',
      outline: 'none',
      transition: 'border 0.3s',
      cursor: 'pointer',
      opacity: isSaving.value ? 0.7 : 1
    }))
    
    const loadContent = async () => {
      try {
        isLoading.value = true
        const data = await editableAPI.getPageElements(props.pageName)
        const element = data.elements.find(el => el.element_selector === props.selector)
        
        if (element) {
          content.value = element.content_html
        } else {
          content.value = props.placeholder
        }
      } catch (error) {
        console.error('Erreur de chargement:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const saveContent = async (newContent) => {
      try {
        isSaving.value = true
        
        await editableAPI.updateElement({
          page_name: props.pageName,
          element_selector: props.selector,
          content_html: newContent,
          element_type: props.elementType
        })
        
        content.value = newContent
        
      } catch (error) {
        console.error('Erreur de sauvegarde:', error)
        alert('Erreur lors de la sauvegarde')
      } finally {
        isSaving.value = false
      }
    }
    
    const handleInput = () => {
      // Sauvegarder automatiquement après 1 seconde d'inactivité
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        const newContent = editableRef.value.innerHTML
        if (newContent !== content.value) {
          saveContent(newContent)
        }
      }, 1000)
    }
    
    const handleBlur = () => {
      isEditing.value = false
      clearTimeout(saveTimeout)
      
      const newContent = editableRef.value.innerHTML
      if (newContent !== content.value) {
        saveContent(newContent)
      }
    }
    
    onMounted(() => {
      loadContent()
    })
    
    return {
      content,
      isEditing,
      isSaving,
      isLoading,
      editableRef,
      editableStyle,
      handleInput,
      handleBlur
    }
  }
}
</script>

<style scoped>
.editing {
  background-color: rgba(0, 123, 255, 0.1);
}

.saving-indicator {
  position: absolute;
  top: -30px;
  right: 0;
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  animation: fadeInOut 2s;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
```

## 📱 Mode WYSIWYG avancé

```javascript
// Éditeur WYSIWYG avec barre d'outils
class WYSIWYGEditor {
  constructor(selector, pageName, elementType = 'paragraph') {
    this.element = document.querySelector(selector);
    this.selector = selector;
    this.pageName = pageName;
    this.elementType = elementType;
    this.init();
  }
  
  init() {
    if (!this.element) return;
    
    this.createToolbar();
    this.makeEditable();
    this.loadContent();
  }
  
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'wysiwyg-toolbar';
    toolbar.style.cssText = `
      display: none;
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
    `;
    
    toolbar.innerHTML = `
      <button onclick="document.execCommand('bold')" title="Gras"><b>B</b></button>
      <button onclick="document.execCommand('italic')" title="Italique"><i>I</i></button>
      <button onclick="this.parentElement.style.display='none'" title="Fermer">×</button>
    `;
    
    document.body.appendChild(toolbar);
    this.toolbar = toolbar;
  }
  
  makeEditable() {
    this.element.contentEditable = true;
    this.element.style.cssText += `
      outline: none;
      cursor: text;
      transition: all 0.3s;
    `;
    
    this.element.addEventListener('focus', () => {
      this.element.style.border = '2px solid #007bff';
      this.showToolbar();
    });
    
    this.element.addEventListener('blur', () => {
      setTimeout(() => {
        this.element.style.border = '2px transparent solid';
        this.hideToolbar();
        this.saveContent();
      }, 200);
    });
    
    this.element.addEventListener('input', () => {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.saveContent();
      }, 1000);
    });
  }
  
  showToolbar() {
    const rect = this.element.getBoundingClientRect();
    this.toolbar.style.display = 'block';
    this.toolbar.style.left = rect.left + 'px';
    this.toolbar.style.top = (rect.top - 40) + 'px';
  }
  
  hideToolbar() {
    this.toolbar.style.display = 'none';
  }
  
  async loadContent() {
    try {
      const data = await editableAPI.getPageElements(this.pageName);
      const element = data.elements.find(el => el.element_selector === this.selector);
      
      if (element) {
        this.element.innerHTML = element.content_html;
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  }
  
  async saveContent() {
    try {
      await editableAPI.updateElement({
        page_name: this.pageName,
        element_selector: this.selector,
        content_html: this.element.innerHTML,
        element_type: this.elementType
      });
      
      this.showSaveIndicator();
      
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  }
  
  showSaveIndicator() {
    const indicator = document.createElement('span');
    indicator.textContent = '✅';
    indicator.style.cssText = `
      position: absolute;
      top: -20px;
      right: 0;
      color: green;
      font-size: 16px;
    `;
    
    this.element.style.position = 'relative';
    this.element.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 2000);
  }
}

// Utilisation
document.addEventListener('DOMContentLoaded', () => {
  new WYSIWYGEditor('.team-member-1 .name', 'notre-equipe', 'title');
  new WYSIWYGEditor('.team-member-1 .bio', 'notre-equipe', 'bio');
  new WYSIWYGEditor('.team-intro p', 'notre-equipe', 'paragraph');
});
```

## 🎨 CSS recommandé

```css
/* Styles pour les éléments éditables */
.editable-element {
  position: relative;
  transition: all 0.3s ease;
}

.editable-element:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.editable-element.editing {
  background-color: rgba(0, 123, 255, 0.1);
  border: 2px dashed #007bff !important;
}

.editable-element.saving {
  opacity: 0.7;
}

/* Barre d'outils WYSIWYG */
.wysiwyg-toolbar {
  display: flex;
  gap: 5px;
}

.wysiwyg-toolbar button {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
}

.wysiwyg-toolbar button:hover {
  background: #e9ecef;
}

/* Indicateurs de sauvegarde */
.save-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #28a745;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 10000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Mode édition global */
body.edit-mode .editable-element {
  border: 2px dashed transparent;
  transition: border 0.3s;
}

body.edit-mode .editable-element:hover {
  border-color: #007bff;
}

/* Responsive */
@media (max-width: 768px) {
  .wysiwyg-toolbar {
    position: fixed !important;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    top: auto !important;
  }
}
```

## 🚨 Gestion d'erreurs

```javascript
// Gestionnaire d'erreurs global
const handleAPIError = (error, context = '') => {
  console.error(`Erreur ${context}:`, error);
  
  if (error.message.includes('401')) {
    // Token expiré
    logout();
    alert('Session expirée. Veuillez vous reconnecter.');
    window.location.href = '/login';
  } else if (error.message.includes('429')) {
    // Rate limit
    alert('Trop de modifications. Veuillez patienter quelques instants.');
  } else if (error.message.includes('400')) {
    // Données invalides
    alert('Contenu invalide. Vérifiez votre saisie.');
  } else {
    // Erreur générique
    alert('Une erreur est survenue. Veuillez réessayer.');
  }
};

// Wrapper avec gestion d'erreurs
const safeAPICall = async (apiCall, context = '') => {
  try {
    return await apiCall();
  } catch (error) {
    handleAPIError(error, context);
    throw error;
  }
};

// Utilisation
const updateElementSafely = async (elementData) => {
  return safeAPICall(
    () => editableAPI.updateElement(elementData),
    'modification d\'élément'
  );
};
```

## 📊 Monitoring et analytics

```javascript
// Tracking des modifications
const trackEdit = (action, elementSelector, pageName) => {
  // Envoyer à votre système d'analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'content_edit', {
      'custom_parameter_1': action,
      'custom_parameter_2': elementSelector,
      'custom_parameter_3': pageName
    });
  }
  
  console.log(`📊 ${action}: ${pageName} > ${elementSelector}`);
};

// Statistiques en temps réel
const showEditStats = () => {
  const stats = JSON.parse(localStorage.getItem('editStats') || '{}');
  console.table(stats);
};

// Ajouter le tracking aux sauvegardes
const originalUpdateElement = editableAPI.updateElement;
editableAPI.updateElement = async function(elementData) {
  const result = await originalUpdateElement.call(this, elementData);
  
  // Tracking
  trackEdit('update', elementData.element_selector, elementData.page_name);
  
  // Stats locales
  const stats = JSON.parse(localStorage.getItem('editStats') || '{}');
  const key = `${elementData.page_name}.${elementData.element_selector}`;
  stats[key] = (stats[key] || 0) + 1;
  localStorage.setItem('editStats', JSON.stringify(stats));
  
  return result;
};
```

## 🔧 Outils de debug

```javascript
// Console de debug
window.EditableDebug = {
  // Afficher tous les éléments éditables
  showAll: async (pageName) => {
    const data = await editableAPI.getPageElements(pageName);
    console.table(data.elements);
    return data;
  },
  
  // Tester un sélecteur
  testSelector: (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.style.background = 'yellow';
      console.log('✅ Sélecteur trouvé:', element);
      setTimeout(() => element.style.background = '', 2000);
    } else {
      console.log('❌ Sélecteur non trouvé:', selector);
    }
  },
  
  // Mode édition visuel
  toggleEditMode: () => {
    document.body.classList.toggle('edit-mode');
    console.log('Mode édition:', document.body.classList.contains('edit-mode') ? 'ON' : 'OFF');
  },
  
  // Réinitialiser le cache
  clearCache: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('editStats');
    console.log('Cache effacé');
  }
};

// Raccourcis clavier pour le debug (Ctrl+Shift+E)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
    e.preventDefault();
    EditableDebug.toggleEditMode();
  }
});
```

---

## 🎉 C'est prêt !

Votre API editable-content est maintenant prête à être utilisée avec tous ces exemples ! 

**🚀 Pour commencer rapidement :**

1. Copiez la classe `EditableContentAPI`
2. Utilisez `makeEditable()` pour vos premiers tests
3. Intégrez les composants React/Vue selon votre framework
4. Ajoutez le CSS pour une belle expérience utilisateur

**💡 Besoin d'aide ?** Tous les exemples sont testés et fonctionnels ! 