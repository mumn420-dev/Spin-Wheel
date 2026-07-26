const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemImageFile = document.getElementById('item-image-file');
const fileChosenText = document.getElementById('file-chosen-text');
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const centerImg = document.getElementById('center-img');
const centerText = document.getElementById('center-text');
const groupNameSpan = document.getElementById('group-name-span');
const groupNameList = document.getElementById('group-name-list');
const contenderListDiv = document.getElementById('contender-list');

const tabPeople = document.getElementById('tab-people');
const tabThings = document.getElementById('tab-things');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editNameInput = document.getElementById('edit-name-input');
const editImageFile = document.getElementById('edit-image-file');
const editFileText = document.getElementById('edit-file-text');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

let currentGroup = 'people';
let editingIndex = null;
let uploadedImageBase64 = '';
let editImageBase64 = '';
let currentRotation = 0;
let isSpinning = false;

// Robust localStorage loading
let data = { people: [], things: [] };
try {
    const savedData = localStorage.getItem('spinWheelData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.people) data.people = parsed.people;
        if (parsed.things) data.things = parsed.things;
    }
} catch (e) {
    console.error("Error loading stored data:", e);
}

// Reliable saveData wrapper
function saveData() {
    try {
        localStorage.setItem('spinWheelData', JSON.stringify(data));
    } catch (e) {
        alert("Storage limit reached! Try choosing smaller pictures.");
        console.error("Error saving data to localStorage:", e);
    }
}

// Helper to compress uploaded images so they fit securely inside localStorage
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            const maxDim = 200; // Limit dimensions for lightweight storage
            if (width > height) {
                if (width > maxDim) { height *= maxDim / width; width = maxDim; }
            } else {
                if (height > maxDim) { width *= maxDim / height; height = maxDim; }
            }
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0, width, height);
            callback(tempCanvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Image File Selection Handlers
itemImageFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileChosenText.textContent = file.name;
        compressImage(file, (base64Result) => {
            uploadedImageBase64 = base64Result;
        });
    }
});

editImageFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        editFileText.textContent = file.name;
        compressImage(file, (base64Result) => {
            editImageBase64 = base64Result;
        });
    }
});

// Group Switching Tabs
tabPeople.addEventListener('click', () => switchGroup('people'));
tabThings.addEventListener('click', () => switchGroup('things'));

function switchGroup(groupName) {
    if (isSpinning) return;
    currentGroup = groupName;

    if (groupName === 'people') {
        tabPeople.classList.add('active');
        tabThings.classList.remove('active');
    } else {
        tabThings.classList.add('active');
        tabPeople.classList.remove('active');
    }

    groupNameSpan.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);
    groupNameList.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);

    resetCenter();
    updateUI();
}

// Add Contender Form Submission
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const image = uploadedImageBase64 || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    if (name) {
        data[currentGroup].push({ name, image });
        saveData();
        
        itemNameInput.value = '';
        itemImageFile.value = '';
        fileChosenText.textContent = 'No picture chosen';
        uploadedImageBase64 = '';
        
        resetCenter();
        updateUI();
    }
});

// Reset Current Group
resetBtn.addEventListener('click', () => {
    if (isSpinning) return;
    if (confirm(`Are you sure you want to reset all contenders in the ${currentGroup} group?`)) {
        data[currentGroup] = [];
        saveData();
        resetCenter();
        updateUI();
    }
});

function resetCenter() {
    centerImg.classList.add('hidden');
    centerImg.src = '';
    centerText.classList.remove('hidden');
    centerText.textContent = 'SPIN';
    canvas.style.transition = 'none';
    canvas.style.transform = `rotate(0deg)`;
    currentRotation = 0;
}

// Delete Contender with Warning Confirmation
window.deleteContender = function(index) {
    if (isSpinning) return;
    const item = data[currentGroup][index];
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        data[currentGroup].splice(index, 1);
        saveData();
        resetCenter();
        updateUI();
    }
};

// Open Edit Modal
window.openEditModal = function(index) {
    if (isSpinning) return;
    editingIndex = index;
    const item = data[currentGroup][index];
    editNameInput.value = item.name;
    editImageBase64 = item.image;
    editFileText.textContent = 'Keep current picture';
    editModal.classList.remove('hidden');
};

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
        data[currentGroup][editingIndex].name = editNameInput.value.trim();
        data[currentGroup][editingIndex].image = editImageBase64;
        
        // Clear cached image object reference so canvas instantly loads the new picture
        delete data[currentGroup][editingIndex].imgObj;

        saveData();
        editModal.classList.add('hidden');
        editingIndex = null;
        resetCenter();
        updateUI();
    }
});

cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingIndex = null;
});

// Update User Interface and Redraw Wheel Canvas
function updateUI() {
    drawWheel();

    contenderListDiv.innerHTML = '';
    const items = data[currentGroup];

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `
            <div class="mini-info">
                <img src="${item.image}" alt="">
                <span>${item.name}</span>
            </div>
            <div class="mini-actions">
                <button type="button" class="btn btn-edit" onclick="openEditModal(${index})">Edit</button>
                <button type="button" class="btn btn-delete" onclick="deleteContender(${index})">Delete</button>
            </div>
        `;
        contenderListDiv.appendChild(div);
    });

    spinBtn.disabled = items.length < 2;
}

// Draw Wheel Canvas (With non-overlapping name and picture layout)
function drawWheel() {
    const items = data[currentGroup];
    const n = items.length;
    const centerX = 190;
    const centerY = 190;
    const outerRadius = 185;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (n === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = "bold 18px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Add items to start!", centerX, centerY);
        return;
    }

    const arcSize = (Math.PI * 2) / n;
    const colors = ['#e94560', '#0f3460', '#533483', '#16213e', '#e94560', '#0f3460'];

    // 1. Draw Slices
    for (let i = 0; i < n; i++) {
        const angle = i * arcSize;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, angle, angle + arcSize);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();
    }

    // 2. Draw Images and Names (Picture closer to center, Name closer to outer rim so they never overlap)
    items.forEach((item, i) => {
        const angle = i * arcSize + arcSize / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        const imgDist = 105;   // Picture inner position
        const imgSize = 36;    // Picture size
        const textDist = 150;  // Name outer position (above picture)

        // Draw text name clearly visible near the outer rim
        ctx.save();
        ctx.rotate(Math.PI / 2); // Rotate text upright relative to slice
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Segoe UI";
        ctx.fillText(item.name, 0, -textDist);
        ctx.restore();

        // Load or draw image
        if (!item.imgObj) {
            item.imgObj = new Image();
            item.imgObj.crossOrigin = "anonymous";
            item.imgObj.src = item.image;
            item.imgObj.onload = () => drawWheel(); 
        } else if (item.imgObj.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(imgDist, 0, imgSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(item.imgObj, imgDist - imgSize / 2, -imgSize / 2, imgSize, imgSize);
            ctx.restore();
            
            // Gold ring around contestant image
            ctx.beginPath();
            ctx.arc(imgDist, 0, imgSize / 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffd700';
            ctx.stroke();
        }

        ctx.restore();
    });

    // 3. Mask Center Hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();
}

// Spin Wheel Physics Action
spinBtn.addEventListener('click', () => {
    const items = data[currentGroup];
    if (items.length < 2 || isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    resetCenter();

    const n = items.length;
    const sliceAngle = 360 / n;
    
    const winningIndex = Math.floor(Math.random() * n);
    
    const randomFullSpins = 6 * 360; 
    const targetSliceCenterAngle = winningIndex * sliceAngle + (sliceAngle / 2);
    const targetRotation = randomFullSpins + (360 - targetSliceCenterAngle);

    currentRotation = targetRotation;
    canvas.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.15, 1)';
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        const winner = items[winningIndex];
        centerText.classList.add('hidden');
        centerImg.src = winner.image;
        centerImg.classList.remove('hidden');
        isSpinning = false;
        spinBtn.disabled = false;
    }, 4000);
});

// Initial app load
updateUI();
