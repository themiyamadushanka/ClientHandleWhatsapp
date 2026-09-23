process.loadEnvFile();

export async function handle(message,jid) {
    
    const payload = {
        message,
        jid
    }

    try {
        const response = await fetch(process.env.WEBHOOK_URL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            }
        )

        if (!response.ok) {
            throw new Error(`Webhook returned ${response.status}`)
        }

        const result = await response.json();
        let text = JSON.stringify(result.message);
        return text.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } catch (error) {
        console.error('Error sending data:', error.message)
    }
}