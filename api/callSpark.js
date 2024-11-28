export default async function handler(req, res) {
    const { projectId, prompt } = req.body;

    try {
        const response = await fetch('https://sparkengine.ai/api/engine/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: process.env.SPARK_API_KEY,
                project_id: projectId,
                prompt: prompt,
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let responseData = await response.json();

        // Sanitize the outputs to remove backticks
        if (responseData.data) {
            responseData.data = responseData.data.map((item) => {
                if (item.output && typeof item.output === 'string') {
                    // Remove backticks if they exist at the start or end
                    item.output = item.output.replace(/^```|```$/g, '').trim();
                }
                return item;
            });
        }
        console.log(responseData.data)
        res.status(200).json(responseData.data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
}