// File: chat.js (ở thư mục GỐC) - Bản tối ưu và tương thích đa trang
document.addEventListener("DOMContentLoaded", () => {

    // === LẤY CÁC PHẦN TỬ CHATBOT ===
    const sendButton = document.getElementById("send-button");
    const userInput = document.getElementById("user-input");
    const chatWindow = document.getElementById("chat-window");
    const chatWidget = document.getElementById('ai-chat-widget');
    const chatBubble = document.getElementById('ai-chat-bubble');
    const chatBox = document.getElementById('ai-chat-box');
    const closeChatBtn = document.getElementById('ai-chat-close-btn');
    const micButton = document.getElementById("mic-button");

    // === LẤY CÁC PHẦN TỬ MODAL & MENU ===
    const contactLink = document.getElementById('contact-link');
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const contactLinkMobile = document.getElementById('contact-link-mobile');

    // === KIỂM TRA DOM TỪNG PHẦN ===
    function checkElements(...elements) { return elements.every(el => el !== null); }
    const chatElementsExist = checkElements(sendButton, userInput, chatWindow, chatWidget, chatBubble, chatBox, closeChatBtn, micButton);
    const modalElementsExist = checkElements(contactLink, contactModal, closeModalBtn);
    const hamburgerElementsExist = checkElements(hamburgerBtn, mobileNav, contactLinkMobile);

    // === 1. XỬ LÝ SỰ KIỆN CHATBOT (CHỈ CHẠY TRONG PHÒNG THÍ NGHIỆM) ===
    if (chatElementsExist) {
        // Voice Chat Setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition = null;
        let isRecording = false;

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN';
            recognition.interimResults = false;

            micButton.addEventListener("click", () => {
                if (isRecording) { recognition.stop(); } 
                else {
                    try { recognition.start(); }
                    catch (error) {
                        console.error("Lỗi ghi âm:", error);
                        isRecording = false; micButton.classList.remove("is-recording"); micButton.textContent = '🎙️';
                    }
                }
            });

            recognition.onstart = () => { isRecording = true; micButton.classList.add("is-recording"); micButton.textContent = '...'; };
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                setTimeout(sendMessage, 50);
            };
            recognition.onend = () => { isRecording = false; micButton.classList.remove("is-recording"); micButton.textContent = '🎙️'; };
            recognition.onerror = (event) => { console.error("Lỗi STT:", event.error); isRecording = false; };
        } else {
            console.warn("Trình duyệt không hỗ trợ SpeechRecognition (STT).");
            micButton.style.display = 'none';
        }

        // Click Events cho Chatbox
        sendButton.addEventListener("click", sendMessage);
        userInput.addEventListener("keypress", (event) => { if (event.key === "Enter") { event.preventDefault(); sendMessage(); } });
        chatBubble.addEventListener('click', toggleChatBox);
        closeChatBtn.addEventListener('click', toggleChatBox);
    }

    // === 2. XỬ LÝ SỰ KIỆN MODAL HỖ TRỢ (CHẠY TRÊN CẢ 2 TRANG) ===
    if (modalElementsExist) {
        contactLink.addEventListener('click', (event) => { event.preventDefault(); contactModal.classList.add('show'); });
        closeModalBtn.addEventListener('click', () => { contactModal.classList.remove('show'); });
        contactModal.addEventListener('click', (event) => { if (event.target === contactModal) { contactModal.classList.remove('show'); } });
    }

    // === 3. XỬ LÝ MENU DI ĐỘNG (HAMBURGER) ===
    if (hamburgerElementsExist) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('is-active');
            mobileNav.classList.toggle('is-active');
        });
        if (contactLinkMobile && contactModal) {
            contactLinkMobile.addEventListener('click', (event) => {
                event.preventDefault(); contactModal.classList.add('show');
                hamburgerBtn.classList.remove('is-active'); mobileNav.classList.remove('is-active');
            });
        }
    }

    // === CÁC HÀM XỬ LÝ CHATBOT ===
    async function sendMessage() {
        if (!userInput) return;
        let question = userInput.value.trim();
        if (question === "") return;
        addMessage(question, "user");
        userInput.value = "";
        showTypingIndicator();
        try {
            const response = await fetch('/api/gemini-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || `Lỗi: ${response.status}`); }
            removeTypingIndicator();
            addMessage(data.answer, "ai");
        } catch (error) {
            console.error("Lỗi API:", error);
            removeTypingIndicator();
            addMessage(`Lỗi: ${error.message}`, "ai");
        }
    }

    function addMessage(message, sender) {
        if (!chatWindow) return;
        const messageElement = document.createElement("p");
        messageElement.className = sender === "user" ? "user-message" : "ai-message";
        if (sender === 'user') { messageElement.textContent = message; }
        else { messageElement.innerHTML = message ? message.replace(/\n/g, '<br>') : '...'; }
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showTypingIndicator() {
        if (document.getElementById("typing-indicator") || !chatWindow) return;
        const typingIndicator = document.createElement("p");
        typingIndicator.className = "ai-message typing-indicator";
        typingIndicator.id = "typing-indicator";
        typingIndicator.innerHTML = "<span></span><span></span><span></span>";
        chatWindow.appendChild(typingIndicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typing-indicator");
        if (indicator && chatWindow) { chatWindow.removeChild(indicator); }
    }

    function toggleChatBox() {
        if (!chatWidget) return;
        const isOpen = chatWidget.classList.toggle('chat-open');
        if (isOpen) { requestAnimationFrame(() => { setTimeout(() => userInput.focus(), 50); }); }
    }
});
