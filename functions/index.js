// index.js (Cloudflare Worker Script)

// Fungsi untuk meneruskan permintaan ke Google Gemini API
async function handleGeminiProxy(request, env, modelName) {
    // 1. Ambil Key dari Environment Variables (Secret) Cloudflare
    const apiKey = env.GEMINI_API_KEY; 
    
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set in Cloudflare Secrets." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 2. Tentukan URL API tujuan
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
        // 3. Ambil payload (data gambar, prompt, dll.) dari permintaan frontend
        const body = await request.json();

        // 4. Lakukan Panggilan ke API Gemini (dengan Key yang Aman)
        const geminiResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // 5. Teruskan respons dan header kembali ke frontend
        // Menggunakan response.clone() untuk membaca isi dan meneruskan header
        return geminiResponse; 

    } catch (e) {
        console.error("Worker error:", e);
        return new Response(JSON.stringify({ error: `Internal Worker Error: ${e.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Hanya tangani permintaan POST ke endpoint proxy kita
        if (request.method === 'POST') {
            
            // Endpoint untuk Image-to-Image (Fitting)
            if (url.pathname === '/api/gemini-image') {
                return handleGeminiProxy(request, env, 'gemini-2.5-flash-image-preview');
            }
            
            // Endpoint untuk Multimodal/Text (Deskripsi Gaya)
            if (url.pathname === '/api/gemini-text') {
                return handleGeminiProxy(request, env, 'gemini-2.5-flash-preview-09-2025');
            }
        }
        
        // Jika permintaan bukan ke endpoint API, sajikan file statis (misalnya aifitting.html)
        // Note: Anda harus mengkonfigurasi Cloudflare Pages atau Worker untuk menyajikan file statis
        // Cara termudah adalah menggunakan Cloudflare Pages dan menempatkan Worker ini di fungsi _middleware.
        
        return new Response("Not Found", { status: 404 });
    }
}
