// Global variables
let currentTab = '';
let currentClassName = '';
const SHEET_ID = '1d4Im-qFPn0bWNA4LSSf7MM24Ut6QzvDjfgIQZFQ7F2U';
const SHEET_ID_12TH_IT = '1QHtf_cXtHdMnDl3IvVyukxdcPaO5sGMmQzU-lXjtkw4';
const SHEET_ID_12TH_COMMERCE = '1TiACzhkXO0JBXp1GabjAgmXnXToCmwDxTdLbHd09xCA'; // New Sheet ID for 12th Commerce

// Select class and show roll input screen
function selectClass(tab, className) {
    currentTab = tab;
    currentClassName = className;
    
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('rollScreen').style.display = 'block';
    document.getElementById('selectedClassName').textContent = className;
    document.getElementById('rollInput').value = '';
    document.getElementById('messageBox').innerHTML = '';
}

// Go back to home screen
function goHome() {
    document.getElementById('homeScreen').style.display = 'block';
    document.getElementById('rollScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('rollInput').value = '';
    document.getElementById('messageBox').innerHTML = '';
}

// Fetch result from Google Sheet
async function fetchResult() {
    const rollNo = document.getElementById('rollInput').value.trim();
    const messageBox = document.getElementById('messageBox');

    // Validation
    if (!rollNo) {
        messageBox.innerHTML = '<span class="error-msg">⚠️ Please enter a roll number</span>';
        return;
    }

    // Show loading message
    messageBox.innerHTML = '<span class="loading-msg">🔍 Fetching your result...</span>';

    try {
        // Use direct URL with sheet name
        let url;
        let sheetId;
        
        if (currentTab === '11th') {
            // For 11th class, use the main sheet (first tab)
            sheetId = SHEET_ID;
            url = `https://opensheet.elk.sh/${sheetId}/1`;
        } else if (currentTab === '12_Sci_IT') {
            // For 12th Sci/IT class, use the new sheet
            sheetId = SHEET_ID_12TH_IT;
            url = `https://opensheet.elk.sh/${sheetId}/class12`;
        } else if (currentTab === 'sheet12commerce') {
            // For 12th Commerce class, use the commerce sheet
            sheetId = SHEET_ID_12TH_COMMERCE;
            url = `https://opensheet.elk.sh/${sheetId}/sheet12commerce`;
        } else {
            // For other classes, use the tab name with original sheet
            sheetId = SHEET_ID;
            url = `https://opensheet.elk.sh/${sheetId}/${currentTab}`;
        }
        
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        if (!data || data.length === 0) {
            messageBox.innerHTML = '<span class="error-msg">❌ No data found in the sheet!</span>';
            return;
        }

        // DEBUG: Show available roll numbers and column names
        console.log('Available columns:', Object.keys(data[0]));
        const availableRollNos = data.map(s => s.RollNo || s.rollno || s.ROLLNO || s['Roll No'] || s['Roll Number'] || 'N/A');
        console.log('Available roll numbers:', availableRollNos);

        // Find student by roll number - TRY ALL POSSIBLE COLUMN NAMES
        let student = null;
        const firstRow = data[0];
        
        // List of possible roll number column names
        const possibleRollColumns = [
            'RollNo', 'rollno', 'ROLLNO', 'Roll No', 'Roll Number', 
            'Roll', 'ROLL', 'roll', 'Student ID', 'StudentId'
        ];

        // Try each possible column name
        for (let col of possibleRollColumns) {
            if (firstRow[col] !== undefined) {
                console.log(`Trying column: ${col}`);
                student = data.find(s => String(s[col]).trim() === rollNo);
                if (student) {
                    console.log(`Found student using column: ${col}`);
                    break;
                }
            }
        }

        // If still not found, try any column that contains "roll"
        if (!student) {
            const allColumns = Object.keys(firstRow);
            const rollLikeColumns = allColumns.filter(key => 
                key.toLowerCase().includes('roll') || 
                key.toLowerCase().includes('no') ||
                key.toLowerCase().includes('id')
            );
            
            console.log('Roll-like columns:', rollLikeColumns);
            
            for (let col of rollLikeColumns) {
                student = data.find(s => String(s[col]).trim() === rollNo);
                if (student) {
                    console.log(`Found student using column: ${col}`);
                    break;
                }
            }
        }

        if (!student) {
            messageBox.innerHTML = `
                <span class="error-msg">
                    ❌ Roll number "${rollNo}" not found!<br>
                    Available roll numbers: ${availableRollNos.join(', ')}
                </span>
            `;
            return;
        }

        // Display result
        displayResult(student);
        messageBox.innerHTML = '<span class="success-msg">✅ Result found successfully!</span>';

    } catch (error) {
        console.error('Error fetching result:', error);
        messageBox.innerHTML = `
            <span class="error-msg">
                ⚠️ Error loading result: ${error.message}<br>
                Please check your internet connection and try again.
            </span>
        `;
    }
}

// Display result in table
function displayResult(student) {
    document.getElementById('rollScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'block';

    // Get all available fields from the student data
    const fields = Object.keys(student);
    
    let resultHTML = `
        <tr>
            <th>Field</th>
            <th>Details</th>
        </tr>
    `;

    // Dynamically create table rows for all available fields
    fields.forEach(field => {
        if (field && student[field] !== undefined && student[field] !== '' && student[field] !== null) {
            resultHTML += `
                <tr>
                    <td>${formatFieldName(field)}</td>
                    <td>${student[field]}</td>
                </tr>
            `;
        }
    });

    document.getElementById('resultTable').innerHTML = resultHTML;
}

// Format field names to be more readable
function formatFieldName(field) {
    const fieldMap = {
        'RollNo': 'Roll Number',
        'rollno': 'Roll Number',
        'ROLLNO': 'Roll Number',
        'Roll No': 'Roll Number',
        'Roll Number': 'Roll Number',
        'Name': 'Student Name',
        'name': 'Student Name',
        'NAME': 'Student Name',
        'Student Name': 'Student Name',
        'English': 'English',
        'Math': 'Mathematics',
        'Mathematics': 'Mathematics',
        'Science': 'Science',
        'Computer': 'Computer',
        'Total': 'Total Marks',
        'Result': 'Result',
        'Percentage': 'Percentage',
        'Grade': 'Grade'
    };
    
    return fieldMap[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Enable Enter key for roll number submission
document.addEventListener('DOMContentLoaded', function() {
    const rollInput = document.getElementById('rollInput');
    if (rollInput) {
        rollInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                fetchResult();
            }
        });
    }
});

// Toggle Chatbox function
function toggleChatbox() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.toggle('active');
}

// Close chatbox when clicking outside
document.addEventListener('click', function(e) {
    const chatbox = document.getElementById('chatbox');
    const chatbotButton = document.querySelector('.chatbot-button');
    
    if (chatbox && chatbotButton) {
        if (!chatbox.contains(e.target) && !chatbotButton.contains(e.target)) {
            chatbox.classList.remove('active');
        }
    }
});