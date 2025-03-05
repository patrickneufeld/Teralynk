import axios from "axios";

const AI_PERFORMANCE_API = "http://127.0.0.1:8000"; // Localhost API

/**
 * Evaluate AI performance using Python API
 * @param {Array<number>} y_true - Actual values
 * @param {Array<number>} y_pred - AI predictions
 * @returns {Promise<Object>} - AI performance metrics (MSE, MAE, RSE)
 */
const evaluateAIPerformance = async (y_true, y_pred) => {
  try {
    const response = await axios.post(`${AI_PERFORMANCE_API}/evaluate`, {
      y_true,
      y_pred,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error evaluating AI performance:", error.response?.data || error.message);
    return null;
  }
};

/**
 * Get average AI performance metrics
 * @returns {Promise<Object>} - Rolling average errors
 */
const getAverageErrors = async () => {
  try {
    const response = await axios.get(`${AI_PERFORMANCE_API}/average-errors`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching average AI errors:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { evaluateAIPerformance, getAverageErrors };
