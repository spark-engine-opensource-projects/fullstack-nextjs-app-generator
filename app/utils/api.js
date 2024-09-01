// utils/api.js
import axios from 'axios';
import sparkConfig from '../../spark.config.json';

// Utility function to evaluate and replace expressions within strings
const evaluateExpressions = (str, context) => {
    return str.replace(/'([^']*)'\s*\+\s*([\w.]+)/g, (match, p1, p2) => {
        const value = context[p2];
        return `"${p1}${value || ''}"`;
    });
};

// Safe JSON parser with context-based evaluation
const safeParse = (data, context) => {
    try {
        console.log('Raw Data:', data);

        // Evaluate expressions and replace single quotes with double quotes, but ignore escaped quotes
        let fixedData = evaluateExpressions(data, context)
            .replace(/\\'/g, '\\u0027') // Temporarily replace escaped apostrophes with a Unicode character
            .replace(/'/g, '"') // Replace non-escaped apostrophes with double quotes
            .replace(/\\u0027/g, '\'') // Restore the escaped apostrophes
            .replace(/(\w+):/g, '"$1":') // Add double quotes around keys
            .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas before closing brackets or braces

        return JSON.parse(fixedData);
    } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw parseError;
    }
};

export const callSpark = async (projectId, prompt) => {
    const payload = {
        projectId,
        prompt
    };

    try {
        const response = await axios.post('/api/callSpark', payload);

        console.log(response.data)

        return response.data;
    } catch (error) {
        console.error('Error calling Spark API:', error.message);
        throw error;
    }
};

export const generateSinglePagePlan = async (form) => {
    let prompt = `Name: ${form.projectName}, Purpose: ${form.purpose}`
    let data = await callSpark(sparkConfig.projectIDs.generateSinglePagePlan, prompt);
    return {pages: safeParse(data[0].output)}
};

export const generateMultiplePagePlan = async (form) => {
    let prompt = `Name: ${form.projectName}, Purpose: ${form.purpose}`
    let data = await callSpark(sparkConfig.projectIDs.generateMultiplePagePlan, prompt);
    return {pages: safeParse(data[0].output)}
};

export const generateStylingPlan = async (form) => {
    let data = await callSpark(sparkConfig.projectIDs.generateStylingPlan, form.colors);
    return safeParse(data[0].output)
};

export const generateApiPlan = async (prompt) => {
    let data = await callSpark(sparkConfig.projectIDs.generateApiPlan, prompt);
    return safeParse(data[0].output)
};

export const generateServerlessApi = async (prompt) => {
    let data = await callSpark(sparkConfig.projectIDs.generateVercelServerlessAPI, prompt);
    return data[0].output
};

export const generateSQLDatabaseQuery = async (prompt) => {
    let data = await callSpark(sparkConfig.projectIDs.generateSQLExecutionCode, prompt);
    return data[0].output
};

export const generateSchema = async (prompt) => {
    let data = await callSpark(sparkConfig.projectIDs.generateSchema, prompt);
    return safeParse(data[0].output)
};

export const generateDynamicallyRenderingReactComponent = async (prompt) => {
    let data = await callSpark(sparkConfig.projectIDs.generateDynamicallyRenderingReactComponentWithStyledComponents, prompt);
    return data[0].output
};

export const generateNormalReactComponent = async (prompt) => {
    return await callSpark(sparkConfig.projectIDs.generateNormalReactComponent, prompt);
};

export const generateNormalReactPage = async (prompt) => {
    let data = await callSpark(sparkConfig.projectIDs.generateNormalReactPage, prompt);
    return data[0].output
};

export const modifySinglePagePlan = async (prompt) => {
    return await callSpark(sparkConfig.projectIDs.modifySinglePagePlan, prompt);
};

export const modifyMultiplePagePlan = async (prompt) => {
    return await callSpark(sparkConfig.projectIDs.modifyMultiplePagePlan, prompt);
};

export const modifyApiPlan = async (prompt) => {
    return await callSpark(sparkConfig.projectIDs.modifyApiPlan, prompt);
};

export const modifySchema = async (prompt) => {
    return await callSpark(sparkConfig.projectIDs.modifySchema, prompt);
};

export const modifyReactComponent = async (prompt) => {
    return await callSpark(sparkConfig.projectIDs.modifyReactComponent, prompt);
};