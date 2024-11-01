export default async function handler(req, res) {
    const { projectId, prompt } = req.body;

    try {
        // console.log("Got here");
    
        const response = await fetch('https://sparkengine.ai/api/engine/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: process.env.SPARK_API_KEY,
                project_id: projectId,
                prompt: prompt
            })
        });
    
        if (!response.ok) {
            console.log(response)
            throw new Error('Network response was not ok');
        }
    
        const responseData = await response.json()
        console.log(responseData)
        res.status(200).json(responseData.data);
    
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }

}
