// --- CONFIGURATION ---
// IMPORTANT: Replace this URL with your actual Google Apps Script Web App URL.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzP9wMoX78tniSJT_w8UexVfpu0-6OJFjrP-YvYFBAi3smPtcQKsLRSuZRC0Z2VqS2SBA/exec";

// --- LANGUAGE & TRANSLATIONS ---
const translations = {
    en: {
        welcome_heading: "Welcome to the Clinic",
        welcome_subheading: "Please fill this form to get your token.",
        label_name: "Full Name",
        label_phone: "Phone Number",
        label_age: "Age",
        button_get_token: "Get My Token",
        button_submitting: "Submitting...",
        success_heading: "Registration Successful!",
        success_subheading: "Please show this screen at the reception.",
        label_patient_id: "Patient ID:",
        label_token: "Today's Token:",
        alert_error: "An error occurred. Please try again.",
        alert_invalid_phone: "Please enter a valid phone number.",
        alert_invalid_age: "Please enter a valid age (between 1 and 120).",
        button_reset: "Register Another Patient"
    },
    mr: {
        welcome_heading: "क्लिनिकमध्ये आपले स्वागत आहे",
        welcome_subheading: "कृपया तुमचा टोकन मिळवण्यासाठी हा फॉर्म भरा.",
        label_name: "पूर्ण नाव",
        label_phone: "फोन नंबर",
        label_age: "वय",
        button_get_token: "माझे टोकन मिळवा",
        button_submitting: "सबमिट करत आहे...",
        success_heading: "नोंदणी यशस्वी झाली!",
        success_subheading: "कृपया ही स्क्रीन रिसेप्शनला दाखवा.",
        label_patient_id: "रुग्ण आयडी:",
        label_token: "आजचे टोकन:",
        alert_error: "एक त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
        alert_invalid_phone: "कृपया वैध फोन नंबर प्रविष्ट करा.",
        alert_invalid_age: "कृपया वैध वय प्रविष्ट करा (1 ते 120 दरम्यान).",
        button_reset: "दुसऱ्या रुग्णाची नोंदणी करा"
    }
};
let currentLang = 'en';

// --- DOM ELEMENT REFERENCES ---
const form = document.getElementById('clinic-form');
const submitButton = document.getElementById('submit-button');
const registrationFormView = document.getElementById('registration-form');
const successMessageView = document.getElementById('success-message');
const patientIdElement = document.getElementById('patient-id');
const tokenNumberElement = document.getElementById('token-number');
const langEnButton = document.getElementById('lang-en');
const langMrButton = document.getElementById('lang-mr');
const resetButton = document.getElementById('reset-button');

// --- EVENT LISTENER ---
form.addEventListener('submit', handleFormSubmit);
langEnButton.addEventListener('click', () => setLanguage('en'));
langMrButton.addEventListener('click', () => setLanguage('mr'));
resetButton.addEventListener('click', resetFormView);

/**
 * Sets the application language and updates the UI.
 * @param {string} lang - The language to set ('en' or 'mr').
 */
function setLanguage(lang) {
    currentLang = lang;
    // Update the document's primary language for accessibility
    document.documentElement.lang = lang;

    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update button styles
    if (lang === 'en') {
        langEnButton.classList.add('font-semibold', 'text-blue-600', 'underline');
        langMrButton.classList.remove('font-semibold', 'text-blue-600', 'underline');
    } else {
        langMrButton.classList.add('font-semibold', 'text-blue-600', 'underline');
        langEnButton.classList.remove('font-semibold', 'text-blue-600', 'underline');
    }
}

/**
 * Handles the form submission process.
 * @param {Event} e - The submit event object.
 */
async function handleFormSubmit(e) {
    e.preventDefault(); // Prevent the default form submission behavior

    // --- 1. Enter Loading State ---
    setLoadingState(true);

    // --- 2. Capture Form Data ---
    const formData = new FormData(form);
    const data = {
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        age: formData.get('age').trim(),
    };

    // --- Client-Side Validation ---
    const phoneRegex = /^\+?[0-9\s-()]{7,15}$/; // Basic regex for phone numbers
    if (!phoneRegex.test(data.phone)) {
        alert(translations[currentLang].alert_invalid_phone);
        setLoadingState(false);
        return; // Stop the submission
    }

    const ageNum = parseInt(data.age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        alert(translations[currentLang].alert_invalid_age);
        setLoadingState(false);
        return; // Stop the submission
    }
    // --- End Validation ---

    try {
        // --- 3. Send Data to Google Apps Script ---
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // Important for cross-origin requests
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            // Handle HTTP errors like 404 or 500
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const result = await response.json();

        // --- 4. Handle Successful Response ---
        if (result.result === 'success') { // Changed 'status' to 'result'
            displaySuccessScreen(result.patientId, result.tokenNumber); // Adjusted to match backend response
        } else {
            // Handle application-specific errors returned from the script
            throw new Error(result.message || 'An unknown error occurred.');
        }

    } catch (error) {
        // --- 5. Handle Failed Response/Error ---
        console.error("Submission Error:", error);

        // Provide a more detailed error message for easier debugging
        let errorMessage = translations[currentLang].alert_error; // Default message
        if (error.message.includes("Failed to fetch")) {
            errorMessage += "\n\nDetails: Network error or CORS issue. Please check the browser console (F12) for more information and verify your Apps Script deployment permissions.";
        } else if (error instanceof SyntaxError) {
            errorMessage += "\n\nDetails: The server response was not valid JSON. This often means an error occurred on the server-side. Check the Apps Script project's 'Executions' log for errors.";
        } else {
            errorMessage += `\n\nDetails: ${error.message}`;
        }

        alert(errorMessage);
        setLoadingState(false); // Re-enable the form
    }
}

/**
 * Toggles the loading state of the submit button.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function setLoadingState(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? translations[currentLang].button_submitting : translations[currentLang].button_get_token;
}

/**
 * Hides the form and displays the success screen with the received data.
 * @param {string} patientId - The patient ID received from the server.
 * @param {string|number} tokenNumber - The token number received from the server.
 */
function displaySuccessScreen(patientId, tokenNumber) {
    // Populate the data
    patientIdElement.textContent = patientId;
    tokenNumberElement.textContent = tokenNumber;

    // Animate the transition
    registrationFormView.style.opacity = '0';
    setTimeout(() => {
        registrationFormView.classList.add('hidden');
        successMessageView.classList.remove('hidden');
        successMessageView.style.opacity = '0';
        setTimeout(() => {
            successMessageView.style.opacity = '1';
        }, 50); // Small delay to ensure the element is rendered before fading in
    }, 500); // Match the CSS transition duration
}

/**
 * Resets the view from the success screen back to the registration form.
 */
function resetFormView() {
    // Reset the form fields
    form.reset();

    // Animate the transition back
    successMessageView.style.opacity = '0';
    setTimeout(() => {
        successMessageView.classList.add('hidden');
        registrationFormView.classList.remove('hidden');
        registrationFormView.style.opacity = '0';
        setTimeout(() => {
            registrationFormView.style.opacity = '1';
        }, 50); // Small delay for fade-in
    }, 500); // Match the CSS transition duration
}

/**
 * Initializes the application by setting the language based on browser preference.
 */
function initializeApp() {
    // Get the primary language from the browser (e.g., 'en' from 'en-US')
    const browserLang = navigator.language.split('-')[0];

    // If the browser language is Marathi ('mr'), set it, otherwise default to English.
    const initialLang = browserLang === 'mr' ? 'mr' : 'en';
    setLanguage(initialLang);
}

// Run the initialization function when the page content has fully loaded.
document.addEventListener('DOMContentLoaded', initializeApp);