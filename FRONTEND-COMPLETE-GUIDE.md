# 🚀 Guide Frontend Complet - API Rimconseil

## 📋 Table des matières
1. [Authentification](#-authentification)
2. [API Articles & Actualités](#-api-articles--actualités)
3. [API Contenu Éditable](#-api-contenu-éditable)
4. [Gestion des Listes](#-gestion-des-listes)
5. [Composants React/Vue](#-composants-reactvue)
6. [Gestion d'erreurs](#-gestion-derreurs)
7. [Outils de debug](#-outils-de-debug)

---

## 🔐 Authentification

### Configuration de base
```javascript
const API_BASE = 'http://localhost:4000';
const token = localStorage.getItem('authToken');

// Headers par défaut
const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
```

### Fonctions d'authentification
```javascript
// Connexion
const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('authToken', data.token);
    return data.token;
  }
  throw new Error(data.message);
};

// Déconnexion
const logout = () => {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
};

// Vérifier l'authentification
const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};
```

---

## 📰 API Articles & Actualités

### Création d'articles
```javascript
async function createArticle(articleData, mainImageFile, coverImageFile) {
  const formData = new FormData();
  
  // Champs obligatoires
  formData.append('date', articleData.date);
  formData.append('titre', articleData.titre);
  formData.append('text_preview', articleData.preview);
  formData.append('content_json', JSON.stringify(articleData.content));
  
  // Champs optionnels
  if (articleData.category) {
    formData.append('category', JSON.stringify(articleData.category));
  }
  
  // Images
  if (mainImageFile) formData.append('image', mainImageFile);
  if (coverImageFile) formData.append('coverImage', coverImageFile);
  
  const response = await fetch(`${API_BASE}/api/articles`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Erreur lors de la création');
  }
  
  return result.data;
}
```

### Mise à jour d'articles
```javascript
async function updateArticle(articleId, updates, newMainImage, newCoverImage) {
  const formData = new FormData();
  
  Object.keys(updates).forEach(key => {
    const value = (key === 'content_json' || key === 'category') && typeof updates[key] === 'object'
      ? JSON.stringify(updates[key])
      : updates[key];
    formData.append(key, value);
  });
  
  if (newMainImage) formData.append('image', newMainImage);
  if (newCoverImage) formData.append('coverImage', newCoverImage);
  
  const response = await fetch(`${API_BASE}/api/articles/${articleId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return response.json();
}
```

### Suppression d'images
```javascript
async function removeArticleImage(articleId, imageType) {
  const formData = new FormData();
  
  if (imageType === 'main') {
    formData.append('img_path', '');
  } else if (imageType === 'cover') {
    formData.append('cover_img_path', '');
  }
  
  const response = await fetch(`${API_BASE}/api/articles/${articleId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return response.json();
}
```

---

## ✏️ API Contenu Éditable

### Classe utilitaire principale
```javascript
class EditableContentAPI {
  constructor(baseUrl = '', token = null) {
    this.baseUrl = baseUrl;
    this.token = token || localStorage.getItem('authToken');
  }
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }
  
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
        headers: this.getHeaders(false)
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

---

## 📝 Gestion des Listes

### Suppression d'éléments de liste

#### Méthode 1: Suppression par contenu
```javascript
// Supprimer un élément spécifique d'une liste
const removeListItem = async (pageName, selector, itemToRemove) => {
  try {
    // Récupérer le contenu actuel
    const data = await editableAPI.getPageElements(pageName);
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      // Parser le HTML et supprimer l'élément
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      // Trouver et supprimer l'élément spécifique
      const listItems = doc.querySelectorAll('li');
      listItems.forEach(li => {
        if (li.textContent.includes(itemToRemove)) {
          li.remove();
        }
      });
      
      // Mettre à jour avec le nouveau contenu
      const newContent = doc.body.innerHTML;
      
      await editableAPI.updateElement({
        page_name: pageName,
        element_selector: selector,
        content_html: newContent,
        element_type: 'list'
      });
      
      console.log('✅ Élément supprimé de la liste');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};

// Utilisation
removeListItem('notre-equipe', '.team-skills ul', 'JavaScript');
```

#### Méthode 2: Suppression par index
```javascript
// Supprimer un élément par sa position dans la liste
const removeListItemByIndex = async (pageName, selector, index) => {
  try {
    const data = await editableAPI.getPageElements(pageName);
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      const listItems = doc.querySelectorAll('li');
      if (listItems[index]) {
        listItems[index].remove();
        
        const newContent = doc.body.innerHTML;
        
        await editableAPI.updateElement({
          page_name: pageName,
          element_selector: selector,
          content_html: newContent,
          element_type: 'list'
        });
        
        console.log(`✅ Élément à l'index ${index} supprimé`);
        return true;
      } else {
        throw new Error(`Index ${index} non trouvé dans la liste`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};

// Utilisation
removeListItemByIndex('notre-equipe', '.team-skills ul', 2);
```

#### Méthode 3: Suppression depuis le DOM
```javascript
// Supprimer directement depuis le DOM avec sauvegarde automatique
const removeListItemFromDOM = async (selector, itemText) => {
  const listElement = document.querySelector(selector);
  if (listElement) {
    const listItems = listElement.querySelectorAll('li');
    let removed = false;
    
    listItems.forEach(li => {
      if (li.textContent.trim() === itemText) {
        li.remove();
        removed = true;
      }
    });
    
    if (removed) {
      // Sauvegarder automatiquement
      const pageName = 'notre-equipe'; // À adapter selon votre contexte
      await editableAPI.updateElement({
        page_name: pageName,
        element_selector: selector,
        content_html: listElement.innerHTML,
        element_type: 'list'
      });
      
      console.log('✅ Élément supprimé et sauvegardé');
    }
  }
};

// Utilisation
removeListItemFromDOM('.team-skills ul', 'JavaScript');
```

### Ajout d'éléments de liste
```javascript
// Ajouter un nouvel élément à une liste
const addListItem = async (pageName, selector, newItem, position = 'end') => {
  try {
    const data = await editableAPI.getPageElements(pageName);
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      const list = doc.querySelector('ul, ol');
      if (list) {
        const newLi = doc.createElement('li');
        newLi.textContent = newItem;
        
        if (position === 'start') {
          list.insertBefore(newLi, list.firstChild);
        } else if (typeof position === 'number') {
          const existingItems = list.querySelectorAll('li');
          if (existingItems[position]) {
            list.insertBefore(newLi, existingItems[position]);
          } else {
            list.appendChild(newLi);
          }
        } else {
          list.appendChild(newLi);
        }
        
        const newContent = doc.body.innerHTML;
        
        await editableAPI.updateElement({
          page_name: pageName,
          element_selector: selector,
          content_html: newContent,
          element_type: 'list'
        });
        
        console.log('✅ Nouvel élément ajouté à la liste');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout:', error);
    throw error;
  }
};

// Utilisation
addListItem('notre-equipe', '.team-skills ul', 'React', 'start');
addListItem('notre-equipe', '.team-skills ul', 'Vue.js', 2);
addListItem('notre-equipe', '.team-skills ul', 'Angular');
```

### Modification d'éléments de liste
```javascript
// Modifier le contenu d'un élément de liste
const updateListItem = async (pageName, selector, oldText, newText) => {
  try {
    const data = await editableAPI.getPageElements(pageName);
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      const listItems = doc.querySelectorAll('li');
      let updated = false;
      
      listItems.forEach(li => {
        if (li.textContent.includes(oldText)) {
          li.textContent = newText;
          updated = true;
        }
      });
      
      if (updated) {
        const newContent = doc.body.innerHTML;
        
        await editableAPI.updateElement({
          page_name: pageName,
          element_selector: selector,
          content_html: newContent,
          element_type: 'list'
        });
        
        console.log('✅ Élément de liste modifié');
        return true;
      } else {
        throw new Error(`Élément "${oldText}" non trouvé`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la modification:', error);
    throw error;
  }
};

// Utilisation
updateListItem('notre-equipe', '.team-skills ul', 'JavaScript', 'JavaScript ES6+');
```

### Vider une liste complète
```javascript
// Supprimer tous les éléments d'une liste
const clearList = async (pageName, selector) => {
  try {
    await editableAPI.updateElement({
      page_name: pageName,
      element_selector: selector,
      content_html: '<ul></ul>', // ou '<ol></ol>' selon le type
      element_type: 'list'
    });
    
    console.log('✅ Liste vidée');
    return true;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};

// Utilisation
clearList('notre-equipe', '.team-skills ul');
```

---

## ⚛️ Composants React

### Composant EditableElement
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

export default EditableElement;
```

### Composant EditableList
```jsx
import React, { useState, useEffect } from 'react';

const EditableList = ({ 
  pageName, 
  selector, 
  className = '',
  allowEdit = true,
  allowAdd = true,
  allowRemove = true
}) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState('');
  
  useEffect(() => {
    loadList();
  }, [pageName, selector]);
  
  const loadList = async () => {
    try {
      setIsLoading(true);
      const data = await editableAPI.getPageElements(pageName);
      const element = data.elements.find(el => el.element_selector === selector);
      
      if (element) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(element.content_html, 'text/html');
        const listItems = Array.from(doc.querySelectorAll('li')).map(li => li.textContent);
        setItems(listItems);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveList = async (newItems) => {
    try {
      setIsSaving(true);
      
      const listHTML = `<ul>${newItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
      
      await editableAPI.updateElement({
        page_name: pageName,
        element_selector: selector,
        content_html: listHTML,
        element_type: 'list'
      });
      
      setItems(newItems);
      
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
  
  const addItem = async () => {
    if (newItem.trim()) {
      const updatedItems = [...items, newItem.trim()];
      await saveList(updatedItems);
      setNewItem('');
    }
  };
  
  const removeItem = async (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    await saveList(updatedItems);
  };
  
  const updateItem = async (index, newValue) => {
    const updatedItems = items.map((item, i) => i === index ? newValue : item);
    await saveList(updatedItems);
  };
  
  if (isLoading) {
    return <div className={className}>Chargement de la liste...</div>;
  }
  
  return (
    <div className={`editable-list ${className}`}>
      <ul>
        {items.map((item, index) => (
          <li key={index} className="list-item">
            {allowEdit ? (
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                onBlur={() => saveList(items)}
                className="list-item-input"
              />
            ) : (
              <span>{item}</span>
            )}
            {allowRemove && (
              <button
                onClick={() => removeItem(index)}
                className="remove-btn"
                title="Supprimer"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      
      {allowAdd && (
        <div className="add-item-form">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="Ajouter un élément..."
            className="new-item-input"
          />
          <button onClick={addItem} className="add-btn">
            Ajouter
          </button>
        </div>
      )}
      
      {isSaving && (
        <div className="saving-indicator">💾 Sauvegarde...</div>
      )}
    </div>
  );
};

export default EditableList;
```

### Utilisation des composants
```jsx
import React from 'react';
import EditableElement from './EditableElement';
import EditableList from './EditableList';

const NotreEquipePage = () => {
  return (
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
      
      <EditableList
        pageName="notre-equipe"
        selector=".team-skills ul"
        className="skills-list"
        allowEdit={true}
        allowAdd={true}
        allowRemove={true}
      />
    </div>
  );
};

export default NotreEquipePage;
```

---

## 🖖 Composants Vue.js

### Composant EditableElement
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

### Composant EditableList
```vue
<template>
  <div class="editable-list">
    <ul v-if="!isLoading">
      <li v-for="(item, index) in items" :key="index" class="list-item">
        <input
          v-if="allowEdit"
          type="text"
          :value="item"
          @input="updateItem(index, $event.target.value)"
          @blur="saveList"
          class="list-item-input"
        />
        <span v-else>{{ item }}</span>
        
        <button
          v-if="allowRemove"
          @click="removeItem(index)"
          class="remove-btn"
          title="Supprimer"
        >
          ×
        </button>
      </li>
    </ul>
    
    <div v-if="allowAdd && !isLoading" class="add-item-form">
      <input
        type="text"
        v-model="newItem"
        @keyup.enter="addItem"
        placeholder="Ajouter un élément..."
        class="new-item-input"
      />
      <button @click="addItem" class="add-btn">
        Ajouter
      </button>
    </div>
    
    <div v-if="isSaving" class="saving-indicator">
      💾 Sauvegarde...
    </div>
    
    <div v-if="isLoading" class="loading">
      Chargement de la liste...
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'EditableList',
  props: {
    pageName: {
      type: String,
      required: true
    },
    selector: {
      type: String,
      required: true
    },
    allowEdit: {
      type: Boolean,
      default: true
    },
    allowAdd: {
      type: Boolean,
      default: true
    },
    allowRemove: {
      type: Boolean,
      default: true
    }
  },
  
  setup(props) {
    const items = ref([])
    const isLoading = ref(true)
    const isSaving = ref(false)
    const newItem = ref('')
    
    const loadList = async () => {
      try {
        isLoading.value = true
        const data = await editableAPI.getPageElements(props.pageName)
        const element = data.elements.find(el => el.element_selector === props.selector)
        
        if (element) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(element.content_html, 'text/html')
          const listItems = Array.from(doc.querySelectorAll('li')).map(li => li.textContent)
          items.value = listItems
        }
      } catch (error) {
        console.error('Erreur de chargement:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const saveList = async (newItems = items.value) => {
      try {
        isSaving.value = true
        
        const listHTML = `<ul>${newItems.map(item => `<li>${item}</li>`).join('')}</ul>`
        
        await editableAPI.updateElement({
          page_name: props.pageName,
          element_selector: props.selector,
          content_html: listHTML,
          element_type: 'list'
        })
        
        items.value = newItems
        
      } catch (error) {
        console.error('Erreur de sauvegarde:', error)
        alert('Erreur lors de la sauvegarde')
      } finally {
        isSaving.value = false
      }
    }
    
    const addItem = async () => {
      if (newItem.value.trim()) {
        const updatedItems = [...items.value, newItem.value.trim()]
        await saveList(updatedItems)
        newItem.value = ''
      }
    }
    
    const removeItem = async (index) => {
      const updatedItems = items.value.filter((_, i) => i !== index)
      await saveList(updatedItems)
    }
    
    const updateItem = async (index, newValue) => {
      const updatedItems = items.value.map((item, i) => i === index ? newValue : item)
      items.value = updatedItems
    }
    
    onMounted(() => {
      loadList()
    })
    
    return {
      items,
      isLoading,
      isSaving,
      newItem,
      addItem,
      removeItem,
      updateItem,
      saveList
    }
  }
}
</script>

<style scoped>
.editable-list {
  position: relative;
}

.list-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.list-item-input {
  flex: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  margin-left: 10px;
}

.add-item-form {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.new-item-input {
  flex: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.add-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 3px;
  cursor: pointer;
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
}
</style>
```

---

## 🎨 CSS Recommandé

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

/* Styles pour les listes éditables */
.editable-list {
  position: relative;
}

.list-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.list-item:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.list-item-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.list-item-input:focus {
  outline: none;
  border-color: #007bff;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  margin-left: 10px;
  font-size: 16px;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: #c82333;
}

.add-item-form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(0, 123, 255, 0.05);
  border-radius: 5px;
}

.new-item-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
}

.new-item-input:focus {
  outline: none;
  border-color: #007bff;
}

.add-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #218838;
}

/* Indicateurs de sauvegarde */
.saving-indicator {
  position: absolute;
  top: -35px;
  right: 0;
  background: #28a745;
  color: white;
  padding: 4px 12px;
  border-radius: 3px;
  font-size: 12px;
  animation: fadeInOut 2s;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
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
  .add-item-form {
    flex-direction: column;
  }
  
  .list-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .remove-btn {
    margin-left: 0;
    margin-top: 5px;
    align-self: flex-end;
  }
}
```

---

## 🚨 Gestion d'Erreurs

### Gestionnaire d'erreurs global
```javascript
const handleAPIError = (error, context = '') => {
  console.error(`Erreur ${context}:`, error);
  
  if (error.message.includes('401')) {
    logout();
    alert('Session expirée. Veuillez vous reconnecter.');
    window.location.href = '/login';
  } else if (error.message.includes('429')) {
    alert('Trop de modifications. Veuillez patienter quelques instants.');
  } else if (error.message.includes('400')) {
    alert('Contenu invalide. Vérifiez votre saisie.');
  } else {
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
```

### Validation côté client
```javascript
function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Type de fichier non supporté. Types acceptés: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (maximum 10MB)');
  }

  return true;
}
```

---

## 🔧 Outils de Debug

### Console de debug
```javascript
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
  
  // Tester les fonctions de liste
  testListFunctions: async (pageName, selector) => {
    console.log('🧪 Test des fonctions de liste...');
    
    try {
      // Test d'ajout
      await addListItem(pageName, selector, 'Test Item', 'start');
      console.log('✅ Test d\'ajout réussi');
      
      // Test de suppression
      await removeListItem(pageName, selector, 'Test Item');
      console.log('✅ Test de suppression réussi');
      
    } catch (error) {
      console.error('❌ Test échoué:', error);
    }
  },
  
  // Réinitialiser le cache
  clearCache: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('editStats');
    console.log('Cache effacé');
  }
};

// Raccourcis clavier pour le debug
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
    e.preventDefault();
    EditableDebug.toggleEditMode();
  }
});
```

---

## 📊 Endpoints Disponibles

### Articles & Actualités
```
POST   /api/articles        # Créer un article
GET    /api/articles        # Récupérer tous les articles  
GET    /api/articles/:id    # Récupérer un article
PATCH  /api/articles/:id    # Mettre à jour un article
DELETE /api/articles/:id    # Supprimer un article

POST   /api/actus          # Créer une actualité
GET    /api/actus          # Récupérer toutes les actualités
GET    /api/actus/:id      # Récupérer une actualité
PATCH  /api/actus/:id      # Mettre à jour une actualité
DELETE /api/actus/:id      # Supprimer une actualité
```

### Contenu Éditable
```
GET    /api/editable-content/:pageName     # Récupérer les éléments d'une page
PATCH  /api/editable-content/element       # Modifier un élément
POST   /api/editable-content/bulk-update   # Modifier plusieurs éléments
```

### Authentification
```
POST   /api/login          # Se connecter
POST   /api/register       # S'inscrire (si disponible)
```

---

## 🎉 Exemples d'Utilisation Complète

### Page d'équipe avec gestion de liste
```javascript
// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  // Charger le contenu de la page
  await loadPageContent('notre-equipe');
  
  // Rendre les éléments éditables
  makeEditable('.team-intro h2', 'notre-equipe', 'title');
  makeEditable('.team-intro p', 'notre-equipe', 'paragraph');
  
  // Gérer la liste des compétences
  setupSkillsList();
});

const setupSkillsList = () => {
  const skillsList = document.querySelector('.team-skills ul');
  if (skillsList) {
    // Ajouter des boutons de gestion
    const addButton = document.createElement('button');
    addButton.textContent = '+ Ajouter compétence';
    addButton.onclick = () => addNewSkill();
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Vider la liste';
    clearButton.onclick = () => clearSkillsList();
    
    skillsList.parentNode.appendChild(addButton);
    skillsList.parentNode.appendChild(clearButton);
  }
};

const addNewSkill = async () => {
  const skill = prompt('Nouvelle compétence:');
  if (skill) {
    await addListItem('notre-equipe', '.team-skills ul', skill);
  }
};

const clearSkillsList = async () => {
  if (confirm('Vider toute la liste des compétences ?')) {
    await clearList('notre-equipe', '.team-skills ul');
  }
};
```

---

## 🔗 Liens Utiles

- **Documentation API Images** : `FRONTEND-API-GUIDE.md`
- **Documentation Contenu Éditable** : `FRONTEND-EDITABLE-CONTENT-GUIDE.md`
- **Tests API** : Exécuter `node test-images-api.js`
- **Base URL locale** : `http://localhost:4000`

---

*Guide complet mis à jour le 15/01/2024 - Compatible avec toutes les fonctionnalités de l'API Rimconseil v2.0*
