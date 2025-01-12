document.getElementById('compareBtn').addEventListener('click', async function () {
    const originalFileInput = document.getElementById('originalFile').files[0];
    const translatedFileInput = document.getElementById('translatedFile').files[0];

    if (!originalFileInput || !translatedFileInput) {
        alert('Please upload both the original and translated files.');
        return;
    }

    const originalText = await extractTextFromDocx(originalFileInput);
    const translatedText = await extractTextFromDocx(translatedFileInput);

    const originalParagraphs = splitIntoParagraphs(originalText);
    const translatedParagraphs = splitIntoParagraphs(translatedText);

    if (originalParagraphs.length !== translatedParagraphs.length) {
        alert('The number of paragraphs in the original and translated files do not match.');
        return;
    }

    const results = await compareParagraphs(originalParagraphs, translatedParagraphs);
    displayComparison(results);
});

async function extractTextFromDocx(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => resolve(result.value))
                .catch(err => reject(err));
        };
        reader.readAsArrayBuffer(file);
    });
}

function splitIntoParagraphs(text) {
    return text.split(/\n+/).map(para => para.trim()).filter(para => para.length > 0);
}

async function compareParagraphs(originalParagraphs, translatedParagraphs) {
    const results = [];
    for (let i = 0; i < originalParagraphs.length; i++) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_API_KEY` // Replace with your OpenAI API key
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful assistant for comparing translations." },
                    {
                        role: "user",
                        content: `Compare the following original paragraph and its translation. Indicate if the translation is correct or has issues:\n\nOriginal:\n${originalParagraphs[i]}\n\nTranslation:\n${translatedParagraphs[i]}`
                    }
                ]
            })
        });

        const data = await response.json();
        const feedback = data.choices[0].message.content;

        results.push({
            original: originalParagraphs[i],
            translated: translatedParagraphs[i],
            feedback: feedback,
            hasIssues: feedback.toLowerCase().includes('issue') || feedback.toLowerCase().includes('problem'),
        });
    }
    return results;
}

function displayComparison(results) {
    const output = document.getElementById('output');
    output.innerHTML = '';

    results.forEach((result, index) => {
        const container = document.createElement('div');
        container.className = result.hasIssues ? 'error-paragraph' : 'valid-paragraph';

        const originalPara = document.createElement('p');
        originalPara.textContent = `Original: ${result.original}`;

        const translatedPara = document.createElement('p');
        translatedPara.textContent = `Translated: ${result.translated}`;

        const feedbackPara = document.createElement('p');
        feedbackPara.textContent = `Feedback: ${result.feedback}`;

        container.appendChild(originalPara);
        container.appendChild(translatedPara);
        container.appendChild(feedbackPara);

        output.appendChild(container);
    });
}