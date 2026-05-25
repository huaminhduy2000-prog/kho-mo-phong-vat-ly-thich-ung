document.addEventListener("DOMContentLoaded", () => {
    // === XỬ LÝ MENU DI ĐỘNG & MODAL LIÊN HỆ (Chạy an toàn trên index.html) ===
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const contactLink = document.getElementById('contact-link');
    const contactLinkMobile = document.getElementById('contact-link-mobile');
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (hamburgerBtn && mobileNav) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('is-active');
            mobileNav.classList.toggle('is-active');
        });
    }

    if (contactLink && contactModal && closeModalBtn) {
        contactLink.addEventListener('click', (e) => { e.preventDefault(); contactModal.classList.add('show'); });
        closeModalBtn.addEventListener('click', () => { contactModal.classList.remove('show'); });
        contactModal.addEventListener('click', (e) => { if (e.target === contactModal) contactModal.classList.remove('show'); });
    }

    if (contactLinkMobile && contactModal) {
        contactLinkMobile.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.classList.add('show');
            if (hamburgerBtn && mobileNav) {
                hamburgerBtn.classList.remove('is-active');
                mobileNav.classList.remove('is-active');
            }
        });
    }

    // === KIỂM TRA PHÒNG VỆ CHATBOX AI (Nếu không tìm thấy widget sẽ dừng lại ngay, không báo lỗi) ===
    const chatWidget = document.getElementById('ai-chat-widget');
    if (!chatWidget) return; 

    const sendButton = document.getElementById("send-button");
    const userInput = document.getElementById("user-input");
    const chatWindow = document.getElementById("chat-window");
    const chatBubble = document.getElementById("ai-chat-bubble");
    const closeChatBtn = document.getElementById("ai-chat-close-btn");
    const micButton = document.getElementById("mic-button");

    if (chatBubble && closeChatBtn) {
        chatBubble.addEventListener('click', () => chatWidget.classList.add('chat-open'));
        closeChatBtn.addEventListener('click', () => chatWidget.classList.remove('chat-open'));
    }

    async function sendMessage() {
        if (!userInput || !chatWindow) return;
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
            removeTypingIndicator();
            if (response.ok) {
                addMessage(data.answer, "ai");
            } else {
                addMessage("Lỗi: " + (data.error || "Không thể kết nối AI"), "ai");
            }
        } catch (error) {
            removeTypingIndicator();
            addMessage("Lỗi kết nối máy chủ ảo AI.", "ai");
        }
    }

    function addMessage(message, sender) {
        const msg = document.createElement("p");
        msg.className = sender === "user" ? "user-message" : "ai-message";
        if (sender === "user") {
            msg.textContent = message;
        } else {
            msg.innerHTML = message.replace(/\n/g, '<br>');
        }
        chatWindow.appendChild(msg);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // KÍCH HOẠT MATHJAX ĐỂ DỊCH CÔNG THỨC TOÁN HỌC
        if (sender === "ai" && window.MathJax) {
            MathJax.typesetPromise([msg]).catch(function (err) {
                console.error("Lỗi hiển thị Toán học:", err.message);
            });
        }
    }

    function showTypingIndicator() {
        if (document.getElementById("typing-indicator")) return;
        const indicator = document.createElement("p");
        indicator.className = "ai-message typing-indicator";
        indicator.id = "typing-indicator";
        indicator.innerHTML = "<span></span><span></span><span></span>";
        chatWindow.appendChild(indicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
    }

    if (sendButton && userInput) {
        sendButton.addEventListener("click", sendMessage);
        userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    }

    // Xử lý Voice Chat Giọng Nói
    if (micButton) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN';
            let isRecording = false;

            micButton.addEventListener("click", () => {
                if (isRecording) { recognition.stop(); } 
                else { recognition.start(); }
            });

            recognition.onstart = () => { isRecording = true; micButton.classList.add("is-recording"); micButton.textContent = '...'; };
            recognition.onresult = (event) => { userInput.value = event.results[0][0].transcript; setTimeout(sendMessage, 100); };
            recognition.onend = () => { isRecording = false; micButton.classList.remove("is-recording"); micButton.textContent = '🎙️'; };
        } else {
            micButton.style.display = 'none';
        }
    }
});
