import { Taxi } from "./taxi";
import { loadChart, clearChart } from './plot';


document.addEventListener('DOMContentLoaded', () => {
    const chartsGrid = document.querySelector('.charts-grid');
    const chartCards = document.querySelectorAll('.chart-card');
    const prevButton = document.querySelector('.carousel-button-prev');
    const nextButton = document.querySelector('.carousel-button-next');

    if (!chartsGrid || !prevButton || !nextButton || chartCards.length === 0) {
        console.warn('Elementos do carrossel não encontrados. O carrossel não será inicializado.');
        return;
    }

    let currentIndex = 0;
    const totalSlides = chartCards.length;

    function updateCarousel() {
        const cardWidth = chartCards[0].offsetWidth; 
        chartsGrid.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

      
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === totalSlides - 1;
    }

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < totalSlides - 1) {
            currentIndex++;
            updateCarousel();
        }
    });

    
    updateCarousel();

   let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateCarousel();
        }, 250); 
    });
});


function setupEventListeners(data) {
    const loadBtn = document.querySelector('#loadBtn');
    const clearBtn = document.querySelector('#clearBtn');

    if (!loadBtn || !clearBtn) {
        console.error("Botões não encontrados!");
        return;
    }

    loadBtn.addEventListener('click', async () => {
        loadBtn.disabled = true;
        loadBtn.textContent = "Carregando...";
        
        
        clearChart();
        
        try {
            await loadChart(data);
            loadBtn.textContent = "Carregar Gráficos";
        } catch (error) {

            loadBtn.textContent = "Erro ao Carregar";
        } finally {
            loadBtn.disabled = false;
        }
    });

    clearBtn.addEventListener('click', () => {
        clearChart();
    });
}


window.onload = async () => {
    try {
        const mainContainer = document.querySelector('.main-container'); 
        const body = document.body; 

        
        const loadingMsg = document.createElement('div');
        loadingMsg.style.textAlign = 'center';
        loadingMsg.style.padding = '20px';
        loadingMsg.style.fontSize = '16px';
        loadingMsg.style.color = '#333';
        loadingMsg.innerHTML = `
            <h3>Carregando dados dos Green Taxis de NYC...</h3>
            <p>Aguarde enquanto processamos os dados para análise.</p>
        `;
        mainContainer.appendChild(loadingMsg);

        const taxi = new Taxi();
        await taxi.init();
        await taxi.loadTaxi(6);

        const sql = `
            SELECT
                lpep_pickup_datetime,
                tip_amount,
                fare_amount,
                total_amount,
                trip_distance,
                payment_type
            FROM
                taxi_2023
            LIMIT 5000
        `;
        const data = await taxi.query(sql);

        const validData = data.filter(d => {
            try {
                const date = new Date(d.lpep_pickup_datetime);
                return !isNaN(date.getTime()) &&
                    date.getFullYear() === 2023 &&
                    typeof d.tip_amount === 'number' &&
                    d.tip_amount >= 0;
            } catch (e) {
                return false;
            }
        });

        if (validData.length === 0) {
            if (mainContainer.contains(loadingMsg)) {
                mainContainer.removeChild(loadingMsg);
            }
            throw new Error("Nenhum dado válido encontrado!");
        }

        if (mainContainer.contains(loadingMsg)) {
            mainContainer.removeChild(loadingMsg); 
        }

       
        const infoDiv = document.createElement('div');
        infoDiv.style.position = 'fixed';
        infoDiv.style.bottom = '20px';
        infoDiv.style.right = '20px';
        infoDiv.style.padding = '15px 20px';
        infoDiv.style.backgroundColor = '#5F8B4C'; 
        infoDiv.style.color = 'white';
        infoDiv.style.border = 'none';
        infoDiv.style.borderRadius = '8px';
        infoDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        infoDiv.style.zIndex = '1050'; 
        infoDiv.style.maxWidth = '350px';
        infoDiv.style.textAlign = 'left';
        infoDiv.innerHTML = `
            <strong>Dados Carregados!</strong><br>
            ${validData.length} corridas de táxi encontradas para os primeiros 6 meses de 2023.
        `;
        body.appendChild(infoDiv); 

        
        setTimeout(() => {
            if (body.contains(infoDiv)) {
                infoDiv.style.transition = 'opacity 0.5s ease-out';
                infoDiv.style.opacity = '0';
                setTimeout(() => body.removeChild(infoDiv), 500);
            }
        }, 7000); 

        setupEventListeners(validData);
        await loadChart(validData);

    } catch (error) {
        const body = document.body;
        const loadingMsgInMain = document.querySelector('.main-container div');
        if (loadingMsgInMain && loadingMsgInMain.innerHTML.includes('Carregando dados')) {
            loadingMsgInMain.remove();
        }

        
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.padding = '15px 20px';
        errorDiv.style.backgroundColor = '#dc3545'; // Vermelho erro
        errorDiv.style.color = 'white';
        errorDiv.style.border = 'none';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        errorDiv.style.zIndex = '1050';
        errorDiv.style.maxWidth = '350px';
        errorDiv.style.textAlign = 'left';
        errorDiv.innerHTML = `
            <strong>Erro ao carregar os dados!</strong><br>
            <p style="margin-top: 5px; margin-bottom: 0;">${error.message}</p>
            <small>Verifique o console para mais detalhes.</small>
        `;
        body.appendChild(errorDiv); 
    }
};