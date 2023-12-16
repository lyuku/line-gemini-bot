const { GoogleGenerativeAI } = require("@google/generative-ai");


addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
  // event.respondWith(handleLocal(event.request));
});


// async function handleLocal(request) {
//   const body = await request.text();
//   const result = await requestGemini("");
//   return new Response(result, { status: 200 });
// }

async function handleRequest(request) {
  try {
    // Validate the request (you may add more validation as needed)
    // if (request.method !== 'POST') {
    //   return new Response('Method Not Allowed', { status: 405 });
    // }

    const body = await request.text();
    const json = JSON.parse(body);
    // console.log(body);
    // console.log(JSON.stringify(request.headers));
    // Verify the signature (replace 'YOUR_CHANNEL_SECRET' with your actual channel secret)
    // const isValidSignature = validateSignature(request.headers, body, 'YOUR_CHANNEL_SECRET');
    // if (!isValidSignature) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    // Process incoming events
    const message = json.events[0].message.text;
    // const replyText = `You said: ${json.events[0].message.text}`;

    const geminiReply = await requestGemini(message)
    console.log(geminiReply);
    await replyToLine(geminiReply, json.events[0].replyToken);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function requestGemini(customPrompt) {
  
  // Create a client with your API key
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // Define your prompt
  const systemPrompt = "you must follow these rules: 1. response must be within 100 words; 2. answer with the same language as the question; 3. be smart; 4. be profession; 5. be pithy. please reply this text:";

  // Get the generative model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Generate text
  const result = await model.generateContent(systemPrompt + customPrompt);
  return result.response.candidates[0].content.parts[0].text;
}

async function replyToLine(replyText, replyToken) {
  const url = 'https://api.line.me/v2/bot/message/reply';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
  };

  const body = JSON.stringify({
    replyToken: replyToken,
    messages: [{ type: 'text', text: replyText }],
  });

  const result = await fetch(url, { method: 'POST', headers, body });
}

// function validateSignature(headers, body, channelSecret) {
//   const signature = headers.get('X-Line-Signature') || '';
//   const crypto = require('crypto');
//   const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
//   return signature === hash;
// }
