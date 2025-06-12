import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
import { calculateStorageBilling } from "./aiStorageBilling.mjs";
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * Generates an AI-driven invoice for storage usage.
 * @param {string} userId - The user being invoiced.
 * @returns {object} - AI-generated invoice.
 */
const generateStorageInvoice = async (userId) => {
  if (isKillSwitchEnabled()) return;
  console.log(`🧾 AI generating storage invoice for user: ${userId}`);

  const billingData = await calculateStorageBilling(userId);
  let invoiceDetails = {};

  // AI-generated invoice creation
  // @ai_updatable:start
const aiPrompt = `Generate a storage invoice for:
  - User ID: ${userId}
  - Billing Data: ${JSON.stringify(billingData, null, 2)}

  Include itemized charges, total amount due, and payment due date.
  Respond in JSON format with keys: 'invoice_number', 'itemized_charges', 'total_due', 'due_date'.`;
// @ai_updatable:end

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    invoiceDetails = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageInvoiceManager.mjs' });

    // AI Logs Learning: Store invoice generation insights
    await aiLearningManager.logAILearning(userId, "storage_invoice_generation", { invoiceDetails });

    console.log(`✅ AI Storage Invoice for User ${userId}:`, invoiceDetails);
    return { invoiceDetails };
  } catch (error) {
    console.error("❌ Error generating AI-driven storage invoice:", error.message);
    throw new Error("AI invoice generation failed.");
  }
};

/**
 * Processes AI-driven invoice payments.
 * @param {string} userId - The user making the payment.
 * @param {string} invoiceNumber - The invoice being paid.
 * @param {number} amount - The amount being paid.
 * @returns {object} - AI-generated payment confirmation.
 */
const processInvoicePayment = async (userId, invoiceNumber, amount) => {
  if (isKillSwitchEnabled()) return;
  console.log(`💰 AI processing invoice payment for user: ${userId}, Invoice: ${invoiceNumber}`);

  let paymentConfirmation = {};

  // AI-generated payment processing
  const aiPrompt = `Process payment for:
  - User ID: ${userId}
  - Invoice Number: ${invoiceNumber}
  - Payment Amount: ${amount}

  Confirm payment status and update records accordingly.
  Respond in JSON format with keys: 'payment_status', 'remaining_balance', 'confirmation_number'.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    paymentConfirmation = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageInvoiceManager.mjs' });

    // AI Logs Learning: Store payment insights
    await aiLearningManager.logAILearning(userId, "storage_invoice_payment", { paymentConfirmation });

    console.log(`✅ AI Invoice Payment Confirmation for User ${userId}:`, paymentConfirmation);
    return { paymentConfirmation };
  } catch (error) {
    console.error("❌ Error processing AI-driven storage invoice payment:", error.message);
    throw new Error("AI payment processing failed.");
  }
};

/**
 * Sends AI-generated invoices via email.
 * @param {string} userId - The user receiving the invoice.
 * @param {string} email - The email address to send the invoice to.
 * @returns {object} - AI-generated email confirmation.
 */
const sendInvoiceByEmail = async (userId, email) => {
  if (isKillSwitchEnabled()) return;
  console.log(`📧 AI sending invoice to user: ${userId}, Email: ${email}`);

  const invoiceData = await generateStorageInvoice(userId);
  let emailConfirmation = {};

  // AI-generated invoice email
  const aiPrompt = `Send storage invoice via email:
  - User ID: ${userId}
  - Recipient Email: ${email}
  - Invoice Data: ${JSON.stringify(invoiceData, null, 2)}

  Generate an email template and confirm the invoice was sent.
  Respond in JSON format with keys: 'email_status', 'sent_timestamp', 'email_body'.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    emailConfirmation = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageInvoiceManager.mjs' });

    // AI Logs Learning: Store email invoice insights
    await aiLearningManager.logAILearning(userId, "storage_invoice_email", { emailConfirmation });

    console.log(`✅ AI Invoice Email Sent for User ${userId}:`, emailConfirmation);
    return { emailConfirmation };
  } catch (error) {
    console.error("❌ Error sending AI-generated invoice email:", error.message);
    throw new Error("AI invoice email sending failed.");
  }
};

export {
  generateStorageInvoice,
  processInvoicePayment,
  sendInvoiceByEmail,
};
