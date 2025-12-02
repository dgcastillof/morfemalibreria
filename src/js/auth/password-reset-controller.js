/** * Password Reset Controller * * Handles the password reset form submission.
* Sends a password reset email via Firebase Auth. */ import { sendPasswordReset
} from './auth-esm.js'; // Simple email validation regex const EMAIL_REGEX =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/; /** * Show a message in the message container *
@param {string} text - Message text * @param {'error' | 'success' | 'warning'}
type - Message type */ function showMessage(text, type) { const container =
document.getElementById('reset-message'); if (!container) return;
container.textContent = text; container.className = 'auth-message show ' + type;
} /** * Hide the message container */ function hideMessage() { const container =
document.getElementById('reset-message'); if (!container) return;
container.className = 'auth-message'; container.textContent = ''; } /** * Show a
field error * @param {string} inputId - The input element ID * @param {string}
errorId - The error element ID */ function showFieldError(inputId, errorId) {
const input = document.getElementById(inputId); const error =
document.getElementById(errorId); if (input) input.classList.add('input-error');
if (error) error.classList.add('show'); } /** * Hide a field error * @param
{string} inputId - The input element ID * @param {string} errorId - The error
element ID */ function hideFieldError(inputId, errorId) { const input =
document.getElementById(inputId); const error =
document.getElementById(errorId); if (input)
input.classList.remove('input-error'); if (error)
error.classList.remove('show'); } /** * Set the loading state on the submit
button * @param {boolean} loading - Whether to show loading state */ function
setLoading(loading) { const button = document.getElementById('reset-submit'); if
(!button) return; if (loading) { button.classList.add('loading');
button.disabled = true; } else { button.classList.remove('loading');
button.disabled = false; } } /** * Validate email format * @param {string} email
- Email to validate * @returns {boolean} Whether the email is valid */ function
isValidEmail(email) { return EMAIL_REGEX.test(email); } /** * Handle the
password reset form submission * @param {Event} e - The submit event */ async
function handleResetSubmit(e) { e.preventDefault(); const emailInput =
document.getElementById('reset-email'); const email = emailInput?.value.trim()
|| ''; // Reset errors hideFieldError('reset-email', 'reset-email-error');
hideMessage(); // Validate email if (!email || !isValidEmail(email)) {
showFieldError('reset-email', 'reset-email-error'); return; } // Start password
reset setLoading(true); try { await sendPasswordReset(email); // Always show
success message for security (don't reveal if email exists) showMessage( 'Si el
email existe en nuestro sistema, recibirás un enlace para restablecer tu
contraseña.', 'success' ); // Clear the form if (emailInput) { emailInput.value
= ''; } } catch (error) { // For security, still show a generic success message
// Only show error for invalid email format errors if (error.code ===
'auth/invalid-email') { showMessage(error.message, 'error'); } else {
showMessage( 'Si el email existe en nuestro sistema, recibirás un enlace para
restablecer tu contraseña.', 'success' ); } } finally { setLoading(false); } }
/** * Set up input listeners to clear errors on typing */ function
setupInputListeners() { const emailInput =
document.getElementById('reset-email'); if (emailInput) {
emailInput.addEventListener('input', () => { hideFieldError('reset-email',
'reset-email-error'); }); } } /** * Initialize the password reset controller */
function init() { const form = document.getElementById('reset-form'); if (form)
{ form.addEventListener('submit', handleResetSubmit); } setupInputListeners(); }
// Initialize when DOM is ready if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init); } else { init(); }
