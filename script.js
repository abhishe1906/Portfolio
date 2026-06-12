/* -------------------------------------------------------------
   Abhishek Agrawal - Portfolio JS Script
   Contains Particle Canvas, Sorting Visualizer, RAG Simulator,
   Concept Drift Simulator, and Layout Logic
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================
       1. Navigation & Layout Helpers
       ========================================== */
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-links a');
    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('nav-links');

    // Scroll effect on Navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active Link Highlight on scroll
        let current = '';
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // Mobile Hamburger Menu
    hamburger.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    /* ==========================================
       2. Particle Canvas Background
       ========================================== */
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const colors = ['#00f2fe', '#a18cd1', '#7f5af0', '#0a0f1d'];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
            this.color = colors[Math.floor(Math.random() * (colors.length - 1))];
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        const numberOfParticles = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 75);
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    initParticles();

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw links between nearby particles
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            
            for (let j = i; j < particlesArray.length; j++) {
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 110) {
                    ctx.strokeStyle = `rgba(161, 140, 209, ${0.15 - (distance / 110) * 0.15})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Reinitialize on window resize
    window.addEventListener('resize', () => {
        initParticles();
    });

    /* ==========================================
       3. Playground Tabs Navigation
       ========================================== */
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.playground-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');

            // Special triggers for canvases on load
            if (target === 'playground-drift') {
                drawDriftChart();
            }
        });
    });

    /* ==========================================
       4. Playground 1: Sorting Visualizer Logic
       ========================================== */
    const barsContainer = document.getElementById('bars-container');
    const selectAlgorithm = document.getElementById('sorting-algorithm');
    const inputSize = document.getElementById('array-size');
    const inputSpeed = document.getElementById('sorting-speed');
    const btnRandomize = document.getElementById('btn-randomize');
    const btnSort = document.getElementById('btn-sort');
    const labelComparisons = document.getElementById('stat-comparisons');
    const labelSwaps = document.getElementById('stat-swaps');
    const labelState = document.getElementById('stat-state');

    let sortingArray = [];
    let isSortingActive = false;
    let sortingResolve = null;

    // Helper functions
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function randomizeArray() {
        if (isSortingActive) return;
        const size = parseInt(inputSize.value);
        sortingArray = [];
        barsContainer.innerHTML = '';
        
        for (let i = 0; i < size; i++) {
            sortingArray.push(Math.floor(Math.random() * 90) + 10); // 10% to 100% height
        }
        
        renderBars();
        labelComparisons.innerText = '0';
        labelSwaps.innerText = '0';
        labelState.innerText = 'Idle';
        labelState.style.color = 'var(--cyan)';
    }

    function renderBars() {
        barsContainer.innerHTML = '';
        sortingArray.forEach((val, idx) => {
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            bar.style.height = `${val}%`;
            bar.id = `bar-${idx}`;
            barsContainer.appendChild(bar);
        });
    }

    function updateBarState(idx, state) {
        const bar = document.getElementById(`bar-${idx}`);
        if (!bar) return;
        
        // Remove existing states
        bar.classList.remove('compare', 'swap', 'sorted');
        
        if (state === 'compare') {
            bar.classList.add('compare');
        } else if (state === 'swap') {
            bar.classList.add('swap');
        } else if (state === 'sorted') {
            bar.classList.add('sorted');
        }
    }

    function swapBars(i, j) {
        const barI = document.getElementById(`bar-${i}`);
        const barJ = document.getElementById(`bar-${j}`);
        if (!barI || !barJ) return;

        // Swap visual height
        const tempHeight = barI.style.height;
        barI.style.height = barJ.style.height;
        barJ.style.height = tempHeight;

        // Swap in internal array
        const tempVal = sortingArray[i];
        sortingArray[i] = sortingArray[j];
        sortingArray[j] = tempVal;
    }

    // Sorting Algorithms
    async function executeBubbleSort() {
        const len = sortingArray.length;
        let comparisons = 0;
        let swaps = 0;
        
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len - i - 1; j++) {
                if (!isSortingActive) return;
                
                updateBarState(j, 'compare');
                updateBarState(j + 1, 'compare');
                comparisons++;
                labelComparisons.innerText = comparisons;
                
                const speed = parseInt(inputSpeed.value);
                await sleep(speed);

                if (sortingArray[j] > sortingArray[j + 1]) {
                    updateBarState(j, 'swap');
                    updateBarState(j + 1, 'swap');
                    swapBars(j, j + 1);
                    swaps++;
                    labelSwaps.innerText = swaps;
                    await sleep(speed);
                }

                updateBarState(j, '');
                updateBarState(j + 1, '');
            }
            updateBarState(len - i - 1, 'sorted');
        }
    }

    async function executeSelectionSort() {
        const len = sortingArray.length;
        let comparisons = 0;
        let swaps = 0;

        for (let i = 0; i < len; i++) {
            let minIdx = i;
            updateBarState(minIdx, 'compare');

            for (let j = i + 1; j < len; j++) {
                if (!isSortingActive) return;

                updateBarState(j, 'compare');
                comparisons++;
                labelComparisons.innerText = comparisons;

                const speed = parseInt(inputSpeed.value);
                await sleep(speed);

                if (sortingArray[j] < sortingArray[minIdx]) {
                    updateBarState(minIdx, '');
                    minIdx = j;
                    updateBarState(minIdx, 'swap');
                } else {
                    updateBarState(j, '');
                }
            }

            if (minIdx !== i) {
                swapBars(i, minIdx);
                swaps++;
                labelSwaps.innerText = swaps;
            }

            updateBarState(minIdx, '');
            updateBarState(i, 'sorted');
        }
    }

    async function executeInsertionSort() {
        const len = sortingArray.length;
        let comparisons = 0;
        let swaps = 0;

        updateBarState(0, 'sorted');

        for (let i = 1; i < len; i++) {
            let key = sortingArray[i];
            let j = i - 1;

            updateBarState(i, 'compare');
            const speed = parseInt(inputSpeed.value);
            await sleep(speed);

            while (j >= 0) {
                if (!isSortingActive) return;
                
                comparisons++;
                labelComparisons.innerText = comparisons;
                updateBarState(j, 'compare');
                await sleep(speed);

                if (sortingArray[j] > key) {
                    updateBarState(j, 'swap');
                    // Shift value forward
                    sortingArray[j + 1] = sortingArray[j];
                    const barNext = document.getElementById(`bar-${j + 1}`);
                    const barCurr = document.getElementById(`bar-${j}`);
                    barNext.style.height = barCurr.style.height;
                    
                    swaps++;
                    labelSwaps.innerText = swaps;
                    j = j - 1;
                    await sleep(speed);
                } else {
                    updateBarState(j, 'sorted');
                    break;
                }
            }
            
            sortingArray[j + 1] = key;
            const barTarget = document.getElementById(`bar-${j + 1}`);
            barTarget.style.height = `${key}%`;
            
            // Highlight everything sorted up to i
            for (let k = 0; k <= i; k++) {
                updateBarState(k, 'sorted');
            }
        }
    }

    async function startSorting() {
        if (isSortingActive) return;
        isSortingActive = true;
        btnSort.disabled = true;
        btnRandomize.disabled = true;
        inputSize.disabled = true;
        selectAlgorithm.disabled = true;
        
        labelState.innerText = 'Sorting...';
        labelState.style.color = 'var(--neon-orange)';

        const algorithm = selectAlgorithm.value;
        if (algorithm === 'bubble') {
            await executeBubbleSort();
        } else if (algorithm === 'selection') {
            await executeSelectionSort();
        } else if (algorithm === 'insertion') {
            await executeInsertionSort();
        }

        if (isSortingActive) {
            // Success highlight
            for (let i = 0; i < sortingArray.length; i++) {
                updateBarState(i, 'sorted');
            }
            labelState.innerText = 'Completed!';
            labelState.style.color = 'var(--success-green)';
        }

        isSortingActive = false;
        btnSort.disabled = false;
        btnRandomize.disabled = false;
        inputSize.disabled = false;
        selectAlgorithm.disabled = false;
    }

    // Controls listeners
    btnRandomize.addEventListener('click', randomizeArray);
    inputSize.addEventListener('input', randomizeArray);
    btnSort.addEventListener('click', startSorting);

    // Initial load
    randomizeArray();


    /* ==========================================
       5. Playground 2: RAG Q&A Simulator Logic
       ========================================== */
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const btnChatSend = document.getElementById('btn-chat-send');
    
    const nodeEmbed = document.getElementById('node-embed');
    const textEmbed = document.getElementById('text-embed');
    const nodeFaiss = document.getElementById('node-faiss');
    const textFaiss = document.getElementById('text-faiss');
    const nodeContext = document.getElementById('node-context');
    const textContext = document.getElementById('text-context');
    const scoreFaiss = document.getElementById('score-faiss');
    const nodeLlama = document.getElementById('node-llama');
    const textLlama = document.getElementById('text-llama');

    // Simple document chunks representing indices for "retrieval"
    const databaseChunks = [
        { id: 1, text: "Abhishek Agrawal is a skilled AI/ML Engineer and Web Developer.", keywords: ["who", "name", "profile", "about", "resume", "abhishek"] },
        { id: 2, text: "He has three main repositories on GitHub: RAG-based-Chatmodel, Fraud-detection-concept-drift, and Sorting-Visualizer.", keywords: ["repos", "repositories", "projects", "work", "github"] },
        { id: 3, text: "RAG-based-Chatmodel uses FAISS, Sentence Transformers, and LLaMA3 for academic document semantic search.", keywords: ["rag", "chatmodel", "llama3", "faiss", "embedding"] },
        { id: 4, text: "Fraud-detection-concept-drift explores temporal evaluation and rolling retraining under pattern drift.", keywords: ["drift", "fraud", "concept", "retrain", "temporal"] },
        { id: 5, text: "Sorting-Visualizer animates sorting algorithms like Bubble Sort, Selection Sort, and Insertion Sort in Javascript.", keywords: ["sorting", "visualizer", "algorithms", "javascript"] },
        { id: 6, text: "His skillset includes Python, PyTorch, FAISS, Streamlit, HTML, CSS, JavaScript, and Jupyter Notebooks.", keywords: ["skills", "languages", "python", "pytorch", "stack", "technologies"] }
    ];

    function appendMessage(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `chat-message ${sender}`;
        bubble.innerText = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function processRagQuery(query) {
        appendMessage('user', query);
        chatInput.value = '';
        chatInput.disabled = true;
        btnChatSend.disabled = true;

        // Reset Pipeline UI
        document.querySelectorAll('.retrieval-node').forEach(n => n.className = 'retrieval-node');
        textEmbed.innerText = 'Awaiting...';
        textFaiss.innerText = 'Awaiting...';
        textContext.innerText = 'No context retrieved yet.';
        scoreFaiss.innerText = 'Similarity: --';
        textLlama.innerText = 'Awaiting context...';

        const lowercaseQuery = query.toLowerCase();

        // 1. Step: Embedding Question
        nodeEmbed.classList.add('active');
        textEmbed.innerText = 'Computing 384-d vector embeddings using Sentence-Transformers...';
        await sleep(1000);
        nodeEmbed.classList.remove('active');
        nodeEmbed.classList.add('retrieved');
        textEmbed.innerText = 'Embedding vector computed successfully.';

        // 2. Step: Vector Database Search
        nodeFaiss.classList.add('active');
        textFaiss.innerText = 'Running Cosine Similarity search on index partition...';
        await sleep(1000);
        nodeFaiss.classList.remove('active');
        nodeFaiss.classList.add('retrieved');
        textFaiss.innerText = 'Cosine similarity matched top vectors.';

        // 3. Step: Retrieve context chunks
        nodeContext.classList.add('active');
        let matchedChunks = [];
        databaseChunks.forEach(chunk => {
            let matches = 0;
            chunk.keywords.forEach(kw => {
                if (lowercaseQuery.includes(kw)) matches++;
            });
            if (matches > 0) matchedChunks.push({ chunk, score: 0.7 + (matches * 0.08) });
        });

        // Sort by score
        matchedChunks.sort((a, b) => b.score - a.score);

        let retrievedText = "";
        let similarityScoreStr = "Similarity: --";
        if (matchedChunks.length > 0) {
            const top = matchedChunks[0];
            retrievedText = top.chunk.text;
            similarityScoreStr = `Similarity: ${(top.score * 100).toFixed(1)}% (FAISS Match)`;
        } else {
            // Fallback chunk
            retrievedText = databaseChunks[0].text;
            similarityScoreStr = "Similarity: 68.2% (Soft Match)";
        }

        textContext.innerText = `"${retrievedText}"`;
        scoreFaiss.innerText = similarityScoreStr;
        await sleep(1200);
        nodeContext.classList.remove('active');
        nodeContext.classList.add('retrieved');

        // 4. Step: LLaMA3 prompt synthesis & Stream Response
        nodeLlama.classList.add('active');
        textLlama.innerText = 'Generating response utilizing system prompt + retrieved context...';
        await sleep(800);
        nodeLlama.classList.remove('active');
        nodeLlama.classList.add('retrieved');
        textLlama.innerText = 'Response generated.';

        // Generate response content depending on matched topics
        let botResponse = "";
        if (lowercaseQuery.includes('skill') || lowercaseQuery.includes('languages') || lowercaseQuery.includes('stack')) {
            botResponse = "According to Abhishek's profile, his skills span AI/ML and Web Development. He is proficient in Python, PyTorch, FAISS, Sentence Transformers, and LLMs (such as LLaMA3 via Groq). For frontend development, he uses JavaScript (ES6+), HTML5, CSS3, Streamlit, and Canvas API.";
        } else if (lowercaseQuery.includes('repo') || lowercaseQuery.includes('project') || lowercaseQuery.includes('work') || lowercaseQuery.includes('github')) {
            botResponse = "Abhishek hosts three main projects on GitHub: \n1. 'RAG-based-Chatmodel' (Python system with FAISS indexing, live at: rag-based-chatmodel-benfumnrc6bezqhqi4a9gu.streamlit.app)\n2. 'Fraud-detection-concept-drift' (a temporal ML retraining sandbox)\n3. 'Sorting-Visualizer' (browser algorithm animator).";
        } else if (lowercaseQuery.includes('drift') || lowercaseQuery.includes('fraud') || lowercaseQuery.includes('concept')) {
            botResponse = "His project 'Fraud-detection-concept-drift' is an exploration of models running in production under shifting data trends (concept drift). It utilizes temporal evaluation pipelines and applies a rolling retraining schedule to correct performance drops caused by adversarial fraud pattern evolution.";
        } else if (lowercaseQuery.includes('sort') || lowercaseQuery.includes('visualizer')) {
            botResponse = "The 'Sorting-Visualizer' repository contains a frontend application that illustrates sorting algorithms (Bubble Sort, Selection Sort, Insertion Sort) visually. It helps analyze comparison and swap steps in real-time.";
        } else if (lowercaseQuery.includes('rag') || lowercaseQuery.includes('chat')) {
            botResponse = "The 'RAG-based-Chatmodel' repository implements a semantic Question & Answering engine. It ingests academic files, splits them into semantic nodes, encodes them using Sentence Transformers, queries a FAISS vector base, and passes context directly to LLaMA3 (using Groq API) for answers. Live Streamlit app is deployed at: rag-based-chatmodel-benfumnrc6bezqhqi4a9gu.streamlit.app.";
        } else {
            botResponse = "Abhishek Agrawal is a technology developer specializing in AI systems and frontend visualizers. You can browse his core repositories (RAG Chatbot with Streamlit demo, Fraud Concept Drift, Sorting Visualizer) right here in this playground, or visit his GitHub: github.com/abhishe1906.";
        }

        // Add response text streaming inside chat bubble
        const bubble = document.createElement('div');
        bubble.className = "chat-message bot";
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        let words = botResponse.split(' ');
        let wordIdx = 0;
        
        function streamWords() {
            if (wordIdx < words.length) {
                bubble.innerText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
                chatHistory.scrollTop = chatHistory.scrollHeight;
                wordIdx++;
                setTimeout(streamWords, 50);
            } else {
                chatInput.disabled = false;
                btnChatSend.disabled = false;
                chatInput.focus();
            }
        }
        streamWords();
    }

    // Event listeners for chat
    btnChatSend.addEventListener('click', () => {
        const query = chatInput.value.trim();
        if (query) processRagQuery(query);
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = chatInput.value.trim();
            if (query) processRagQuery(query);
        }
    });


    /* ==========================================
       6. Playground 3: Concept Drift Dashboard Logic
       ========================================== */
    const driftCanvas = document.getElementById('drift-canvas');
    const driftCtx = driftCanvas.getContext('2d');
    
    const metricAccuracy = document.getElementById('metric-accuracy');
    const metricDriftStatus = document.getElementById('metric-drift-status');
    const metricDriftDesc = document.getElementById('metric-drift-desc');
    const metricWindow = document.getElementById('metric-window');
    
    const btnStepDrift = document.getElementById('btn-step-drift');
    const btnRetrain = document.getElementById('btn-retrain');
    const btnResetDrift = document.getElementById('btn-reset-drift');

    // Dashboard State variables
    let timelineDays = [1];
    let modelAccuracy = [98.2];
    let dataDrift = [0.0];
    let currentDay = 1;
    let isRetraining = false;

    function drawDriftChart() {
        const width = driftCanvas.width;
        const height = driftCanvas.height;
        
        driftCtx.clearRect(0, 0, width, height);

        // Draw grid lines
        driftCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        driftCtx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const x = (width / 10) * i;
            driftCtx.beginPath();
            driftCtx.moveTo(x, 0);
            driftCtx.lineTo(x, height);
            driftCtx.stroke();
            
            const y = (height / 5) * i;
            driftCtx.beginPath();
            driftCtx.moveTo(0, y);
            driftCtx.lineTo(width, y);
            driftCtx.stroke();
        }

        // Draw axes labels (0%, 50%, 100%)
        driftCtx.fillStyle = 'var(--text-muted)';
        driftCtx.font = '10px Fira Code';
        driftCtx.fillText('100% Acc', 10, 20);
        driftCtx.fillText('50% Acc', 10, height / 2 + 5);
        driftCtx.fillText('0% Acc', 10, height - 10);

        // Plot Lines
        const totalPoints = timelineDays.length;
        if (totalPoints < 2) {
            // Draw a starting point dot
            const x = 50;
            const yAcc = height - (modelAccuracy[0] / 100) * (height - 40) - 20;
            const yDrift = height - (dataDrift[0] / 100) * (height - 40) - 20;
            
            driftCtx.fillStyle = '#00f3ff';
            driftCtx.beginPath();
            driftCtx.arc(x, yAcc, 6, 0, Math.PI * 2);
            driftCtx.fill();

            driftCtx.fillStyle = '#ff007f';
            driftCtx.beginPath();
            driftCtx.arc(x, yDrift, 6, 0, Math.PI * 2);
            driftCtx.fill();
            return;
        }

        const paddingX = 50;
        const spacingX = (width - paddingX * 2) / Math.max(9, totalPoints - 1);

        // Plot 1: Model Accuracy (Glowing Neon Cyan)
        driftCtx.shadowBlur = 12;
        driftCtx.shadowColor = '#00f3ff';
        driftCtx.strokeStyle = '#00f3ff';
        driftCtx.lineWidth = 4;
        driftCtx.beginPath();
        for (let i = 0; i < totalPoints; i++) {
            const x = paddingX + i * spacingX;
            const y = height - ((modelAccuracy[i] - 40) / 60) * (height - 60) - 30;
            if (i === 0) driftCtx.moveTo(x, y);
            else driftCtx.lineTo(x, y);
        }
        driftCtx.stroke();

        // Reset shadow for accuracy dots
        driftCtx.shadowBlur = 0;
        for (let i = 0; i < totalPoints; i++) {
            const x = paddingX + i * spacingX;
            const y = height - ((modelAccuracy[i] - 40) / 60) * (height - 60) - 30;
            driftCtx.fillStyle = '#00f3ff';
            driftCtx.beginPath();
            driftCtx.arc(x, y, 5, 0, Math.PI * 2);
            driftCtx.fill();
            
            // Text value above the last point
            if (i === totalPoints - 1) {
                driftCtx.fillStyle = 'var(--text-primary)';
                driftCtx.fillText(`${modelAccuracy[i].toFixed(1)}%`, x - 15, y - 12);
            }
        }

        // Plot 2: Data Drift (Glowing Neon Magenta)
        driftCtx.shadowBlur = 8;
        driftCtx.shadowColor = '#ff007f';
        driftCtx.strokeStyle = '#ff007f';
        driftCtx.lineWidth = 3;
        driftCtx.setLineDash([4, 4]); // Dashed line for drift
        driftCtx.beginPath();
        for (let i = 0; i < totalPoints; i++) {
            const x = paddingX + i * spacingX;
            const y = height - (dataDrift[i]) * (height - 60) - 30;
            if (i === 0) driftCtx.moveTo(x, y);
            else driftCtx.lineTo(x, y);
        }
        driftCtx.stroke();
        driftCtx.setLineDash([]); // Reset dash style

        // Reset shadow for drift dots
        driftCtx.shadowBlur = 0;
        for (let i = 0; i < totalPoints; i++) {
            const x = paddingX + i * spacingX;
            const y = height - (dataDrift[i]) * (height - 60) - 30;
            driftCtx.fillStyle = '#ff007f';
            driftCtx.beginPath();
            driftCtx.arc(x, y, 4, 0, Math.PI * 2);
            driftCtx.fill();
        }

        // Draw timeline label at bottom
        driftCtx.fillStyle = 'var(--text-muted)';
        for (let i = 0; i < totalPoints; i++) {
            const x = paddingX + i * spacingX;
            driftCtx.fillText(`Day ${timelineDays[i]}`, x - 15, height - 5);
        }
    }

    function updateDriftMetrics() {
        const latestAccuracy = modelAccuracy[modelAccuracy.length - 1];
        const latestDrift = dataDrift[dataDrift.length - 1];
        
        metricAccuracy.innerText = `${latestAccuracy.toFixed(1)}%`;
        metricWindow.innerText = `Day ${currentDay}`;

        if (latestAccuracy >= 90.0) {
            metricDriftStatus.innerText = 'Stable';
            metricDriftStatus.style.color = 'var(--success-green)';
            metricDriftDesc.innerText = 'Fraud patterns match trained data.';
            metricDriftStatus.classList.remove('drift-active');
            btnRetrain.disabled = true;
        } else if (latestAccuracy >= 75.0) {
            metricDriftStatus.innerText = 'Drift Detected';
            metricDriftStatus.style.color = 'var(--neon-orange)';
            metricDriftDesc.innerText = 'System alert: Evolving transaction trends.';
            metricDriftStatus.classList.add('drift-active');
            btnRetrain.disabled = false;
        } else {
            metricDriftStatus.innerText = 'Critically Degraded';
            metricDriftStatus.style.color = 'red';
            metricDriftDesc.innerText = 'System failure: Immediate retraining required!';
            metricDriftStatus.classList.add('drift-active');
            btnRetrain.disabled = false;
        }
    }

    btnStepDrift.addEventListener('click', () => {
        if (isRetraining) return;
        currentDay++;

        // Add next point with drift decay
        const lastAcc = modelAccuracy[modelAccuracy.length - 1];
        const lastDrift = dataDrift[dataDrift.length - 1];
        
        // Accumulate drift random factor
        const newDrift = Math.min(1.0, lastDrift + Math.random() * 0.15 + 0.05);
        // Accuracy decays as a function of drift
        const accLoss = (newDrift * newDrift) * 35 * (0.8 + Math.random() * 0.4);
        const newAcc = Math.max(50.0, 98.2 - accLoss);

        timelineDays.push(currentDay);
        modelAccuracy.push(newAcc);
        dataDrift.push(newDrift);

        // Keep last 10 days in window for visualization clarity
        if (timelineDays.length > 10) {
            timelineDays.shift();
            modelAccuracy.shift();
            dataDrift.shift();
        }

        drawDriftChart();
        updateDriftMetrics();
    });

    btnRetrain.addEventListener('click', async () => {
        if (btnRetrain.disabled || isRetraining) return;
        isRetraining = true;
        
        btnRetrain.disabled = true;
        btnStepDrift.disabled = true;
        
        metricDriftStatus.innerText = 'Retraining Model...';
        metricDriftStatus.style.color = 'var(--purple)';
        metricDriftDesc.innerText = 'Re-fitting sliding temporal window on GPU...';

        // Animate training dots on status
        let progressDots = '';
        const interval = setInterval(() => {
            progressDots = progressDots.length < 3 ? progressDots + '.' : '';
            metricDriftStatus.innerText = `Retraining Model${progressDots}`;
        }, 300);

        await sleep(2000); // Simulate model computation
        clearInterval(interval);

        // Reset accuracy to baseline and drift level to 0
        currentDay++;
        timelineDays.push(currentDay);
        modelAccuracy.push(98.4);
        dataDrift.push(0.02); // minor residual drift

        if (timelineDays.length > 10) {
            timelineDays.shift();
            modelAccuracy.shift();
            dataDrift.shift();
        }

        isRetraining = false;
        btnStepDrift.disabled = false;
        
        drawDriftChart();
        updateDriftMetrics();
    });

    btnResetDrift.addEventListener('click', () => {
        timelineDays = [1];
        modelAccuracy = [98.2];
        dataDrift = [0.0];
        currentDay = 1;
        isRetraining = false;

        btnStepDrift.disabled = false;
        btnRetrain.disabled = true;

        drawDriftChart();
        updateDriftMetrics();
    });


    /* ==========================================
       7. Contact Form Handling (Web3Forms Real Email Service)
       ========================================== */
    const contactForm = document.getElementById('contact-form');
    const btnSubmit = document.getElementById('btn-submit');
    const formMessage = document.getElementById('form-message');

    // PLACE YOUR ACCESS KEY HERE:
    // Go to https://web3forms.com to get a free key emailed to you
    const WEB3FORMS_ACCESS_KEY = "7ab00f64-4c09-4765-a3e2-736c89465d34"; 

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
            formMessage.innerText = "Please fill in all fields.";
            formMessage.className = "form-message error";
            formMessage.style.display = 'block';
            return;
        }

        // Show sending state
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        formMessage.style.display = 'none';

        if (WEB3FORMS_ACCESS_KEY === "7ab00f64-4c09-4765-a3e2-736c89465d34") {
            // Fallback simulated save if no key is entered yet
            setTimeout(() => {
                const messages = JSON.parse(localStorage.getItem('messages') || '[]');
                messages.push({ name, email, message, date: new Date().toISOString() });
                localStorage.setItem('messages', JSON.stringify(messages));

                formMessage.innerHTML = `<i class="fa-solid fa-circle-info"></i> Form submitted (Simulation Mode). To receive emails, please replace <code>YOUR_ACCESS_KEY_HERE</code> in <code>script.js</code> with your Web3Forms access key.`;
                formMessage.className = "form-message success";
                formMessage.style.display = 'block';

                contactForm.reset();
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
            }, 1000);
            return;
        }

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: WEB3FORMS_ACCESS_KEY,
                    name: name,
                    email: email,
                    message: message,
                    subject: `New Portfolio Message from ${name}`
                })
            });

            const result = await response.json();
            
            if (response.status === 200 && result.success) {
                // Success
                formMessage.innerText = `Thank you, ${name}! Your message has been sent successfully.`;
                formMessage.className = "form-message success";
                formMessage.style.display = 'block';
                contactForm.reset();
            } else {
                // Error from API
                formMessage.innerText = result.message || "Something went wrong. Please try again.";
                formMessage.className = "form-message error";
                formMessage.style.display = 'block';
            }
        } catch (error) {
            // Network error
            formMessage.innerText = "Network error. Please check your internet connection.";
            formMessage.className = "form-message error";
            formMessage.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
            
            // Auto-hide message after 8 seconds
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 8000);
        }
    });

});
