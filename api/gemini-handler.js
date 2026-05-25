const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
    // Chỉ cho phép phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Khai báo mô hình (Ở đây mình để tạm bản 1.5 flash vì nó ổn định nhất)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Lệnh ép AI trả về công thức Toán học MathJax chuẩn
        const prompt = "Bạn là một trợ giảng Vật lý ảo. Hãy trả lời câu hỏi sau của học sinh một cách ngắn gọn, dễ hiểu. QUAN TRỌNG: Tất cả các công thức, ký hiệu Toán học và Vật lý BẮT BUỘC phải được bọc trong cặp dấu $...$ (ví dụ: $d_2 - d_1 = k\\lambda$) hoặc $$...$$. Câu hỏi: " + question;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ answer: text });

    } catch (error) {
        console.error("Lỗi API:", error);
        res.status(500).json({ error: "Lỗi kết nối đến AI" });
    }
};
