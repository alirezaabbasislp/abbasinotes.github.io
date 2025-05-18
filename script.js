// Select HTML elements
const noteTitleInput = document.getElementById('note-title-input');
const noteContentInput = document.getElementById('note-content-input');
const saveNoteButton = document.getElementById('save-note-button');
const notesListDiv = document.getElementById('notes-list'); // Use the ul element
const newNoteButton = document.getElementById('new-note-button');
const searchInput = document.getElementById('search-input'); // Select search input

// Variable to store notes
let notes = [];

// Variable to store the ID of the note being edited
let editingNoteId = null;

// Global variable for Quill editor
let quillEditor;

// Function to render the list of notes
function renderNotesList(notesToRender = notes) { // Accept notes array as parameter
    notesListDiv.innerHTML = ''; // Clear the current list

    notesToRender.forEach(note => {
        const noteItemLi = document.createElement('li');
        noteItemLi.dataset.id = note.id; // Store note ID on the list item

        // Add fade-in class for animation
        noteItemLi.classList.add('note-fade-in');

        const noteTitle = document.createElement('h3');
        noteTitle.textContent = note.title;

        const noteContent = document.createElement('div'); // Use div to better handle rich text
        noteContent.classList.add('note-content-display'); // Optional class for styling
        noteContent.innerHTML = note.content; // Use innerHTML to render rich text

        // Display snippet if content is too long (might need more sophisticated handling for rich text)
        // For now, let's display the full content to see rich text.
        // If snippets are needed, Quill's API or a DOM manipulation approach would be better.

        const editButton = document.createElement('button');
        editButton.textContent = 'ویرایش';
        editButton.classList.add('edit-button'); // Add edit button class
        editButton.dataset.id = note.id; // Store note ID on the button
        editButton.onclick = () => loadNoteForEditing(note.id); // Add event listener


        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'حذف';
        deleteButton.classList.add('delete-button'); // Add delete button class
        deleteButton.dataset.id = note.id; // Store note ID on the button
        deleteButton.onclick = () => deleteNote(note.id); // Add event listener

        // Helper function to format timestamp
        const formatTimestamp = (timestamp) => {
            const date = new Date(timestamp);
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleDateString('fa-IR', options);
        };

        const noteTimestampsDiv = document.createElement('div');
        noteTimestampsDiv.classList.add('note-timestamps');
        noteTimestampsDiv.innerHTML = `ایجاد: ${formatTimestamp(note.createdAt)} | آخرین ویرایش: ${formatTimestamp(note.updatedAt)}`;

        // Create download button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'دانلود';
        downloadButton.classList.add('download-button'); // Add download button class
        downloadButton.dataset.id = note.id; // Store note ID on the button
        downloadButton.onclick = () => downloadNote(note.id); // Add event listener

        noteItemLi.appendChild(noteTitle);
        noteItemLi.appendChild(noteContent);
        noteItemLi.appendChild(noteTimestampsDiv); // Add timestamps before actions

        const noteActionsDiv = document.createElement('div');
        noteActionsDiv.appendChild(downloadButton); // Add download button
        noteActionsDiv.appendChild(editButton);
        noteActionsDiv.appendChild(deleteButton);

        noteItemLi.appendChild(noteActionsDiv);

        notesListDiv.appendChild(noteItemLi);
    });
}

// Placeholder for download function (implementation needed)
function downloadNote(noteId) {
    console.log('Download button clicked for note ID:', noteId);
    // Implementation to find the note and download its content as HTML
    const noteToDownload = notes.find(note => note.id === noteId);
    if (noteToDownload) {
        const htmlContent = noteToDownload.content; // Assuming content is already HTML from Quill
        const noteTitle = noteToDownload.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // Sanitize title for filename
        const filename = `${noteTitle || 'note'}.html`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Function to save notes to localStorage
// Function to save notes to localStorage
function saveNotesToLocalStorage() {
    localStorage.setItem('my-notes-app', JSON.stringify(notes));
}

// Function to load notes from localStorage
function loadNotesFromLocalStorage() {
    const storedNotes = localStorage.getItem('my-notes-app');
    if (storedNotes) {
        notes = JSON.parse(storedNotes);
    } else {
        notes = []; // Ensure notes is an empty array if nothing is stored
    }
    renderNotesList(); // Render the list after loading
}

// Initialize Quill editor and load notes when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill
    quillEditor = new Quill('#note-content-editor', {
        theme: 'snow', // or 'bubble'
        placeholder: 'متن یادداشت خود را اینجا بنویسید...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'align': [] }],
                ['link'],
                ['clean']
            ]
        }
    });

    // Load notes from local storage after Quill is initialized
    loadNotesFromLocalStorage();
});

// Event listener for search input
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter(note => {
        return note.title.toLowerCase().includes(searchTerm) ||
               note.content.toLowerCase().includes(searchTerm);
    });
    renderNotesList(filteredNotes); // Render filtered notes
});

// Event listener for save button
saveNoteButton.addEventListener('click', () => {
    const title = noteTitleInput.value.trim();

    if (!quillEditor) {
        console.error('Quill editor is not initialized.');
        return;
    }

    const contentHTML = quillEditor.root.innerHTML;

    if (title === '') {
        alert('عنوان یادداشت نمی‌تواند خالی باشد.');
        return;
    }

    if (editingNoteId !== null) {
        // Update existing note
        const noteToUpdate = notes.find(note => note.id === editingNoteId);
        if (noteToUpdate) {
            noteToUpdate.title = title;
            noteToUpdate.content = contentHTML; // Use HTML content from Quill
            noteToUpdate.updatedAt = Date.now(); // Update update timestamp
        }
    } else {
        // Create new note
        const now = Date.now();
        const newNote = {
            id: now, // Simple unique ID
            title: title,
            content: contentHTML, // Use HTML content from Quill
            createdAt: now, // Set creation timestamp
            updatedAt: now  // Set initial update timestamp
        };
        notes.push(newNote);
    }

    // Clear form and reset editing state
    noteTitleInput.value = '';
    // Remove the incorrect line accessing noteContentInput.value
    if (quillEditor) {
        quillEditor.root.innerHTML = '<p><br></p>'; // Clear Quill editor
    }
    editingNoteId = null;



    saveNotesToLocalStorage(); // Save changes
    renderNotesList(); // Update the list display
});

// Event listener for new note button
newNoteButton.addEventListener('click', () => {
    noteTitleInput.value = ''; // Clear title input
    if (quillEditor) {
        quillEditor.root.innerHTML = '<p><br></p>'; // Clear Quill editor
    }
    noteTitleInput.focus(); // Set focus to title input
});

// Function to load a note into the editor for editing
function loadNoteForEditing(noteId) {
    const noteToEdit = notes.find(note => note.id === noteId);
    if (noteToEdit) {
        noteTitleInput.value = noteToEdit.title;
        if (quillEditor) {
            quillEditor.root.innerHTML = noteToEdit.content || '<p><br></p>'; // Load content into Quill
        }
        editingNoteId = noteId;
    }
}

// Function to delete a note
function deleteNote(noteId) {
    // Optional: Ask for confirmation
    const confirmed = confirm('آیا از حذف این یادداشت اطمینان دارید؟');
    if (!confirmed) {
        return; // Stop if not confirmed
    }

    // Filter out the note to be deleted
    notes = notes.filter(note => note.id !== noteId);

    // If the deleted note was being edited, clear the form
    if (editingNoteId === noteId) {
        noteTitleInput.value = '';
        noteContentInput.value = '';
        editingNoteId = null;
    }

    saveNotesToLocalStorage(); // Save changes
    renderNotesList(); // Update the list display
}