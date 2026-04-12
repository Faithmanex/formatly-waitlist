document.addEventListener('DOMContentLoaded', () => {
    // Countdown Timer
    const targetDate = new Date('2026-04-13T07:01:00Z'); // April 13, 2026 12:01 AM PDT = 07:01 UTC
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const launchDateEl = document.getElementById('launchDate');
    const countdownContainer = document.querySelector('.countdown-container');

    function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            if (countdownContainer) {
                countdownContainer.innerHTML = '<a href="https://formatlyapp.com" style="font-size: 1.5rem; font-weight: 800; color: var(--primary); text-decoration: none;">Formatly is live! Click here to go to the app →</a>';
            }
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = days;
        if (hoursEl) hoursEl.textContent = hours;
        if (minutesEl) minutesEl.textContent = minutes;
        if (secondsEl) secondsEl.textContent = seconds;

        if (launchDateEl) {
            const localDate = targetDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
            });
            launchDateEl.textContent = localDate;
        }
    }

    if (daysEl && hoursEl && minutesEl && secondsEl) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // Scroll Reveal Animation logic
    const reveals = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
        }
    };

    window.addEventListener('scroll', revealOnScroll);
    
    // Initial check in case elements are already visible
    revealOnScroll();

    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateIcons(currentTheme);

        themeToggle.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateIcons(theme);
        });
    }

    function updateIcons(theme) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // Supabase Configuration
    const SUPABASE_URL = 'https://chuxhdvazicuwdqwhtot.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNodXhoZHZhemljdXdkcXdodG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzMwMTMsImV4cCI6MjA3MDYwOTAxM30.Hnp44Y6IZjJRuOzb-4_UtGx1sBBSp67MonqB_aLwxpY';

    // Diagnostic log to confirm script loaded
    console.log("script.js loaded and DOM content ready");

    const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    if (!supabaseClient) {
        console.error("Supabase client failed to initialize. Check if the Supabase script is loaded.");
    }

    // Load waitlist count immediately on page load
    async function loadWaitlistCount() {
        if (!supabaseClient) {
            console.error("Cannot load waitlist count: Supabase client not available");
            return;
        }

        try {
            const { data: count, error } = await supabaseClient.rpc('get_waitlist_count');

            if (error) {
                console.error("Error fetching waitlist count:", error);
                return;
            }

            // Base count of 500 + actual count from database
            const totalCount = 500 + (count || 0);
            const countElement = document.getElementById('waitlistCount');
            
            if (countElement) {
                countElement.textContent = totalCount.toLocaleString() + '+ researchers';
                console.log("Waitlist count updated to:", totalCount);
            }
        } catch (err) {
            console.error("Exception while loading waitlist count:", err);
        }
    }

    // Load count as the first thing
    loadWaitlistCount();

    const form = document.getElementById('waitlistForm');
    const submitBtn = document.getElementById('submitBtn');
    const responseMsg = document.getElementById('responseMsg');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!supabaseClient) {
                responseMsg.textContent = "Configuration error: Supabase not loaded.";
                responseMsg.style.color = "#ef4444";
                responseMsg.style.display = "block";
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Joining...";

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;

            try {
                const { data, error } = await supabaseClient
                    .from('waitlist')
                    .insert([{ full_name: name, email: email }]);

                if (error) {
                    // Check for duplicate key error (Postgres code 23505)
                    if (error.code === '23505') {
                        showSuccessState("You're already on the list!");
                    } else {
                        responseMsg.textContent = "Error joining. Please try again.";
                        responseMsg.style.color = "#ef4444";
                        responseMsg.style.display = "block";
                    }
                    return;
                }

                // Successful signup
                console.log("Conversion Tracked: New Waitlist Entry");
                showSuccessState("You're on the list!");
                form.reset();

            } catch (err) {
                console.error("Submission error:", err);
                responseMsg.textContent = "Something went wrong. Please try again.";
                responseMsg.style.color = "#ef4444";
                responseMsg.style.display = "block";
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Join The Waitlist";
            }
        });
    }

    function showSuccessState(headingText) {
        // Smooth transition animation
        form.style.opacity = '0';
        setTimeout(() => {
            form.style.display = 'none';
            const thankYouMsg = document.getElementById('thankYouMessage');
            thankYouMsg.querySelector('h2').textContent = headingText;
            thankYouMsg.style.display = 'block';
            thankYouMsg.style.opacity = '0';
            thankYouMsg.style.transform = 'translateY(10px)';
            
            // Trigger reflow for animation
            thankYouMsg.offsetHeight; 
            
            thankYouMsg.style.transition = 'all 0.5s ease-out';
            thankYouMsg.style.opacity = '1';
            thankYouMsg.style.transform = 'translateY(0)';
        }, 300);
    }

    // Clipboard Functionality
    const copyBtn = document.getElementById('copyBtn');
    const copyBtnText = document.getElementById('copyBtnText');

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                copyBtnText.textContent = "Link copied!";
                copyBtn.style.borderColor = "var(--primary)";
                copyBtn.style.color = "var(--primary)";
                
                setTimeout(() => {
                    copyBtnText.textContent = "Copy invite link";
                    copyBtn.style.borderColor = "var(--glass-border)";
                    copyBtn.style.color = "var(--text-main)";
                }, 2000);
            });
        });
    }
});
